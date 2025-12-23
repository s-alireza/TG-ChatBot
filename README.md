# TG-ChatBot

A free & fast personal AI chatbot for Telegram, powered by multiple AI models including Gemini, Llama, and more.

## Features

- 🤖 **Multi-Model Support**: GPT OSS, Llama 4, Llama 3.3, Qwen 3, Gemini 2.5/3.0, and more
- 🎤 **Voice Messages**: Send voice messages and get voice responses
- 📷 **Image Analysis**: Analyze photos and PDFs using vision models
- 🌐 **Bilingual**: Full English and Persian support
- 💾 **Conversation Memory**: Maintains chat history per user
- 🔒 **Access Control**: Public or private mode with user whitelist

---

## 🚀 Deploy Your Own (GitHub Actions)

The easiest way to deploy - no local tools required!

### Step 1: Fork This Repository

Click the **Fork** button at the top-right of this page.

### Step 2: Get Your API Keys

| Secret Name | Where to Get |
|-------------|--------------|
| `TELEGRAM_TOKEN` | Message [@BotFather](https://t.me/BotFather) on Telegram |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) |
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (optional) |
| `CF_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens |
| `CF_ACCOUNT_ID` | Cloudflare Dashboard → Workers → Account ID (right sidebar) |
| `CF_KV_NAMESPACE_ID` | Create via `npx wrangler kv:namespace create TG_BOT_KV` or dashboard |

### Step 3: Add Secrets to Your Fork

1. Go to your forked repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret | Value |
|--------|-------|
| `TELEGRAM_TOKEN` | Your bot token from BotFather |
| `GROQ_API_KEY` | Your Groq API key |
| `GEMINI_API_KEY` | Your Gemini key (or leave empty) |
| `CF_API_TOKEN` | Your Cloudflare API token |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |
| `CF_KV_NAMESPACE_ID` | Your KV namespace ID |
| `ACCESS_MODE` | `public` or `private` |
| `ALLOWED_USER_IDS` | Comma-separated IDs (only if private) |

### Step 4: Deploy

1. Go to **Actions** tab in your fork
2. Click **Deploy to Cloudflare Workers**
3. Click **Run workflow** → **Run workflow**
4. Wait ~1 minute for deployment

### Step 5: Set Webhook

After deployment, visit this URL in your browser:

```
https://tg-chatbot.YOUR_SUBDOMAIN.workers.dev/setup-webhook
```

Your bot is now live! 🎉

---

## 🖥️ Local Setup (Alternative)

If you prefer to deploy from your computer:

### Prerequisites

- Python 3.8+
- Node.js 18+
- Cloudflare Account

### Quick Start

1. Clone and enter the repo:

   ```bash
   git clone https://github.com/s-alireza/TG-ChatBot.git
   cd TG-ChatBot
   npm install
   ```

2. Run the setup tool:

   ```bash
   python setup.py
   ```

3. Enter your API keys and click **Deploy**!

---

## Setting Up Cloudflare API Token

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click profile icon → **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use **"Edit Cloudflare Workers"** template
5. Ensure these permissions:
   - Account - Workers KV Storage: **Edit**
   - Account - Workers Scripts: **Edit**
6. Create and copy the token

---

## Bot Commands

| Button | Action |
|--------|--------|
| ✨ New Topic | Clear conversation history |
| 💡 Inspire Me | Get a random interesting fact |
| 💌 For You | Get a motivational message |
| 🧠 Brain | Switch AI model |
| 🌐 Change Language | Toggle English/Persian |

## Available AI Models

- **GPT OSS 120B** - OpenAI-compatible open source model
- **Llama 4 (17B)** - Meta's latest Llama model
- **Llama 3.3 (70B)** - Versatile model for general tasks
- **Llama 3.2 Vision** - For image analysis
- **Qwen 3 (32B)** - Alibaba's multilingual model
- **Gemini 2.5/3.0** - Google's models
- **Compound (Groq)** - Groq's compound AI system

## License

MIT
