import { Hono } from 'hono';

// Environment Bindings
type Bindings = {
    TG_BOT_KV: KVNamespace;
    TELEGRAM_TOKEN: string;
    GEMINI_API_KEY: string;
    GROQ_API_KEY: string;
    ACCESS_MODE: string;          // "public" or "private"
    ALLOWED_USER_IDS: string;     // Comma-separated user IDs
    WEBHOOK_SECRET?: string; // Optional security headers
};

const app = new Hono<{ Bindings: Bindings }>();

// Conversation History Type
interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Telegram Types (Partial)
interface TelegramPhoto {
    file_id: string;
    file_size?: number;
    width: number;
    height: number;
}

interface TelegramDocument {
    file_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
}

interface TelegramUpdate {
    message?: {
        message_id: number;
        from: {
            id: number;
            first_name: string;
        };
        chat: {
            id: number;
        };
        text?: string;
        caption?: string; // For media captions
        photo?: TelegramPhoto[];
        document?: TelegramDocument;
        voice?: {
            file_id: string;
            duration: number;
            mime_type: string;
            file_size: number;
        };
    };
}

// --- CONSTANTS ---
const SYSTEM_PROMPT = `You are a sophisticated, wise, and friendly AI assistant.
Your tone should be professional, helpful, and well-rounded. Be detailed, factual, and supportive.
Encourage learning and critical thinking. Be deep, meaningful, and accurate.
Do not use LaTeX formatting for math (like \[ \] or \sqrt or anything starting with \). Use standard Unicode symbols (e.g. √, ×, ≈) and plain text for equations to ensure they render correctly on Telegram. Avoid using tables.`;

// Content Prompts
const PROMPT_INSPIRE = "Tell me a fascinating, lesser-known scientific or interesting fact. Keep it concise and engaging.";
const PROMPT_MOTIVATE = "Write a short, elegant, and motivational message to encourage productivity and positive thinking.";

