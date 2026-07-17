(function() {
  'use strict';
  const StadiaAI = window.StadiaAI = window.StadiaAI || {};

  const SYSTEM_PROMPTS = {
    chat: `You are StadiaAI, the official, highly intelligent GenAI-enabled stadium companion for the FIFA World Cup 2026 at MetLife Stadium (New York/New Jersey).
Your goal is to assist fans, volunteers, staff, and organizers with any queries.

CORE INSTRUCTIONS:
1. MULTILINGUAL ASSISTANCE: Always detect the language of the user's message and respond fluently in that exact same language (e.g., if asked in Spanish, respond in Spanish; if in Hindi, respond in Hindi).
2. STADIUM SPECIFIC KNOWLEDGE: You are fully aware of MetLife Stadium. It has 4 main gates (A, B, C, D, E, F), stands (North, South, East, West), upper/lower concourses, VIP clubs (Coaches Club), concessions (New York Pizza, Stadium Burger, Local Brews), and first aid clinics.
3. CONCISE & ACTIONABLE: Keep responses concise, clear, and structured. Use bullet points or numbered lists where possible to make instructions easy to read on mobile screens.
4. ACCESSIBILITY AWARE: If someone asks about elevators, ramps, service dogs, sensory rooms, or restrooms, highlight accessibility options. Sensory room is near Section 117. ALDs are at Section 124.
5. EMERGENCIES: If the query indicates a medical emergency, fire, or safety threat, instruct them immediately to stay calm, contact the nearest staff member in a yellow jacket, or head to the First Aid Station (East/West concourses).
6. TONALITY: Friendly, welcoming, sporting, helpful. Do not mention that you are a language model or AI trained by Google. Act as the official digital companion.`,

    navigation: `You are the StadiaAI Wayfinder. Your task is to explain the optimal walking route between two stadium zones.
Explain the step-by-step path clearly.
If the route crosses dense crowd zones, suggest alternative routes (e.g., "Concourse L1 is congested, take Concourse L3 bypass").
Always check if accessibility (wheelchair friendly) is requested; if so, emphasize elevator usage instead of stairs.`,

    crowd: `You are the StadiaAI Crowd Analytics Engine. Analyze the current zone occupancy and densities.
Identify potential bottlenecks and crowd congestion.
Provide actionable suggestions for venue organizers: e.g., open Gate A overflow lanes, redirect concessions lines, deploy staff to East Stand corners.`,

    transport: `You are the StadiaAI Transport Coordinator. Provide a clear travel plan for a fan heading to or leaving MetLife Stadium.
Include transit recommendations (NJ Transit rail frequency, Coach USA bus shuttle from Port Authority), rideshare instructions (Lot G arches), or walking corridors.
Be realistic about traffic and queue wait times.`,

    ops: `You are the StadiaAI Operations Command Support System. You assist stadium organizers and security chiefs.
An alert or incident has occurred (e.g. medical emergency, gate congestion, power fault).
Analyze the alert, provide a 3-step immediate action plan, specify the dispatch priority (Low/Medium/High/Critical), and recommend resource deployment. Keep it tactical, concise, and executive-level.`,

    sustainability: `You are the StadiaAI Eco Advisor. Explain the stadium's green score and provide actionable tips for fans to reduce carbon footprints, recycle correctly, and choose public transit. Keep it encouraging and positive.`,

    accessibility: `You are the StadiaAI Accessibility Advocate. Provide clear support, rules, locations, and procedures for disabled guests, sensory-sensitive individuals, and seniors attending the match.`
  };

  StadiaAI.Gemini = {
    apiKey: null,
    model: 'gemini-1.5-flash', // Default model used by the API key
    conversationHistory: [],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',

    init: function() {
      this.apiKey = StadiaAI.Utils.storage.get('stadia_api_key');
      if (this.apiKey) {
        console.log('Gemini API Key loaded successfully.');
      }
    },

    setApiKey: function(key) {
      if (!key || key.trim() === '') {
        this.apiKey = null;
        StadiaAI.Utils.storage.remove('stadia_api_key');
        return false;
      }
      this.apiKey = key.trim();
      StadiaAI.Utils.storage.set('stadia_api_key', this.apiKey);
      return true;
    },

    hasApiKey: function() {
      return !!this.apiKey;
    },

    clearHistory: function() {
      this.conversationHistory = [];
    },

    getSystemPrompt: function(feature) {
      return SYSTEM_PROMPTS[feature] || SYSTEM_PROMPTS.chat;
    },

    chat: async function(userMessage, feature = 'chat', additionalContext = '') {
      if (!this.hasApiKey()) {
        throw new Error('API Key is missing. Please set your Gemini API key.');
      }

      const systemPrompt = this.getSystemPrompt(feature);
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      
      this.conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
      
      const contents = this._buildContents(userMessage, additionalContext);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'Failed to call Gemini API');
        }

        const data = await response.json();
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        
        // Save to history
        this.conversationHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
        
        return aiResponseText;
      } catch (err) {
        console.error('Gemini API error:', err);
        // Remove last user message from history on error so we don't pollute the retry
        this.conversationHistory.pop();
        throw err;
      }
    },

    chatStream: async function(userMessage, feature = 'chat', additionalContext = '', onChunk = () => {}) {
      if (!this.hasApiKey()) {
        throw new Error('API Key is missing. Please set your Gemini API key.');
      }

      const systemPrompt = this.getSystemPrompt(feature);
      const url = `${this.baseUrl}/${this.model}:streamGenerateContent?key=${this.apiKey}`;
      
      const contents = this._buildContents(userMessage, additionalContext);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'Failed to call Gemini API');
        }

        // Handle streaming response reader
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponseText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // SSE format: the chunks are standard JSON objects streamed down the wire.
          // Parse buffer. The response from streamGenerateContent is a JSON array
          // or chunks separated by commas.
          try {
            // Find boundaries of valid JSON objects or array entries
            let cleanText = buffer.trim();
            if (cleanText.startsWith('[')) cleanText = cleanText.substring(1);
            if (cleanText.endsWith(']')) cleanText = cleanText.slice(0, -1);
            
            // Split entries. Gemini streams are usually clean chunks of text.
            const parts = cleanText.split(/,\s*\n*/);
            for (const part of parts) {
              if (part.trim() === '') continue;
              try {
                const chunkObj = JSON.parse(part);
                const chunkText = chunkObj.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunkText) {
                  fullResponseText += chunkText;
                  onChunk(chunkText);
                }
              } catch (e) {
                // Chunk might be incomplete, let's keep it in buffer
              }
            }
          } catch (e) {
            // parsing error, skip and wait for more data
          }
        }
        
        // Final fallback if SSE parsing was too complex: do a manual regex capture on the raw buffer
        if (fullResponseText === '') {
          const regex = /"text":\s*"([^"]+)"/g;
          let match;
          while ((match = regex.exec(buffer)) !== null) {
            const rawText = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            fullResponseText += rawText;
            onChunk(rawText);
          }
        }

        // Add to history
        this.conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        this.conversationHistory.push({ role: 'model', parts: [{ text: fullResponseText }] });

        return fullResponseText;
      } catch (err) {
        console.error('Gemini streaming API error:', err);
        throw err;
      }
    },

    _buildContents: function(newMessage, additionalContext) {
      // Build a fresh array, injecting context on the fly if available
      const history = [...this.conversationHistory];
      
      // If we have additional context, prepend/attach it to the user's latest turn
      if (additionalContext && history.length > 0) {
        const lastTurn = history[history.length - 1];
        if (lastTurn.role === 'user') {
          lastTurn.parts[0].text = `[Context Information:\n${additionalContext}]\n\nUser Question:\n${newMessage}`;
        }
      }
      
      // Return history. If history is empty, initialize it.
      if (history.length === 0) {
        let text = newMessage;
        if (additionalContext) {
          text = `[Context Information:\n${additionalContext}]\n\nUser Question:\n${newMessage}`;
        }
        history.push({ role: 'user', parts: [{ text: text }] });
      }
      
      return history;
    }
  };
})();
