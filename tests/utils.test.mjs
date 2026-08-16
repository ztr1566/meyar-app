import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatQuantity, isCurrentUserId } from '../js/core/utils.js';

test('escapeHtml - escapes dangerous XSS characters', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml(`' or 1=1 -- & "`), '&#039; or 1=1 -- &amp; &quot;');
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(12345), '12345');
});

test('formatQuantity - formats numbers and culinary fractions', () => {
  assert.equal(formatQuantity(1), '1');
  assert.equal(formatQuantity(0.5), '½');
  assert.equal(formatQuantity(0.25), '¼');
  assert.equal(formatQuantity(0.75), '¾');
  assert.equal(formatQuantity(1.5), '1 ½');
  assert.equal(formatQuantity(2.33), '2 ⅓');
  assert.equal(formatQuantity(0), '0');
  assert.equal(formatQuantity(null), '0');
});

test('isCurrentUserId - identifies owned entities without matching empty IDs', () => {
  const currentUser = { id: 'chef-1' };

  assert.equal(isCurrentUserId('chef-1', currentUser), true);
  assert.equal(isCurrentUserId('chef-2', currentUser), false);
  assert.equal(isCurrentUserId('', currentUser), false);
  assert.equal(isCurrentUserId('chef-1', null), false);
});
