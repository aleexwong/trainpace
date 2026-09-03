/**
 * Minimal streaming ZIP reader.
 *
 * An Apple Health `export.zip` is routinely 100 MB–1 GB. Reading it into memory
 * on an iPhone is not an option, so this reads only what it needs:
 *
 *   1. the tail of the file, to find the central directory,
 *   2. the central directory, to list entries,
 *   3. one entry's compressed bytes, as a stream.
 *
 * `Blob.slice()` is lazy — the browser reads those ranges off disk on demand —
 * and `DecompressionStream` inflates chunk by chunk, so peak memory stays in the
 * low megabytes no matter how big the archive is.
 *
 * Only what a real archive needs is implemented: stored + deflate entries, and
 * ZIP64 for archives past the 4 GB / 65535-entry limits.
 */

export interface ZipEntry {
  /** Path inside the archive, e.g. "apple_health_export/export.xml". */
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  /** 0 = stored, 8 = deflate. Anything else is rejected on read. */
  compressionMethod: number;
  localHeaderOffset: number;
}

const EOCD_SIG = 0x06054b50;
const ZIP64_LOCATOR_SIG = 0x07064b50;
const ZIP64_EOCD_SIG = 0x06064b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

/** EOCD is 22 bytes plus a comment of up to 65535, and may be preceded by a 20-byte ZIP64 locator and a 56-byte ZIP64 EOCD record. */
const MAX_TAIL = 22 + 0xffff + 20 + 56;

const U32_MAX = 0xffffffff;
const U16_MAX = 0xffff;

async function readBytes(blob: Blob, start: number, end: number): Promise<Uint8Array> {
  return new Uint8Array(await blob.slice(start, end).arrayBuffer());
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Read a ZIP64 8-byte field as a JS number. Archive sizes never approach 2^53. */
function u64(dv: DataView, offset: number): number {
  return Number(dv.getBigUint64(offset, true));
}

export class ZipFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipFormatError";
  }
}

/**
 * List the archive's entries by reading its central directory.
 * Reads the tail plus the directory itself — not the file bodies.
 */
export async function readZipEntries(blob: Blob): Promise<ZipEntry[]> {
  const tailLength = Math.min(blob.size, MAX_TAIL);
  const tail = await readBytes(blob, blob.size - tailLength, blob.size);
  const tailStart = blob.size - tailLength;
  const dv = view(tail);

  // Scan backwards for the End Of Central Directory signature.
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) {
    throw new ZipFormatError(
      "This does not look like a .zip file — no end-of-archive record found."
    );
  }

  let entryCount = dv.getUint16(eocd + 10, true);
  let cdSize = dv.getUint32(eocd + 12, true);
  let cdOffset = dv.getUint32(eocd + 16, true);

  // ZIP64: the 32-bit fields are saturated and the real values live in a
  // separate record pointed at by a locator sitting just before the EOCD.
  const needsZip64 =
    entryCount === U16_MAX || cdSize === U32_MAX || cdOffset === U32_MAX;
  if (needsZip64) {
    const locator = eocd - 20;
    if (locator < 0 || dv.getUint32(locator, true) !== ZIP64_LOCATOR_SIG) {
      throw new ZipFormatError("Archive needs ZIP64 but has no ZIP64 locator.");
    }
    const zip64Offset = u64(dv, locator + 8);
    const record = await readBytes(blob, zip64Offset, zip64Offset + 56);
    const zdv = view(record);
    if (zdv.getUint32(0, true) !== ZIP64_EOCD_SIG) {
      throw new ZipFormatError("ZIP64 end-of-archive record is missing.");
    }
    entryCount = u64(zdv, 32);
    cdSize = u64(zdv, 40);
    cdOffset = u64(zdv, 48);
  }

  // The directory may already be inside the tail we read; re-slice only if not.
  const cd =
    cdOffset >= tailStart && cdOffset + cdSize <= blob.size
      ? tail.subarray(cdOffset - tailStart, cdOffset - tailStart + cdSize)
      : await readBytes(blob, cdOffset, cdOffset + cdSize);

  return parseCentralDirectory(cd, entryCount);
}

