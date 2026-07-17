(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  let currentZoom = 1;
  let viewBoxX = 0;
  let viewBoxY = 0;
  const viewBoxWidth = 800;
  const viewBoxHeight = 500;
  let selectedZoneId = null;

  StadiaAI.StadiumMap = {
    init: function() {
      const container = StadiaAI.Utils.$('#stadium-svg-container');
      if (!container) return;

      this.render(container);
      this.setupZoomControls();
      this.setupInteraction();
      this.updateDensity(StadiaAI.Data.getZones());
    },

    render: function(container) {
      // Create SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
      svg.setAttribute('id', 'stadium-svg');
      
      // Clear container
      container.innerHTML = '';
      
      // Draw elements
      let svgHtml = '';
      
      // 1. Stadium background/outline (Bowl)
      svgHtml += `<rect x="50" y="20" width="700" height="460" rx="230" ry="230" fill="var(--bg-secondary)" stroke="var(--border-subtle)" stroke-width="2" />`;
      
      // Concourse Rings
      svgHtml += `<rect x="90" y="55" width="620" height="390" rx="195" ry="195" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="32" />`;
      svgHtml += `<rect x="130" y="90" width="540" height="320" rx="160" ry="160" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="24" />`;
      
      // 2. Pitch / Field in the center
      svgHtml += `
        <!-- Field -->
        <g id="pitch">
          <rect x="260" y="170" width="280" height="160" fill="#1e3a27" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
          <!-- Markings -->
          <line x1="400" y1="170" x2="400" y2="330" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
          <circle cx="400" cy="250" r="35" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
          <circle cx="400" cy="250" r="4" fill="rgba(255,255,255,0.6)" />
          <!-- Penalty Boxes -->
          <rect x="260" y="210" width="40" height="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
          <rect x="500" y="210" width="40" height="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
          <circle cx="300" cy="250" r="1.5" fill="rgba(255,255,255,0.6)" />
          <circle cx="500" cy="250" r="1.5" fill="rgba(255,255,255,0.6)" />
        </g>
      `;

      // 3. Render zones (Stands, corners, restrooms, medical)
      const zones = StadiaAI.Data.getZones();
      zones.forEach(zone => {
        const coords = zone.coordinates;
        if (zone.type === 'stand') {
          // Stands drawn as curved capsules using rect with large radius
          const x = coords.cx - coords.rx;
          const y = coords.cy - coords.ry;
          const w = coords.rx * 2;
          const h = coords.ry * 2;
          const rx = zone.id.includes('corner') ? varRad(zone.id) : 15;
          svgHtml += `
            <rect id="svg-${zone.id}" class="map-zone" data-zone-id="${zone.id}" 
                  x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}"
                  fill="rgba(0, 201, 167, 0.15)" stroke="var(--bg-glass-border)" stroke-width="1.5" />
          `;
        } else if (zone.type === 'concourse') {
          // Drawn as outlines, not filled zones to keep map clean
          const x = coords.cx - coords.rx;
          const y = coords.cy - coords.ry;
          svgHtml += `
            <rect id="svg-${zone.id}" class="map-zone concourse-ring" data-zone-id="${zone.id}"
                  x="${x}" y="${y}" width="${coords.rx*2}" height="${coords.ry*2}" rx="120" ry="120"
                  fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" />
          `;
        } else if (zone.type === 'gate') {
          // Gates as circular checkpoints around edge
          svgHtml += `
            <g id="svg-${zone.id}" class="map-zone" data-zone-id="${zone.id}" cursor="pointer">
              <circle cx="${coords.cx}" cy="${coords.cy}" r="${coords.r}" fill="var(--bg-tertiary)" stroke="var(--accent-gold)" stroke-width="2" />
              <text x="${coords.cx}" y="${coords.cy + 4}" font-family="var(--font-heading)" font-size="10" font-weight="700" fill="var(--text-primary)" text-anchor="middle">
                ${zone.name.split(' ')[1]}
              </text>
            </g>
          `;
        } else if (zone.type === 'concession') {
          // Food kiosks
          svgHtml += `
            <rect id="svg-${zone.id}" class="map-zone" data-zone-id="${zone.id}"
                  x="${coords.cx - coords.rx}" y="${coords.cy - coords.ry}" width="${coords.rx*2}" height="${coords.ry*2}" rx="4"
                  fill="#78350f" stroke="#f59e0b" stroke-width="1" />
          `;
        } else if (zone.type === 'restroom') {
          svgHtml += `
            <rect id="svg-${zone.id}" class="map-zone" data-zone-id="${zone.id}"
                  x="${coords.cx - coords.rx}" y="${coords.cy - coords.ry}" width="${coords.rx*2}" height="${coords.ry*2}" rx="4"
                  fill="#1e3a8a" stroke="#3b82f6" stroke-width="1" />
          `;
        } else if (zone.type === 'medical') {
          svgHtml += `
            <rect id="svg-${zone.id}" class="map-zone" data-zone-id="${zone.id}"
                  x="${coords.cx - coords.rx}" y="${coords.cy - coords.ry}" width="${coords.rx*2}" height="${coords.ry*2}" rx="4"
                  fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5" />
          `;
        } else if (zone.type === 'accessible' || zone.type === 'vip') {
          svgHtml += `
            <rect id="svg-${zone.id}" class="map-zone" data-zone-id="${zone.id}"
                  x="${coords.cx - coords.rx}" y="${coords.cy - coords.ry}" width="${coords.rx*2}" height="${coords.ry*2}" rx="4"
                  fill="rgba(139, 92, 246, 0.15)" stroke="var(--accent-purple)" stroke-width="1" />
          `;
        }
      });

      // Overlay text markers for North/South stands
      svgHtml += `
        <text x="400" y="48" font-family="var(--font-heading)" font-size="12" font-weight="700" fill="var(--text-muted)" text-anchor="middle" letter-spacing="1">NORTH STANDS</text>
        <text x="400" y="462" font-family="var(--font-heading)" font-size="12" font-weight="700" fill="var(--text-muted)" text-anchor="middle" letter-spacing="1">SOUTH STANDS</text>
        <text x="75" y="254" font-family="var(--font-heading)" font-size="12" font-weight="700" fill="var(--text-muted)" text-anchor="middle" transform="rotate(-90 75 254)" letter-spacing="1">WEST STANDS</text>
        <text x="725" y="254" font-family="var(--font-heading)" font-size="12" font-weight="700" fill="var(--text-muted)" text-anchor="middle" transform="rotate(90 725 254)" letter-spacing="1">EAST STANDS</text>
      `;

      svg.innerHTML = svgHtml;
      container.appendChild(svg);
    },

    setupZoomControls: function() {
      StadiaAI.Utils.on(StadiaAI.Utils.$('#map-zoom-in'), 'click', () => this.zoom(1.2));
      StadiaAI.Utils.on(StadiaAI.Utils.$('#map-zoom-out'), 'click', () => this.zoom(0.8));
      StadiaAI.Utils.on(StadiaAI.Utils.$('#map-reset'), 'click', () => this.zoom(0));
    },

    setupInteraction: function() {
      const self = this;
      
      // Zone clicking
      StadiaAI.Utils.delegate(StadiaAI.Utils.$('#stadium-svg-container'), 'click', '.map-zone', function(e) {
        const id = this.getAttribute('data-zone-id') || this.id.replace('svg-', '');
        self.selectZone(id);
      });
    },

    zoom: function(scaleFactor) {
      const svg = StadiaAI.Utils.$('#stadium-svg');
      if (!svg) return;

      if (scaleFactor === 0) {
        currentZoom = 1;
        viewBoxX = 0;
        viewBoxY = 0;
      } else {
        currentZoom = StadiaAI.Utils.clamp(currentZoom * scaleFactor, 0.5, 4);
        const newWidth = viewBoxWidth / currentZoom;
        const newHeight = viewBoxHeight / currentZoom;
        viewBoxX = (viewBoxWidth - newWidth) / 2;
        viewBoxY = (viewBoxHeight - newHeight) / 2;
      }
      
      svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth / currentZoom} ${viewBoxHeight / currentZoom}`);
    },

    updateDensity: function(zones) {
      zones.forEach(zone => {
        const el = StadiaAI.Utils.$(`#svg-${zone.id}`) || StadiaAI.Utils.$(`[data-zone-id="${zone.id}"]`);
        if (!el) return;

        const density = zone.currentOccupancy / zone.capacity;
        let color = '#22c55e'; // Green (Low)
        let stroke = 'rgba(255,255,255,0.08)';

        if (density >= 0.85) {
          color = '#ef4444'; // Red (Critical)
          stroke = 'rgba(239, 68, 68, 0.4)';
        } else if (density >= 0.70) {
          color = '#f97316'; // Orange (High)
          stroke = 'rgba(249, 115, 22, 0.4)';
        } else if (density >= 0.50) {
          color = '#eab308'; // Yellow (Medium)
          stroke = 'rgba(234, 179, 8, 0.4)';
        }

        // Apply style adjustments depending on SVG element types
        if (el.tagName === 'circle') {
          el.setAttribute('fill', color);
        } else if (el.classList.contains('concourse-ring')) {
          el.setAttribute('stroke', color);
          el.style.opacity = '0.4';
        } else {
          el.setAttribute('fill', color);
          el.style.fillOpacity = '0.15';
          el.setAttribute('stroke', stroke);
        }
      });
      
      // Update selected zone data in overlay pane
      if (selectedZoneId) {
        this.selectZone(selectedZoneId, false);
      }
    },

    selectZone: function(zoneId, refocus = true) {
      // Clear previous selections
      StadiaAI.Utils.$$('.map-zone').forEach(z => z.classList.remove('selected'));
      
      selectedZoneId = zoneId;
      const el = StadiaAI.Utils.$(`#svg-${zoneId}`) || StadiaAI.Utils.$(`[data-zone-id="${zoneId}"]`);
      if (el) {
        el.classList.add('selected');
      }

      const zone = StadiaAI.Data.getZone(zoneId);
      const panel = StadiaAI.Utils.$('#zone-details-content');
      if (!zone || !panel) return;

      const density = Math.round((zone.currentOccupancy / zone.capacity) * 100);
      let densityText = 'Low Crowd';
      let densityClass = 'badge-success';
      if (density >= 85) {
        densityText = 'Critical Congestion';
        densityClass = 'badge-danger';
      } else if (density >= 70) {
        densityText = 'High Crowds';
        densityClass = 'badge-danger';
      } else if (density >= 50) {
        densityText = 'Moderate Crowds';
        densityClass = 'badge-warning';
      }

      // Concessions within this zone
      const concessions = StadiaAI.Data.getConcessions().filter(c => c.location === zoneId);
      let concessionsHtml = '<p class="text-muted text-sm">None in this zone</p>';
      if (concessions.length > 0) {
        concessionsHtml = concessions.map(c => `
          <div class="concession-item" style="margin-top: 8px; padding-bottom: 8px; border-bottom: 1px dashed var(--border-subtle)">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>${c.name}</strong>
              <span class="badge ${c.waitTime > 10 ? 'badge-danger' : 'badge-success'}">${c.waitTime} min wait</span>
            </div>
            <p class="text-secondary text-sm" style="margin-top: 2px;">
              Popular: ${c.items.filter(i => i.popular).map(i => i.name).join(', ')}
            </p>
          </div>
        `).join('');
      }

      // Draw panel
      panel.innerHTML = `
        <div style="display:flex; flex-direction:column; gap: var(--space-4); margin-top: var(--space-4);">
          <div>
            <h4 style="font-size: 1.125rem;">${zone.name}</h4>
            <span class="text-muted text-sm" style="text-transform: capitalize;">Type: ${zone.type} • Level ${zone.level}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge ${densityClass}">${densityText}</span>
            <strong class="font-mono">${density}% Full</strong>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width: ${density}%; background-color: ${density >= 85 ? 'var(--accent-red)' : density >= 70 ? 'var(--accent-orange)' : 'var(--accent-teal)'}"></div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-3); border-top:1px solid var(--border-subtle); padding-top:var(--space-3);">
            <div>
              <span class="text-muted text-xs uppercase tracking-wide block">Occupancy</span>
              <span class="font-mono text-sm">${StadiaAI.Utils.formatNumber(zone.currentOccupancy)}</span>
            </div>
            <div>
              <span class="text-muted text-xs uppercase tracking-wide block">Capacity</span>
              <span class="font-mono text-sm">${StadiaAI.Utils.formatNumber(zone.capacity)}</span>
            </div>
          </div>

          <div style="border-top:1px solid var(--border-subtle); padding-top:var(--space-3);">
            <h5 style="font-size:0.875rem; margin-bottom:var(--space-2);">Kiosks &amp; Concessions</h5>
            ${concessionsHtml}
          </div>

          <div style="display:flex; gap:var(--space-2); margin-top:var(--space-4);">
            <button class="btn btn-primary btn-sm btn-nav-from" data-zone="${zone.id}" style="flex:1;">From Here</button>
            <button class="btn btn-secondary btn-sm btn-nav-to" data-zone="${zone.id}" style="flex:1;">To Here</button>
          </div>
        </div>
      `;

      // Set up click handlers for Nav triggers
      StadiaAI.Utils.on(StadiaAI.Utils.$('.btn-nav-from', panel), 'click', function() {
        StadiaAI.App.navigateTo('navigate');
        const fromSel = StadiaAI.Utils.$('#nav-from-select');
        if (fromSel) {
          fromSel.value = this.getAttribute('data-zone');
          fromSel.dispatchEvent(new Event('change'));
        }
      });

      StadiaAI.Utils.on(StadiaAI.Utils.$('.btn-nav-to', panel), 'click', function() {
        StadiaAI.App.navigateTo('navigate');
        const toSel = StadiaAI.Utils.$('#nav-to-select');
        if (toSel) {
          toSel.value = this.getAttribute('data-zone');
          toSel.dispatchEvent(new Event('change'));
        }
      });
    }
  };

  // Helper inside layout positioning
  function varRad(id) {
    return 10;
  }
})();
