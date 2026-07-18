(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  let lastAiAnalysisTime = 0;

  StadiaAI.Crowd = {
    init: function() {
      this.renderZoneTable();
      this.renderAlerts();
      this.updateStats();
    },

    update: function(crowdData) {
      this.updateStats();
      this.updateZoneTable(crowdData);
      this.renderAlerts();

      // Check if we should call Gemini for bottleneck predictions
      const now = Date.now();
      if (StadiaAI.Gemini.hasApiKey() && (now - lastAiAnalysisTime > 30000)) { // limit AI call to every 30s max
        this.getAICrowdPrediction(crowdData);
        lastAiAnalysisTime = now;
      }
    },

    updateStats: function() {
      const zones = StadiaAI.Data.getZones();
      const totalAttendance = zones.reduce((sum, z) => sum + (z.type === 'stand' ? z.currentOccupancy : 0), 0);
      const totalStandCap = zones.reduce((sum, z) => sum + (z.type === 'stand' ? z.capacity : 0), 0);
      const avgDensity = Math.round((totalAttendance / totalStandCap) * 100);

      // Find peak zone
      let peakZone = { currentOccupancy: 0, capacity: 1, name: 'None' };
      zones.forEach(z => {
        if (z.type === 'stand' && (z.currentOccupancy / z.capacity > peakZone.currentOccupancy / peakZone.capacity)) {
          peakZone = z;
        }
      });

      // Animate total attendance counter
      const attEl = StadiaAI.Utils.$('#crowd-total');
      if (attEl) {
        const prevValue = parseInt(attEl.innerText.replace(/,/g, '')) || 0;
        StadiaAI.Utils.animateCounter(attEl, prevValue, totalAttendance, 800, StadiaAI.Utils.formatNumber);
      }

      // Update avg density
      const densEl = StadiaAI.Utils.$('#crowd-avg-density');
      if (densEl) densEl.innerText = `${avgDensity}%`;

      // Update peak zone
      const peakEl = StadiaAI.Utils.$('#crowd-peak-zone');
      if (peakEl) peakEl.innerText = peakZone.name;
    },

    renderZoneTable: function() {
      const tbody = StadiaAI.Utils.$('#crowd-zone-tbody');
      if (!tbody) return;

      tbody.innerHTML = '';
      const zones = StadiaAI.Data.getZones();

      zones.forEach(zone => {
        const tr = StadiaAI.Utils.createElement('tr');
        tr.setAttribute('data-row-id', zone.id);
        tr.style.cursor = 'pointer';
        
        tr.innerHTML = `
          <td><strong>${StadiaAI.Utils.escapeHtml(zone.name)}</strong></td>
          <td style="text-transform: capitalize;"><span class="text-secondary">${StadiaAI.Utils.escapeHtml(zone.type)}</span></td>
          <td class="font-mono">${StadiaAI.Utils.formatNumber(zone.capacity)}</td>
          <td class="font-mono" id="row-occ-${zone.id}">${StadiaAI.Utils.formatNumber(zone.currentOccupancy)}</td>
          <td>
            <div class="crowd-density-bar-container">
              <div class="crowd-density-bar">
                <div class="crowd-density-fill" id="row-fill-${zone.id}" style="width: 0%"></div>
              </div>
              <span class="font-mono text-sm" id="row-pct-${zone.id}">0%</span>
            </div>
          </td>
        `;

        // Redirect to Map zone selection on click
        StadiaAI.Utils.on(tr, 'click', () => {
          StadiaAI.App.navigateTo('map');
          if (StadiaAI.StadiumMap) {
            StadiaAI.StadiumMap.selectZone(zone.id);
          }
        });

        tbody.appendChild(tr);
      });
    },

    updateZoneTable: function(zones) {
      zones.forEach(zone => {
        const occEl = StadiaAI.Utils.$(`#row-occ-${zone.id}`);
        const fillEl = StadiaAI.Utils.$(`#row-fill-${zone.id}`);
        const pctEl = StadiaAI.Utils.$(`#row-pct-${zone.id}`);
        
        if (!occEl || !fillEl || !pctEl) return;

        const density = Math.round((zone.currentOccupancy / zone.capacity) * 100);
        
        occEl.innerText = StadiaAI.Utils.formatNumber(zone.currentOccupancy);
        pctEl.innerText = `${density}%`;
        fillEl.style.width = `${density}%`;

        let color = 'var(--accent-teal)';
        const level = StadiaAI.Utils.getDensityLevel(density);
        if (level === 'critical') {
          color = 'var(--accent-red)';
        } else if (level === 'high') {
          color = 'var(--accent-orange)';
        } else if (level === 'medium') {
          color = 'var(--accent-gold)';
        }
        fillEl.style.backgroundColor = color;
      });
    },

    renderAlerts: function() {
      const feed = StadiaAI.Utils.$('#crowd-alerts-feed');
      if (!feed) return;

      feed.innerHTML = '';
      const alerts = StadiaAI.Data.getAlerts().filter(a => !a.resolved);

      if (alerts.length === 0) {
        feed.innerHTML = '<p class="text-muted text-sm" style="text-align:center; padding: var(--space-8);">No active alerts. Operational status normal.</p>';
        return;
      }

      alerts.forEach(alert => {
        const item = StadiaAI.Utils.createElement('div', 'alert-item animate-in');
        
        let sevClass = 'badge-info';
        if (alert.severity === 'critical') sevClass = 'badge-danger';
        else if (alert.severity === 'high') sevClass = 'badge-danger';
        else if (alert.severity === 'medium') sevClass = 'badge-warning';

        const zoneName = StadiaAI.Data.getZone(alert.zone)?.name || 'Unknown Zone';
        
        item.innerHTML = `
          <div class="alert-item-header">
            <span class="badge ${sevClass}" style="text-transform: uppercase;">${StadiaAI.Utils.escapeHtml(alert.severity)}</span>
            <span class="text-muted text-xs">${StadiaAI.Utils.formatRelativeTime(alert.timestamp)}</span>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-primary);">${StadiaAI.Utils.escapeHtml(alert.message)}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top: var(--space-2); border-top: 1px solid var(--border-subtle); padding-top: var(--space-2);">
            <span class="text-muted text-xs">📍 ${StadiaAI.Utils.escapeHtml(zoneName)}</span>
            <button class="btn btn-ghost btn-sm btn-view-map" data-zone="${StadiaAI.Utils.escapeHtml(alert.zone)}">View Map</button>
          </div>
        `;

        StadiaAI.Utils.on(StadiaAI.Utils.$('.btn-view-map', item), 'click', function(e) {
          e.stopPropagation();
          StadiaAI.App.navigateTo('map');
          if (StadiaAI.StadiumMap) {
            StadiaAI.StadiumMap.selectZone(this.getAttribute('data-zone'));
          }
        });

        feed.appendChild(item);
      });
    },

    getAICrowdPrediction: async function(crowdData) {
      const insightCard = StadiaAI.Utils.$('#crowd-ai-insight');
      if (!insightCard) return;

      const denseZones = crowdData.filter(z => (z.currentOccupancy / z.capacity) >= 0.75);
      if (denseZones.length === 0) {
        insightCard.style.display = 'none';
        return;
      }

      const zoneContext = denseZones.map(z => `${z.name}: ${Math.round((z.currentOccupancy / z.capacity)*100)}% density (${z.currentOccupancy}/${z.capacity})`).join(', ');

      insightCard.innerHTML = `
        <div style="display:flex; align-items:center; gap:var(--space-2); color:var(--accent-gold); font-weight:700; margin-bottom:var(--space-2);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4"/></svg>
          <span>StadiaAI Crowd Analytics Insight</span>
        </div>
        <p class="text-sm skeleton skeleton-text" style="width:100%"></p>
        <p class="text-sm skeleton skeleton-text" style="width:85%"></p>
      `;
      insightCard.style.display = 'block';

      try {
        const text = await StadiaAI.Gemini.chat(
          `Current highly congested zones are: ${zoneContext}. What is the bottleneck risk and immediate operational action for staff? Keep it under 80 words.`,
          'crowd'
        );

        insightCard.innerHTML = `
          <div style="display:flex; align-items:center; gap:var(--space-2); color:var(--accent-gold); font-weight:700; margin-bottom:var(--space-2);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M16.24 16.24l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            <span>StadiaAI Crowd Analytics Insight</span>
          </div>
          <p class="text-sm" style="line-height:1.5;">${StadiaAI.Utils.escapeHtml(text)}</p>
        `;
      } catch (err) {
        console.error('Failed to get crowd prediction:', err);
        insightCard.style.display = 'none';
      }
    }
  };
})();
