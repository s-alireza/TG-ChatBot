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

## 🚀 Deploy Your Own (One-Click via GitHub)

No local tools required! Just fork and add secrets.

### Step 1: Fork This Repository

Click the **Fork** button at the top-right of this page.

### Step 2: Add Secrets (Only 5 Required!)

Go to your fork → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Required | Description |
| Secret | Required | Description |
| `CF_API_TOKEN` | ✅ | Cloudflare API Token ([How to get](#cloudflare-api-token)) |
| `TELEGRAM_TOKEN` | ✅ | Bot token from [@BotFather](https://t.me/BotFather) |
| `GROQ_API_KEY` | ✅ | From [console.groq.com/keys](https://console.groq.com/keys) |
| `GEMINI_API_KEY` | ❌ | Optional: [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `ACCESS_MODE` | ✅ | `public` or `private` |
| `ALLOWED_USER_IDS` | ❌ | Comma-separated IDs (only if private) |

> **Note**: Cloudflare Account ID and KV namespace are auto-detected!

### Step 3: Deploy

1. Go to **Actions** tab
2. Click **Deploy to Cloudflare Workers**
3. Click **Run workflow** → **Run workflow**

### Step 4: Set Webhook

Visit your worker URL + `/setup-webhook`:

```text
https://tg-chatbot.YOUR_SUBDOMAIN.workers.dev/setup-webhook
```

**Done!** Your bot is live 🎉

---

## Cloudflare API Token

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Profile icon → **My Profile** → **API Tokens**
3. **Create Token** → Use **"Edit Cloudflare Workers"** template
4. Ensure permissions:
   - Account - Workers KV Storage: **Edit**
   - Account - Workers Scripts: **Edit**
5. Create and copy the token

---

## 🖥️ Local Setup (Alternative)

```bash
git clone https://github.com/s-alireza/TG-ChatBot.git
cd TG-ChatBot
npm install
python setup.py
```

---

## Bot Commands

| Button | Action |
| Button | Action |
| ✨ New Topic | Clear conversation history |
| 💡 Inspire Me | Random interesting fact |
| 💌 For You | Motivational message |
| 🧠 Brain | Switch AI model |
| 🌐 Language | Toggle English/Persian |

## Available Models

- GPT OSS 120B, Llama 4, Llama 3.3 (70B), Llama 3.2 Vision
- Qwen 3 (32B), Gemini 2.5/3.0, Compound (Groq)

## License

MIT
