'use strict';

// features.test.js — JSDOM-based integration tests for StadiaAI
//
// These tests spin up a full JSDOM environment from index.html and
// execute each feature module against the real DOM, verifying that
// UI state changes match expected behaviour.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

// ---------------------------------------------------------------------------
// Helper: build a fresh JSDOM + StadiaAI environment per test
// ---------------------------------------------------------------------------
function createEnv() {
  const rootDir = path.join(__dirname, '..');
  const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  const dom = new JSDOM(htmlContent, {
    url: 'https://metlife.stadium/',
    runScripts: 'dangerously',
    // Virtual console silences noisy output during tests
    virtualConsole: (new (require('jsdom').VirtualConsole)())
  });

  const { window } = dom;

  // Stub out browser APIs not provided by JSDOM
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  window.cancelAnimationFrame = () => {};

  // Load scripts in dependency order by evaluating them in the window context
  const scripts = [
    'js/utils.js',
    'js/data.js',
    'js/gemini.js',
    'js/stadium-map.js',
    'js/crowd.js',
    'js/navigation.js',
    'js/transport.js',
    'js/accessibility.js',
    'js/sustainability.js',
    'js/ops.js',
    'js/app.js',
  ];

  for (const rel of scripts) {
    const src = fs.readFileSync(path.join(rootDir, rel), 'utf8');
    window.eval(src);
  }

  return { window, document: window.document, StadiaAI: window.StadiaAI };
}

// ---------------------------------------------------------------------------
// 1. Core namespace
// ---------------------------------------------------------------------------
test('StadiaAI namespace is defined after module load', () => {
  const { StadiaAI } = createEnv();
  assert.ok(StadiaAI, 'window.StadiaAI should be defined');
  assert.ok(StadiaAI.Utils,   'StadiaAI.Utils should be defined');
  assert.ok(StadiaAI.Data,    'StadiaAI.Data should be defined');
  assert.ok(StadiaAI.Crowd,   'StadiaAI.Crowd should be defined');
  assert.ok(StadiaAI.Navigation, 'StadiaAI.Navigation should be defined');
  assert.ok(StadiaAI.Transport,  'StadiaAI.Transport should be defined');
  assert.ok(StadiaAI.Accessibility, 'StadiaAI.Accessibility should be defined');
  assert.ok(StadiaAI.Sustainability, 'StadiaAI.Sustainability should be defined');
  assert.ok(StadiaAI.Ops,     'StadiaAI.Ops should be defined');
});

// ---------------------------------------------------------------------------
// 2. Crowd module — init populates the zone table
// ---------------------------------------------------------------------------
test('Crowd.init() populates zone density table', () => {
  const { document, StadiaAI } = createEnv();

  StadiaAI.Crowd.init();

  const tbody = document.getElementById('crowd-zone-tbody');
  assert.ok(tbody, 'crowd-zone-tbody element should exist');
  assert.ok(tbody.children.length > 0, 'Crowd zone table should have at least one row after init');
});

// ---------------------------------------------------------------------------
// 3. Navigation module — populateSelects fills <select> options
// ---------------------------------------------------------------------------
test('Navigation.init() populates From/To selects with zone options', () => {
  const { document, StadiaAI } = createEnv();

  StadiaAI.Navigation.init();

  const fromSel = document.getElementById('nav-from-select');
  const toSel   = document.getElementById('nav-to-select');

  assert.ok(fromSel, '#nav-from-select should exist');
  assert.ok(toSel,   '#nav-to-select should exist');
  // At minimum the disabled placeholder + at least one zone
  assert.ok(fromSel.options.length > 1, 'From select should have more than 1 option');
  assert.ok(toSel.options.length   > 1, 'To select should have more than 1 option');
});

// ---------------------------------------------------------------------------
// 4. Navigation module — calculateRouteSteps returns correct structure
// ---------------------------------------------------------------------------
test('Navigation.calculateRouteSteps() returns steps with positive distance/time', () => {
  const { StadiaAI } = createEnv();

  const fromZone = StadiaAI.Data.getZone('gate-a');
  const toZone   = StadiaAI.Data.getZone('stand-north');

  assert.ok(fromZone, 'gate-a zone should exist in data');
  assert.ok(toZone,   'stand-north zone should exist in data');

  const result = StadiaAI.Navigation.calculateRouteSteps(fromZone, toZone, false);

  assert.ok(result,                          'calculateRouteSteps should return a result object');
  assert.ok(Array.isArray(result.steps),     'result.steps should be an array');
  assert.ok(result.steps.length > 0,        'result.steps should not be empty');
  assert.ok(result.totalDistance > 0,       'totalDistance should be positive');
  assert.ok(result.totalTime > 0,           'totalTime should be positive');
});

// ---------------------------------------------------------------------------
// 5. Navigation — accessible route uses elevator instruction
// ---------------------------------------------------------------------------
test('Navigation.calculateRouteSteps() accessible route includes elevator step for multi-level', () => {
  const { StadiaAI } = createEnv();

  // gate-a is level 1, stand-ne is level 2
  const fromZone = StadiaAI.Data.getZone('gate-a');
  const toZone   = StadiaAI.Data.getZone('stand-ne');

  const accessible = StadiaAI.Navigation.calculateRouteSteps(fromZone, toZone, true);
  const nonAcc     = StadiaAI.Navigation.calculateRouteSteps(fromZone, toZone, false);

  const hasElevator = accessible.steps.some(s => s.type === 'elevator');
  const hasStairs   = nonAcc.steps.some(s    => s.type === 'stairs');

  assert.ok(hasElevator, 'Accessible route should include an elevator step');
  assert.ok(hasStairs,   'Non-accessible route should include a stairs step');
});

