
interface Env { }

// Hardcoded source of truth for the worker code
const CODE_URL = "https://raw.githubusercontent.com/s-alireza/TG-ChatBot/main/dist/index.js";

export default {
    async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
        // CORs Handling
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        if (request.method !== "POST") {
            return new Response("Only POST allowed", { status: 405 });
        }

        try {
            const body = await request.json() as any;
            const { telegram_token, cf_token, access_mode, allowed_user_ids } = body;

            // 1. Validation
            if (!telegram_token || !cf_token) {
                throw new Error("Missing required API keys");
            }

            // 2. Get Cloudflare Account ID
            const accountId = await getAccount(cf_token);
            if (!accountId) throw new Error("Could not find Cloudflare Account ID. Check your Token permissions.");

            // 2.5. Check if Subdomain exists (Required for workers.dev)
            const preSubdomain = await getSubdomain(cf_token, accountId);
            if (!preSubdomain) {
                throw new Error("You haven't set up a *.workers.dev subdomain yet! Please go to Cloudflare Dashboard > Workers & Pages and set up your subdomain (on the right sidebar).");
            }

            // 3. Get/Create KV Namespace
            const kvId = await setupKV(cf_token, accountId);
            if (!kvId) throw new Error("Failed to setup KV Namespace");

            // 4. Fetch Worker Code
            const workerCode = await fetch(CODE_URL).then(r => {
                if (!r.ok) throw new Error(`Failed to fetch worker code from GitHub: ${r.status}`);
                return r.text();
            });

            // 5. Deploy to Cloudflare
            const workerName = "tg-chatbot";
            const deployResult = await deployWorker(cf_token, accountId, workerName, workerCode, {
                TG_BOT_KV: kvId,
                TELEGRAM_TOKEN: telegram_token,
                GROQ_API_KEY: "", // Managed by bot
                GEMINI_API_KEY: "", // Managed by bot
                ACCESS_MODE: access_mode || "public",
                ALLOWED_USER_IDS: allowed_user_ids || ""
            });

            if (!deployResult.success) {
                throw new Error("Deployment failed: " + JSON.stringify(deployResult.errors));
            }

            // 6. Enable Subdomain (Critical!)
            await enableSubdomain(cf_token, accountId, workerName);

            // 7. Trigger Webhook Setup (Ping the new worker)
            const subdomain = await getSubdomain(cf_token, accountId);
            const workerUrl = `https://${workerName}.${subdomain}.workers.dev`;

            // Wait 5s for propagation
            await new Promise(r => setTimeout(r, 5000));

            let webhookStatus = "⚠️ Webhook could not be set automatically. Check worker logs.";
            try {
                const ping = await fetch(workerUrl);
                if (ping.ok) {
                    webhookStatus = "✅ Webhook set successfully!";
                }
            } catch (e) {
                console.log("Webhook ping failed:", e);
            }

            return new Response(JSON.stringify({
                success: true,
                workerUrl: workerUrl,
                message: "Deployment Successful",
                webhookStatus: webhookStatus
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });

        } catch (e: any) {
            return new Response(JSON.stringify({
                success: false,
                error: e.message
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }
    }
};

// --- Helpers ---

async function getAccount(token: string) {
    const res = await fetch("https://api.cloudflare.com/client/v4/accounts", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json() as any;
    if (data.success && data.result && data.result.length > 0) {
        return data.result[0].id;
    }
    return null;
}

async function getSubdomain(token: string, accountId: string) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json() as any;
    if (data.success && data.result) {
        return data.result.subdomain;
    }
    return null;
}

async function setupKV(token: string, accountId: string) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`;
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

    // List
    const listRes = await fetch(url, { headers });
    const listData = await listRes.json() as any;

    if (listData.success) {
        const existing = listData.result.find((ns: any) => ns.title === "TG_BOT_KV");
        if (existing) return existing.id;
    }

    // Create
    const createRes = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: "TG_BOT_KV" })
    });
    const createData = await createRes.json() as any;
    if (createData.success) {
        return createData.result.id;
    }
    return null;
}

async function deployWorker(token: string, accountId: string, name: string, code: string, vars: any) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}`;

    const formData = new FormData();

    // Metadata
    const metadata = {
        main_module: "index.js",
        bindings: [
            { type: "kv_namespace", name: "TG_BOT_KV", namespace_id: vars.TG_BOT_KV },
            { type: "plain_text", name: "TELEGRAM_TOKEN", text: vars.TELEGRAM_TOKEN },
            { type: "plain_text", name: "GROQ_API_KEY", text: vars.GROQ_API_KEY },
            { type: "plain_text", name: "GEMINI_API_KEY", text: vars.GEMINI_API_KEY },
            { type: "plain_text", name: "ACCESS_MODE", text: vars.ACCESS_MODE },
            { type: "plain_text", name: "ALLOWED_USER_IDS", text: vars.ALLOWED_USER_IDS }
        ]
    };

    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));

    // Code (Must be a module since we used main_module)
    formData.append("index.js", new Blob([code], { type: "application/javascript+module" }));

    const res = await fetch(url, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    return await res.json() as any;
}

async function enableSubdomain(token: string, accountId: string, name: string) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}/subdomain`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true })
    });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to enable subdomain: ${res.status} ${error}`);
    }
}
