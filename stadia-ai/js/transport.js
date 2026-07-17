(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  let timerInterval = null;

  StadiaAI.Transport = {
    init: function() {
      // Tab switching
      const tabs = StadiaAI.Utils.$$('#transport-tabs .tab');
      tabs.forEach(tab => {
        StadiaAI.Utils.on(tab, 'click', (e) => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderTab(tab.getAttribute('data-tab'));
        });
      });

      // AI Plan button
      const aiBtn = StadiaAI.Utils.$('#transport-ai-btn');
      if (aiBtn) {
        StadiaAI.Utils.on(aiBtn, 'click', () => this.getAIPlan());
      }

      // Initial tab
      this.renderTab('transit');
      this.startTimers();
    },

    renderTab: function(tabName) {
      const container = StadiaAI.Utils.$('#transport-content');
      if (!container) return;

      container.innerHTML = '';
      
      const colLeft = StadiaAI.Utils.createElement('div', 'transport-grid-col');
      const colRight = StadiaAI.Utils.createElement('div', 'transport-grid-col');
      
      if (tabName === 'transit') {
        const transits = StadiaAI.Data.getTransportOptions().transit;
        transits.forEach((t, index) => {
          const card = StadiaAI.Utils.createElement('div', 'transport-card animate-in');
          const nextDepSec = StadiaAI.Utils.randomBetween(120, 560); // simulated seconds till next rail departure
          
          card.innerHTML = `
            <div class="transport-card-header">
              <div class="transport-icon" style="color:var(--accent-blue);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><path d="M4 11h16"/><path d="M12 3v8"/></svg>
              </div>
              <div>
                <strong>${t.name}</strong>
                <span class="badge ${t.status.includes('delay') ? 'badge-warning' : 'badge-success'}" style="margin-top: 4px; display:inline-block">${t.status}</span>
              </div>
            </div>
            <p class="text-secondary text-sm">${t.route}</p>
            <div class="transport-stats">
              <div>
                <span class="text-muted text-xs block">Next Train</span>
                <span class="font-mono text-sm font-bold text-gold transit-timer" data-seconds="${nextDepSec}">Calculating...</span>
              </div>
              <div>
                <span class="text-muted text-xs block">Travel Time</span>
                <span class="font-mono text-sm">${t.travelTime}</span>
              </div>
              <div>
                <span class="text-muted text-xs block">Frequency</span>
                <span class="font-mono text-sm">${t.frequency}</span>
              </div>
            </div>
          `;
          if (index % 2 === 0) colLeft.appendChild(card);
          else colRight.appendChild(card);
        });

        // Add NJ Transit timeline exit plan card
        const timelineCard = StadiaAI.Utils.createElement('div', 'transport-card animate-in');
        timelineCard.innerHTML = `
          <h4 style="font-size:0.9375rem;">Recommended Post-Match Exit Plan</h4>
          <div class="transport-timeline">
            <div class="timeline-step">
              <div class="timeline-marker"></div>
              <div class="timeline-time">90' min</div>
              <div class="timeline-desc">Final Whistle — Head towards Pepsi Gate A.</div>
            </div>
            <div class="timeline-step">
              <div class="timeline-marker"></div>
              <div class="timeline-time">95' min</div>
              <div class="timeline-desc">Exit Gate A and follow the yellow pathway directly to Meadowlands Station.</div>
            </div>
            <div class="timeline-step">
              <div class="timeline-marker"></div>
              <div class="timeline-time">105' min</div>
              <div class="timeline-desc">Board the Meadowlands Rail shuttle train. Trains depart continuously for Secaucus Junction.</div>
            </div>
          </div>
        `;
        colRight.appendChild(timelineCard);

      } else if (tabName === 'driving') {
        const parkings = StadiaAI.Data.getTransportOptions().parking;
        parkings.forEach((p, index) => {
          const card = StadiaAI.Utils.createElement('div', 'transport-card animate-in');
          const pctAvailable = Math.round((p.available / p.capacity) * 100);
          
          let color = 'var(--accent-teal)';
          if (pctAvailable < 15) color = 'var(--accent-red)';
          else if (pctAvailable < 40) color = 'var(--accent-orange)';

          card.innerHTML = `
            <div class="transport-card-header">
              <div class="transport-icon" style="color:var(--accent-gold);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
              </div>
              <div>
                <strong>${p.name}</strong>
                <span class="badge badge-info" style="margin-top: 4px; display:inline-block">${p.price} Flat Fare</span>
              </div>
            </div>
            <div style="margin-top: var(--space-2)">
              <div style="display:flex; justify-content:space-between; font-size:0.8125rem; margin-bottom:4px;">
                <span class="text-secondary">Space Availability</span>
                <strong>${p.available} / ${p.capacity} slots</strong>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${pctAvailable}%; background-color: ${color}"></div>
              </div>
            </div>
            <div class="transport-stats">
              <div>
                <span class="text-muted text-xs block">Distance</span>
                <span class="font-mono text-sm">${p.distance} to Gates</span>
              </div>
              <div>
                <span class="text-muted text-xs block">Accessibility</span>
                <span class="text-sm">${p.accessible ? '♿ Yes' : 'No'}</span>
              </div>
            </div>
          `;
          if (index % 2 === 0) colLeft.appendChild(card);
          else colRight.appendChild(card);
        });

      } else if (tabName === 'rideshare') {
        const rideshares = StadiaAI.Data.getTransportOptions().rideshare;
        rideshares.forEach((r, index) => {
          const card = StadiaAI.Utils.createElement('div', 'transport-card animate-in');
          
          card.innerHTML = `
            <div class="transport-card-header">
              <div class="transport-icon" style="color:var(--accent-purple);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.5 4h-13L3.7 9.8c-.4 1.2.5 2.2 1.8 2.2H18.5c1.3 0 2.2-1 1.8-2.2L18.5 4z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
              </div>
              <div>
                <strong>${r.name}</strong>
                <span class="badge badge-danger" style="margin-top: 4px; display:inline-block">Surge: ${r.surgePricing}</span>
              </div>
            </div>
            <p class="text-secondary text-sm" style="line-height:1.4;">${r.pickupInstructions}</p>
            <div class="transport-stats">
              <div>
                <span class="text-muted text-xs block">Avg. Wait Time</span>
                <span class="font-mono text-sm font-bold text-red">${r.avgWait}</span>
              </div>
              <div>
                <span class="text-muted text-xs block">Dispatches</span>
                <span class="text-sm">Continuous</span>
              </div>
            </div>
          `;
          if (index % 2 === 0) colLeft.appendChild(card);
          else colRight.appendChild(card);
        });

      } else if (tabName === 'walking') {
        const card = StadiaAI.Utils.createElement('div', 'transport-card animate-in', `
          <div class="transport-card-header">
            <div class="transport-icon" style="color:var(--accent-teal);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="4" r="1.5"/><path d="M7 8h10"/><path d="m9 12 3 8"/><path d="m15 12-3 8"/><path d="M12 8v4"/></svg>
            </div>
            <div>
              <strong>Pedestrian Green Corridors</strong>
            </div>
          </div>
          <p class="text-secondary text-sm">Designated traffic-free pathways connecting Meadowlands train station directly to MetLife Gates A &amp; B perimeter.</p>
          <div class="transport-stats">
            <div>
              <span class="text-muted text-xs block">Status</span>
              <span class="text-sm text-teal font-bold">Clear Flow</span>
            </div>
            <div>
              <span class="text-muted text-xs block">Gate Wait Time</span>
              <span class="font-mono text-sm">3 - 6 mins</span>
            </div>
          </div>
        `);
        colLeft.appendChild(card);
      }

      container.appendChild(colLeft);
      container.appendChild(colRight);
    },

    getAIPlan: async function() {
      const panel = StadiaAI.Utils.$('#transport-ai-plan');
      const content = StadiaAI.Utils.$('#transport-ai-content');
      if (!panel || !content) return;

      panel.style.display = 'block';
      content.innerHTML = '<p class="text-muted skeleton skeleton-text" style="width:100%"></p><p class="text-muted skeleton skeleton-text" style="width:90%"></p>';

      const prompt = `Give me a smart, personalized transit departure strategy for the post-match crowd leaving MetLife Stadium. Suggest details for NJ Transit train riders and Uber rideshare seekers. Keep it structured, tactical, and under 80 words.`;

      try {
        content.innerHTML = '';
        await StadiaAI.Gemini.chatStream(prompt, 'transport', '', (chunk) => {
          content.innerHTML += chunk;
        });
      } catch (err) {
        console.error('Failed to stream AI travel plan:', err);
        panel.style.display = 'none';
      }
    },

    startTimers: function() {
      if (timerInterval) clearInterval(timerInterval);

      timerInterval = setInterval(() => {
        const timers = StadiaAI.Utils.$$('.transit-timer');
        timers.forEach(t => {
          let secs = parseInt(t.getAttribute('data-seconds'));
          if (isNaN(secs)) return;

          if (secs <= 0) {
            secs = StadiaAI.Utils.randomBetween(300, 600); // reset
          } else {
            secs--;
          }
          t.setAttribute('data-seconds', secs);

          const mins = Math.floor(secs / 60);
          const remSecs = secs % 60;
          t.innerText = `${mins}m ${remSecs < 10 ? '0' : ''}${remSecs}s`;
        });
      }, 1000);
    }
  };
})();
