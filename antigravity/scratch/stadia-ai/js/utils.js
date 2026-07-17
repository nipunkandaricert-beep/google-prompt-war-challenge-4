(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  StadiaAI.Utils = {
    // DOM helpers
    $: (selector, parent = document) => parent.querySelector(selector),
    $$: (selector, parent = document) => Array.from(parent.querySelectorAll(selector)),
    
    createElement: (tag, className = '', innerHTML = '') => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (innerHTML) el.innerHTML = innerHTML;
      return el;
    },

    on: (el, event, handler) => {
      if (el) el.addEventListener(event, handler);
    },

    delegate: (parentEl, event, childSelector, handler) => {
      if (!parentEl) return;
      parentEl.addEventListener(event, function(e) {
        const target = e.target.closest(childSelector);
        if (target && parentEl.contains(target)) {
          handler.call(target, e, target);
        }
      });
    },

    // Formatters
    formatNumber: (n) => {
      return Number(n).toLocaleString();
    },

    formatPercent: (n) => {
      return `${Math.round(n)}%`;
    },

    formatTime: (dateOrString) => {
      const d = new Date(dateOrString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    },

    formatDate: (dateOrString) => {
      const d = new Date(dateOrString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatRelativeTime: (dateOrString) => {
      const diff = Date.now() - new Date(dateOrString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins === 1) return '1 min ago';
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs === 1) return '1 hour ago';
      return `${hrs} hours ago`;
    },

    // Math
    randomBetween: (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat: (min, max) => {
      return Math.random() * (max - min) + min;
    },

    clamp: (val, min, max) => {
      return Math.max(min, Math.min(max, val));
    },

    lerp: (start, end, t) => {
      return start + (end - start) * t;
    },

    // Performance
    debounce: (fn, ms) => {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), ms);
      };
    },

    throttle: (fn, ms) => {
      let wait = false;
      return function(...args) {
        if (!wait) {
          fn.apply(this, args);
          wait = true;
          setTimeout(() => wait = false, ms);
        }
      };
    },

    // LocalStorage wrapper
    storage: {
      get: (key) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : null;
        } catch (e) {
          console.error('Error reading localStorage', e);
          return null;
        }
      },
      set: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.error('Error writing to localStorage', e);
        }
      },
      remove: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Error deleting localStorage key', e);
        }
      }
    },

    // Delay helper
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Animate numbers smoothly
    animateCounter: (element, start, end, duration = 1000, formatter = (n) => n) => {
      if (!element) return;
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        element.innerHTML = formatter(currentValue);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    },

    // Toast alerts
    showToast: (message, type = 'info', duration = 3000) => {
      const container = document.getElementById('toast-container');
      if (!container) return;
      
      const toast = document.createElement('div');
      toast.className = `toast toast--${type} animate-slide-right`;
      
      let icon = '';
      if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      } else if (type === 'error') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      } else if (type === 'warning') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      } else {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      }
      
      toast.innerHTML = `${icon}<span>${message}</span>`;
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  };
})();
