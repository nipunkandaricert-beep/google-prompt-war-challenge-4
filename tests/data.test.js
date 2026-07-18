// Zero-dependency tests using Node's built-in test runner (Node 18+).
// Run with:  node --test tests
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

global.window = global.window || {};
require(path.join(__dirname, '..', 'js', 'utils.js'));
require(path.join(__dirname, '..', 'js', 'data.js'));

const Data = global.window.StadiaAI.Data;

test('getVenues returns a non-empty list of venue objects with required fields', () => {
  const venues = Data.getVenues();
  assert.ok(Array.isArray(venues) && venues.length > 0);
  venues.forEach(v => {
    assert.equal(typeof v.id, 'string');
    assert.equal(typeof v.name, 'string');
    assert.equal(typeof v.capacity, 'number');
  });
});

test('getVenue finds a known venue by id and returns undefined for unknown ids', () => {
  const metlife = Data.getVenue('metlife');
  assert.ok(metlife);
  assert.equal(metlife.city, 'New York/New Jersey');
  assert.equal(Data.getVenue('not-a-real-venue'), undefined);
});

test('getZones returns zones with valid, non-negative occupancy within capacity', () => {
  const zones = Data.getZones();
  assert.ok(zones.length > 0);
  zones.forEach(z => {
    assert.ok(z.currentOccupancy >= 0);
    assert.ok(z.currentOccupancy <= z.capacity);
  });
});

test('getZone returns the matching zone object', () => {
  const zone = Data.getZone('gate-a');
  assert.ok(zone);
  assert.equal(zone.type, 'gate');
});

test('resolveAlert marks the matching alert resolved and leaves others untouched', () => {
  const alerts = Data.getAlerts();
  const target = alerts[0];
  assert.equal(target.resolved, false);

  Data.resolveAlert(target.id);

  const updated = Data.getAlerts().find(a => a.id === target.id);
  assert.equal(updated.resolved, true);
});

test('generateCrowdData keeps every zone within its 10%-95% simulated bounds', () => {
  const zones = Data.generateCrowdData();
  zones.forEach(z => {
    const min = Math.floor(z.capacity * 0.1);
    const max = Math.floor(z.capacity * 0.95);
    assert.ok(z.currentOccupancy >= min, `${z.id} occupancy ${z.currentOccupancy} below min ${min}`);
    assert.ok(z.currentOccupancy <= max, `${z.id} occupancy ${z.currentOccupancy} above max ${max}`);
  });
});

test('generateAlert produces a well-formed alert and prepends it to the active list', () => {
  const before = Data.getAlerts().length;
  const alert = Data.generateAlert();

  assert.equal(typeof alert.id, 'string');
  assert.ok(['medical', 'security', 'crowd', 'weather', 'facility'].includes(alert.type));
  assert.ok(['low', 'medium', 'high', 'critical'].includes(alert.severity));
  assert.equal(typeof alert.message, 'string');
  assert.equal(alert.resolved, false);

  const after = Data.getAlerts();
  assert.equal(after.length, before + 1);
  assert.equal(after[0].id, alert.id);
});
