# TG-ChatBot

A free & fast personal AI chatbot for Telegram, powered by multiple AI models including Gemini, Llama, and more.

## 🚀 **Easiest Way to Deploy: Web Setup Tool**

Start your bot in seconds using our free web-based setup tool (no installation required!):

### 👉 [Open Web Setup Tool](https://s-alireza.github.io/TG-ChatBot/) 👈

*(If the link doesn't work, see the "One-Time Setup" section below)*

---

## Features

- 🤖 **Multi-Model Support**: Llama 4, Llama 3.3, Qwen 3, Gemini 2.5/3.0, and more
- 🎤 **Voice Messages**: Send voice messages and get voice responses  
- 📷 **Image Analysis**: Analyze photos and PDFs using vision models
- 🌐 **Bilingual**: Full English and Persian support
- 💾 **Conversation Memory**: Maintains chat history per user
- 🔒 **Access Control**: Public or private mode with user whitelist

---

## �️ Repository Owner Setup (One-Time)

If you have forked this repository, you need to set up the **Web Tool** once so it works for you and others.

### 1. Enable GitHub Pages

1. Go to your repository **Settings** → **Pages**.
2. Under **Build and deployment**, select **Source** as `GitHub Actions`.
3. The `Deploy Web Setup to Pages` workflow will automatically handle the rest!

### 2. Deploy the Proxy Worker

The web tool needs a "proxy" to talk to Cloudflare. Deploy it once:

```bash
cd deploy-proxy
npx wrangler deploy
```

 > **Important**: Copy the **Worker URL** (e.g., `https://tg-bot-deploy-proxy.your-name.workers.dev`) and update `web-setup/script.js` line 14:
>
 > ```javascript
 > const DEFAULT_PROXY_URL = 'https://tg-bot-deploy-proxy.your-name.workers.dev';
 > ```

### 3. Commit the Built Worker

To allow the web tool to fetch your code, build and commit the worker file:

```bash
# In the root directory
npx wrangler deploy --dry-run --outdir dist
git add dist/worker.js
git commit -m "Add built worker"
git push
```

---

## 💻 Manual Setup (Alternative)

If you prefer to deploy manually using Python:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the setup tool: `python setup.py`

---

## 🔐 Getting a Cloudflare API Token

For deployment, you need a Cloudflare API Token:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click profile icon → **My Profile** → **API Tokens**
3. Create Token → **"Edit Cloudflare Workers"** template
4. Create and copy your token

---

## 📝 License

MIT
