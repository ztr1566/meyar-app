import test from 'node:test';
import assert from 'node:assert/strict';
import { isFeedPath } from '../js/main.js';

test('isFeedPath recognizes the server and direct-file feed URLs', () => {
  assert.equal(isFeedPath('/feeds'), true);
  assert.equal(isFeedPath('/feeds/'), true);
  assert.equal(isFeedPath('/feeds.html'), true);
  assert.equal(isFeedPath('/'), false);
  assert.equal(isFeedPath('/index.html'), false);
});
