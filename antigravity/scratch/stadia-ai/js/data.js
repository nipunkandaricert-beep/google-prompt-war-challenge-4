(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  const venues = [
    { id: 'metlife', name: 'MetLife Stadium', city: 'New York/New Jersey', country: 'United States', capacity: 82500, lat: 40.8135, lng: -74.0744, timezone: 'America/New_York' },
    { id: 'sofi', name: 'SoFi Stadium', city: 'Los Angeles', country: 'United States', capacity: 70240, lat: 33.9534, lng: -118.3387, timezone: 'America/Los_Angeles' },
    { id: 'att', name: 'AT&T Stadium', city: 'Dallas', country: 'United States', capacity: 80000, lat: 32.7473, lng: -97.0945, timezone: 'America/Chicago' },
    { id: 'hard-rock', name: 'Hard Rock Stadium', city: 'Miami', country: 'United States', capacity: 64767, lat: 25.9579, lng: -80.2388, timezone: 'America/New_York' },
    { id: 'mercedes-benz', name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'United States', capacity: 71000, lat: 33.7576, lng: -84.4010, timezone: 'America/New_York' },
    { id: 'nrg', name: 'NRG Stadium', city: 'Houston', country: 'United States', capacity: 72220, lat: 29.6847, lng: -95.4082, timezone: 'America/Chicago' },
    { id: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City', country: 'United States', capacity: 76416, lat: 39.0489, lng: -94.4839, timezone: 'America/Chicago' },
    { id: 'gillette', name: 'Gillette Stadium', city: 'Boston', country: 'United States', capacity: 65878, lat: 42.0909, lng: -71.2643, timezone: 'America/New_York' },
    { id: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'United States', capacity: 69796, lat: 39.9008, lng: -75.1674, timezone: 'America/New_York' },
    { id: 'levis', name: 'Levi\'s Stadium', city: 'San Francisco', country: 'United States', capacity: 68500, lat: 37.4033, lng: -121.9698, timezone: 'America/Los_Angeles' },
    { id: 'lumen', name: 'Lumen Field', city: 'Seattle', country: 'United States', capacity: 69000, lat: 47.5952, lng: -122.3316, timezone: 'America/Los_Angeles' },
    { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', capacity: 87523, lat: 19.3030, lng: -99.1505, timezone: 'America/Mexico_City' },
    { id: 'akron', name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', capacity: 48071, lat: 20.6819, lng: -103.4627, timezone: 'America/Mexico_City' },
    { id: 'bbva', name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', capacity: 53500, lat: 25.6692, lng: -100.2443, timezone: 'America/Mexico_City' },
    { id: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: 45000, lat: 43.6328, lng: -79.4186, timezone: 'America/Toronto' },
    { id: 'bc-place', name: 'BC Place', city: 'Vancouver', country: 'Canada', capacity: 54500, lat: 49.2768, lng: -123.1120, timezone: 'America/Vancouver' }
  ];

  // Specific MetLife Stadium coordinates, levels, capacities
  const metlifeZones = [
    // Outer/Stands
    { id: 'stand-north', name: 'North Stands', type: 'stand', level: 1, capacity: 18000, currentOccupancy: 15400, coordinates: { cx: 400, cy: 70, rx: 280, ry: 40 } },
    { id: 'stand-south', name: 'South Stands', type: 'stand', level: 1, capacity: 18000, currentOccupancy: 16200, coordinates: { cx: 400, cy: 430, rx: 280, ry: 40 } },
    { id: 'stand-east', name: 'East Stands', type: 'stand', level: 1, capacity: 20000, currentOccupancy: 18500, coordinates: { cx: 680, cy: 250, rx: 40, ry: 150 } },
    { id: 'stand-west', name: 'West Stands', type: 'stand', level: 1, capacity: 20000, currentOccupancy: 17100, coordinates: { cx: 120, cy: 250, rx: 40, ry: 150 } },
    
    // Corners
    { id: 'stand-ne', name: 'North-East Section', type: 'stand', level: 2, capacity: 4500, currentOccupancy: 3800, coordinates: { cx: 600, cy: 110, rx: 80, ry: 50 } },
    { id: 'stand-nw', name: 'North-West Section', type: 'stand', level: 2, capacity: 4500, currentOccupancy: 3900, coordinates: { cx: 200, cy: 110, rx: 80, ry: 50 } },
    { id: 'stand-se', name: 'South-East Section', type: 'stand', level: 2, capacity: 4500, currentOccupancy: 4200, coordinates: { cx: 600, cy: 390, rx: 80, ry: 50 } },
    { id: 'stand-sw', name: 'South-West Section', type: 'stand', level: 2, capacity: 4500, currentOccupancy: 4000, coordinates: { cx: 200, cy: 390, rx: 80, ry: 50 } },
    
    // Concourses
    { id: 'concourse-lower', name: 'Lower Concourse (L1)', type: 'concourse', level: 1, capacity: 15000, currentOccupancy: 8500, coordinates: { cx: 400, cy: 250, rx: 250, ry: 130 } },
    { id: 'concourse-upper', name: 'Upper Concourse (L3)', type: 'concourse', level: 3, capacity: 10000, currentOccupancy: 4300, coordinates: { cx: 400, cy: 250, rx: 290, ry: 160 } },
    
    // Gates
    { id: 'gate-a', name: 'Gate A (Pepsi Gate)', type: 'gate', level: 1, capacity: 5000, currentOccupancy: 1200, coordinates: { cx: 230, cy: 40, r: 12 } },
    { id: 'gate-b', name: 'Gate B', type: 'gate', level: 1, capacity: 5000, currentOccupancy: 2800, coordinates: { cx: 570, cy: 40, r: 12 } },
    { id: 'gate-c', name: 'Gate C (Verizon Gate)', type: 'gate', level: 1, capacity: 5000, currentOccupancy: 3900, coordinates: { cx: 730, cy: 180, r: 12 } },
    { id: 'gate-d', name: 'Gate D', type: 'gate', level: 1, capacity: 5000, currentOccupancy: 2100, coordinates: { cx: 730, cy: 320, r: 12 } },
    { id: 'gate-e', name: 'Gate E (Bud Light Gate)', type: 'gate', level: 1, capacity: 5000, currentOccupancy: 1500, coordinates: { cx: 570, cy: 460, r: 12 } },
    { id: 'gate-f', name: 'Gate F', type: 'gate', level: 1, capacity: 5000, currentOccupancy: 800, coordinates: { cx: 230, cy: 460, r: 12 } },

    // Concessions
    { id: 'concession-north', name: 'North Food Court', type: 'concession', level: 1, capacity: 2000, currentOccupancy: 1400, coordinates: { cx: 400, cy: 110, rx: 50, ry: 15 } },
    { id: 'concession-south', name: 'South Food Hall', type: 'concession', level: 1, capacity: 2000, currentOccupancy: 950, coordinates: { cx: 400, cy: 390, rx: 50, ry: 15 } },
    
    // Restrooms
    { id: 'restroom-n1', name: 'North Restrooms L1', type: 'restroom', level: 1, capacity: 300, currentOccupancy: 220, coordinates: { cx: 320, cy: 110, rx: 15, ry: 12 } },
    { id: 'restroom-s1', name: 'South Restrooms L1', type: 'restroom', level: 1, capacity: 300, currentOccupancy: 110, coordinates: { cx: 480, cy: 390, rx: 15, ry: 12 } },
    
    // Medical
    { id: 'medical-east', name: 'First Aid - East', type: 'medical', level: 1, capacity: 100, currentOccupancy: 15, coordinates: { cx: 620, cy: 250, rx: 15, ry: 15 } },
    { id: 'medical-west', name: 'First Aid - West', type: 'medical', level: 1, capacity: 100, currentOccupancy: 8, coordinates: { cx: 180, cy: 250, rx: 15, ry: 15 } },

    // Accessible Viewing & VIP
    { id: 'accessible-zone-1', name: 'Accessible Viewing Plat North', type: 'accessible', level: 1, capacity: 150, currentOccupancy: 62, coordinates: { cx: 400, cy: 135, rx: 40, ry: 8 } },
    { id: 'vip-lounge', name: 'Coaches Club VIP Lounge', type: 'vip', level: 1, capacity: 1500, currentOccupancy: 850, coordinates: { cx: 400, cy: 365, rx: 40, ry: 10 } }
  ];

  const concessions = [
    { id: 'burger-co', name: 'Stadium Burger Co.', location: 'concession-north', type: 'food', items: [{ name: 'World Cup Double Burger', price: 16.50, popular: true }, { name: 'Crispy Fries', price: 7.00, popular: false }, { name: 'Giant Soda', price: 9.00, popular: false }], waitTime: 12, rating: 4.2 },
    { id: 'taco-go', name: 'Taco & Tequila Go', location: 'concession-north', type: 'food', items: [{ name: 'Street Tacos (3x)', price: 14.00, popular: true }, { name: 'Nachos Grande', price: 12.50, popular: true }], waitTime: 8, rating: 4.5 },
    { id: 'jersey-brew', name: 'Jersey Local Brews', location: 'concession-south', type: 'drink', items: [{ name: 'Craft IPA Pint', price: 15.00, popular: true }, { name: 'Import Lager', price: 13.50, popular: false }, { name: 'Pretzel & Beer Combo', price: 22.00, popular: true }], waitTime: 4, rating: 4.6 },
    { id: 'pizza-slice', name: 'New York Pizza Slice', location: 'concession-south', type: 'food', items: [{ name: 'Pepperoni Slice XL', price: 9.50, popular: true }, { name: 'Cheese Slice XL', price: 8.50, popular: false }, { name: 'Garlic Knots (4x)', price: 6.00, popular: false }], waitTime: 14, rating: 4.1 }
  ];

  const schedule = [
    { id: 'm37', matchNumber: 37, stage: 'Group Stage — Group C', team1: { name: 'Brazil', code: 'BRA', flag: '🇧🇷' }, team2: { name: 'Germany', code: 'GER', flag: '🇩🇪' }, date: '2026-07-10T20:00:00Z', status: 'live', team1Score: 2, team2Score: 1, minute: '67\'' },
    { id: 'm48', matchNumber: 48, stage: 'Group Stage — Group F', team1: { name: 'United States', code: 'USA', flag: '🇺🇸' }, team2: { name: 'Italy', code: 'ITA', flag: '🇮🇹' }, date: '2026-07-13T19:00:00Z', status: 'upcoming' },
    { id: 'm64', matchNumber: 64, stage: 'Round of 32', team1: { name: 'Argentina', code: 'ARG', flag: '🇦🇷' }, team2: { name: 'Spain', code: 'ESP', flag: '🇪🇸' }, date: '2026-07-16T18:00:00Z', status: 'upcoming' },
    { id: 'm82', matchNumber: 82, stage: 'Round of 16', team1: { name: 'Mexico', code: 'MEX', flag: '🇲🇽' }, team2: { name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, date: '2026-07-20T20:00:00Z', status: 'upcoming' },
    { id: 'm98', matchNumber: 98, stage: 'Quarter-Final', team1: { name: 'Winner R16-1', code: 'TBD', flag: '🏳️' }, team2: { name: 'Winner R16-2', code: 'TBD', flag: '🏳' }, date: '2026-07-24T17:00:00Z', status: 'upcoming' },
    { id: 'm104', matchNumber: 104, stage: 'World Cup Final', team1: { name: 'Finalist 1', code: 'TBD', flag: '🏳️' }, team2: { name: 'Finalist 2', code: 'TBD', flag: '🏳️' }, date: '2026-07-26T21:00:00Z', status: 'upcoming' }
  ];

  const transportOptions = {
    parking: [
      { name: 'Lot A (Gold Lot)', distance: '400m', capacity: 3500, available: 410, price: '$60', accessible: true },
      { name: 'Lot B (Silver Lot)', distance: '600m', capacity: 4500, available: 1200, price: '$50', accessible: true },
      { name: 'Lot E (North Lot)', distance: '900m', capacity: 6000, available: 3100, price: '$35', accessible: false },
      { name: 'Lot G (Rideshare / Shuttle)', distance: '300m', capacity: 1500, available: 670, price: '$20', accessible: true }
    ],
    transit: [
      { name: 'NJ Transit Meadowlands Rail', route: 'Secaucus Junction ⇄ MetLife Stadium', frequency: 'Every 8 mins', travelTime: '15 mins', status: 'Running on schedule' },
      { name: 'Coach USA Express Bus', route: 'NYC Port Authority ⇄ MetLife Stadium Lot K', frequency: 'Every 15 mins', travelTime: '30 mins', status: 'Minor delays due to tunnel traffic' },
      { name: 'PATH Train Connection', route: 'Hoboken / Jersey City ⇄ Secaucus (Transfer)', frequency: 'Every 10 mins', travelTime: '25 mins', status: 'Running on schedule' }
    ],
    rideshare: [
      { name: 'Uber & Lyft Zone (Lot G)', avgWait: '18 min', surgePricing: '2.1x', pickupInstructions: 'Walk directly to the designated pickup arches in Lot G.' },
      { name: 'Local Taxi Stand (Lot F)', avgWait: '12 min', surgePricing: 'Flat fare NY/NJ', pickupInstructions: 'Direct dispatch lines outside Gate F.' }
    ],
    walking: [
      { name: 'Pedestrian Gateway East', destination: 'Gates C & D', avgWait: '6 min concourse walk', recommendation: 'Clean paths, highly recommended' }
    ]
  };

  const sustainabilityData = {
    carbonSaved: 12.4, // tons
    wasteRecycled: 87, // %
    waterSaved: 28500, // liters
    energyRenewable: 64, // %
    treesEquivalent: 340,
    matchDayCarbon: 1.8, // kg per fan
    targetCarbon: 1.5,
    greenScore: 73
  };

  const accessibilityFeatures = [
    { name: 'Wheelchair Ramps & Elevators', desc: 'All stadium levels accessible via broad ramp lanes and express elevators.', location: 'Located at Gates A, C, and E.' },
    { name: 'Sensory Relief Rooms', desc: 'Quieter space with soothing ambient lighting, noise-canceling headphones, and fidget tools.', location: 'Concourse Level 1, near Section 117.' },
    { name: 'Assistive Listening Devices', desc: 'Wireless FM receivers picking up in-stadium play-by-play commentary.', location: 'Guest Services booths at Section 124 & 315.' },
    { name: 'Open Captioning & ASL', desc: 'Real-time text translation of announcements on the primary ribbon videoboards.', location: 'Available on all main bowl displays.' },
    { name: 'Service Animal Relief Area', desc: 'Designated synthetic grass patch with waste disposal facilities.', location: 'Just outside Gate D perimeter.' }
  ];

  let activeAlerts = [
    { id: 'a1', type: 'crowd', severity: 'medium', message: 'Gate C showing high ticket scan delays. Dynamic routing fans to Gate B.', timestamp: new Date(Date.now() - 4 * 60000).toISOString(), zone: 'gate-c', resolved: false },
    { id: 'a2', type: 'medical', severity: 'high', message: 'Heat-related issue reported at Stand North. Medical Team deployed.', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), zone: 'stand-north', resolved: false }
  ];

  let selectedVenueId = 'metlife';

  StadiaAI.Data = {
    init: () => {
      // Re-populate mock occupancy occasionally
      metlifeZones.forEach(z => {
        if (z.type === 'stand') {
          z.currentOccupancy = Math.floor(z.capacity * StadiaAI.Utils.randomFloat(0.7, 0.95));
        } else if (z.type === 'concourse') {
          z.currentOccupancy = Math.floor(z.capacity * StadiaAI.Utils.randomFloat(0.4, 0.7));
        } else if (z.type === 'gate') {
          z.currentOccupancy = Math.floor(z.capacity * StadiaAI.Utils.randomFloat(0.15, 0.6));
        }
      });
    },

    getVenues: () => venues,
    getVenue: (id) => venues.find(v => v.id === id),
    getSelectedVenue: () => venues.find(v => v.id === selectedVenueId),
    setSelectedVenue: (id) => { selectedVenueId = id; },
    
    getZones: () => metlifeZones,
    getZone: (id) => metlifeZones.find(z => z.id === id),
    
    getConcessions: () => concessions,
    getSchedule: () => schedule,
    getTransportOptions: () => transportOptions,
    getSustainabilityData: () => sustainabilityData,
    getAccessibilityFeatures: () => accessibilityFeatures,
    
    getAlerts: () => activeAlerts,
    resolveAlert: (id) => {
      const alert = activeAlerts.find(a => a.id === id);
      if (alert) alert.resolved = true;
    },

    generateCrowdData: () => {
      metlifeZones.forEach(z => {
        let delta = StadiaAI.Utils.randomBetween(-100, 100);
        z.currentOccupancy = StadiaAI.Utils.clamp(z.currentOccupancy + delta, Math.floor(z.capacity * 0.1), Math.floor(z.capacity * 0.95));
      });
      return metlifeZones;
    },

    generateAlert: () => {
      const types = ['medical', 'security', 'crowd', 'weather', 'facility'];
      const severities = ['low', 'medium', 'high', 'critical'];
      const randomType = types[StadiaAI.Utils.randomBetween(0, types.length - 1)];
      const randomSeverity = severities[StadiaAI.Utils.randomBetween(0, severities.length - 1)];
      const randomZone = metlifeZones[StadiaAI.Utils.randomBetween(0, metlifeZones.length - 1)];
      
      let msg = '';
      if (randomType === 'medical') {
        msg = `Minor incident reported in ${randomZone.name}. First aid dispatched.`;
      } else if (randomType === 'security') {
        msg = `Suspicious item reported near ${randomZone.name}. Security scanning area.`;
      } else if (randomType === 'crowd') {
        msg = `Bottleneck building up in ${randomZone.name}. Directing volunteers to assist.`;
      } else if (randomType === 'weather') {
        msg = `Heavy winds expected. Securing temporary banners in ${randomZone.name}.`;
      } else {
        msg = `Leaky plumbing in restrooms adjacent to ${randomZone.name}. Maintenance alerted.`;
      }
      
      const newAlert = {
        id: `a${Date.now()}`,
        type: randomType,
        severity: randomSeverity,
        message: msg,
        timestamp: new Date().toISOString(),
        zone: randomZone.id,
        resolved: false
      };
      
      activeAlerts.unshift(newAlert);
      if (activeAlerts.length > 20) activeAlerts.pop();
      return newAlert;
    }
  };
})();
