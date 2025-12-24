document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const accessModeRadios = document.querySelectorAll('input[name="access_mode"]');
    const userIdContainer = document.getElementById('user_ids_container');
    const deployBtn = document.getElementById('deploy_btn');
    const logsOutput = document.getElementById('logs_output');
    const statusMessage = document.getElementById('status_message');
    const toggleLogs = document.getElementById('toggle_logs');
    const logsContent = document.getElementById('logs_output');

    // --- State ---
    // TODO: UPDATE THIS AFTER DEPLOYING PROXY
    const DEFAULT_PROXY_URL = 'https://tg-bot-deploy-proxy.alirzw6070.workers.dev';

    // --- Event Listeners ---

    // Toggle User IDs input
    accessModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'private') {
                userIdContainer.classList.remove('hidden');
            } else {
                userIdContainer.classList.add('hidden');
            }
        });
    });

    // Toggle Logs
    toggleLogs.addEventListener('click', () => {
        const isHidden = logsContent.classList.contains('hidden');
        if (isHidden) {
            logsContent.classList.remove('hidden');
            toggleLogs.querySelector('.toggle-icon').textContent = '▲';
        } else {
            logsContent.classList.add('hidden');
            toggleLogs.querySelector('.toggle-icon').textContent = '▼';
        }
    });

    // Deploy Action
    deployBtn.addEventListener('click', handleDeploy);

    // --- Functions ---

    function log(message, type = 'info') {
        const line = document.createElement('div');
        line.classList.add('log-line');

        const timestamp = new Date().toLocaleTimeString();

        let prefix = '';
        if (type === 'step') {
            line.classList.add('log-step');
            prefix = `[${timestamp}] 🔹 `;
        } else if (type === 'success') {
            line.classList.add('log-success');
            prefix = `[${timestamp}] ✅ `;
        } else if (type === 'error') {
            line.classList.add('log-error');
            prefix = `[${timestamp}] ❌ `;
        } else {
            line.classList.add('log-info');
            prefix = `[${timestamp}] `;
        }

        line.textContent = prefix + message;
        logsOutput.appendChild(line);
        logsOutput.scrollTop = logsOutput.scrollHeight;
    }

    function setStatus(msg, type) {
        statusMessage.textContent = msg;
        statusMessage.className = 'status-msg ' + (type === 'error' ? 'status-error' : 'status-success');
    }

    async function handleDeploy() {
        // 1. Get Values
        const telegramToken = document.getElementById('telegram_token').value.trim();
        const cfToken = document.getElementById('cf_api_token').value.trim();
        const accessMode = document.querySelector('input[name="access_mode"]:checked').value;
        const userIds = document.getElementById('allowed_user_ids').value.trim();
        const proxyUrlInput = document.getElementById('proxy_url').value.trim();

        // 2. Validation
        if (!telegramToken) return showError("Telegram Bot Token is required");
        if (!cfToken) return showError("Cloudflare API Token is required");
        if (accessMode === 'private' && !userIds) return showError("User IDs are required for private mode");

        // 3. Prepare Deployment
        const proxyUrl = proxyUrlInput || DEFAULT_PROXY_URL;
        if (proxyUrl.includes('YOUR_SUBDOMAIN')) {
            showError("⚠️ Please configure the Proxy URL in Advanced Settings or update the source code.");
            log("Error: Proxy URL not configured. Deployment cannot proceed.", "error");
            return;
        }

        startLoading();
        logsContent.classList.remove('hidden'); // Auto show logs
        logsOutput.innerHTML = ''; // Clear previous logs
        log("🚀 Starting deployment sequence...", "step");

        const payload = {
            telegram_token: telegramToken,
            cf_token: cfToken,
            access_mode: accessMode,
            allowed_user_ids: userIds
        };

        try {
            // Step 1: Send Request to Proxy
            log("Contacting deployment proxy...", "info");

            // Note: In a real streaming set up we'd read chunks. 
            // For now, we await the full result (Proxy handles the sequence).
            const response = await fetch(`${proxyUrl}/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Server error: ${response.status}`);
            }

            // Step 2: Handle Success
            if (result.success) {
                log("Cloudflare account detected.", "success");
                log("KV Namespace configured.", "success");
                log("Worker code deployed.", "success");

                const workerUrl = result.workerUrl;
                log(`Worker URL: ${workerUrl}`, "info");

                // MANUAL Verification Steps
                log("👇 ALMOST DONE!", "step");
                log("1. Click the 'Initialize Bot' button below.", "info");
                log("2. A new tab will open showing 'Status'.", "info");
                log("3. If you see 'Webhook Set', your bot is ready!", "info");

                setStatus("✅ Deployment Successful! (Click below to Finish)", "success");

                // Hide Deploy Button
                deployBtn.classList.add('hidden');

                // Create a fresh Link Button
                const initLink = document.createElement('a');
                initLink.href = workerUrl;
                initLink.target = "_blank";
                initLink.className = "deploy-btn";
                // Force styling to ensure visibility
                initLink.style.cssText = "background-color: #00d26a; color: white !important; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; margin-top: 1rem;";
                initLink.innerHTML = `<span class="btn-text" style="font-weight: bold;">🔗 Initialize Bot (Set Webhook)</span>`;

                // Append next to the hidden button
                deployBtn.parentNode.appendChild(initLink);

                initLink.addEventListener('click', () => {
                    log("Opening bot status page...", "info");
                });

                log("🎉 Waiting for you to click Initialize...", "success");

            } else {
                throw new Error(result.error || "Unknown deployment failure");
            }

        } catch (error) {
            log(error.message, "error");
            setStatus("❌ Deployment Failed", "error");
        } finally {
            stopLoading();
        }
    }

    function showError(msg) {
        setStatus(msg, 'error');
        // Shake button effect
        deployBtn.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300 });
    }

    function startLoading() {
        deployBtn.disabled = true;
        deployBtn.querySelector('.btn-text').textContent = "Deploying...";
        deployBtn.querySelector('.loader').classList.remove('hidden');
        statusMessage.textContent = "";
    }

    function stopLoading() {
        deployBtn.disabled = false;
        deployBtn.querySelector('.btn-text').textContent = "🚀 Deploy to Cloudflare";
        deployBtn.querySelector('.loader').classList.add('hidden');
    }
});
