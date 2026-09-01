/**
 * Application Constants & Provider Configurations
 */

export const BASE_SYSTEM_PROMPT = `You are a high-precision Telegraphic Prompt Optimization Engine.
Convert raw, informal, or unstructured inputs (Indonesian or casual English) into ultra-dense, token-minimized, production-grade English prompt directives.

Core Directives:
1. Maximum Semantic Density: Eliminate all rhetorical fluff, academic prose, and verbose padding (BAN phrases like "Implement a feature allowing users to...", "Ensure that...", "In order to...").
2. Telegraphic Imperative Style: Use compact, direct action verbs ("Add...", "Replace X with Y...", "Enforce...", "Refactor...", "Support..."). Express complete technical specifications in the fewest possible tokens.
3. 100% Technical Fidelity: Retain every constraint, negative requirement, framework/library, and edge case. Resolve typos and slang into precise technical concepts.
4. Concise Structure: Single tasks -> 1–2 crisp imperative sentences. Multi-requirement tasks -> tight bulleted directives.
5. Strict Output Only: Output ONLY the compiled English prompt. Absolutely NO intro, NO explanations, and NO surrounding quotation marks.`;

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