// Keyboards
const KEYBOARDS = {
    en: {

        model: {
            keyboard: [
                [{ text: '🤖 GPT OSS (120B)' }],
                [{ text: '🥣 Compound (Groq)' }],
                [{ text: '👁️ Llama 3.2 (Vision)' }, { text: '🦄 Llama 4 (17B)' }],
                [{ text: '🦙 Llama 3.3 (70B)' }, { text: '🐉 Qwen 3 (32B)' }],
                [{ text: '🚀 Gemini 3.0 (flash)' }, { text: '⚡ Gemini 2.5 (flash)' }],
                [{ text: '🪶 Gemini 2.5 (Lite)' }, { text: '💎 Gemma 3 (27B)' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
        lang: {
            keyboard: [
                [{ text: 'English 🇬🇧' }, { text: 'Persian 🇮🇷' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }
    },
    fa: {

        model: {
            keyboard: [
                [{ text: '🤖 جی‌پی‌تی (120B)' }],
                [{ text: '🥣 کامپاند (Groq)' }],
                [{ text: '👁️ لاما 3.2 (Vision)' }, { text: '🦄 لاما 4 (17B)' }],
                [{ text: '🦙 لاما 3.3 (70B)' }, { text: '🐉 کوین 3 (32B)' }],
                [{ text: '🚀 جمنای 3.0 (Flash)' }, { text: '⚡ جمنای 2.5 (Flash)' }],
                [{ text: '🪶 جمنای 2.5 (Lite)' }, { text: '💎 Gemma 3 (27B)' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
        lang: {
            keyboard: [
                [{ text: 'English 🇬🇧' }, { text: 'Persian 🇮🇷' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }
    }
};

// Model Mapping (Hybrid Manual/Auto)
const MODEL_MAP: { [key: string]: string } = {
    // English Keys
    '⚡ Gemini 2.5 (flash)': 'gemini-2.5-flash',
    '🪶 Gemini 2.5 (Lite)': 'gemini-2.5-flash-lite',
    '🚀 Gemini 3.0 (flash)': 'gemini-3-flash-preview',
    '💎 Gemma 3 (27B)': 'gemma-3-27b-it',
    '🤖 GPT OSS (120B)': 'openai/gpt-oss-120b',
    '🦙 Llama 3.3 (70B)': 'llama-3.3-70b-versatile',
    '🦄 Llama 4 (17B)': 'meta-llama/llama-4-maverick-17b-128e-instruct',
    '🐉 Qwen 3 (32B)': 'qwen/qwen3-32b',
    '👁️ Llama 3.2 (Vision)': 'llama-3.2-90b-vision-preview',
    '🥣 Compound (Groq)': 'groq/compound',

    // Farsi Keys
    '⚡ جمنای 2.5 (Flash)': 'gemini-2.5-flash',
    '🪶 جمنای 2.5 (Lite)': 'gemini-2.5-flash-lite',
    '🚀 جمنای 3.0 (Flash)': 'gemini-3-flash-preview',
    '💎 جما 3 (27B)': 'gemma-3-27b-it',
    '🤖 جی‌پی‌تی (120B)': 'openai/gpt-oss-120b',
    '🦙 لاما 3.3 (70B)': 'llama-3.3-70b-versatile',
    '🦄 لاما 4 (17B)': 'meta-llama/llama-4-maverick-17b-128e-instruct',
    '🐉 کوین 3 (32B)': 'qwen/qwen3-32b',
    '👁️ لاما 3.2 (Vision)': 'llama-3.2-90b-vision-preview',
    '🥣 کامپاند (Groq)': 'groq/compound',
};

const GLOBAL_FALLBACK_ORDER = [
    'openai/gpt-oss-120b',
    'groq/compound',
    'llama-3.3-70b-versatile',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'qwen/qwen3-32b',
    'llama-3.2-90b-vision-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemma-3-27b-it'
];

// --- ROUTES ---

app.get('/', (c) => c.text('TG-ChatBot is alive! 🤖'));

// Auto-setup webhook endpoint - call this after deployment
app.get('/setup-webhook', async (c) => {
    const env = c.env;
    const workerUrl = new URL(c.req.url);
    const webhookUrl = `${workerUrl.origin}/webhook`;

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`
        );
        const result: any = await response.json();

        if (result.ok) {
            return c.json({
                success: true,
                message: 'Webhook configured successfully! ✅',
                webhook_url: webhookUrl,
                telegram_response: result
            });
        } else {
            return c.json({
                success: false,
                message: 'Failed to set webhook',
                error: result.description
            }, 400);
        }
    } catch (error: any) {
        return c.json({
            success: false,
            message: 'Error setting webhook',
            error: error.message
        }, 500);
    }
});

app.post('/webhook', async (c) => {
    const update: TelegramUpdate = await c.req.json();
    const env = c.env;

    // 1. Validate Message
    const message = update.message;
    if (!message) return c.json({ ok: true });

    // Determine content (Text OR Caption OR Visual only)
    // Determine content (Text OR Caption OR Visual only)
    let text = message.text || message.caption || '';
    let isVoiceMessage = false;


    // Check for Media
    let mediaData: { mimeType: string, data: string } | null = null;

    // Handle Photos
    if (message.photo && message.photo.length > 0) {
        // Take the largest photo (last in array)
        const largestPhoto = message.photo[message.photo.length - 1];
        const base64Data = await getTelegramFile(largestPhoto.file_id, env.TELEGRAM_TOKEN);
        if (base64Data) {
            mediaData = { mimeType: 'image/jpeg', data: base64Data };
        }
    }
    // Handle Documents (PDFs)
    else if (message.document) {
        const mime = message.document.mime_type;
        // Accept PDFs or Images sent as specific file types
        if (mime === 'application/pdf' || mime?.startsWith('image/')) {
            const base64Data = await getTelegramFile(message.document.file_id, env.TELEGRAM_TOKEN);
            if (base64Data) {
                mediaData = { mimeType: mime, data: base64Data }; // Use actual mime type
            }
        }
    }
    // Handle Voice Messages
    else if (message.voice) {
        const fileBuffer = await getTelegramFileBuffer(message.voice.file_id, env.TELEGRAM_TOKEN);
        if (fileBuffer) {
            try {
                text = await transcribeAudio(fileBuffer.buffer, env.GROQ_API_KEY);
                isVoiceMessage = true;
                await sendMessage(message.chat.id, `📝 You said: '${text}'`, env.TELEGRAM_TOKEN);
            } catch (e: any) {
                console.error("Transcription failed", e);
                await sendMessage(message.chat.id, "❌ Valid Error: Could not transcribe audio.", env.TELEGRAM_TOKEN);
            }
        }
    }

    // Ignore if strictly empty (no text AND no media)
    if (!text && !mediaData) return c.json({ ok: true });

    const chatId = message.chat.id;
    const userId = message.from.id;

    // 2. Authorization Check (configurable public/private)
    if (env.ACCESS_MODE === 'private') {
        const allowedIds = env.ALLOWED_USER_IDS.split(',').map(id => id.trim());
        if (!allowedIds.includes(userId.toString())) {
            console.log(`Unauthorized access attempt from: ${userId}`);
            await sendMessage(chatId, "Access Denied ⛔\nYou are not authorized to use this bot.", env.TELEGRAM_TOKEN);
            return c.json({ ok: true });
        }
    }
    // If ACCESS_MODE is "public", allow everyone

    // 3. Language Check
    const langKey = `lang:${userId}`;
    let userLang = await env.TG_BOT_KV.get(langKey) as 'en' | 'fa';

    // Handle Change Language
    if (text.includes('Change Language') || text.includes('تغییر زبان')) {
        await env.TG_BOT_KV.delete(langKey);
        await sendMessage(chatId, "Please choose your language / لطفا زبان خود را انتخاب کنید:", env.TELEGRAM_TOKEN, KEYBOARDS.en.lang);
        return c.json({ ok: true });
    }

    // --- DETERMINE CURRENT MODEL (For Display & Usage) ---
    const usageKey = `usage:${userId}`;
    const usageData = await env.TG_BOT_KV.get(usageKey);
    const usage = usageData ? JSON.parse(usageData) : {};
    let activeModel = usage.manualModel || 'openai/gpt-oss-120b';

    // Force Llama 3.3 for Voice to support Farsi/Smart replies
    if (isVoiceMessage) {
        activeModel = 'llama-3.3-70b-versatile';
    }

    if (!userLang) {
        if (text.includes('English')) {
            await env.TG_BOT_KV.put(langKey, 'en');
            await sendMessage(chatId, "Language set to English! 🇬🇧\nHello! I'm your AI assistant.", env.TELEGRAM_TOKEN, getMainKeyboard('en', activeModel));
        } else if (text.includes('Persian') || text.includes('فارسی')) {
            await env.TG_BOT_KV.put(langKey, 'fa');
            await sendMessage(chatId, "زبان روی فارسی تنظیم شد! 🇮🇷\nسلام! من دستیار هوش مصنوعی شما هستم.", env.TELEGRAM_TOKEN, getMainKeyboard('fa', activeModel));
        } else {
            await sendMessage(chatId, "Please choose your language / لطفا زبان خود را انتخاب کنید:", env.TELEGRAM_TOKEN, KEYBOARDS.en.lang);
        }
        return c.json({ ok: true });
    }

    // Short Names for Status Display
    const MODEL_NAMES: { [key: string]: string } = {
        'gemini-3-flash-preview': '3.0 Flash',
        'gemini-2.5-flash': '2.5 Flash',
        'gemini-2.5-flash-lite': '2.5 Lite',
        'gemma-3-27b-it': 'Gemma 3',
        'openai/gpt-oss-120b': 'GPT OSS 120B',
        'llama-3.3-70b-versatile': 'Llama 3.3',
        'meta-llama/llama-4-maverick-17b-128e-instruct': 'Llama 4',
        'qwen/qwen3-32b': 'Qwen 3',
        'llama-3.2-90b-vision-preview': 'Llama 3.2 Vision',
        'groq/compound': 'Compound',
        // Legacy
        'gemini-1.5-flash-latest': '1.5 Flash',
        'gemini-2.0-flash-exp': '2.0 Exp',
        'gemini-2.5-pro': '2.5 Pro',
        'gemini-3-pro-preview': '3.0 Pro'
    };

    function getMainKeyboard(lang: 'en' | 'fa', currentModelId: string) {
        const modelName = MODEL_NAMES[currentModelId] || 'Unknown';
        const isFa = lang === 'fa';

        // Dynamic Button Text
        const brainText = isFa
            ? `🧠 مدل: ${modelName}` // Model: Name
            : `🧠 Brain: ${modelName}`;

        return {
            keyboard: [
                [{ text: isFa ? '✨ موضوع جدید' : '✨ New Topic' }, { text: isFa ? '💡 الهام بخش' : '💡 Inspire Me' }],
                [{ text: isFa ? '💌 برای تو' : '💌 For You' }],
                [{ text: brainText }, { text: isFa ? '🌐 تغییر زبان' : '🌐 Change Language' }]
            ],
            resize_keyboard: true,
            persistent_keyboard: true,
        };
    }

    // Generate Dynamic Keyboard
    const isPersian = userLang === 'fa';
    const currentKeyboard = getMainKeyboard(userLang, activeModel);
    const modelKeyboard = isPersian ? KEYBOARDS.fa.model : KEYBOARDS.en.model;

    // Adjust System Prompt based on Mode
    let localizedSystemPrompt = SYSTEM_PROMPT;

    if (isVoiceMessage) {
        // Voice Mode: English only, ~1 minute speech (750 chars for Groq TTS).
        localizedSystemPrompt += " Respond in English ONLY. Keep your response conversational and under 750 characters.";
    } else {
        // Text Mode: General Conciseness (Fit in one Telegram message ~4096 chars)
        localizedSystemPrompt += " Keep your response concise and under 4000 characters to fit in a single message.";

        if (isPersian) {
            localizedSystemPrompt += " Respond in Persian/Farsi. Be professional and academic.";
        }
    }

    // 4. Command Handling (Only if text exists)
    if (text === '/start') {
        const welcome = isPersian ? "خوش آمدید! 🤖\nچطور می‌توانم امروز به شما کمک کنم؟" : "Welcome! 🤖\nHow can I help you today?";
        await sendMessage(chatId, welcome, env.TELEGRAM_TOKEN, currentKeyboard);
        return c.json({ ok: true });
    }

    // --- MANUAL MODEL SELECTION ---
    // Match "Change Brain" OR "Brain:" OR "مدل:"
    if (text.includes('Change Brain') || text.includes('تغییر مغز') || text.includes('Brain:') || text.includes('مدل:')) {
        const msg = isPersian ? "کدام مدل هوش مصنوعی را ترجیح می‌دهید؟ 🧠" : "Which AI model would you like to use? 🧠";
        await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, modelKeyboard);
        return c.json({ ok: true });
    }

    if (MODEL_MAP[text]) {
        const selectedModel = MODEL_MAP[text];

        // Store explicit manual selection
        usage.manualModel = selectedModel;
        await env.TG_BOT_KV.put(usageKey, JSON.stringify(usage));

        // Re-generate keyboard with NEW model to show update immediately
        const newKeyboard = getMainKeyboard(userLang, selectedModel);

        const confirmMsg = isPersian ? `مدل به ${text} تنظیم شد. ✅` : `Model set to: ${text}. ✅`;
        await sendMessage(chatId, confirmMsg, env.TELEGRAM_TOKEN, newKeyboard);
        return c.json({ ok: true });
    }



    if (text.includes('New Topic') || text.includes('موضوع جدید')) {
        await env.TG_BOT_KV.delete(`history:${userId}`);
        const clearMsg = isPersian ? "حافظه پاک شد. موضوع بعدی چیست؟ ✨" : "Context cleared. Ready for a new topic. ✨";
        await sendMessage(chatId, clearMsg, env.TELEGRAM_TOKEN, currentKeyboard);
        return c.json({ ok: true });
    }

    // Special Tasks (Routing)
    let promptToGemini = text;
    let history: ChatMessage[] = [];

    // Load History
    const historyKey = `history:${userId}`;
    const historyData = await env.TG_BOT_KV.get(historyKey);
    if (historyData) {
        history = JSON.parse(historyData);
    }

    if (text.includes('Inspire Me') || text.includes('الهام بخش')) {
        promptToGemini = PROMPT_INSPIRE;
    } else if (text.includes('For You') || text.includes('برای تو')) {
        promptToGemini = PROMPT_MOTIVATE;
    } else {
        // Normal conversation
        if (!promptToGemini && mediaData) {
            promptToGemini = isPersian ? "لطفا این را تحلیل کنید." : "Please analyze this.";
        }
        history.push({ role: 'user', parts: [{ text: promptToGemini }] });
    }

    let initialModel = activeModel;

    let aiResponse = "";
    let success = false;
    let lastError = "";
    let switchWarnings = ""; // Accumulate warnings here

    // 5. Unified Fallback Execution
    // Find where the selected model is in the order
    let startIndex = GLOBAL_FALLBACK_ORDER.indexOf(initialModel);
    if (startIndex === -1) startIndex = 0; // Safety default

    let currentModelIndex = startIndex;

    while (!success && currentModelIndex < GLOBAL_FALLBACK_ORDER.length) {
        const attemptModel = GLOBAL_FALLBACK_ORDER[currentModelIndex];
        const isGemini = attemptModel.startsWith('gemini') || attemptModel.startsWith('gemma');

        try {
            // Constraint: IF media is present AND not Gemini, Skip this model
            if (mediaData && !isGemini) {
                console.log(`Skipping ${attemptModel} because it does not support media.`);
                currentModelIndex++;
                continue;
            }

            if (history.length > 20) history = history.slice(history.length - 20);

            if (isGemini) {
                aiResponse = await callGemini(env.GEMINI_API_KEY, localizedSystemPrompt, history, promptToGemini, attemptModel, mediaData);
            } else {
                aiResponse = await callGroq(env.GROQ_API_KEY, localizedSystemPrompt, history, promptToGemini, attemptModel);
            }

            success = true;

        } catch (error: any) {
            console.error(`Model ${attemptModel} failed:`, error);
            lastError = error.message;

            // Notify user of switch if there is another model to try
            const nextIndex = currentModelIndex + 1;
            if (nextIndex < GLOBAL_FALLBACK_ORDER.length) {
                const failedName = MODEL_NAMES[attemptModel] || attemptModel;

                // Find next eligible model (handling the skip logic visually might be too complex, 
                // so just saying "switching..." is safer, but let's try to be specific if we can.
                // Actually, the loop logic handles skipping at start of NEXT iteration. 
                // So we might announce switching to X, but then X is skipped immediately. 
                // To avoid confusion, let's just say "Switching to next brain..." OR 
                // we can look ahead to find the *actual* next non-skipped model. 

                let actualNextIndex = nextIndex;
                let foundNext = false;
                while (actualNextIndex < GLOBAL_FALLBACK_ORDER.length) {
                    const candidate = GLOBAL_FALLBACK_ORDER[actualNextIndex];
                    const isCandidateGemini = candidate.startsWith('gemini') || candidate.startsWith('gemma');
                    if (mediaData && !isCandidateGemini) {
                        actualNextIndex++;
                        continue;
                    }
                    foundNext = true;
                    break;
                }

                if (foundNext) {
                    const nextModelId = GLOBAL_FALLBACK_ORDER[actualNextIndex];
                    const nextName = MODEL_NAMES[nextModelId] || nextModelId;

                    // ACCUMULATE warning instead of sending immediately
                    const msg = isPersian
                        ? `⚠️ مدل ${failedName} پاسخ نداد. تلاش با ${nextName}...`
                        : `⚠️ ${failedName} failed. Switching to ${nextName}...`;

                    switchWarnings += `_${msg}_\n`; // Italics for subtle display
                }
            }

            currentModelIndex++; // Fallback to next model in global order
        }
    }

    // 6. Send Response or Error
    try {
        if (success) {
            // Prepend warnings to the final response if any occurred
            if (switchWarnings) {
                aiResponse = switchWarnings + "\n" + aiResponse;
            }

            // Send response with current keyboard (which reflects current model)
            // Send response with current keyboard (which reflects current model)
            await sendMessage(chatId, aiResponse, env.TELEGRAM_TOKEN, currentKeyboard);

            // If user sent voice, reply with voice too (Always English now)
            // If user sent voice, reply with voice too
            if (isVoiceMessage) {
                // Generate Speech: Groq PlayAI (Primary) → Google TTS (Fallback with regenerated response)
                const cleanText = aiResponse
                    .replace(/[*_#\`]/g, '') // Strip Markdown syntax
                    .replace(/⚠️.*?(\n|$)/g, '') // Remove warnings
                    .trim();

                try {
                    let audioBuffer: ArrayBuffer;
                    try {
                        // Primary: Groq PlayAI TTS (~1 minute, 750 chars)
                        audioBuffer = await generateSpeech(cleanText, env.GROQ_API_KEY);
                    } catch (groqError: any) {
                        console.error("Groq TTS Failed, regenerating for Google Fallback:", groqError);
                        await sendMessage(chatId, `⚠️ Primary TTS failed. Regenerating shorter response...`, env.TELEGRAM_TOKEN);

                        // Regenerate AI response with 200 char limit for Google TTS
                        const shortPrompt = localizedSystemPrompt.replace("under 750 characters", "under 200 characters");
                        let shortResponse = "";

                        // Try to regenerate with current model
                        try {
                            if (activeModel.startsWith('gemini') || activeModel.startsWith('gemma')) {
                                shortResponse = await callGemini(env.GEMINI_API_KEY, shortPrompt, [], text, activeModel, null);
                            } else {
                                shortResponse = await callGroq(env.GROQ_API_KEY, shortPrompt, [], text, activeModel);
                            }
                        } catch (regenError) {
                            console.error("Regeneration failed, using truncated response:", regenError);
                            shortResponse = cleanText.substring(0, 200);
                        }

                        const shortClean = shortResponse
                            .replace(/[*_#\`]/g, '')
                            .replace(/⚠️.*?(\n|$)/g, '')
                            .trim();

                        // Fallback: Google TTS (200 char limit)
                        audioBuffer = await generateSpeechGoogle(shortClean, 'en');
                    }

                    await sendVoiceMessage(chatId, audioBuffer, env.TELEGRAM_TOKEN);
                } catch (e: any) {
                    console.error("TTS Generation failed:", e);
                    await sendMessage(chatId, `❌ TTS Error: ${e.message}`, env.TELEGRAM_TOKEN);
                }
            }

            // 7. Update History (Only on Success)
            if (!text.includes('Inspire Me') && !text.includes('For You') &&
                !text.includes('الهام بخش') && !text.includes('برای تو')) {
                history.push({ role: 'model', parts: [{ text: aiResponse }] });
                await env.TG_BOT_KV.put(historyKey, JSON.stringify(history));
            }
        } else {
            // All models failed
            const errorMessage = isPersian
                ? `خطا در ارتباط با تمام مدل‌ها: ${lastError}`
                : `All AI brains failed. Last error: ${lastError}`;
            await sendMessage(chatId, errorMessage, env.TELEGRAM_TOKEN);
        }
    } catch (e) {
        console.error("Error sending response:", e);
    }

    return c.json({ ok: true });
});

// --- HELPER FUNCTIONS ---

function formatTelegramMessage(text: string): string {
    // 1. Convert Headers (### Title) to Bold (*Title*)
    text = text.replace(/^#{1,6}\s+(.*?)$/gm, '*$1*');

    // 2. Convert **Bold** to *Bold* (Telegram legacy Markdown)
    text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');

    // 3. Convert __Bold__ to *Bold*
    text = text.replace(/__(.*?)__/g, '*$1*');

    // 4. Standardize Bullet points
    // Replace "* " or "- " at start of line with "• "
    text = text.replace(/^[-*]\s+/gm, '• ');

    // 5. Clean up LaTeX Math (Backwards compatibility)
    // Remove block delimiters \[ \]
    text = text.replace(/\\\[/g, '\n').replace(/\\\]/g, '\n');
    // Remove inline delimiters \( \)
    text = text.replace(/\\\(/g, '').replace(/\\\)/g, '');
    // Convert Common Symbols
    text = text.replace(/\\sqrt/g, '√');
    text = text.replace(/\\times/g, '×');
    text = text.replace(/\\approx/g, '≈');
    text = text.replace(/\\neq/g, '≠');
    text = text.replace(/\\leq/g, '≤');
    text = text.replace(/\\geq/g, '≥');
    // Remove \text{...} wrapper
    text = text.replace(/\\text\{(.*?)\}/g, '$1');
    // Remove lingering backslashes before spaces
    text = text.replace(/\\ /g, ' ');

    return text;
}

async function sendMessage(chatId: number, text: string, token: string, replyMarkup: any = null) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const MAX_LENGTH = 4096;

    // Apply formatting
    text = formatTelegramMessage(text);

    // Helper to send a single chunk
    const sendChunk = async (chunk: string, markup: any = null) => {
        const body: any = {
            chat_id: chatId,
            text: chunk,
            parse_mode: 'Markdown',
        };
        if (markup) {
            body.reply_markup = markup;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result: any = await response.json();
            if (!result.ok) {
                console.error("Telegram API Error:", result, "Chunk length:", chunk.length);
                // Fallback: Try sending without Markdown if it failed (likely parsing error)
                if (result.description && result.description.includes('parse')) {
                    console.log("Retrying without Markdown...");
                    body.parse_mode = undefined;
                    await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                }
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    };

    if (text.length <= MAX_LENGTH) {
        await sendChunk(text, replyMarkup);
    } else {
        // Smart Split by Newlines to avoid breaking Markdown
        const lines = text.split('\n');
        let currentChunk = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineWithNewline = line + "\n";

            if (currentChunk.length + lineWithNewline.length > MAX_LENGTH) {
                // Current chunk is full, send it
                await sendChunk(currentChunk, null); // No markup on intermediate chunks
                currentChunk = lineWithNewline;
            } else {
                currentChunk += lineWithNewline;
            }
        }

        // Send remaining chunk
        if (currentChunk.length > 0) {
            await sendChunk(currentChunk, replyMarkup); // Markup on last chunk
        }
    }
}

// Download file from Telegram and convert to Base64
async function getTelegramFile(fileId: string, token: string): Promise<string | null> {
    try {
        // 1. Get File Path
        const fileInfoUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
        const infoResp = await fetch(fileInfoUrl);
        const infoData: any = await infoResp.json();

        if (!infoData.ok || !infoData.result?.file_path) {
            console.error('Telegram getFile failed:', infoData);
            return null;
        }

        const filePath = infoData.result.file_path;

        // 2. Download File
        const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
        const fileResp = await fetch(downloadUrl);
        const arrayBuffer = await fileResp.arrayBuffer();

        // 3. Convert to Base64 (Safe chunking)
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = bytes.byteLength;
        const chunkSize = 1024;

        for (let i = 0; i < len; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
            binary += String.fromCharCode(...chunk);
        }

        return btoa(binary);
    } catch (error) {
        console.error('Error downloading/encoding file:', error);
        return null;
    }
}

// Download file from Telegram as ArrayBuffer
async function getTelegramFileBuffer(fileId: string, token: string): Promise<{ buffer: ArrayBuffer, mimeType: string } | null> {
    try {
        const fileInfoUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
        const infoResp = await fetch(fileInfoUrl);
        const infoData: any = await infoResp.json();

        if (!infoData.ok || !infoData.result?.file_path) return null;

        const downloadUrl = `https://api.telegram.org/file/bot${token}/${infoData.result.file_path}`;
        const fileResp = await fetch(downloadUrl);
        const buffer = await fileResp.arrayBuffer();

        // Guess extension based on path if needed, but return buffer
        return { buffer, mimeType: 'audio/ogg' }; // Telegram voice is typically OGG
    } catch (error) {
        console.error('Error downloading file buffer:', error);
        return null;
    }
}

async function transcribeAudio(audioBuffer: ArrayBuffer, apiKey: string, fileName: string = 'voice.ogg'): Promise<string> {
    const url = `https://api.groq.com/openai/v1/audio/transcriptions`;
    const formData = new FormData();

    // Create a Blob from buffer to treat it as a file
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    });

    const data: any = await response.json();
    if (!response.ok) {
        console.error("Transcription Error:", data);
        throw new Error(data.error?.message || "Transcription failed");
    }
    return data.text;
}

async function generateSpeech(text: string, apiKey: string): Promise<ArrayBuffer> {
    const url = `https://api.groq.com/openai/v1/audio/speech`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "playai-tts",
            input: text,
            voice: "Briggs-PlayAI"
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("TTS Error:", errText);
        throw new Error(`TTS API Failed: ${errText}`);
    }

    return await response.arrayBuffer();
}

async function sendVoiceMessage(chatId: number, audioBuffer: ArrayBuffer, token: string, caption?: string) {
    const url = `https://api.telegram.org/bot${token}/sendVoice`;
    const formData = new FormData();

    formData.append('chat_id', chatId.toString());
    if (caption) formData.append('caption', caption);

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('voice', blob, 'response.mp3');

    await fetch(url, {
        method: 'POST',
        body: formData
    });
}

async function callGroq(apiKey: string, systemPrompt: string, history: ChatMessage[], currentPrompt: string, model: string, mediaData: any = null): Promise<string> {
    const url = `https://api.groq.com/openai/v1/chat/completions`;

    // Automatic Switch: If image is present, we MUST use a vision model
    // Groq only supports Llama 3.2 Vision for images
    if (mediaData && mediaData.mimeType.startsWith('image/')) {
        console.log("Image detected! Switching Groq model to llama-3.2-11b-vision-preview (or 90b).");
        model = 'llama-3.2-90b-vision-preview';
    }

    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text
        }))
    ];

    // Add current message
    if (mediaData && mediaData.mimeType.startsWith('image/')) {
        // Multimodal Payload for Llama Vision
        messages.push({
            role: 'user',
            content: [
                { type: "text", text: currentPrompt },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${mediaData.mimeType};base64,${mediaData.data}`
                    }
                }
            ] as any
        });
    } else {
        // Standard Text Payload
        messages.push({ role: 'user', content: currentPrompt });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'TinaBot/1.0'
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096 // Vision models might need this explicitly
        })
    });

    const data: any = await response.json();

    if (!response.ok) {
        console.error('Groq API Error:', data);
        throw new Error(data.error?.message || `Groq API Error: ${response.statusText}`);
    }

    return data.choices[0].message.content;
}

async function callGemini(
    apiKey: string,
    systemInstruction: string,
    history: ChatMessage[],
    currentText: string,
    model: string = 'gemini-1.5-flash',
    mediaData: { mimeType: string, data: string } | null = null // New arg
): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const finalPrompt = `${systemInstruction}\n\nUser says: ${currentText}`;

    // Ensure history parts are valid
    const cleanHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: msg.parts
    }));

    // Build current user message parts
    const userParts: any[] = [{ text: finalPrompt }];
    if (mediaData) {
        userParts.push({
            inline_data: {
                mime_type: mediaData.mimeType,
                data: mediaData.data
            }
        });
    }

    const payload = {
        contents: [
            ...cleanHistory,
            { role: 'user', parts: userParts }
        ],
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data: any = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        console.error('Gemini API Error Response:', JSON.stringify(data));
        if (data.error) {
            throw new Error(data.error.message || 'Gemini API Error');
        }
        return "Analysis failed... (No candidates returned)";
    }

    return data.candidates[0].content.parts[0].text;
}

// Helper Functions
async function generateSpeechGoogle(text: string, lang: string): Promise<ArrayBuffer> {
    // Google TTS (Unofficial) - ONLY works with SHORT text (~200 chars max)
    // Longer text causes 400 errors from Cloudflare IPs.
    let safeText = text.substring(0, 200);
    if (lang === 'fa') {
        safeText = "پیام شما دریافت شد"; // Farsi is blocked from Cloudflare
    }

    // googleapis.com + gtx works for short English text
    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encodeURIComponent(safeText)}`;

    const resp = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
    });

    if (!resp.ok) throw new Error(`Google TTS failed: ${resp.status}`);
    return await resp.arrayBuffer();
}

export default {
    fetch: app.fetch
};

