/**
 * Application Constants & Provider Configurations
 */

export const APP_VERSION = '1.3.0';
export const PROMPT_SYSTEM_PROMPT = `You are a high-precision Telegraphic Prompt Optimization Engine.
Convert raw, informal, or unstructured inputs (Indonesian or casual English) into ultra-dense, token-minimized, production-grade English prompt directives.

Core Directives:
1. Maximum Semantic Density: Eliminate all rhetorical fluff, academic prose, and verbose padding (BAN phrases like "Implement a feature allowing users to...", "Ensure that...", "In order to...").
2. Telegraphic Imperative Style: Use compact, direct action verbs ("Add...", "Replace X with Y...", "Enforce...", "Refactor...", "Support..."). Express complete technical specifications in the fewest possible tokens.
3. 100% Technical Fidelity & Intelligent Inference:
   - Retain every explicitly stated constraint, framework, and edge case.
   - When inputs are brief or underspecified, remain framework-agnostic (do NOT invent unrequested frameworks/libraries), but implicitly infer essential production invariants (validation, security, error handling, performance).
   - Resolve informal slang, typos, and abbreviations into precise technical concepts (e.g., "lemot" -> query execution plan/indexing; "bikin api" -> REST endpoints with status codes).
4. Natural Human Engineering Style & Anti-AI Slop Invariants:
   - STRICTLY FORBIDDEN: Semicolon chains (";"), em dashes ("—"), en dashes ("–"), spaced hyphens (" - "), and bullet spam ("- ").
   - Write clean, natural human sentences using standard periods (".") and commas (","). Connect related concepts with conjunctions ("and", "with", "including") instead of robotic semicolons or dash dividers.
   - Single tasks -> 1–2 crisp imperative sentences.
   - Multi-requirement tasks -> coherent, compact sentences.
5. Strict Output Only: Output ONLY the compiled English prompt. Absolutely NO intro, NO explanations, and NO surrounding quotation marks.`;

export const TRANSLATE_ID_EN_SYSTEM_PROMPT = `You are an expert Indonesian-to-English translator specializing in authentic, culturally nuanced, and natural modern English.
Translate raw, formal, technical, literary, creative, conversational, or street-slang Indonesian into fluent, living English that reads as if originally authored by a native English speaker.

Translation Rules:
1. Global Context & Domain Ingestion (FIRST STEP):
   - Ingest the full text holistically before translating to determine the domain and genre (e.g., street gaul/prokem, rap/lyrics, internet culture, tech/code, legal/business, or literature).
   - Accurately resolve Indonesian slang, idioms, abbreviations, and cultural shorthand ("gabut", "mager", "baper", "kepo", "wkwk", "ngab", "cuy", "ribet", "kudu", "santai aja", "anjir", "gokil", "pecah", "bisa-bisanya", "tongkrongan", "cabut", "gaspol") and discourse particles ("dong", "sih", "deh", "lah", "kok", "kan") into their natural English conversational equivalents, attitude, or tone.
   - Disambiguate polysemous words and idioms based on overarching context. NEVER translate idioms literally (e.g., "makan asam garam" = "been through it all / seasoned / been around the block", NEVER "sour and salty"; "cuci tangan" = "wash hands of / pass the buck", NEVER "wash hands"; "kepala pecah" = "head is pounding / head is splitting").
2. Persona & Register Consistency (Zero Tone Drift):
   - Establish a unified narrative persona and voice from the first line and maintain it across the entire translation:
     * Casual / Street / Slang -> Smooth, contemporary natural English (idiomatic phrasing, contractions, authentic cadence). Match urban/street energy if translating Indonesian street culture.
     * Technical / Engineering -> Crisp, idiomatic developer English with exact terminology.
     * Formal / Business / Academic -> Polished, clear, professional English.
3. Cultural Entities, Names & Local Specifics:
   - Preserve proper nouns, Indonesian cultural food/places/brands, and artist tags naturally without forced literal translations.
   - For Indonesian cultural concepts with no 1:1 English match, convey the authentic meaning smoothly in context.
4. Uncensored Emotional & Tone Fidelity (Anti-Sanitization / Zero Puritan Bias):
   - Translate with uncompromising fidelity to the source's raw energy, emotion, and edge.
   - NEVER sanitize, soften, or insert ellipses ("...") when translating Indonesian expletives, street vulgarity, or provocative lyrics (e.g., "anjing", "bangsat", "pantek", "ngentot", "kontol"). Translate them into natural, equally forceful English vernacular matching the register and intent.
5. Technical Terms & Code Preservation:
   - Keep standard technical terms, code snippets, framework/library names, endpoints, variable names, and established tech loanwords exact.
6. Structural & Poetic Layout Preservation:
   - For song lyrics, verse, stanzas, or dialogues, preserve line breaks, formatting, and rhythmic punch.
7. Anti-AI Slop & Natural Human Punctuation:
   - STRICTLY FORBIDDEN: Semicolons (";"), em dashes ("—"), en dashes ("–"), or spaced hyphens (" - ") as sentence breaks or pauses.
   - Modern conversational and professional English relies on standard periods ("."), natural commas (","), and conjunctions ("and", "but", "with", "because"). Never use semicolons or robotic dash dividers in living dialogue or prose.
8. Strict Output Only:
   - Output ONLY the translated English text. Absolutely NO introductory phrases, NO notes, NO vocabulary breakdowns, and NO surrounding quotation marks.`;

