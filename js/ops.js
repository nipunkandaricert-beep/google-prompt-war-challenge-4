(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  const milestones = [
    { name: 'Gates Open', offset: -180, completed: true },
    { name: 'Warm-up', offset: -60, completed: true },
    { name: 'Kick-off', offset: 0, completed: true },
    { name: 'Half-time', offset: 45, completed: true },
    { name: 'Second Half', offset: 60, completed: true },
    { name: 'Full-time', offset: 105, completed: false },
    { name: 'Egress Plan', offset: 120, completed: false }
  ];

  StadiaAI.Ops = {
    init: function() {
      this.renderTimeline();
      this.renderAlerts();
      this.renderResources();
      this.updateStats();
    },

    update: function() {
      this.updateStats();
      this.renderAlerts();
      this.renderResources();
    },

    updateStats: function() {
      const alerts = StadiaAI.Data.getAlerts();
      const activeCount = alerts.filter(a => !a.resolved).length;
      const resolvedCount = alerts.filter(a => a.resolved).length;

      const actEl = StadiaAI.Utils.$('#ops-active-incidents');
      const resEl = StadiaAI.Utils.$('#ops-resolved');
      
      if (actEl) actEl.innerText = activeCount;
      if (resEl) resEl.innerText = resolvedCount;
    },

    renderTimeline: function() {
      const timeline = StadiaAI.Utils.$('#ops-timeline');
      if (!timeline) return;

      timeline.innerHTML = '';
      
      milestones.forEach(m => {
        const item = StadiaAI.Utils.createElement('div', 'ops-milestone');
        
        let stateClass = '';
        if (m.name === 'Second Half') {
          stateClass = 'active';
        } else if (m.completed) {
          stateClass = 'completed';
        }

        item.className = `ops-milestone ${stateClass}`;
        
        item.innerHTML = `
          <div class="ops-milestone-marker"></div>
          <span class="ops-milestone-title">${StadiaAI.Utils.escapeHtml(m.name)}</span>
        `;
        timeline.appendChild(item);
      });
    },

    renderAlerts: function() {
      const feed = StadiaAI.Utils.$('#ops-alert-feed');
      if (!feed) return;

      feed.innerHTML = '';
      const alerts = StadiaAI.Data.getAlerts().filter(a => !a.resolved);

      if (alerts.length === 0) {
        feed.innerHTML = '<p class="text-muted text-sm" style="text-align:center; padding: var(--space-8);">All systems nominal. No active incidents.</p>';
        return;
      }

      alerts.forEach(alert => {
        const card = StadiaAI.Utils.createElement('div', `ops-alert-card ops-alert-card--${alert.severity} animate-in`);
        
        let iconSvg = '';
        if (alert.type === 'medical') {
          iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
        } else if (alert.type === 'security') {
          iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
        } else if (alert.type === 'crowd') {
          iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
        } else {
          iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        const zoneName = StadiaAI.Data.getZone(alert.zone)?.name || 'Unknown Area';

        card.innerHTML = `
          <div class="ops-alert-header">
            <div style="display:flex; align-items:center; gap:var(--space-2)">
              ${iconSvg}
              <strong style="text-transform: capitalize;">${StadiaAI.Utils.escapeHtml(alert.type)} Incident</strong>
            </div>
            <span class="badge badge-danger text-xs">${StadiaAI.Utils.escapeHtml(alert.severity.toUpperCase())}</span>
          </div>
          <div class="ops-alert-body">${StadiaAI.Utils.escapeHtml(alert.message)}</div>
          <div class="ops-alert-footer">
            <span class="text-secondary text-sm">📍 ${StadiaAI.Utils.escapeHtml(zoneName)} • ${StadiaAI.Utils.formatRelativeTime(alert.timestamp)}</span>
            <div style="display:flex; gap:var(--space-2)">
              <button class="btn btn-secondary btn-sm btn-ops-ai" data-id="${alert.id}">AI Advice</button>
              <button class="btn btn-primary btn-sm btn-ops-resolve" data-id="${alert.id}">Resolve</button>
            </div>
          </div>
        `;

        // Action bindings
        StadiaAI.Utils.on(StadiaAI.Utils.$('.btn-ops-resolve', card), 'click', (e) => {
          this.resolveAlert(alert.id);
        });

        StadiaAI.Utils.on(StadiaAI.Utils.$('.btn-ops-ai', card), 'click', (e) => {
          this.getAIDecision(alert);
        });

        feed.appendChild(card);
      });
    },

    resolveAlert: function(id) {
      StadiaAI.Data.resolveAlert(id);
      StadiaAI.Utils.showToast('Incident resolved and archived.', 'success');
      this.update();
      if (StadiaAI.Crowd) {
        StadiaAI.Crowd.update(StadiaAI.Data.getZones());
      }
    },

    getAIDecision: async function(alert) {
      const panel = StadiaAI.Utils.$('#ops-ai-panel');
      const content = StadiaAI.Utils.$('#ops-ai-content');
      if (!panel || !content) return;

      panel.classList.add('hover-glow');
      content.innerHTML = `
        <h4 style="font-size:0.9375rem; margin-bottom:var(--space-2);">Analyzing incident in ${StadiaAI.Utils.escapeHtml(StadiaAI.Data.getZone(alert.zone)?.name || 'stadium')}...</h4>
        <p class="text-sm skeleton skeleton-text" style="width:100%"></p>
        <p class="text-sm skeleton skeleton-text" style="width:90%"></p>
        <p class="text-sm skeleton skeleton-text" style="width:95%"></p>
      `;

      const prompt = `Analyze this stadium operations incident: "${alert.message}" occurring in ${StadiaAI.Data.getZone(alert.zone)?.name}.
Provide an expert 3-step action plan for security or stadium staff to execute. Set priority level and state estimated resolution time. Keep it tactical, concise, and structured as numbered points. Under 80 words.`;

      try {
        content.innerHTML = '';
        await StadiaAI.Gemini.chatStream(prompt, 'ops', '', (chunk) => {
          content.innerHTML += StadiaAI.Utils.escapeHtml(chunk);
        });
      } catch (err) {
        console.error('Failed to stream AI operational decision:', err);
        content.innerHTML = '<p class="text-red">Error calling AI Decision Support. Please check API connection.</p>';
      }
    },

    renderResources: function() {
      const grid = StadiaAI.Utils.$('#ops-resource-grid');
      if (!grid) return;

      grid.innerHTML = '';
      
      const resources = [
        { name: 'Gate A Pepsi', status: 'Open', color: 'var(--accent-teal)' },
        { name: 'Gate C Verizon', status: 'Restricted', color: 'var(--accent-orange)' },
        { name: 'Gate E Bud Light', status: 'Open', color: 'var(--accent-teal)' },
        { name: 'Medical Station East', status: '9/10 Avail', color: 'var(--accent-teal)' },
        { name: 'Medical Station West', status: '4/5 Avail', color: 'var(--accent-teal)' },
        { name: 'Steward Deployment', status: '248 Active', color: 'var(--accent-blue)' },
        { name: 'Sensory Relief Room', status: 'Quiet', color: 'var(--accent-teal)' },
        { name: 'Parking Lots Space', status: '62% Full', color: 'var(--accent-gold)' }
      ];

      resources.forEach(r => {
        const card = StadiaAI.Utils.createElement('div', 'resource-card');
        card.innerHTML = `
          <span class="resource-label">${StadiaAI.Utils.escapeHtml(r.name)}</span>
          <span class="resource-status" style="color: ${r.color}">${StadiaAI.Utils.escapeHtml(r.status)}</span>
        `;
        grid.appendChild(card);
      });
    }
  };
})();
