(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  StadiaAI.Accessibility = {
    init: function() {
      // Toggle accessibility enhancements
      const toggle = StadiaAI.Utils.$('#accessibility-toggle');
      if (toggle) {
        // Restore last preference
        const enabled = StadiaAI.Utils.storage.get('accessibility_mode') === true;
        toggle.checked = enabled;
        this.toggleAccessibilityMode(enabled);

        StadiaAI.Utils.on(toggle, 'change', (e) => {
          this.toggleAccessibilityMode(e.target.checked);
        });
      }

      // Emergency help request
      const helpBtn = StadiaAI.Utils.$('#accessibility-emergency-btn');
      if (helpBtn) {
        StadiaAI.Utils.on(helpBtn, 'click', () => this.requestAssistance());
      }

      this.renderFeatures();
      this.populateSelects();
    },

    toggleAccessibilityMode: function(enabled) {
      if (enabled) {
        document.body.classList.add('accessibility-mode');
        StadiaAI.Utils.storage.set('accessibility_mode', true);
        StadiaAI.Utils.showToast('Enhanced Accessibility Mode enabled.', 'success');
      } else {
        document.body.classList.remove('accessibility-mode');
        StadiaAI.Utils.storage.set('accessibility_mode', false);
        StadiaAI.Utils.showToast('Standard Mode restored.', 'info');
      }
    },

    renderFeatures: function() {
      const container = StadiaAI.Utils.$('#accessibility-features');
      if (!container) return;

      container.innerHTML = '';
      const features = StadiaAI.Data.getAccessibilityFeatures();

      features.forEach(f => {
        const card = StadiaAI.Utils.createElement('div', 'accessibility-card animate-in');
        
        let iconSvg = '';
        if (f.name.includes('Sensory')) {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v12M6 12h12"/></svg>`;
        } else if (f.name.includes('FM')) {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`;
        } else if (f.name.includes('Captioning')) {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 10h4M7 14h6"/></svg>`;
        } else if (f.name.includes('Animal')) {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>`;
        } else {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="1.5"/><path d="M7 8h10"/><path d="m9 12 3 8"/><path d="m15 12-3 8"/><path d="M12 8v4"/></svg>`;
        }

        card.innerHTML = `
          <div class="accessibility-card-header">
            <div class="accessibility-icon">${iconSvg}</div>
            <strong>${StadiaAI.Utils.escapeHtml(f.name)}</strong>
          </div>
          <p class="text-secondary text-sm" style="line-height:1.4;">${StadiaAI.Utils.escapeHtml(f.desc)}</p>
          <span class="text-gold text-xs font-bold" style="margin-top:auto; padding-top:var(--space-2)">📍 ${StadiaAI.Utils.escapeHtml(f.location)}</span>
        `;
        container.appendChild(card);
      });
    },

    populateSelects: function() {
      const fromSel = StadiaAI.Utils.$('#acc-from-select');
      const toSel = StadiaAI.Utils.$('#acc-to-select');
      if (!fromSel || !toSel) return;

      const zones = StadiaAI.Data.getZones();
      let html = '<option value="" disabled selected>Select location...</option>';
      
      zones.forEach(z => {
        html += `<option value="${StadiaAI.Utils.escapeHtml(z.id)}">${StadiaAI.Utils.escapeHtml(z.name)} (L${z.level})</option>`;
      });

      fromSel.innerHTML = html;
      toSel.innerHTML = html;
    },

    requestAssistance: function() {
      if (confirm('Are you sure you want to request urgent assistance? An organizer or medical volunteer will be dispatched to your location immediately.')) {
        
        // Post alert in Ops Center feed
        const alert = {
          id: `acc-${Date.now()}`,
          type: 'medical',
          severity: 'high',
          message: 'Urgent assistance request triggered by disabled fan at Accessible Viewing Platform (North). Dispatching nearby steward.',
          timestamp: new Date().toISOString(),
          zone: 'accessible-zone-1',
          resolved: false
        };

        const alerts = StadiaAI.Data.getAlerts();
        alerts.unshift(alert);

        // Update Ops center if page is active
        if (StadiaAI.Ops) {
          StadiaAI.Ops.addAlert(alert);
          StadiaAI.Ops.updateStats();
        }

        StadiaAI.Utils.showToast('Assistance requested. Support staff has been notified.', 'success', 5000);
      }
    }
  };
})();
