// Zero-dependency tests using Node's built-in test runner (Node 18+).
// Run with:  node --test tests
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// utils.js attaches itself to `window`, so provide a minimal stand-in
// before loading it under Node.
global.window = global.window || {};

require(path.join(__dirname, '..', 'js', 'utils.js'));
const Utils = global.window.StadiaAI.Utils;

test('formatNumber adds thousands separators', () => {
  assert.equal(Utils.formatNumber(1234567), '1,234,567');
  assert.equal(Utils.formatNumber(0), '0');
});

test('formatPercent rounds and appends %', () => {
  assert.equal(Utils.formatPercent(49.6), '50%');
  assert.equal(Utils.formatPercent(0), '0%');
});

test('clamp keeps values within [min, max]', () => {
  assert.equal(Utils.clamp(5, 0, 10), 5);
  assert.equal(Utils.clamp(-5, 0, 10), 0);
  assert.equal(Utils.clamp(15, 0, 10), 10);
});

test('lerp interpolates linearly', () => {
  assert.equal(Utils.lerp(0, 10, 0.5), 5);
  assert.equal(Utils.lerp(10, 20, 0), 10);
  assert.equal(Utils.lerp(10, 20, 1), 20);
});

test('randomBetween always stays within the inclusive range', () => {
  for (let i = 0; i < 200; i++) {
    const n = Utils.randomBetween(5, 8);
    assert.ok(n >= 5 && n <= 8, `${n} out of range`);
  }
});

test('escapeHtml neutralizes HTML special characters (XSS regression guard)', () => {
  const dirty = `<img src=x onerror="alert('xss')">&'"`;
  const clean = Utils.escapeHtml(dirty);
  assert.ok(!clean.includes('<img'));
  assert.equal(
    clean,
    '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;&#39;&quot;'
  );
});

test('escapeHtml handles null/undefined safely', () => {
  assert.equal(Utils.escapeHtml(null), '');
  assert.equal(Utils.escapeHtml(undefined), '');
});

test('escapeHtml is safe to apply chunk-by-chunk (streaming AI responses)', () => {
  // Simulates how ops.js / transport.js escape each streamed token individually
  // before appending it to innerHTML, rather than escaping the full message at once.
  const chunks = ['<scr', 'ipt>alert(1)', '</scr', 'ipt>'];
  const rebuilt = chunks.map(Utils.escapeHtml).join('');
  assert.ok(!/<\s*script/i.test(rebuilt));
  assert.equal(rebuilt, '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('escapeHtml is idempotent-safe for plain text (no false-positive mangling)', () => {
  const plain = 'Gate A wait time is 12 minutes, density 42%.';
  assert.equal(Utils.escapeHtml(plain), plain);
});

test('getDensityLevel classifies boundary values consistently (single source of truth for 50/70/85 thresholds)', () => {
  assert.equal(Utils.getDensityLevel(0), 'low');
  assert.equal(Utils.getDensityLevel(49.9), 'low');
  assert.equal(Utils.getDensityLevel(50), 'medium');
  assert.equal(Utils.getDensityLevel(69.9), 'medium');
  assert.equal(Utils.getDensityLevel(70), 'high');
  assert.equal(Utils.getDensityLevel(84.9), 'high');
  assert.equal(Utils.getDensityLevel(85), 'critical');
  assert.equal(Utils.getDensityLevel(100), 'critical');
});
