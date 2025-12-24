# 🤖 TG-ChatBot

**A free, open-source AI chatbot for Telegram with multi-model support, voice messages, and image analysis.**

Deploy your personal AI assistant to Cloudflare Workers in minutes—no server costs, scales automatically!

---

## ✨ Features

- 🧠 **Multi-Model AI**: Llama 4, Llama 3.3 70B, Qwen 3, Gemini 2.5/3.0, and more
- 🎤 **Voice Messages**: Send and receive voice messages
- 📷 **Vision AI**: Analyze photos and PDFs with Llama Vision
- 🌐 **Multi-Language**: English, Persian, Russian, Chinese, Arabic, Spanish
- 💾 **Conversation History**: Maintains context across messages
- 🔒 **Access Control**: Public or private mode with user whitelist
- ⚡ **Free Hosting**: Runs on Cloudflare's free tier (100K requests/day)
- 🔧 **In-Bot Configuration**: Set up API keys conversationally within Telegram

---

## 🚀 Quick Start (For Users)

### Method 1: Web Setup Tool (Recommended) ⭐

The easiest way! No installation needed:

1. **Go to**: [TG-ChatBot Web Setup](https://s-alireza.github.io/TG-ChatBot/)
2. **Enter**:
   - Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
   - Cloudflare API Token (see instructions below)
   - Access mode (Public or Private)
3. **Click Deploy** and wait ~30 seconds
4. **Activate** (one-time):
   - Visit [dash.cloudflare.com/workers](https://dash.cloudflare.com/workers)
   - Click on `tg-chatbot` worker
   - Click the **"Visit"** button
   - Wait 2-5 minutes for DNS propagation
   - You'll see **"Webhook Set Successfully ✅"** when ready!
5. **Start chatting** with your bot on Telegram! 🎉

---

### Method 2: Local Setup

```bash
git clone https://github.com/s-alireza/TG-ChatBot
cd TG-ChatBot
npm install
python setup.py
```

This launches the Python GUI for local deployment.

---

## 🔐 Getting a Cloudflare API Token

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click profile icon → **My Profile** → **API Tokens**
3. **Create Token** → Use **"Edit Cloudflare Workers"** template
4. Copy your token

> **Important**: Ensure you have set up a `workers.dev` subdomain:
>
> - Go to **Workers & Pages**
> - Look for "Set up subdomain" on the right sidebar
> - Choose your subdomain (e.g., `my-name.workers.dev`)

---

## 🛠️ For Repository Owners

If you've forked this repo, follow these steps to enable deployment for others:

### 1. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. **Build and deployment** → **Source**: `GitHub Actions`
3. The workflow will auto-deploy your web tool!

### 2. Deploy the Proxy Worker

The web tool uses a proxy to communicate with Cloudflare:

```bash
cd deploy-proxy
npx wrangler deploy
```

**Copy the proxy URL** (e.g., `https://tg-bot-deploy-proxy.your-name.workers.dev`) and update line 14 in `web-setup/script.js`:

```javascript
const DEFAULT_PROXY_URL = 'https://tg-bot-deploy-proxy.your-name.workers.dev';
```

### 3. Commit the Built Worker

The web tool fetches the bot code from your repo:

```bash
npx wrangler deploy --dry-run --outdir dist
git add -f dist/index.js
git commit -m "Add built worker"
git push
```

---

## 👨‍💻 For Developers

### Project Structure

```
TG-ChatBot/
├── src/
│   └── index.ts           # Main bot code (Hono framework)
├── web-setup/             # Browser-based setup tool
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── deploy-proxy/          # Cloudflare Worker proxy
│   └── index.ts           # Handles deployment API calls
├── setup.py               # Python GUI for local deployment
├── launch.py              # Simple launcher (Web vs Local)
├── deploy.json            # Deploy Button configuration
└── wrangler.toml          # Base Cloudflare config
```

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run locally**:

   ```bash
   npx wrangler dev
   ```

3. **Test bot**:
   - Use [ngrok](https://ngrok.com/) to expose your local server
   - Set webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<NGROK_URL>`

4. **Deploy**:

   ```bash
   npx wrangler deploy
   ```

### Architecture

```
User → Telegram → Bot Worker (Cloudflare) → AI APIs (Groq/Gemini)
                      ↓
                   KV Store (Conversation History)
```

**Tech Stack**:

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono (lightweight HTTP framework)
- **Storage**: Cloudflare KV
- **AI**: Groq (Llama models), Google Gemini
- **Language**: TypeScript

---

## 🐞 Troubleshooting

### "Nothing here" or "DNS error" when visiting worker

**Cause**: New workers take 2-5 minutes to propagate globally.

**Solution**: Wait a few minutes and refresh. If it persists for >10 minutes, check:

- Did you set up a `workers.dev` subdomain in your Cloudflare account?
- Is the worker showing as "Published" in the dashboard?

### Bot not responding

**Possible causes**:

1. **Webhook not set**: Did you click "Visit" on the worker?
2. **API keys missing**: Configure Groq/Gemini via bot settings menu
3. **Wrong token**: Double-check your Telegram Bot Token

**Debug**:

- Check worker logs in Cloudflare Dashboard
- Send `/start` to your bot to verify it's online

### Deployment fails

- **Invalid token**: Verify your Cloudflare API Token has "Edit Workers" permissions
- **Subdomain not set**: Set up `workers.dev` subdomain first
- **Quota exceeded**: Free tier allows 100K requests/day

---

## 📝 License

MIT License - Feel free to fork, modify, and use!

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

---

## ⭐ Show Your Support

If you find this project useful, please give it a star on GitHub!

[![Star on GitHub](https://img.shields.io/github/stars/s-alireza/TG-ChatBot?style=social)](https://github.com/s-alireza/TG-ChatBot)
