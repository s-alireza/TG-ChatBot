import { Hono } from 'hono';

// Environment Bindings
type Bindings = {
    TG_BOT_KV: KVNamespace;
    TELEGRAM_TOKEN: string;
    GEMINI_API_KEY?: string;  // Optional - can be set via bot
    GROQ_API_KEY?: string;    // Optional - can be set via bot
    ACCESS_MODE?: string;     // "public" or "private"
    ALLOWED_USER_IDS?: string; // Comma-separated user IDs
    WEBHOOK_SECRET?: string;
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



// Keyboards (Language selection only - model keyboard is now dynamic)
const KEYBOARDS = {
    en: {
        lang: {
            keyboard: [
                [{ text: 'English 🇬🇧' }, { text: 'فارسی 🇮🇷' }],
                [{ text: 'Русский 🇷🇺' }, { text: '中文 🇨🇳' }],
                [{ text: 'العربية 🇸🇦' }, { text: 'Español 🇪🇸' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }
    }
};

// Dynamic Model Keyboard Generator (shows 🔒 for unavailable Gemini models)
function getModelKeyboard(lang: string, hasGeminiKey: boolean) {
    const isFa = lang === 'fa';
    const lock = hasGeminiKey ? '' : ' 🔒';

    if (isFa) {
        return {
            keyboard: [
                [{ text: '🤖 جی‌پی‌تی (120B)' }],
                [{ text: '🥣 کامپاند (Groq)' }],
                [{ text: '👁️ لاما 3.2 (Vision)' }, { text: '🦄 لاما 4 (17B)' }],
                [{ text: '🦙 لاما 3.3 (70B)' }, { text: '🐉 کوین 3 (32B)' }],
                [{ text: `🚀 جمنای 3.0 (Flash)${lock}` }, { text: `⚡ جمنای 2.5 (Flash)${lock}` }],
                [{ text: `🪶 جمنای 2.5 (Lite)${lock}` }, { text: `💎 Gemma 3 (27B)${lock}` }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        };
    } else {
        return {
            keyboard: [
                [{ text: '🤖 GPT OSS (120B)' }],
                [{ text: '🥣 Compound (Groq)' }],
                [{ text: '👁️ Llama 3.2 (Vision)' }, { text: '🦄 Llama 4 (17B)' }],
                [{ text: '🦙 Llama 3.3 (70B)' }, { text: '🐉 Qwen 3 (32B)' }],
                [{ text: `🚀 Gemini 3.0 (flash)${lock}` }, { text: `⚡ Gemini 2.5 (flash)${lock}` }],
                [{ text: `🪶 Gemini 2.5 (Lite)${lock}` }, { text: `💎 Gemma 3 (27B)${lock}` }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        };
    }
}

// Model Mapping (Hybrid Manual/Auto)
// Includes both unlocked and locked (🔒) versions for Gemini models
const MODEL_MAP: { [key: string]: string } = {
    // English Keys - Groq models
    '🤖 GPT OSS (120B)': 'openai/gpt-oss-120b',
    '🦙 Llama 3.3 (70B)': 'llama-3.3-70b-versatile',
    '🦄 Llama 4 (17B)': 'meta-llama/llama-4-maverick-17b-128e-instruct',
    '🐉 Qwen 3 (32B)': 'qwen/qwen3-32b',
    '👁️ Llama 3.2 (Vision)': 'llama-3.2-90b-vision-preview',
    '🥣 Compound (Groq)': 'groq/compound',

    // English Keys - Gemini models (unlocked)
    '⚡ Gemini 2.5 (flash)': 'gemini-2.5-flash',
    '🪶 Gemini 2.5 (Lite)': 'gemini-2.5-flash-lite',
    '🚀 Gemini 3.0 (flash)': 'gemini-3-flash-preview',
    '💎 Gemma 3 (27B)': 'gemma-3-27b-it',

    // English Keys - Gemini models (locked versions)
    '⚡ Gemini 2.5 (flash) 🔒': 'gemini-2.5-flash',
    '🪶 Gemini 2.5 (Lite) 🔒': 'gemini-2.5-flash-lite',
    '🚀 Gemini 3.0 (flash) 🔒': 'gemini-3-flash-preview',
    '💎 Gemma 3 (27B) 🔒': 'gemma-3-27b-it',

    // Farsi Keys - Groq models
    '🤖 جی‌پی‌تی (120B)': 'openai/gpt-oss-120b',
    '🦙 لاما 3.3 (70B)': 'llama-3.3-70b-versatile',
    '🦄 لاما 4 (17B)': 'meta-llama/llama-4-maverick-17b-128e-instruct',
    '🐉 کوین 3 (32B)': 'qwen/qwen3-32b',
    '👁️ لاما 3.2 (Vision)': 'llama-3.2-90b-vision-preview',
    '🥣 کامپاند (Groq)': 'groq/compound',

    // Farsi Keys - Gemini models (unlocked)
    '⚡ جمنای 2.5 (Flash)': 'gemini-2.5-flash',
    '🪶 جمنای 2.5 (Lite)': 'gemini-2.5-flash-lite',
    '🚀 جمنای 3.0 (Flash)': 'gemini-3-flash-preview',
    '💎 جما 3 (27B)': 'gemma-3-27b-it',

    // Farsi Keys - Gemini models (locked versions)
    '⚡ جمنای 2.5 (Flash) 🔒': 'gemini-2.5-flash',
    '🪶 جمنای 2.5 (Lite) 🔒': 'gemini-2.5-flash-lite',
    '🚀 جمنای 3.0 (Flash) 🔒': 'gemini-3-flash-preview',
    '💎 جما 3 (27B) 🔒': 'gemma-3-27b-it',
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

// --- SETUP WIZARD ---
// Checks if bot is configured (has Groq API key)
async function isConfigured(kv: KVNamespace): Promise<boolean> {
    const groqKey = await kv.get('config:groq_key');
    return !!groqKey;
}

// Get API keys from KV (fallback to env)
async function getGroqKey(kv: KVNamespace, env: Bindings): Promise<string | null> {
    const kvKey = await kv.get('config:groq_key');
    return kvKey || env.GROQ_API_KEY || null;
}

async function getGeminiKey(kv: KVNamespace, env: Bindings): Promise<string | null> {
    const kvKey = await kv.get('config:gemini_key');
    return kvKey || env.GEMINI_API_KEY || null;
}

// Setup steps: 0 = asking for Groq key, 1 = asking for Gemini key
async function handleSetupWizard(
    chatId: number,
    userId: number,
    text: string,
    env: Bindings
): Promise<{ handled: boolean; response?: string }> {
    const kv = env.TG_BOT_KV;

    // Check if already configured
    if (await isConfigured(kv)) {
        return { handled: false };
    }

    // First user becomes owner
    const ownerId = await kv.get('config:owner_id');
    if (!ownerId) {
        await kv.put('config:owner_id', userId.toString());
    } else if (ownerId !== userId.toString()) {
        return {
            handled: true,
            response: "⛔ This bot is being configured by another user. Please wait."
        };
    }

    // Get current setup step
    const step = await kv.get(`setup_step:${userId}`) || '0';

    // Handle /start or first message
    if (step === '0' && !text.startsWith('gsk_')) {
        await kv.put(`setup_step:${userId}`, '0');
        return {
            handled: true,
            response: `🤖 *Welcome to TG-ChatBot Setup!*

Let's configure your bot in 2 simple steps.

*Step 1/2:* Send me your *Groq API Key*
Get it free from: console.groq.com/keys

_Your key should start with \`gsk_\`_`
        };
    }

    // Step 0: Waiting for Groq API Key
    if (step === '0') {
        if (text.startsWith('gsk_') && text.length > 20) {
            // Validate by making a test call
            const isValid = await validateGroqKey(text);
            if (isValid) {
                await kv.put('config:groq_key', text);
                await kv.put(`setup_step:${userId}`, '1');
                return {
                    handled: true,
                    response: `✅ *Groq API Key saved!*

*Step 2/2:* Send me your *Gemini API Key* (optional)
Get it from: aistudio.google.com/app/apikey

_Or send \`skip\` to use Groq only_`
                };
            } else {
                return {
                    handled: true,
                    response: "❌ Invalid Groq API Key. Please check and try again.\n\n_The key should start with `gsk_`_"
                };
            }
        } else {
            return {
                handled: true,
                response: "Please send a valid Groq API Key.\n_It should start with `gsk_`_"
            };
        }
    }

    // Step 1: Waiting for Gemini API Key
    if (step === '1') {
        if (text.toLowerCase() === 'skip') {
            await kv.put('config:gemini_key', '');
            await kv.put('config:setup_complete', 'true');
            await kv.delete(`setup_step:${userId}`);
            return {
                handled: true,
                response: `🎉 *Setup Complete!*

Your bot is ready to use!
Send me any message to start chatting.`
            };
        } else if (text.startsWith('AI') && text.length > 20) {
            // Gemini keys typically start with "AI"
            await kv.put('config:gemini_key', text);
            await kv.put('config:setup_complete', 'true');
            await kv.delete(`setup_step:${userId}`);
            return {
                handled: true,
                response: `🎉 *Setup Complete!*

Both API keys are configured!
Send me any message to start chatting.`
            };
        } else {
            return {
                handled: true,
                response: "Please send a valid Gemini API Key or type `skip` to continue without it."
            };
        }
    }

    return { handled: false };
}

// Validate Groq API Key
async function validateGroqKey(key: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        return response.ok;
    } catch {
        return false;
    }
}

// --- ROUTES ---

// Welcome page with auto-setup
app.get('/', async (c) => {
    const env = c.env;
    const workerUrl = new URL(c.req.url);
    const webhookUrl = `${workerUrl.origin}/webhook`;

    // Cache the worker URL for the scheduled handler
    await env.TG_BOT_KV.put('worker_url', workerUrl.origin);

    // Check current webhook status
    let webhookStatus = { set: false, url: '', error: '' };
    try {
        const infoResponse = await fetch(
            `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/getWebhookInfo`
        );
        const info: any = await infoResponse.json();

        if (info.ok && info.result.url) {
            webhookStatus.set = true;
            webhookStatus.url = info.result.url;
        }
    } catch (e: any) {
        webhookStatus.error = e.message;
    }

    // Auto-setup webhook if not set
    let setupResult = { attempted: false, success: false, message: '' };
    if (!webhookStatus.set && !webhookStatus.error) {
        setupResult.attempted = true;
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`
            );
            const result: any = await response.json();

            if (result.ok) {
                setupResult.success = true;
                setupResult.message = 'Webhook configured automatically!';
                webhookStatus.set = true;
                webhookStatus.url = webhookUrl;
            } else {
                setupResult.message = result.description || 'Failed to set webhook';
            }
        } catch (e: any) {
            setupResult.message = e.message;
        }
    }

    // Return beautiful HTML status page
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>TG-ChatBot Status</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eaeaea;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 500px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .emoji { font-size: 64px; margin-bottom: 20px; }
        h1 { margin: 0 0 10px 0; color: #e94560; }
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 20px 0;
        }
        .status.online { background: #00d26a; color: #000; }
        .status.offline { background: #e94560; color: #fff; }
        .info {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
        }
        .info-row { margin: 8px 0; }
        .info-label { color: #888; }
        code {
            background: rgba(0,0,0,0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            word-break: break-all;
        }
        .btn {
            display: inline-block;
            background: #e94560;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
        }
        .btn:hover { background: #ff6b6b; }
        .success-msg { color: #00d26a; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🤖</div>
        <h1>TG-ChatBot</h1>
        <p>Your AI-powered Telegram bot</p>
        
        <div class="status ${webhookStatus.set ? 'online' : 'offline'}">
            ${webhookStatus.set ? '✅ Online & Ready' : '⚠️ Webhook Not Set'}
        </div>
        
        ${setupResult.attempted && setupResult.success ? `
            <p class="success-msg">🎉 ${setupResult.message}</p>
        ` : ''}
        
        <div class="info">
            <div class="info-row">
                <span class="info-label">Worker URL:</span><br>
                <code>${workerUrl.origin}</code>
            </div>
            <div class="info-row">
                <span class="info-label">Webhook:</span><br>
                <code>${webhookStatus.url || 'Not configured'}</code>
            </div>
            <div class="info-row">
                <span class="info-label">Access Mode:</span>
                <code>${env.ACCESS_MODE || 'public'}</code>
            </div>
        </div>
        
        ${webhookStatus.set ? `
            <p>Your bot is ready! Send a message on Telegram to test it.</p>
        ` : `
            <a href="/setup-webhook" class="btn">🔧 Setup Webhook</a>
        `}
    </div>
</body>
</html>`;

    return c.html(html);
});

// Manual webhook setup endpoint (backup)
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
            // Redirect to home page to show success
            return c.redirect('/');
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

    const chatId = message.chat.id;
    const userId = message.from.id;
    let text = message.text || message.caption || '';

    // 2. Check if bot needs setup (before any other processing)
    const setupResult = await handleSetupWizard(chatId, userId, text, env);
    if (setupResult.handled) {
        if (setupResult.response) {
            await sendMessage(chatId, setupResult.response, env.TELEGRAM_TOKEN);
        }
        return c.json({ ok: true });
    }

    // 3. Get API keys from KV (with env fallback)
    const groqApiKey = await getGroqKey(env.TG_BOT_KV, env);
    const geminiApiKey = await getGeminiKey(env.TG_BOT_KV, env);

    // If still no Groq key, something went wrong
    if (!groqApiKey) {
        await sendMessage(chatId, "⚠️ Bot not configured. Please contact the owner.", env.TELEGRAM_TOKEN);
        return c.json({ ok: true });
    }

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
                text = await transcribeAudio(fileBuffer.buffer, groqApiKey);
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


    // 4. Authorization Check (configurable public/private)
    if (env.ACCESS_MODE === 'private') {
        const allowedIds = (env.ALLOWED_USER_IDS || '').split(',').map(id => id.trim());
        if (!allowedIds.includes(userId.toString())) {
            console.log(`Unauthorized access attempt from: ${userId}`);
            await sendMessage(chatId, "Access Denied ⛔\nYou are not authorized to use this bot.", env.TELEGRAM_TOKEN);
            return c.json({ ok: true });
        }
    }
    // If ACCESS_MODE is "public", allow everyone

    // 3. Language Check
    const langKey = `lang:${userId}`;
    let userLang = await env.TG_BOT_KV.get(langKey);

    // Handle Change Language
    if (text.includes('Change Language') || text.includes('تغییر زبان') || text.includes('Сменить язык') || text.includes('更改语言') || text.includes('تغيير اللغة') || text.includes('Cambiar Idioma')) {
        await env.TG_BOT_KV.delete(langKey);
        await sendMessage(chatId, "Please choose your language:", env.TELEGRAM_TOKEN, KEYBOARDS.en.lang);
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
        } else if (text.includes('فارسی') || text.includes('Persian')) {
            await env.TG_BOT_KV.put(langKey, 'fa');
            await sendMessage(chatId, "زبان روی فارسی تنظیم شد! 🇮🇷\nسلام! من دستیار هوش مصنوعی شما هستم.", env.TELEGRAM_TOKEN, getMainKeyboard('fa', activeModel));
        } else if (text.includes('Русский')) {
            await env.TG_BOT_KV.put(langKey, 'ru');
            await sendMessage(chatId, "Язык установлен на Русский! 🇷🇺\nПривет! Я ваш ИИ-помощник.", env.TELEGRAM_TOKEN, getMainKeyboard('ru', activeModel));
        } else if (text.includes('中文')) {
            await env.TG_BOT_KV.put(langKey, 'zh');
            await sendMessage(chatId, "语言已设置为中文! 🇨🇳\n你好！我是你的AI助手。", env.TELEGRAM_TOKEN, getMainKeyboard('zh', activeModel));
        } else if (text.includes('العربية')) {
            await env.TG_BOT_KV.put(langKey, 'ar');
            await sendMessage(chatId, "تم ضبط اللغة على العربية! 🇸🇦\nأهلاً! أنا مساعد الذكاء الاصطناعي الخاص بك.", env.TELEGRAM_TOKEN, getMainKeyboard('ar', activeModel));
        } else if (text.includes('Español')) {
            await env.TG_BOT_KV.put(langKey, 'es');
            await sendMessage(chatId, "¡Idioma configurado en Español! 🇪🇸\n¡Hola! Soy tu asistente de IA.", env.TELEGRAM_TOKEN, getMainKeyboard('es', activeModel));
        } else {
            await sendMessage(chatId, "Please choose your language:", env.TELEGRAM_TOKEN, KEYBOARDS.en.lang);
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

    function getMainKeyboard(lang: string, currentModelId: string) {
        const modelName = MODEL_NAMES[currentModelId] || 'Unknown';

        // Localized strings
        let conversationsText = '✨ New Conversation';
        let brainLabel = '🧠 Brain';
        let langLabel = '🌐 Change Language';

        if (lang === 'fa') {
            conversationsText = '✨ گفتگوی جدید';
            brainLabel = '🧠 مدل';
            langLabel = '🌐 تغییر زبان';
        } else if (lang === 'ru') {
            conversationsText = '✨ Новый чат';
            brainLabel = '🧠 Модель';
            langLabel = '🌐 Сменить язык';
        } else if (lang === 'zh') {
            conversationsText = '✨ 新对话';
            brainLabel = '🧠 模型';
            langLabel = '🌐 更改语言';
        } else if (lang === 'ar') {
            conversationsText = '✨ محادثة جديدة';
            brainLabel = '🧠 نموذج';
            langLabel = '🌐 تغيير اللغة';
        } else if (lang === 'es') {
            conversationsText = '✨ Nueva Conversación';
            brainLabel = '🧠 Cerebro';
            langLabel = '🌐 Cambiar Idioma';
        }

        const brainText = `${brainLabel}: ${modelName}`;

        return {
            keyboard: [
                [{ text: conversationsText }],
                [{ text: brainText }, { text: langLabel }]
            ],
            resize_keyboard: true,
            persistent_keyboard: true,
        };
    }

    // Generate Dynamic Keyboard
    const isPersian = userLang === 'fa';
    const hasGeminiKey = !!geminiApiKey;
    const currentKeyboard = getMainKeyboard(userLang, activeModel);
    const modelKeyboard = getModelKeyboard(userLang, hasGeminiKey);

    // Adjust System Prompt based on Mode
    let localizedSystemPrompt = SYSTEM_PROMPT;

    if (isVoiceMessage) {
        // Voice Mode: Keep response conversational and short
        localizedSystemPrompt += " Keep your response conversational and under 750 characters.";

        if (userLang === 'en') localizedSystemPrompt += " Respond in English.";
        else if (userLang === 'fa') localizedSystemPrompt += " Respond in Persian/Farsi.";
        else if (userLang === 'ru') localizedSystemPrompt += " Respond in Russian.";
        else if (userLang === 'zh') localizedSystemPrompt += " Respond in Chinese.";
        else if (userLang === 'ar') localizedSystemPrompt += " Respond in Arabic.";
        else if (userLang === 'es') localizedSystemPrompt += " Respond in Spanish.";
    } else {
        // Text Mode: General Conciseness (Fit in one Telegram message ~4096 chars)
        localizedSystemPrompt += " Keep your response concise and under 4000 characters to fit in a single message.";

        if (userLang === 'fa') localizedSystemPrompt += " Respond in Persian/Farsi. Be professional and academic.";
        else if (userLang === 'ru') localizedSystemPrompt += " Respond in Russian.";
        else if (userLang === 'zh') localizedSystemPrompt += " Respond in Chinese.";
        else if (userLang === 'ar') localizedSystemPrompt += " Respond in Arabic.";
        else if (userLang === 'es') localizedSystemPrompt += " Respond in Spanish.";
    }

    // 4. Command Handling (Only if text exists)
    if (text === '/start') {
        const welcome = isPersian ? "خوش آمدید! 🤖\nچطور می‌توانم امروز به شما کمک کنم؟" : "Welcome! 🤖\nHow can I help you today?";
        await sendMessage(chatId, welcome, env.TELEGRAM_TOKEN, currentKeyboard);
        return c.json({ ok: true });
    }

    // --- MANUAL MODEL SELECTION ---
    // Match "Change Brain" OR "Brain:" OR "مدل:" or translations
    if (text.includes('Change Brain') || text.includes('تغییر مغز') || text.includes('Brain:') || text.includes('مدل:') || text.includes('Модель:') || text.includes('模型:') || text.includes('نموذج:') || text.includes('Cerebro:')) {
        let msg = "Which AI model would you like to use? 🧠";
        if (userLang === 'fa') msg = "کدام مدل هوش مصنوعی را ترجیح می‌دهید؟ 🧠";
        else if (userLang === 'ru') msg = "Какую модель ИИ вы хотите использовать? 🧠";
        else if (userLang === 'zh') msg = "您想使用哪个AI模型？ 🧠";
        else if (userLang === 'ar') msg = "أي نموذج ذكاء اصطناعي تود استخدامه؟ 🧠";
        else if (userLang === 'es') msg = "¿Qué modelo de IA te gustaría usar? 🧠";

        await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, modelKeyboard);
        return c.json({ ok: true });
    }

    if (MODEL_MAP[text]) {
        const selectedModel = MODEL_MAP[text];
        const isGeminiModel = selectedModel.startsWith('gemini') || selectedModel.startsWith('gemma');

        // Check if user is trying to select a locked Gemini model
        if (isGeminiModel && !hasGeminiKey) {
            const lockedMsg = isPersian
                ? `⚠️ این مدل قفل است! 🔒

برای استفاده از مدل‌های Gemini، ابتدا باید GEMINI_API_KEY را در تنظیمات اضافه کنید.

💡 مدل‌های Groq (بدون علامت قفل) در دسترس هستند.`
                : `⚠️ This model is locked! 🔒

To use Gemini models, you need to add your GEMINI_API_KEY in the settings first.

💡 Groq models (without 🔒) are available for use.`;
            await sendMessage(chatId, lockedMsg, env.TELEGRAM_TOKEN, currentKeyboard);
            return c.json({ ok: true });
        }

        // Store explicit manual selection
        usage.manualModel = selectedModel;
        await env.TG_BOT_KV.put(usageKey, JSON.stringify(usage));

        // Re-generate keyboard with NEW model to show update immediately
        const newKeyboard = getMainKeyboard(userLang, selectedModel);

        const confirmMsg = isPersian ? `مدل به ${text} تنظیم شد. ✅` : `Model set to: ${text}. ✅`;
        await sendMessage(chatId, confirmMsg, env.TELEGRAM_TOKEN, newKeyboard);
        return c.json({ ok: true });
    }



    if (text.includes('New Conversation') || text.includes('گفتگوی جدید') || text.includes('Новый чат') || text.includes('新对话') || text.includes('محادثة جديدة') || text.includes('Nueva Conversación')) {
        await env.TG_BOT_KV.delete(`history:${userId}`);
        let clearMsg = "Previous conversation cleared. I'm ready! ✨";
        if (userLang === 'fa') clearMsg = "گفتگوی قبلی پاک شد. بفرمایید! ✨";
        else if (userLang === 'ru') clearMsg = "Предыдущая переписка удалена. Я готов! ✨";
        else if (userLang === 'zh') clearMsg = "上次对话已清除。我准备好了！✨";
        else if (userLang === 'ar') clearMsg = "تم مسح المحادثة السابقة. أنا مستعد! ✨";
        else if (userLang === 'es') clearMsg = "Conversación anterior borrada. ¡Estoy listo! ✨";

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

    // Normal conversation
    if (!promptToGemini && mediaData) {
        promptToGemini = isPersian ? "لطفا این را تحلیل کنید." : "Please analyze this.";
    }
    history.push({ role: 'user', parts: [{ text: promptToGemini }] });

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
                aiResponse = await callGemini(geminiApiKey || '', localizedSystemPrompt, history, promptToGemini, attemptModel, mediaData);
            } else {
                aiResponse = await callGroq(groqApiKey, localizedSystemPrompt, history, promptToGemini, attemptModel);
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
                        // Supports English and Arabic. Others will fall back to Google.
                        audioBuffer = await generateSpeech(cleanText, groqApiKey, userLang || 'en');
                    } catch (groqError: any) {
                        console.error("Groq TTS Failed, regenerating for Google Fallback:", groqError);
                        await sendMessage(chatId, `⚠️ Primary TTS failed. Regenerating shorter response...`, env.TELEGRAM_TOKEN);

                        // Regenerate AI response with 200 char limit for Google TTS
                        const shortPrompt = localizedSystemPrompt.replace("under 750 characters", "under 200 characters");
                        let shortResponse = "";

                        // Try to regenerate with current model
                        try {
                            if (activeModel.startsWith('gemini') || activeModel.startsWith('gemma')) {
                                shortResponse = await callGemini(geminiApiKey || '', shortPrompt, [], text, activeModel, null);
                            } else {
                                shortResponse = await callGroq(groqApiKey, shortPrompt, [], text, activeModel);
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
                        audioBuffer = await generateSpeechGoogle(shortClean, userLang || 'en');
                    }

                    await sendVoiceMessage(chatId, audioBuffer, env.TELEGRAM_TOKEN);
                } catch (e: any) {
                    console.error("TTS Generation failed:", e);
                    await sendMessage(chatId, `❌ TTS Error: ${e.message}`, env.TELEGRAM_TOKEN);
                }
            }

            // 7. Update History (Only on Success)
            history.push({ role: 'model', parts: [{ text: aiResponse }] });
            await env.TG_BOT_KV.put(historyKey, JSON.stringify(history));
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

async function generateSpeech(text: string, apiKey: string, lang: string = 'en'): Promise<ArrayBuffer> {
    const url = `https://api.groq.com/openai/v1/audio/speech`;

    let model = "playai-tts";
    let voice = "Briggs-PlayAI";

    if (lang === 'ar') {
        model = "playai-tts-arabic";
        voice = "Ahmad-PlayAI"; // Male Arabic voice
    } else if (lang !== 'en') {
        throw new Error(`Groq PlayAI does not support language: ${lang}`);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            input: text,
            voice: voice
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
