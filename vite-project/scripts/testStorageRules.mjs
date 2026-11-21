import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { deleteApp, initializeApp } from "firebase/app";
import {
  connectStorageEmulator,
  deleteObject,
  getMetadata,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const projectId = "demo-trainpace";
const emulatorAddress = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
if (!emulatorAddress) {
  throw new Error("Run this test with the Firebase Storage emulator.");
}
const { hostname, port } = new URL(`http://${emulatorAddress}`);
const file = new TextEncoder().encode("<gpx/>");
const metadata = { contentType: "application/gpx+xml" };
const denied = { code: "storage/unauthorized" };

test("GPX files are publicly readable and writable only by their owner", async (t) => {
  function storageFor(uid) {
    const app = initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` }, randomUUID());
    t.after(() => deleteApp(app));
    const storage = getStorage(app);
    connectStorageEmulator(storage, hostname, Number(port), uid ? { mockUserToken: { sub: uid } } : undefined);
    return storage;
  }

  const owner = storageFor("runner-one");
  const other = storageFor("runner-two");
  const guest = storageFor();
  const path = `gpx_files/runner-one_${randomUUID()}.gpx`;
  const target = ref(owner, path);

  await assert.rejects(uploadBytes(ref(guest, path), file, metadata), denied);
  await assert.rejects(uploadBytes(ref(other, path), file, metadata), denied);
  await uploadBytes(target, file, metadata);
  assert.equal((await getMetadata(ref(guest, path))).contentType, metadata.contentType);

  await assert.rejects(uploadBytes(ref(other, path), file, metadata), denied);
  await assert.rejects(uploadBytes(target, file, { contentType: "image/png" }), denied);
  await assert.rejects(uploadBytes(target, new Uint8Array(10 * 1024 * 1024), metadata), denied);
  await assert.rejects(uploadBytes(ref(owner, "other/runner-one_route.gpx"), file, metadata), denied);
  await uploadBytes(target, file, metadata);
  await assert.rejects(deleteObject(ref(other, path)), denied);
  await deleteObject(target);
});