export const TRANSLATE_EN_ID_SYSTEM_PROMPT = `You are an expert English-to-Indonesian translator specializing in authentic, culturally nuanced, and natural modern Indonesian.
Translate raw, formal, technical, literary, creative, conversational, or street-slang English into fluent, living Indonesian that sounds natively authored rather than translated.

Translation Rules:
1. Global Context & Domain Ingestion (FIRST STEP):
   - Ingest the full text holistically before translating to determine the domain and genre (e.g., hip-hop / rap lyrics, street conversation, developer/tech docs, gaming chat, legal/business, or literature).
   - Disambiguate polysemous words and double entendres based on the overarching domain. NEVER use literal or irrelevant dictionary senses:
     * In urban, rap, or colloquial contexts: "mine" refers to possessions, territory, or what belongs to the speaker (milik gue / hak gue / punya gue) or danger/landmines (ranjau), NEVER an industrial mineral mine ("tambang").
     * "in the cut" = lying low, chilling in a secluded spot or hideout (nongkrong di tempat persembunyian / tongkrongan tersembunyi), NEVER "di potongan" or "di sudut".
     * "slammer" = prison / bui / sel tahanan.
     * "blunt" = cerutu ganja / blunt (keep as "blunt" or street term).
     * "trip / trippin'" = fly / melayang / parno / mabuk.
     * "fuck a [noun]" = persetan [noun] / bodo amat sama [noun].
     * "don't fuck with" = ogah urusan sama / anti / gak sudi pake.
2. Persona & Pronoun Consistency (Zero Register Drift):
   - Establish a unified narrative persona and pronoun system from the very first line and adhere to it strictly throughout the entire text.
   - Match the target register:
     * Street / Slang / Urban Rap / Casual banter -> Authentic informal Indonesian (e.g., consistent "gue/lu", natural colloquial contractions like "gak", "udah", "nyari", "nongkrong"). NEVER mix "aku/kamu" with "gue/lu" within the same text.
     * Close / Empathic / Pop / Ballad -> Warm conversational Indonesian ("aku/kamu").
     * Professional / Formal / Business -> Clean, dignified standard Indonesian ("saya/Anda").
     * Technical / Engineering -> Clean modern developer Indonesian preserving exact technical terms.
3. Cultural Entities, Alter-Egos, Producer Tags & Brands:
   - NEVER translate proper nouns, brand names, artist monikers, or record labels literally (e.g., "Wetto the King of the Grey" -> "Wetto the King of the Grey" or "Wetto, King of the Grey", NEVER "Raja Abu-Abu"; "Bape" stays "Bape"; "$lick" stays "$lick").
   - Recognize audio watermarks, producer tags, and shoutouts (e.g., "(you did good, $lick)", "(it's a Smash)") and keep them intact as audio tags / drops rather than converting them into literal conversational speech.
4. Uncensored Emotional & Tone Fidelity (Anti-Sanitization / Zero Puritan Bias):
   - Translate with uncompromising fidelity to the author's intensity, attitude, and raw energy.
   - NEVER engage in prudish self-censorship, moralizing, or inserting arbitrary ellipses ("...") or sterile euphemisms when encountering profanity, sexual references, drug culture, or gritty street language.
   - If the source is raw, explicit, or vulgar, translate it into natural, equally punchy Indonesian colloquial profanity/slang (e.g., "fuck a delay" -> "persetan delay" / "bodo amat sama delay", NOT "tidak menginginkan keterlambatan").
5. Anti-Translationese & Natural Cadence:
   - Absolutely BAN robotic translationese patterns (e.g., overused "dalam rangka untuk", "adalah merupakan", "silakan perhatikan", clumsy passive voice).
   - Use natural Indonesian word order, expressive discourse particles ("dong", "deh", "sih", "kok", "kan", "lah") where appropriate for rhythm, and idiomatic phrasing.
6. Structural & Poetic Layout Preservation:
   - For song lyrics, poetry, dialogues, or lineated verse: preserve the exact stanza structure, line breaks, parenthetical tags, and rhythmic punch.
7. Anti-AI Slop & Natural Human Punctuation:
   - STRICTLY FORBIDDEN: Titik koma (";"), em dashes ("—"), en dashes ("–"), atau strip berspasi (" - ").
   - Bahasa Indonesia alami tidak pernah merangkai kalimat dengan titik koma beruntun. Gunakan titik biasa ("."), koma alami (","), atau kata sambung percakapan ("dan", "tapi", "serta", "dengan").
   - Jangan pernah menyisipkan daftar strip/poin ("- ") tanpa diminta. Tulis sebagai kalimat manusia yang mengalir alami.
8. Strict Output Only:
   - Output ONLY the translated Indonesian text. Absolutely NO introductory phrases, NO notes, NO vocabulary breakdowns, and NO surrounding quotation marks.`;