function parseCentralDirectory(cd: Uint8Array, entryCount: number): ZipEntry[] {
  const dv = view(cd);
  const decoder = new TextDecoder("utf-8");
  const entries: ZipEntry[] = [];
  let pos = 0;

  while (pos + 46 <= cd.length && entries.length < entryCount) {
    if (dv.getUint32(pos, true) !== CENTRAL_SIG) break;

    const compressionMethod = dv.getUint16(pos + 10, true);
    let compressedSize = dv.getUint32(pos + 20, true);
    let uncompressedSize = dv.getUint32(pos + 24, true);
    const nameLength = dv.getUint16(pos + 28, true);
    const extraLength = dv.getUint16(pos + 30, true);
    const commentLength = dv.getUint16(pos + 32, true);
    let localHeaderOffset = dv.getUint32(pos + 42, true);

    const nameStart = pos + 46;
    const name = decoder.decode(cd.subarray(nameStart, nameStart + nameLength));

    // ZIP64 extra field (header id 0x0001) supplies whichever of the three
    // saturated fields are actually oversized, in this fixed order.
    if (
      uncompressedSize === U32_MAX ||
      compressedSize === U32_MAX ||
      localHeaderOffset === U32_MAX
    ) {
      const extraStart = nameStart + nameLength;
      let e = extraStart;
      while (e + 4 <= extraStart + extraLength) {
        const headerId = dv.getUint16(e, true);
        const size = dv.getUint16(e + 2, true);
        if (headerId === 0x0001) {
          let f = e + 4;
          if (uncompressedSize === U32_MAX) {
            uncompressedSize = u64(dv, f);
            f += 8;
          }
          if (compressedSize === U32_MAX) {
            compressedSize = u64(dv, f);
            f += 8;
          }
          if (localHeaderOffset === U32_MAX) {
            localHeaderOffset = u64(dv, f);
          }
          break;
        }
        e += 4 + size;
      }
    }

    entries.push({
      name,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      localHeaderOffset,
    });

    pos = nameStart + nameLength + extraLength + commentLength;
  }

  return entries;
}

/**
 * Open one entry as a stream of decompressed bytes.
 * Nothing larger than a decompression chunk is held in memory.
 */
export async function openZipEntry(
  blob: Blob,
  entry: ZipEntry
): Promise<ReadableStream<Uint8Array>> {
  // The local header repeats the name and carries its own (usually different)
  // extra field, so the data offset has to be read from it rather than guessed.
  const header = await readBytes(
    blob,
    entry.localHeaderOffset,
    entry.localHeaderOffset + 30
  );
  const dv = view(header);
  if (dv.getUint32(0, true) !== LOCAL_SIG) {
    throw new ZipFormatError(`Corrupt entry header for "${entry.name}".`);
  }
  const nameLength = dv.getUint16(26, true);
  const extraLength = dv.getUint16(28, true);
  const dataStart = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const body = blob.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return body.stream();
  if (entry.compressionMethod !== 8) {
    throw new ZipFormatError(
      `"${entry.name}" uses an unsupported compression method (${entry.compressionMethod}).`
    );
  }
  if (typeof DecompressionStream === "undefined") {
    throw new ZipFormatError(
      "This browser cannot unzip files. Use Safari 16.4+, Chrome 103+, or Firefox 113+."
    );
  }
  return body.stream().pipeThrough(new DecompressionStream("deflate-raw"));
}

/** Read a whole entry as text. Only for small entries — GPX route files, not export.xml. */
export async function readZipEntryText(
  blob: Blob,
  entry: ZipEntry
): Promise<string> {
  const stream = await openZipEntry(blob, entry);
  const decoder = new TextDecoder("utf-8");
  const reader = stream.getReader();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}
