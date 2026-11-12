import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploadEventCover } from '../lib/events/cover-storage.ts';

function storageMock(errors, createError = null, existingError = null) {
  const calls = [];
  const client = { storage: {
    from(bucket) {
      assert.equal(bucket, 'event_covers');
      return {
        async upload(path, bytes, options) {
          calls.push({ operation: 'upload', path, options, size: bytes.byteLength });
          return { error: errors.shift() ?? null };
        },
        getPublicUrl(path) { return { data: { publicUrl: `https://storage.example/${path}` } }; },
      };
    },
    async createBucket(name, options) { calls.push({ operation: 'create', name, options }); return { error: createError }; },
    async getBucket() { calls.push({ operation: 'get' }); return { error: existingError }; },
  } };
  return { client, calls };
}
const file = () => new File(['image'], 'cover.wrong-extension', { type: 'image/png' });

test('missing bucket is created with restricted image settings and upload is retried', async () => {
  const { client, calls } = storageMock([{ message: 'Bucket not found' }]);
  const url = await uploadEventCover(client, file());
  assert.match(url, /\.png$/);
  assert.deepEqual(calls.map(c => c.operation), ['upload', 'create', 'upload']);
  assert.equal(calls[0].path, calls[2].path);
  assert.equal(calls[1].options.fileSizeLimit, 5242880);
  assert.deepEqual(calls[1].options.allowedMimeTypes, ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
});
test('existing bucket is not changed', async () => {
  const { client, calls } = storageMock([]);
  await uploadEventCover(client, file(), 'event-id');
  assert.deepEqual(calls.map(c => c.operation), ['upload']);
});
test('concurrent bucket creation can recover', async () => {
  const { client, calls } = storageMock([{ message: 'Bucket not found' }], { message: 'Already exists' });
  await uploadEventCover(client, file());
  assert.deepEqual(calls.map(c => c.operation), ['upload', 'create', 'get', 'upload']);
});
test('permission errors do not trigger bucket creation or pretend success', async () => {
  const error = new Error('Permission denied');
  const { client, calls } = storageMock([error]);
  await assert.rejects(uploadEventCover(client, file()), /Permission denied/);
  assert.equal(calls.length, 1);
});
test('invalid uploads fail before storage is accessed', async () => {
  const { client, calls } = storageMock([]);
  await assert.rejects(uploadEventCover(client, new File(['svg'], 'cover.svg', { type: 'image/svg+xml' })), /JPG/);
  await assert.rejects(uploadEventCover(client, new File([new Uint8Array(5242881)], 'large.png', { type: 'image/png' })), /5MB/);
  assert.equal(calls.length, 0);
});