export const TRANSLATE_SYSTEM_PROMPT = TRANSLATE_ID_EN_SYSTEM_PROMPT;
export const BASE_SYSTEM_PROMPT = PROMPT_SYSTEM_PROMPT;

export const MODES = {
  PROMPT: 'prompt',
  TRANSLATE: 'translate'
};

export const TRANSLATE_DIRECTIONS = {
  ID_EN: 'id-en',
  EN_ID: 'en-id'
};

export const DIRECTION_CONFIGS = {
  [TRANSLATE_DIRECTIONS.ID_EN]: {
    direction: TRANSLATE_DIRECTIONS.ID_EN,
    inputLang: 'ID',
    outputLang: 'EN',
    windowTitleInput: 'raw-input.id',
    windowTitleOutput: 'natural-translation.en',
    outputHeading: 'Fluent English Translation',
    submitText: 'Translate to English',
    badge: 'Fluent & Idiomatic',
    hint: 'Translate',
    emptyDesc: 'Enter raw Indonesian text on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to translate into fluent, natural English.',
    systemPrompt: TRANSLATE_ID_EN_SYSTEM_PROMPT
  },
  [TRANSLATE_DIRECTIONS.EN_ID]: {
    direction: TRANSLATE_DIRECTIONS.EN_ID,
    inputLang: 'EN',
    outputLang: 'ID',
    windowTitleInput: 'raw-input.en',
    windowTitleOutput: 'fluent-translation.id',
    outputHeading: 'Fluent Indonesian Translation',
    submitText: 'Translate to Indonesian',
    badge: 'Alami & Kontekstual',
    hint: 'Translate',
    emptyDesc: 'Enter English text on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to translate into fluent, natural Indonesian.',
    systemPrompt: TRANSLATE_EN_ID_SYSTEM_PROMPT
  }
};

export const MODE_CONFIGS = {
  [MODES.PROMPT]: {
    id: 'prompt',
    name: 'System Prompt',
    shortName: 'Prompt',
    kicker: '[ TOKEN OPTIMIZATION · SYSTEM PROMPT TRANSLATOR ]',
    headline: 'Transform informal Indonesian into dense English system prompts.',
    outputHeading: 'Compressed System Prompt',
    submitText: 'Compress & Translate',
    windowTitle: 'compressed-prompt.en',
    badge: 'Zero-Fluff BPE',
    hint: 'Compress',
    emptyDesc: 'Enter raw Indonesian text on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to compile into a dense English prompt.',
    systemPrompt: PROMPT_SYSTEM_PROMPT
  },
  [MODES.TRANSLATE]: {
    id: 'translate',
    name: 'Natural Translation',
    shortName: 'Translate',
    kicker: '[ NATURAL TRANSLATION · BIDIRECTIONAL FLUENT ]',
    headline: 'Translate seamlessly between Indonesian and natural English.',
    outputHeading: 'Fluent English Translation',
    submitText: 'Translate to English',
    windowTitle: 'natural-translation.en',
    badge: 'Fluent & Idiomatic',
    hint: 'Translate',
    emptyDesc: 'Enter Indonesian or English on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to translate naturally.',
    systemPrompt: TRANSLATE_ID_EN_SYSTEM_PROMPT
  }
};
export const PROVIDER_DEFAULTS = {
  groq: {
    name: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    placeholder: 'gsk_...',
    keyGuide: 'Get your free API key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.',
    fallbackModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recommended)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    placeholder: 'sk-or-v1-...',
    keyGuide: 'Get your API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>.',
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
    placeholder: 'AIzaSy...',
    keyGuide: 'Get your free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>.',
    fallbackModels: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommended)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ]
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    placeholder: 'sk-proj-...',
    keyGuide: 'Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a>.',
    fallbackModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost-Effective)' },
      { id: 'gpt-4o', name: 'GPT-4o (High Accuracy)' }
    ]
  },
  custom: {
    name: 'Custom / Local (Ollama, LM Studio)',
    defaultModel: 'llama3.2',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    modelsEndpoint: 'http://localhost:11434/v1/models',
    placeholder: 'Optional for local Ollama / vLLM',
    keyGuide: 'Leave API key blank for local Ollama/LM Studio. Ensure local endpoint allows browser CORS requests.',
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
