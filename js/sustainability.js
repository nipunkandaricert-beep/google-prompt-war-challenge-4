(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  StadiaAI.Sustainability = {
    init: function() {
      this.updateStats();
    },

    updateStats: function() {
      const data = StadiaAI.Data.getSustainabilityData();
      
      // Update gauges
      const gauges = StadiaAI.Utils.$('#sustainability-gauges');
      if (gauges) {
        gauges.innerHTML = '';
        
        // 1. Carbon Reduction (GCP Target)
        this.renderGauge(gauges, Math.round((data.carbonSaved / 20) * 100), 100, 'Carbon Target', 'var(--accent-teal)');
        // 2. Waste Diversion %
        this.renderGauge(gauges, data.wasteRecycled, 100, 'Waste Diverted', 'var(--accent-gold)');
        // 3. Renewable Energy %
        this.renderGauge(gauges, data.energyRenewable, 100, 'Clean Energy', 'var(--accent-blue)');
      }

      // Update stat cards
      const carbonEl = StadiaAI.Utils.$('#sust-carbon');
      const treesEl = StadiaAI.Utils.$('#sust-trees');
      const waterEl = StadiaAI.Utils.$('#sust-water');
      const renewEl = StadiaAI.Utils.$('#sust-renewable');

      if (carbonEl) carbonEl.innerText = `${data.carbonSaved} Tons`;
      if (treesEl) treesEl.innerText = StadiaAI.Utils.formatNumber(data.treesEquivalent);
      if (waterEl) waterEl.innerText = `${StadiaAI.Utils.formatNumber(data.waterSaved)} L`;
      if (renewEl) renewEl.innerText = `${data.energyRenewable}%`;

      // Update Green score
      const scoreVal = StadiaAI.Utils.$('#sustainability-green-score');
      if (scoreVal) {
        const prevValue = parseInt(scoreVal.innerText) || 0;
        StadiaAI.Utils.animateCounter(scoreVal, prevValue, data.greenScore, 1000);
      }

      this.getEcoTips();
    },

    renderGauge: function(container, value, max, label, color) {
      const wrapper = StadiaAI.Utils.createElement('div', 'gauge-container animate-in');
      
      const radius = 50;
      const strokeWidth = 8;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (value / max) * circumference;

      wrapper.innerHTML = `
        <svg class="gauge-svg" viewBox="0 0 120 120">
          <circle class="gauge-bg" cx="60" cy="60" r="${radius}" stroke-width="${strokeWidth}" />
          <circle class="gauge-progress" cx="60" cy="60" r="${radius}" stroke-width="${strokeWidth}" 
                  stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
          <text class="gauge-text" x="60" y="66" text-anchor="middle">${value}%</text>
        </svg>
        <span class="gauge-label">${StadiaAI.Utils.escapeHtml(label)}</span>
      `;
      container.appendChild(wrapper);
    },

    getEcoTips: async function() {
      const tipsDiv = StadiaAI.Utils.$('#sustainability-tips');
      if (!tipsDiv) return;

      tipsDiv.innerHTML = `
        <div class="eco-tips-list">
          <div class="skeleton skeleton-text" style="width:100%"></div>
          <div class="skeleton skeleton-text" style="width:90%"></div>
          <div class="skeleton skeleton-text" style="width:95%"></div>
        </div>
      `;

      try {
        if (StadiaAI.Gemini.hasApiKey()) {
          const tipsText = await StadiaAI.Gemini.chat(
            `Provide 3 highly practical eco-tips for fans visiting MetLife Stadium to reduce plastic waste and transport footprint. Keep it to 3 bullet points, under 60 words total. Use leaf emoji for bullet symbols.`,
            'sustainability'
          );
          
          // Parse bullets into styled list
          const lines = tipsText.split('\n').filter(l => l.trim() !== '');
          let listHtml = '<div class="eco-tips-list">';
          lines.forEach(line => {
            const cleanLine = StadiaAI.Utils.escapeHtml(line.replace(/^(\*|-|•|🍁|🌿|🌱|🍂|🍃)/, '').trim());
            listHtml += `
              <div class="eco-tip-item animate-in">
                <span class="eco-tip-icon">🌿</span>
                <p class="text-sm">${cleanLine}</p>
              </div>
            `;
          });
          listHtml += '</div>';
          tipsDiv.innerHTML = listHtml;
        } else {
          // Fallback static tips
          tipsDiv.innerHTML = `
            <div class="eco-tips-list">
              <div class="eco-tip-item">
                <span class="eco-tip-icon">🌿</span>
                <p class="text-sm">Use Meadowlands Rail transit instead of driving. Saves 80% carbon emissions.</p>
              </div>
              <div class="eco-tip-item">
                <span class="eco-tip-icon">🌿</span>
                <p class="text-sm">Bring a reusable empty water bottle. Refill stations are located near all Guest Services booths.</p>
              </div>
              <div class="eco-tip-item">
                <span class="eco-tip-icon">🌿</span>
                <p class="text-sm">Sort your concessions trash. Yellow bins are for plastics/recyclables, green bins for compostables.</p>
              </div>
            </div>
          `;
        }
      } catch (e) {
        console.error('Failed to load eco tips:', e);
      }
    }
  };
})();
