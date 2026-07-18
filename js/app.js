(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  StadiaAI.App = {
    currentPage: 'home',
    currentRole: 'fan',
    pages: ['home', 'map', 'chat', 'crowd', 'navigate', 'transport', 'accessibility', 'sustainability', 'ops'],
    simulationInterval: null,

    init: function() {
      // 1. Initialize child modules (Gemini first, so its stored-key check
      //    — session storage OR localStorage — is ready before checkApiKey runs)
      if (StadiaAI.Gemini) StadiaAI.Gemini.init();
      if (StadiaAI.Data) StadiaAI.Data.init();
      if (StadiaAI.StadiumMap) StadiaAI.StadiumMap.init();
      if (StadiaAI.Crowd) StadiaAI.Crowd.init();
      if (StadiaAI.Navigation) StadiaAI.Navigation.init();
      if (StadiaAI.Transport) StadiaAI.Transport.init();
      if (StadiaAI.Accessibility) StadiaAI.Accessibility.init();
      if (StadiaAI.Sustainability) StadiaAI.Sustainability.init();
      if (StadiaAI.Ops) StadiaAI.Ops.init();

      // 2. Check/initialize API Key modal (now that Gemini knows if a
      //    session or remembered key already exists)
      this.checkApiKey();

      // 3. Set up SPA events
      this.setupNavigation();
      this.setupRoleSwitcher();
      this.setupModalListeners();
      this.setupSettingsListeners();
      this.setupChatListeners();

      // 4. Load initial role & page
      const savedRole = StadiaAI.Utils.storage.get('stadia_role') || 'fan';
      this.setRole(savedRole);

      const hash = window.location.hash.replace('#', '');
      const initialPage = this.pages.includes(hash) ? hash : 'home';
      this.navigateTo(initialPage);

      // 5. Populate matches schedule UI
      this.renderUpcomingMatches();

      // 6. Start crowd simulation tick loop
      this.startSimulation();
      
      console.log('StadiaAI App successfully initialized.');
    },

    checkApiKey: function() {
      const hasKey = !!(StadiaAI.Gemini && StadiaAI.Gemini.hasApiKey());
      const modal = StadiaAI.Utils.$('#api-key-modal');
      if (!hasKey && modal) {
        modal.style.display = 'flex';
      }
    },

    setupModalListeners: function() {
      const submitBtn = StadiaAI.Utils.$('#api-key-submit');
      const input = StadiaAI.Utils.$('#api-key-input');
      const rememberToggle = StadiaAI.Utils.$('#api-key-remember');
      const skipBtn = StadiaAI.Utils.$('#api-key-skip');
      const clearBtn = StadiaAI.Utils.$('#api-key-clear');
      const modal = StadiaAI.Utils.$('#api-key-modal');

      if (submitBtn && input) {
        StadiaAI.Utils.on(submitBtn, 'click', () => {
          const val = input.value.trim();
          if (val === '') {
            StadiaAI.Utils.showToast('Please enter a valid key.', 'warning');
            return;
          }
          const remember = !!(rememberToggle && rememberToggle.checked);
          if (StadiaAI.Gemini) {
            StadiaAI.Gemini.setApiKey(val, remember);
          }
          if (modal) modal.style.display = 'none';
          StadiaAI.Utils.showToast(
            remember ? 'Gemini API connected and remembered on this device.' : 'Gemini API connected for this session.',
            'success'
          );
          // Reload sustainability & chat context since key is now set
          if (StadiaAI.Sustainability) StadiaAI.Sustainability.updateStats();
        });

        // Submit on enter press
        StadiaAI.Utils.on(input, 'keypress', (e) => {
          if (e.key === 'Enter') {
            submitBtn.click();
          }
        });
      }

      if (skipBtn && modal) {
        StadiaAI.Utils.on(skipBtn, 'click', () => {
          modal.style.display = 'none';
          StadiaAI.Utils.showToast('GenAI features are disabled. Using static fallbacks.', 'warning');
        });
      }

      if (clearBtn) {
        StadiaAI.Utils.on(clearBtn, 'click', () => {
          if (confirm('Remove the stored Gemini API key from this device? You\'ll need to re-enter it to use AI features again.')) {
            if (StadiaAI.Gemini) StadiaAI.Gemini.clearStoredKey();
            if (input) input.value = '';
            if (rememberToggle) rememberToggle.checked = false;
            clearBtn.style.display = 'none';
            StadiaAI.Utils.showToast('Stored API key cleared from this device.', 'info');
          }
        });
      }
    },

    setupSettingsListeners: function() {
      const btn = StadiaAI.Utils.$('#sidebar-settings-btn');
      const modal = StadiaAI.Utils.$('#api-key-modal');
      if (btn && modal) {
        StadiaAI.Utils.on(btn, 'click', () => {
          const input = StadiaAI.Utils.$('#api-key-input');
          const rememberToggle = StadiaAI.Utils.$('#api-key-remember');
          const clearBtn = StadiaAI.Utils.$('#api-key-clear');
          if (input && StadiaAI.Gemini) {
            input.value = StadiaAI.Gemini.apiKey || '';
          }
          if (rememberToggle && StadiaAI.Gemini) {
            rememberToggle.checked = StadiaAI.Gemini.isRemembered();
          }
          if (clearBtn && StadiaAI.Gemini) {
            clearBtn.style.display = StadiaAI.Gemini.hasApiKey() ? 'inline-flex' : 'none';
          }
          modal.style.display = 'flex';
        });
      }
    },

    setupNavigation: function() {
      const self = this;
      
      // Sidebar click handler
      StadiaAI.Utils.delegate(document.body, 'click', '.nav-item[data-page]', function(e, target) {
        const page = target.getAttribute('data-page');
        self.navigateTo(page);
      });

      // Hero/quick actions click handler
      StadiaAI.Utils.delegate(document.body, 'click', '[data-page]:not(.nav-item)', function(e, target) {
        const page = target.getAttribute('data-page');
        self.navigateTo(page);
      });

      // Sidebar expand/collapse toggle (desktop)
      const toggleBtn = StadiaAI.Utils.$('#sidebar-toggle');
      const sidebar = StadiaAI.Utils.$('#sidebar');
      if (toggleBtn && sidebar) {
        StadiaAI.Utils.on(toggleBtn, 'click', () => {
          sidebar.classList.toggle('sidebar--expanded');
        });
      }
    },

    navigateTo: function(page) {
      if (!this.pages.includes(page)) return;

      // Update URL hash
      window.location.hash = page;
      this.currentPage = page;

      // Update visible pages
      StadiaAI.Utils.$$('.page').forEach(p => p.classList.remove('active'));
      const activePage = StadiaAI.Utils.$(`#page-${page}`);
      if (activePage) activePage.classList.add('active');

      // Update active sidebar icon class
      StadiaAI.Utils.$$('.nav-item').forEach(i => i.classList.remove('active'));
      const activeNav = StadiaAI.Utils.$(`.nav-item[data-page="${page}"]`);
      if (activeNav) activeNav.classList.add('active');

      // Update header title
      const title = StadiaAI.Utils.$('#header-title');
      if (title) title.innerText = this.getPageTitle(page);

      // Trigger sub-module updates on entry
      if (page === 'map' && StadiaAI.StadiumMap) {
        StadiaAI.StadiumMap.zoom(0); // reset scale
      } else if (page === 'sustainability' && StadiaAI.Sustainability) {
        StadiaAI.Sustainability.updateStats();
      } else if (page === 'ops' && StadiaAI.Ops) {
        StadiaAI.Ops.update();
      } else if (page === 'crowd' && StadiaAI.Crowd) {
        StadiaAI.Crowd.update(StadiaAI.Data.getZones());
      }
    },

    setRole: function(role) {
      this.currentRole = role;
      StadiaAI.Utils.storage.set('stadia_role', role);

      // Highlight active role selector button
      StadiaAI.Utils.$$('.role-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-role') === role);
      });

      // Show/Hide Ops center option in navigation list depending on roles
      const opsNav = StadiaAI.Utils.$('.nav-item[data-page="ops"]');
      if (opsNav) {
        const isOpsRole = (role === 'staff' || role === 'organizer');
        opsNav.style.display = isOpsRole ? 'flex' : 'none';
      }

      // If user switches role away from Ops while looking at it, force route back home
      if ((role === 'fan' || role === 'volunteer') && this.currentPage === 'ops') {
        this.navigateTo('home');
      }

      StadiaAI.Utils.showToast(`Switched view context to ${role.toUpperCase()}`, 'info');
    },

    setupRoleSwitcher: function() {
      const self = this;
      StadiaAI.Utils.delegate(document.body, 'click', '.role-btn', function(e, btn) {
        const role = btn.getAttribute('data-role');
        self.setRole(role);
      });
    },

    setupChatListeners: function() {
      const input = StadiaAI.Utils.$('#chat-input');
      const sendBtn = StadiaAI.Utils.$('#chat-send-btn');
      const clearBtn = StadiaAI.Utils.$('#chat-clear-btn');
      const suggestions = StadiaAI.Utils.$('#chat-suggestions');
      const self = this;

      const triggerSendMessage = () => {
        if (!input) return;
        const msg = input.value.trim();
        if (msg === '') return;
        this.sendChatMessage(msg);
        input.value = '';
      };

      if (sendBtn && input) {
        StadiaAI.Utils.on(sendBtn, 'click', triggerSendMessage);
        StadiaAI.Utils.on(input, 'keypress', (e) => {
          if (e.key === 'Enter') triggerSendMessage();
        });
      }

      if (clearBtn) {
        StadiaAI.Utils.on(clearBtn, 'click', () => {
          const feed = StadiaAI.Utils.$('#chat-messages');
          if (feed) {
            feed.innerHTML = `
              <div class="chat-message chat-message--ai">
                <div class="chat-avatar">🤖</div>
                <div class="chat-bubble chat-bubble--ai">Chat history cleared. How else can I assist you?</div>
              </div>
            `;
          }
          if (StadiaAI.Gemini) StadiaAI.Gemini.clearHistory();
          StadiaAI.Utils.showToast('Chat history cleared.', 'info');
        });
      }

      // Suggestions delegates
      if (suggestions) {
        StadiaAI.Utils.delegate(suggestions, 'click', '.chat-suggestion-btn', function() {
          const msg = this.getAttribute('data-message');
          self.sendChatMessage(msg);
        });
      }
    },

    sendChatMessage: async function(message) {
      const feed = StadiaAI.Utils.$('#chat-messages');
      if (!feed) return;

      // Basic input validation: reject empty input and cap length so a
      // pasted wall of text can't be rendered or forwarded to the API as-is.
      const MAX_CHAT_MESSAGE_LENGTH = 1000;
      if (typeof message !== 'string' || message.trim() === '') return;
      if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
        message = message.slice(0, MAX_CHAT_MESSAGE_LENGTH);
        StadiaAI.Utils.showToast(`Message truncated to ${MAX_CHAT_MESSAGE_LENGTH} characters.`, 'warning');
      }

      // Add user bubble
      const userMsg = StadiaAI.Utils.createElement('div', 'chat-message chat-message--user animate-in');
      userMsg.innerHTML = `
        <div class="chat-avatar">👤</div>
        <div class="chat-bubble chat-bubble--user">${StadiaAI.Utils.escapeHtml(message)}</div>
      `;
      feed.appendChild(userMsg);
      feed.scrollTop = feed.scrollHeight;

      // Check if API key is set
      if (!StadiaAI.Gemini || !StadiaAI.Gemini.hasApiKey()) {
        const fallbackMsg = StadiaAI.Utils.createElement('div', 'chat-message chat-message--ai animate-in');
        fallbackMsg.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble chat-bubble--ai">
            API key missing. I cannot process real-time GenAI requests without a key. Please tap the Settings gear icon in the bottom-left sidebar to set your Gemini API key.
          </div>
        `;
        feed.appendChild(fallbackMsg);
        feed.scrollTop = feed.scrollHeight;
        return;
      }

      // Add typing loader indicator
      const loader = StadiaAI.Utils.createElement('div', 'chat-message chat-message--ai animate-in');
      loader.id = 'chat-loading-bubble';
      loader.innerHTML = `
        <div class="chat-avatar">🤖</div>
        <div class="chat-typing-indicator">
          <div class="chat-typing-dot"></div>
          <div class="chat-typing-dot"></div>
          <div class="chat-typing-dot"></div>
        </div>
      `;
      feed.appendChild(loader);
      feed.scrollTop = feed.scrollHeight;

      // Perform API call
      try {
        const lang = StadiaAI.Utils.$('#chat-language-select')?.value || 'auto';
        let context = `User Selected Role: ${this.currentRole}. Current Venue: MetLife Stadium.`;
        if (lang !== 'auto') {
          context += ` Force response language: ${lang}.`;
        }

        // Create empty response bubble to stream into
        const aiMsg = StadiaAI.Utils.createElement('div', 'chat-message chat-message--ai animate-in');
        aiMsg.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble chat-bubble--ai" id="streaming-ai-text"></div>
        `;

        let streamedText = '';
        await StadiaAI.Gemini.chatStream(message, 'chat', context, (chunk) => {
          // Remove loader bubble on first chunk arrival
          const currentLoader = document.getElementById('chat-loading-bubble');
          if (currentLoader) {
            currentLoader.remove();
            feed.appendChild(aiMsg);
          }
          
          streamedText += chunk;
          
          // Basic markdown parser for bold, lists, paragraphs
          const bubble = document.getElementById('streaming-ai-text');
          if (bubble) {
            bubble.innerHTML = this.parseMarkdown(streamedText);
            feed.scrollTop = feed.scrollHeight;
          }
        });
      } catch (err) {
        console.error(err);
        const currentLoader = document.getElementById('chat-loading-bubble');
        if (currentLoader) currentLoader.remove();

        const errCard = StadiaAI.Utils.createElement('div', 'chat-message chat-message--ai animate-in');
        errCard.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble chat-bubble--ai text-red">
            Failed to fetch response. Please verify your Gemini API key or internet connection.
          </div>
        `;
        feed.appendChild(errCard);
        feed.scrollTop = feed.scrollHeight;
      }
    },

    parseMarkdown: function(text) {
      // Very simple inline MD parser
      // Escape first so any HTML/script content coming back from the API
      // (or reflected from user input) is rendered as inert text, not markup.
      let html = StadiaAI.Utils.escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="font-mono">$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      // Format lists simple conversion
      if (html.includes('- ') || html.includes('* ')) {
        // basic bullet conversions
        html = html.replace(/(?:^|<br>)-\s(.*?)(?=$|<br>)/g, '<li>$1</li>');
        html = html.replace(/(?:^|<br>)\*\s(.*?)(?=$|<br>)/g, '<li>$1</li>');
        html = `<ul>${html}</ul>`.replace(/<\/ul><ul>/g, '').replace(/<ul><\/p>/g, '</ul>').replace(/<p><ul>/g, '<ul>');
      }

      return `<p>${html}</p>`;
    },

    renderUpcomingMatches: function() {
      const container = StadiaAI.Utils.$('#upcoming-matches');
      if (!container) return;

      container.innerHTML = '';
      const schedule = StadiaAI.Data.getSchedule().filter(m => m.status !== 'live');

      schedule.forEach(m => {
        const card = StadiaAI.Utils.createElement('div', 'match-card hover-lift animate-in');
        
        card.innerHTML = `
          <div class="match-card-header">
            <span>Match ${StadiaAI.Utils.escapeHtml(String(m.matchNumber))}</span>
            <span>${StadiaAI.Utils.escapeHtml(m.stage)}</span>
          </div>
          <div class="match-card-teams">
            <div class="match-team">
              <span class="match-flag">${StadiaAI.Utils.escapeHtml(m.team1.flag)}</span>
              <span>${StadiaAI.Utils.escapeHtml(m.team1.code)}</span>
            </div>
            <span class="match-vs">VS</span>
            <div class="match-team">
              <span>${StadiaAI.Utils.escapeHtml(m.team2.code)}</span>
              <span class="match-flag">${StadiaAI.Utils.escapeHtml(m.team2.flag)}</span>
            </div>
          </div>
          <div class="match-card-footer">
            <span>📅 ${StadiaAI.Utils.formatDate(m.date)}</span>
            <span>🕒 ${StadiaAI.Utils.formatTime(m.date)}</span>
          </div>
        `;
        container.appendChild(card);
      });
    },

    startSimulation: function() {
      if (this.simulationInterval) clearInterval(this.simulationInterval);
      
      this.simulationInterval = setInterval(() => {
        // 1. Update crowd occupancies
        const freshData = StadiaAI.Data.generateCrowdData();
        
        // 2. Notify Map and Crowd modules
        if (StadiaAI.StadiumMap) StadiaAI.StadiumMap.updateDensity(freshData);
        if (StadiaAI.Crowd) StadiaAI.Crowd.update(freshData);

        // 3. Incrementally update match score minutes
        const minuteEl = StadiaAI.Utils.$('#live-match-minute');
        if (minuteEl) {
          let mins = parseInt(minuteEl.innerText);
          if (!isNaN(mins) && mins < 90) {
            mins++;
            minuteEl.innerText = `${mins}'`;
          }
        }

        // 4. Randomly generate alarms occasionally (staged to 10% chance every loop)
        if (StadiaAI.Utils.randomBetween(1, 10) === 1) {
          const alert = StadiaAI.Data.generateAlert();
          StadiaAI.Utils.showToast(`ALERT: New operational incident in ${StadiaAI.Data.getZone(alert.zone)?.name}!`, 'warning');
          
          if (this.currentPage === 'crowd' && StadiaAI.Crowd) {
            StadiaAI.Crowd.update(freshData);
          }
          if (this.currentPage === 'ops' && StadiaAI.Ops) {
            StadiaAI.Ops.update();
          }
        }
      }, 5000);
    },

    getPageTitle: function(page) {
      if (page === 'ops') return 'Operations Center';
      if (page === 'navigate') return 'Wayfinder Route';
      return page;
    }
  };

  // Bind to DOM load
  document.addEventListener('DOMContentLoaded', () => StadiaAI.App.init());
})();
