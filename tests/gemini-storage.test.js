// Tests the Gemini module's API-key storage lifecycle against a real
// sessionStorage/localStorage implementation via jsdom, since this logic
// is the core of the "don't persist the key unless the user opts in"
// security fix and is worth regression-testing directly rather than by
// inspection alone.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');

function loadGeminiWithFreshWindow() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.com/',
    runScripts: 'dangerously'
  });
  const utilsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils.js'), 'utf8');
  const geminiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'gemini.js'), 'utf8');

  // Evaluate both IIFEs against the jsdom window so `window`, `localStorage`,
  // and `sessionStorage` all resolve to the same real (jsdom-backed) objects
  // the app would use in a browser.
  dom.window.eval(utilsSrc);
  dom.window.eval(geminiSrc);

  return dom.window.StadiaAI.Gemini;
}

test('setApiKey defaults to session-only storage (not persisted to localStorage)', () => {
  const Gemini = loadGeminiWithFreshWindow();
  Gemini.setApiKey('AIza-test-key-123');

  assert.equal(Gemini.apiKey, 'AIza-test-key-123');
  assert.equal(Gemini.isRemembered(), false);
});

test('setApiKey(key, true) persists to localStorage and reports as remembered', () => {
  const Gemini = loadGeminiWithFreshWindow();
  Gemini.setApiKey('AIza-test-key-456', true);

  assert.equal(Gemini.apiKey, 'AIza-test-key-456');
  assert.equal(Gemini.isRemembered(), true);
});

test('init() picks up a previously-remembered localStorage key on a fresh load', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com/', runScripts: 'dangerously' });
  const utilsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils.js'), 'utf8');
  const geminiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'gemini.js'), 'utf8');
  dom.window.eval(utilsSrc);
  dom.window.eval(geminiSrc);

  // Simulate a prior "remembered" session by writing directly, then
  // re-running init() as a fresh page load would.
  dom.window.localStorage.setItem('stadia_api_key', JSON.stringify('AIza-remembered-key'));
  dom.window.StadiaAI.Gemini.init();

  assert.equal(dom.window.StadiaAI.Gemini.apiKey, 'AIza-remembered-key');
  assert.equal(dom.window.StadiaAI.Gemini.isRemembered(), true);
});

test('clearStoredKey wipes the key from memory and both storage backends', () => {
  const Gemini = loadGeminiWithFreshWindow();
  Gemini.setApiKey('AIza-to-be-cleared', true);
  assert.equal(Gemini.hasApiKey(), true);

  Gemini.clearStoredKey();

  assert.equal(Gemini.hasApiKey(), false);
  assert.equal(Gemini.apiKey, null);
  assert.equal(Gemini.isRemembered(), false);
});

test('setApiKey with an empty/whitespace value clears any stored key', () => {
  const Gemini = loadGeminiWithFreshWindow();
  Gemini.setApiKey('AIza-something', true);

  const result = Gemini.setApiKey('   ');

  assert.equal(result, false);
  assert.equal(Gemini.hasApiKey(), false);
});
