/**
 * Builds a synthetic Apple Health `export.zip` in memory for the import tests.
 *
 * Committing a real export is out of the question (it is personal health data,
 * and the real thing is hundreds of megabytes), so the fixture reproduces the
 * shape instead: both workout layouts Apple has shipped, a mile-unit workout,
 * an indoor workout, a non-running workout, route file references, and enough
 * `<Record>` noise that the parser has to stream rather than buffer.
 */

import { deflateRawSync } from "node:zlib";

interface ZipInput {
  name: string;
  content: string;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** A deflate-compressed zip with a normal central directory, as `zip` writes. */
export function buildZip(files: ZipInput[]): Buffer {
  const body: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const raw = Buffer.from(file.content, "utf8");
    const deflated = deflateRawSync(raw);
    const nameBytes = Buffer.from(file.name, "utf8");
    const checksum = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    body.push(local, nameBytes, deflated);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(checksum, 16);
    entry.writeUInt32LE(deflated.length, 20);
    entry.writeUInt32LE(raw.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);

    offset += local.length + nameBytes.length + deflated.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...body, centralBuffer, end]);
}

/** Heart-rate spam — the bulk of a real export, and what forces streaming. */
function noiseRecords(count: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const day = (i % 9) + 1;
    const second = i % 10;
    const stamp = `2026-06-0${day} 08:00:0${second} -0700`;
    lines.push(
      ` <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="${stamp}" startDate="${stamp}" endDate="${stamp}" value="${120 + (i % 40)}"/>`
    );
  }
  return lines.join("\n");
}

const GPX = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg><trkpt lat="49.28" lon="-123.12"><ele>10</ele></trkpt></trkseg></trk></gpx>`;

/**
 * What the fixture contains, so assertions can name the expectation rather than
 * repeating a magic number.
 */
export const EXPECTED = {
  runsInWindow: 3,
  totalDistanceKm: "33.7 km",
  totalDistanceMiles: "20.9 mi",
  averageWeekKm: "20.6 km",
  vdot: "48.6",
  fiveKTime: "22:30",
  halfTime: "1:35:12",
  fiveKLink: "/calculator?d=5.020&t=1350",
  halfVdotLink: "/vdot?d=21400&t=5712",
  routeCount: 2,
} as const;

const EXPORT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_CA">
 <ExportDate value="2026-09-01 09:00:00 -0700"/>
${noiseRecords(2000)}
 <Record type="HKQuantityTypeIdentifierVO2Max" sourceName="Apple Watch" unit="mL/min·kg" startDate="2026-08-20 07:00:00 -0700" endDate="2026-08-20 07:00:00 -0700" value="52.4"/>
 <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" startDate="2026-08-28 07:00:00 -0700" endDate="2026-08-28 07:00:00 -0700" value="48"/>
 <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" unit="kg" startDate="2026-08-25 07:00:00 -0700" endDate="2026-08-25 07:00:00 -0700" value="68.2"/>
 <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="22.5" durationUnit="min" totalDistance="5.02" totalDistanceUnit="km" totalEnergyBurned="330" totalEnergyBurnedUnit="kcal" sourceName="Apple Watch" startDate="2026-08-16 08:00:00 -0700" endDate="2026-08-16 08:22:30 -0700">
  <MetadataEntry key="HKIndoorWorkout" value="0"/>
  <WorkoutRoute sourceName="Apple Watch">
   <FileReference path="/workout-routes/route_2026-08-16_8.00am.gpx"/>
  </WorkoutRoute>
 </Workout>
${noiseRecords(1500)}
 <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="95.2" durationUnit="min" sourceName="Apple Watch" startDate="2026-08-23 07:30:00 -0700" endDate="2026-08-23 09:05:12 -0700">
  <MetadataEntry key="HKIndoorWorkout" value="0"/>
  <WorkoutStatistics type="HKQuantityTypeIdentifierDistanceWalkingRunning" sum="21.4" unit="km"/>
  <WorkoutStatistics type="HKQuantityTypeIdentifierActiveEnergyBurned" sum="1420" unit="kcal"/>
  <WorkoutStatistics type="HKQuantityTypeIdentifierHeartRate" average="158.3" minimum="112" maximum="181" unit="count/min"/>
  <WorkoutRoute sourceName="Apple Watch">
   <FileReference path="/workout-routes/route_2026-08-23_7.30am.gpx"/>
  </WorkoutRoute>
 </Workout>
 <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="40" durationUnit="min" totalDistance="4.5" totalDistanceUnit="mi" sourceName="iPhone" startDate="2026-08-26 18:00:00 -0700" endDate="2026-08-26 18:40:00 -0700">
  <MetadataEntry key="HKIndoorWorkout" value="1"/>
 </Workout>
 <Workout workoutActivityType="HKWorkoutActivityTypeCycling" duration="60" durationUnit="min" totalDistance="30" totalDistanceUnit="km" sourceName="Apple Watch" startDate="2026-08-27 18:00:00 -0700" endDate="2026-08-27 19:00:00 -0700"/>
 <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="9.5" durationUnit="min" totalDistance="2.1" totalDistanceUnit="km" sourceName="Apple Watch &amp; friends" startDate="2024-01-05 08:00:00 -0800" endDate="2024-01-05 08:09:30 -0800"/>
</HealthData>
`;

export function syntheticExportZip(): Buffer {
  return buildZip([
    { name: "apple_health_export/export.xml", content: EXPORT_XML },
    { name: "apple_health_export/export_cda.xml", content: "<ClinicalDocument/>" },
    {
      name: "apple_health_export/workout-routes/route_2026-08-16_8.00am.gpx",
      content: GPX,
    },
    {
      name: "apple_health_export/workout-routes/route_2026-08-23_7.30am.gpx",
      content: GPX,
    },
  ]);
}
