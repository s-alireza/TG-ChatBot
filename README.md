# TG-ChatBot

A free & fast personal AI chatbot for Telegram, powered by multiple AI models including Gemini, Llama, and more.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/s-alireza/TG-ChatBot)

## Features

- 🤖 **Multi-Model Support**: Llama 4, Llama 3.3, Qwen 3, Gemini 2.5/3.0, and more
- 🎤 **Voice Messages**: Send voice messages and get voice responses  
- 📷 **Image Analysis**: Analyze photos and PDFs using vision models
- 🌐 **Bilingual**: Full English and Persian support
- 💾 **Conversation Memory**: Maintains chat history per user
- 🔒 **Access Control**: Public or private mode with user whitelist

---

## 🚀 One-Click Deploy

Click the button above to deploy your own bot in minutes! You'll need:

| Requirement | Where to Get |
| --- | --- |
| Telegram Bot Token | Message [@BotFather](https://t.me/BotFather) on Telegram |
| Groq API Key | [console.groq.com/keys](https://console.groq.com/keys) |
| Gemini API Key (optional) | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| GitHub/GitLab Account | To store your cloned repo |
| Cloudflare Account | Free tier works! |

### After Deployment

1. Copy your worker URL (e.g., `https://tg-chatbot.your-name.workers.dev`)
2. Visit `https://your-worker-url/setup-webhook` to activate the bot
3. Message your bot on Telegram - it's ready!

---

## 💻 Manual Setup (Alternative)

If you prefer to deploy manually:

### Prerequisites

- Python 3.8+ (for setup tool)
- Node.js 18+ (for Wrangler)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/s-alireza/TG-ChatBot.git
   cd TG-ChatBot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the setup tool:

   ```bash
   python setup.py
   ```

4. Enter your API keys and click **Deploy**!

---

## 🔐 Getting a Cloudflare API Token

For manual deployment, you need a Cloudflare API Token:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click profile icon → **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use **"Edit Cloudflare Workers"** template
5. Ensure these permissions:

   | Permission | Access Level |
   | --- | --- |
   | Account - Workers KV Storage | Edit |
   | Account - Workers Scripts | Edit |

6. Create and copy your token

---

## 🎮 Bot Commands

| Button | Action |
| --- | --- |
| ✨ New Topic | Clear conversation history |
| 💡 Inspire Me | Get a random interesting fact |
| 💌 For You | Get a motivational message |
| 🧠 Brain | Switch AI model |
| 🌐 Language | Toggle English/Persian |

## 🤖 Available AI Models

- **Llama 4 Scout (17B)** - Meta's latest model
- **Llama 3.3 (70B)** - Versatile for general tasks
- **Llama 3.2 Vision** - For image analysis
- **Qwen 3 (32B)** - Alibaba's multilingual model
- **Gemini 2.5/3.0** - Google's models
- **Compound AI** - Groq's compound system

---

## 📝 License

MIT