// ---------------------------------------------------------------------------
// 6. Sustainability — init renders circular gauges
// ---------------------------------------------------------------------------
test('Sustainability.init() renders gauge SVGs in the gauges container', () => {
  const { document, StadiaAI } = createEnv();

  StadiaAI.Sustainability.init();

  const gauges = document.getElementById('sustainability-gauges');
  assert.ok(gauges, '#sustainability-gauges should exist');
  assert.ok(gauges.children.length > 0, 'Sustainability gauges should have rendered children');
});

// ---------------------------------------------------------------------------
// 7. Ops — init populates timeline and incident feed
// ---------------------------------------------------------------------------
test('Ops.init() populates timeline and alert feed', () => {
  const { document, StadiaAI } = createEnv();

  StadiaAI.Ops.init();

  const timeline  = document.getElementById('ops-timeline');
  const alertFeed = document.getElementById('ops-alert-feed');

  assert.ok(timeline,  '#ops-timeline element should exist');
  assert.ok(alertFeed, '#ops-alert-feed element should exist');
  assert.ok(timeline.children.length > 0,  'Timeline should have rendered nodes');
  assert.ok(alertFeed.children.length > 0, 'Alert feed should have rendered incidents');
});

// ---------------------------------------------------------------------------
// 8. Accessibility — toggleAccessibilityMode adds/removes body class
// ---------------------------------------------------------------------------
test('Accessibility.toggleAccessibilityMode() toggles body class correctly', () => {
  const { document, StadiaAI } = createEnv();

  StadiaAI.Accessibility.init();

  // Enable
  StadiaAI.Accessibility.toggleAccessibilityMode(true);
  assert.ok(
    document.body.classList.contains('accessibility-mode'),
    'body should have accessibility-mode class when enabled'
  );

  // Disable
  StadiaAI.Accessibility.toggleAccessibilityMode(false);
  assert.ok(
    !document.body.classList.contains('accessibility-mode'),
    'body should not have accessibility-mode class when disabled'
  );
});

// ---------------------------------------------------------------------------
// 9. Accessibility — requestAssistance() adds an alert to Data.getAlerts()
// ---------------------------------------------------------------------------
test('Accessibility.requestAssistance() inserts a high-severity medical alert', () => {
  const { window, StadiaAI } = createEnv();

  StadiaAI.Accessibility.init();
  StadiaAI.Ops.init(); // Ops must be present for dispatcher

  // Auto-confirm the browser confirm() dialog
  window.confirm = () => true;

  const before = StadiaAI.Data.getAlerts().length;
  StadiaAI.Accessibility.requestAssistance();
  const after  = StadiaAI.Data.getAlerts().length;

  assert.equal(after, before + 1, 'One new alert should be added after requesting assistance');

  const latest = StadiaAI.Data.getAlerts()[0];
  assert.equal(latest.type,     'medical', 'Dispatched alert type should be medical');
  assert.equal(latest.severity, 'high',    'Dispatched alert severity should be high');
  assert.equal(latest.resolved, false,     'Newly dispatched alert should not be pre-resolved');
});

// ---------------------------------------------------------------------------
// 10. Data module — resolveAlert marks an alert as resolved
// ---------------------------------------------------------------------------
test('Data.resolveAlert() marks the correct alert as resolved', () => {
  const { StadiaAI } = createEnv();

  const alerts = StadiaAI.Data.getAlerts();
  assert.ok(alerts.length > 0, 'There should be seed alerts in Data');

  const target = alerts[0];
  assert.equal(target.resolved, false, 'Seed alert should start as unresolved');

  StadiaAI.Data.resolveAlert(target.id);
  assert.equal(target.resolved, true, 'Alert should be resolved after calling resolveAlert');
});

// ---------------------------------------------------------------------------
// 11. Utils — escapeHtml prevents XSS injection
// ---------------------------------------------------------------------------
test('Utils.escapeHtml() escapes all dangerous characters', () => {
  const { StadiaAI } = createEnv();

  const input   = '<script>alert("xss\'s")</script>/';
  const escaped = StadiaAI.Utils.escapeHtml(input);

  // None of these raw characters should survive verbatim
  assert.ok(!escaped.includes('<'),  'Output should not contain raw <');
  assert.ok(!escaped.includes('>'),  'Output should not contain raw >');
  assert.ok(!escaped.includes('"'),  'Output should not contain raw "');
  assert.ok(!escaped.includes("'"),  "Output should not contain raw '");
  assert.ok(!escaped.includes('/'),  'Output should not contain raw /');

  // The entities should be present instead
  assert.ok(escaped.includes('&lt;'),   'Output should contain &lt; for <');
  assert.ok(escaped.includes('&gt;'),   'Output should contain &gt; for >');
  assert.ok(escaped.includes('&#x2F;'),'Output should contain &#x2F; for /');
});

// ---------------------------------------------------------------------------
// 12. Utils — formatNumber uses en-US locale
// ---------------------------------------------------------------------------
test('Utils.formatNumber() formats with comma thousands separators', () => {
  const { StadiaAI } = createEnv();

  const formatted = StadiaAI.Utils.formatNumber(1234567);
  assert.equal(formatted, '1,234,567', 'formatNumber should produce en-US formatted string');
});
