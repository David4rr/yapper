/**
 * Application Constants & Provider Configurations
 */

export const BASE_SYSTEM_PROMPT = `You are a high-precision Prompt Engineering & Optimization Compiler.
Your mission: Transform raw, informal, conversational, or unstructured user inputs (Indonesian or casual English) into dense, high-signal, production-ready English prompts that can be immediately pasted into an AI assistant, coding agent, or system prompt.

Core Rules:
1. Complete & Actionable Deliverable: NEVER output bare fragments, isolated words, or incomplete phrases. The output MUST be a standalone, self-contained, fully executable prompt with clear context that an AI can immediately execute.
2. Strip Conversational Fluff: Eliminate greetings, polite fillers ("tolong dong", "bro", "bisa gak", "makasih"), complaints, and conversational meta-chatter.
3. Technical Fidelity & Context Reconstruction: Capture 100% of the underlying objective, parameters, frameworks, constraints, and edge cases. If the input is casual or rambling, formulate the concrete underlying goal into explicit technical specifications.
4. Crisp Imperative Architecture: Use direct action verbs ("Implement...", "Design...", "Build...", "Refactor...", "Ensure..."). For multi-step or multi-requirement tasks, organize with concise, high-density bullet points.
5. Maximum Signal, Minimal Tokens: Maximize information density without sacrificing clarity or context. Every word must carry semantic weight.
6. Strict Output Only: Output ONLY the final compiled English prompt. Absolutely NO preambles ("Here is your prompt:"), NO meta-commentary, NO postscripts, and NO surrounding quotation marks.`;

export const PROVIDER_DEFAULTS = {
  groq: {
    name: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    keyGuide: 'Dapatkan API key gratis di <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.',
    fallbackModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Rekomendasi)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra Cepat)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    keyGuide: 'Dapatkan API key di <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>.',
    fallbackModels: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' }
    ]
  },
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key}',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models?key={key}',
    keyGuide: 'Dapatkan API key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>.',
    fallbackModels: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Default)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ]
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    keyGuide: 'Dapatkan API key di <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a>.',
    fallbackModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Hemat & Cepat)' },
      { id: 'gpt-4o', name: 'GPT-4o (Akurasi Tinggi)' }
    ]
  },
  custom: {
    name: 'Custom / Local (Ollama)',
    defaultModel: 'llama3.2',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    modelsEndpoint: 'http://localhost:11434/v1/models',
    keyGuide: 'Pastikan endpoint lokal Anda (misal Ollama/vLLM) mengizinkan CORS browser origin.',
    fallbackModels: [
      { id: 'llama3.2', name: 'llama3.2' },
      { id: 'qwen2.5-coder', name: 'qwen2.5-coder' },
      { id: 'mistral', name: 'mistral' }
    ]
  }
};

export const STORAGE_KEYS = {
  CONFIG: 'yapper_config',
  HISTORY: 'yapper_history'
};
