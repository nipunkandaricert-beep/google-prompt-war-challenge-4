(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  StadiaAI.Navigation = {
    init: function() {
      this.populateSelects();
      
      const routeBtn = StadiaAI.Utils.$('#nav-route-btn');
      if (routeBtn) {
        StadiaAI.Utils.on(routeBtn, 'click', () => {
          const from = StadiaAI.Utils.$('#nav-from-select').value;
          const to = StadiaAI.Utils.$('#nav-to-select').value;
          const accessible = StadiaAI.Utils.$('#nav-accessible-toggle').checked;
          this.findRoute(from, to, accessible);
        });
      }

      const accRouteBtn = StadiaAI.Utils.$('#acc-route-btn');
      if (accRouteBtn) {
        StadiaAI.Utils.on(accRouteBtn, 'click', () => {
          const from = StadiaAI.Utils.$('#acc-from-select').value;
          const to = StadiaAI.Utils.$('#acc-to-select').value;
          this.findRoute(from, to, true, '#acc-route-result');
        });
      }
    },

    populateSelects: function() {
      const fromSel = StadiaAI.Utils.$('#nav-from-select');
      const toSel = StadiaAI.Utils.$('#nav-to-select');
      const accFrom = StadiaAI.Utils.$('#acc-from-select');
      const accTo = StadiaAI.Utils.$('#acc-to-select');
      
      if (!fromSel || !toSel) return;

      const zones = StadiaAI.Data.getZones();
      
      // Group zones by type
      const groups = {
        stands: { label: 'Seating Zones / Stands', options: [] },
        gates: { label: 'Entrance Gates', options: [] },
        amenities: { label: 'Amenities (Food, WC, First Aid)', options: [] }
      };

      zones.forEach(z => {
        const optionHtml = `<option value="${z.id}">${z.name} (L${z.level})</option>`;
        if (z.type === 'stand' || z.type === 'accessible' || z.type === 'vip') {
          groups.stands.options.push(optionHtml);
        } else if (z.type === 'gate') {
          groups.gates.options.push(optionHtml);
        } else {
          groups.amenities.options.push(optionHtml);
        }
      });

      const buildSelectHtml = (targetGroups) => {
        let html = '<option value="" disabled selected>Select location...</option>';
        for (const key in targetGroups) {
          const g = targetGroups[key];
          if (g.options.length > 0) {
            html += `<optgroup label="${g.label}">${g.options.join('')}</optgroup>`;
          }
        }
        return html;
      };

      const selectHtml = buildSelectHtml(groups);
      
      fromSel.innerHTML = selectHtml;
      toSel.innerHTML = selectHtml;
      
      if (accFrom && accTo) {
        accFrom.innerHTML = selectHtml;
        accTo.innerHTML = selectHtml;
      }
    },

    findRoute: async function(fromId, toId, accessible = false, outputTarget = '#nav-route-display') {
      const output = StadiaAI.Utils.$(outputTarget);
      if (!output) return;

      if (!fromId || !toId) {
        StadiaAI.Utils.showToast('Please select both start and destination locations.', 'warning');
        return;
      }

      if (fromId === toId) {
        StadiaAI.Utils.showToast('Start and destination are the same.', 'warning');
        return;
      }

      const fromZone = StadiaAI.Data.getZone(fromId);
      const toZone = StadiaAI.Data.getZone(toId);
      if (!fromZone || !toZone) return;

      // Show container, hide placeholder
      const content = StadiaAI.Utils.$('#nav-route-content', output) || output;
      const placeholder = StadiaAI.Utils.$('.navigate-placeholder', output);
      if (placeholder) placeholder.style.display = 'none';
      if (content && content !== output) content.style.display = 'block';

      // 1. Compute Route Geometry (SVG Path drawing)
      this.drawRoute(fromZone, toZone);

      // 2. Generate Steps and times
      const stepData = this.calculateRouteSteps(fromZone, toZone, accessible);
      
      // Render steps in container
      const stepsList = StadiaAI.Utils.$('#nav-steps-list', output) || StadiaAI.Utils.$('#acc-route-result');
      if (stepsList) {
        stepsList.innerHTML = '';
        stepData.steps.forEach(step => {
          const stepCard = StadiaAI.Utils.createElement('div', 'nav-step-card animate-in');
          
          let iconSvg = '';
          if (step.type === 'stairs') {
            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4v-4h4v-4h4V8h4V4"/></svg>`;
          } else if (step.type === 'elevator') {
            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 10 3-3 3 3M9 14l3 3 3-3"/></svg>`;
          } else if (step.type === 'gate') {
            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20V4h20v16M12 4v16"/></svg>`;
          } else {
            iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
          }

          stepCard.innerHTML = `
            <div class="nav-step-icon">${iconSvg}</div>
            <div class="nav-step-text">${step.instruction}</div>
            <div class="nav-step-dist">${step.distance}m</div>
          `;
          stepsList.appendChild(stepCard);
        });
      }

      // Update summaries
      const timeVal = StadiaAI.Utils.$('#nav-time-estimate', output);
      const distVal = StadiaAI.Utils.$('#nav-distance', output);
      if (timeVal) timeVal.innerText = `${stepData.totalTime} min`;
      if (distVal) distVal.innerText = `${stepData.totalDistance} meters`;

      // 3. AI-Enhanced Routing Tips
      const aiTip = StadiaAI.Utils.$('#nav-ai-tip', output);
      if (aiTip) {
        aiTip.style.display = 'block';
        aiTip.innerHTML = `
          <div style="display:flex; align-items:center; gap:var(--space-2); color:var(--accent-gold); font-weight:700; margin-bottom:var(--space-2);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10a10 10 0 0 0-10-10z"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>StadiaAI Wayfinder Tip</span>
          </div>
          <p class="text-sm skeleton skeleton-text" style="width:100%"></p>
          <p class="text-sm skeleton skeleton-text" style="width:80%"></p>
        `;

        try {
          const aiAdvice = await StadiaAI.Gemini.chat(
            `Explain the best route from ${fromZone.name} to ${toZone.name}. Accessible route requested: ${accessible}. Note any potential bottlenecks and give a 1-sentence tip. Keep it under 60 words.`,
            'navigation'
          );
          aiTip.innerHTML = `
            <div style="display:flex; align-items:center; gap:var(--space-2); color:var(--accent-gold); font-weight:700; margin-bottom:var(--space-2);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4"/></svg>
              <span>StadiaAI Wayfinder Tip</span>
            </div>
            <p class="text-sm" style="line-height: 1.5">${aiAdvice}</p>
          `;
        } catch (e) {
          aiTip.style.display = 'none';
        }
      }
    },

    calculateRouteSteps: function(fromZone, toZone, accessible) {
      const steps = [];
      let totalDist = 0;
      
      // Calculate geometric distance in SVG coordinate terms
      const dx = toZone.coordinates.cx - fromZone.coordinates.cx;
      const dy = toZone.coordinates.cy - fromZone.coordinates.cy;
      const geoDist = Math.round(Math.sqrt(dx*dx + dy*dy) * 0.8); // Scale to realistic meters
      
      steps.push({
        type: 'walk',
        instruction: `Start at ${fromZone.name} (Level ${fromZone.level})`,
        distance: 10
      });

      // Level transitions
      if (fromZone.level !== toZone.level) {
        const liftType = accessible ? 'elevator' : 'stairs';
        const liftWord = accessible ? 'express elevator' : 'stadium stairways';
        
        steps.push({
          type: liftType,
          instruction: `Proceed to the nearest ${liftWord} in concourse and move to Level ${toZone.level}`,
          distance: Math.abs(fromZone.level - toZone.level) * 15
        });
        totalDist += Math.abs(fromZone.level - toZone.level) * 15;
      }

      // Concourse travel
      steps.push({
        type: 'walk',
        instruction: `Walk along Level ${toZone.level} concourse corridor following direction signs`,
        distance: Math.round(geoDist * 0.8)
      });
      totalDist += Math.round(geoDist * 0.8);

      // Final destination
      steps.push({
        type: 'walk',
        instruction: `Arrive at ${toZone.name}`,
        distance: 10
      });
      totalDist += 20;

      // Calculate time adjusted for crowd density
      const avgDensity = (fromZone.currentOccupancy/fromZone.capacity + toZone.currentOccupancy/toZone.capacity) / 2;
      const baseSpeed = 1.4; // 1.4 m/s standard walking speed
      const crowdSpeedFactor = StadiaAI.Utils.clamp(1.5 - avgDensity, 0.4, 1.2); // Slows down to 40% speed in dense crowd
      
      const totalTimeSec = totalDist / (baseSpeed * crowdSpeedFactor);
      const totalTimeMin = Math.max(1, Math.round(totalTimeSec / 60));

      return {
        steps: steps,
        totalDistance: totalDist,
        totalTime: totalTimeMin
      };
    },

    drawRoute: function(fromZone, toZone) {
      const svg = StadiaAI.Utils.$('#stadium-svg');
      if (!svg) return;

      // Remove existing paths
      StadiaAI.Utils.$$('#nav-svg-route', svg).forEach(p => p.remove());

      const fromC = fromZone.coordinates;
      const toC = toZone.coordinates;

      // Create an SVG Path representing the path route
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', 'nav-svg-route');
      path.setAttribute('class', 'route-path');
      
      // Determine intermediate nodes around central pitch
      let d = '';
      
      // If we go side-to-side, curve around the pitch (center is 400, 250)
      if (Math.abs(fromC.cx - toC.cx) > 200 && Math.abs(fromC.cy - toC.cy) > 100) {
        // Curve around center
        const mx = (fromC.cx + toC.cx) / 2;
        const my = fromC.cy < 250 ? 90 : 410; // bypass north or south of pitch
        d = `M ${fromC.cx} ${fromC.cy} Q ${mx} ${my} ${toC.cx} ${toC.cy}`;
      } else {
        // Direct line
        d = `M ${fromC.cx} ${fromC.cy} L ${toC.cx} ${toC.cy}`;
      }
      
      path.setAttribute('d', d);
      
      // Insert path under labels
      const firstText = svg.querySelector('text');
      if (firstText) {
        svg.insertBefore(path, firstText);
      } else {
        svg.appendChild(path);
      }
    }
  };
})();
