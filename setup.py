#!/usr/bin/env python3
"""
TG-ChatBot Setup & Deploy Tool
A streamlined GUI to configure and deploy your Telegram AI chatbot
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import subprocess
import threading
import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

class SetupApp:
    def __init__(self, root):
        self.root = root
        self.root.title("TG-ChatBot Setup")
        self.root.geometry("650x750")
        self.root.resizable(True, True)
        
        # Set theme colors
        self.bg_color = "#1a1a2e"
        self.fg_color = "#eaeaea"
        self.accent_color = "#0f3460"
        self.button_color = "#e94560"
        self.success_color = "#00d26a"
        self.entry_bg = "#16213e"
        
        self.root.configure(bg=self.bg_color)
        
        # Configure styles
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.configure_styles()
        
        # User ID entries list
        self.user_id_entries = []
        
        # Cloudflare detected values
        self.detected_account_id = None
        self.detected_kv_id = None
        
        # Build UI
        self.create_widgets()
        
        # Load existing .env if present
        self.load_existing_env()
    
    def configure_styles(self):
        """Configure ttk styles for dark theme"""
        self.style.configure('TFrame', background=self.bg_color)
        self.style.configure('TLabel', background=self.bg_color, foreground=self.fg_color, font=('Segoe UI', 10))
        self.style.configure('Header.TLabel', font=('Segoe UI', 24, 'bold'), foreground=self.button_color)
        self.style.configure('Status.TLabel', font=('Segoe UI', 11), foreground=self.success_color)
        self.style.configure('TEntry', fieldbackground=self.entry_bg, foreground=self.fg_color)
        self.style.configure('TRadiobutton', background=self.bg_color, foreground=self.fg_color)
        self.style.configure('TLabelframe', background=self.bg_color, foreground=self.fg_color)
        self.style.configure('TLabelframe.Label', background=self.bg_color, foreground=self.fg_color, font=('Segoe UI', 11, 'bold'))
    
    def create_widgets(self):
        """Create all UI widgets"""
        # Main scrollable frame
        canvas = tk.Canvas(self.root, bg=self.bg_color, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        self.main_frame = ttk.Frame(canvas)
        
        self.main_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=self.main_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True, padx=20, pady=20)
        scrollbar.pack(side="right", fill="y")
        
        # Enable mouse wheel scrolling
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        # Header
        header = ttk.Label(self.main_frame, text="🤖 TG-ChatBot Setup", style='Header.TLabel')
        header.pack(pady=(0, 10))
        
        subtitle = ttk.Label(self.main_frame, text="Enter your API keys and click Deploy!", font=('Segoe UI', 10, 'italic'))
        subtitle.pack(pady=(0, 20))
        
        # === Web Setup Button (Recommended) ===
        web_setup_btn = tk.Button(self.main_frame, text="🌐 Open Web Setup (Recommended)",
                                  command=self.open_web_setup,
                                  bg=self.success_color, fg=self.fg_color,
                                  font=('Segoe UI', 11, 'bold'), relief='flat',
                                  cursor='hand2', padx=20, pady=10)
        web_setup_btn.pack(pady=(0, 15))
        
        ttk.Label(self.main_frame, text="OR use local deployment below:",
                 font=('Segoe UI', 10, 'italic')).pack(pady=(0, 15))
        
        # === Cloudflare Section (First) ===
        cf_frame = ttk.LabelFrame(self.main_frame, text="☁️ Cloudflare Configuration", padding=15)
        cf_frame.pack(fill="x", pady=10)
        
        # API Token
        self.create_input_row(cf_frame, "Cloudflare API Token", "cf_api_token",
                             hint="Profile → API Tokens → Create Token (Edit Workers template)", show="•")
        
        # === API Keys Section ===
        api_frame = ttk.LabelFrame(self.main_frame, text="🔑 API Keys", padding=15)
        api_frame.pack(fill="x", pady=10)
        
        # Telegram Token
        self.create_input_row(api_frame, "Telegram Bot Token", "telegram_token", 
                             hint="Get from @BotFather on Telegram")
        
        # Groq API Key
        self.create_input_row(api_frame, "Groq API Key (optional)", "groq_key",
                             hint="Get from console.groq.com/keys (or configure via bot later)", show="•")
        
        # Gemini API Key
        self.create_input_row(api_frame, "Gemini API Key (optional)", "gemini_key",
                             hint="Get from aistudio.google.com/app/apikey (or configure via bot later)", show="•")
        
        # === Access Mode Section ===
        access_frame = ttk.LabelFrame(self.main_frame, text="Access Control", padding=15)
        access_frame.pack(fill="x", pady=10)
        
        self.access_mode = tk.StringVar(value="public")
        
        mode_row = ttk.Frame(access_frame)
        mode_row.pack(fill="x", pady=5)
        
        public_radio = ttk.Radiobutton(mode_row, text="🌍 Public (anyone)", 
                                        variable=self.access_mode, value="public",
                                        command=self.toggle_user_ids)
        public_radio.pack(side="left", padx=(0, 20))
        
        private_radio = ttk.Radiobutton(mode_row, text="🔒 Private (whitelist)",
                                         variable=self.access_mode, value="private",
                                         command=self.toggle_user_ids)
        private_radio.pack(side="left")
        
        # User IDs container (initially hidden)
        self.user_ids_frame = ttk.Frame(access_frame)
        
        ttk.Label(self.user_ids_frame, text="Allowed User IDs (comma-separated):").pack(anchor="w", pady=(10, 5))
        
        self.user_ids_entry = tk.Entry(self.user_ids_frame, font=('Consolas', 10), 
                                        bg=self.entry_bg, fg=self.fg_color,
                                        insertbackground=self.fg_color, width=50)
        self.user_ids_entry.pack(fill="x")
        
        hint = ttk.Label(self.user_ids_frame, text="e.g., 123456789, 987654321", font=('Segoe UI', 9, 'italic'))
        hint.pack(anchor="w")
        
        # === Main Deploy Button ===
        self.deploy_btn = tk.Button(self.main_frame, text="🚀 Deploy to Cloudflare", 
                               command=self.full_deploy,
                               bg=self.button_color, fg=self.fg_color,
                               font=('Segoe UI', 14, 'bold'), relief='flat',
                               cursor='hand2', padx=30, pady=15)
        self.deploy_btn.pack(pady=25)
        
        # Status indicator
        self.status_label = ttk.Label(self.main_frame, text="", style='Status.TLabel')
        self.status_label.pack(pady=(0, 10))
        
        # === Log Output Section (collapsed by default) ===
        self.log_visible = tk.BooleanVar(value=False)
        
        log_toggle = tk.Button(self.main_frame, text="📋 Show Logs", 
                               command=self.toggle_logs,
                               bg=self.accent_color, fg=self.fg_color,
                               font=('Segoe UI', 9), relief='flat', cursor='hand2')
        log_toggle.pack(pady=5)
        self.log_toggle_btn = log_toggle
        
        self.log_frame = ttk.Frame(self.main_frame)
        
        self.log_output = scrolledtext.ScrolledText(self.log_frame, height=12, 
                                                     bg=self.entry_bg, fg=self.fg_color,
                                                     font=('Consolas', 9),
                                                     insertbackground=self.fg_color)
        self.log_output.pack(fill="both", expand=True)
    
    def create_input_row(self, parent, label, attr_name, hint=None, show=None):
        """Create a labeled input row"""
        ttk.Label(parent, text=label).pack(anchor="w")
        
        entry = tk.Entry(parent, font=('Consolas', 10), bg=self.entry_bg, 
                        fg=self.fg_color, insertbackground=self.fg_color, 
                        width=60, show=show if show else "")
        entry.pack(fill="x", pady=(2, 5))
        setattr(self, attr_name, entry)
        
        if hint:
            hint_label = ttk.Label(parent, text=hint, font=('Segoe UI', 9, 'italic'))
            hint_label.pack(anchor="w", pady=(0, 10))
    
    def toggle_user_ids(self):
        """Show/hide user IDs section based on access mode"""
        if self.access_mode.get() == "private":
            self.user_ids_frame.pack(fill="x", pady=10)
        else:
            self.user_ids_frame.pack_forget()
    
    def toggle_logs(self):
        """Toggle log visibility"""
        if self.log_visible.get():
            self.log_frame.pack_forget()
            self.log_toggle_btn.config(text="📋 Show Logs")
            self.log_visible.set(False)
        else:
            self.log_frame.pack(fill="both", expand=True, pady=10)
            self.log_toggle_btn.config(text="📋 Hide Logs")
            self.log_visible.set(True)
    
    def log(self, message):
        """Add message to log output"""
        self.log_output.insert(tk.END, message + "\n")
        self.log_output.see(tk.END)
        self.root.update()
    
    def set_status(self, message, color=None):
        """Update status label"""
        self.status_label.config(text=message)
        if color:
            self.status_label.config(foreground=color)
        self.root.update()
    
    def cf_api_request(self, endpoint, method="GET", data=None):
        """Make a Cloudflare API request"""
        token = self.cf_api_token.get().strip()
        if not token:
            raise ValueError("Cloudflare API Token is required")
        
        url = f"https://api.cloudflare.com/client/v4{endpoint}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        req = urllib.request.Request(url, headers=headers, method=method)
        if data:
            req.data = json.dumps(data).encode('utf-8')
        
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    
    def load_existing_env(self):
        """Load existing .env file if present"""
        env_path = Path(__file__).parent / ".env"
        if env_path.exists():
            try:
                with open(env_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if '=' in line and not line.startswith('#'):
                            key, value = line.split('=', 1)
                            key = key.strip()
                            value = value.strip()
                            
                            if key == "TELEGRAM_TOKEN":
                                self.telegram_token.insert(0, value)
                            elif key == "GROQ_API_KEY":
                                self.groq_key.insert(0, value)
                            elif key == "GEMINI_API_KEY":
                                self.gemini_key.insert(0, value)
                            elif key == "CF_API_TOKEN":
                                self.cf_api_token.insert(0, value)
                            elif key == "CF_ACCOUNT_ID":
                                self.detected_account_id = value
                            elif key == "CF_KV_NAMESPACE_ID":
                                self.detected_kv_id = value
                            elif key == "ACCESS_MODE":
                                self.access_mode.set(value)
                                self.toggle_user_ids()
                            elif key == "ALLOWED_USER_IDS":
                                self.user_ids_entry.insert(0, value)
                self.set_status("✓ Loaded existing configuration", self.success_color)
            except Exception as e:
                self.log(f"⚠️ Error loading .env: {e}")
    
    def open_web_setup(self):
        """Open web setup tool in browser"""
        import webbrowser
        webbrowser.open("https://s-alireza.github.io/TG-ChatBot/")
        self.log("🌐 Opening Web Setup Tool in your browser...")
    
    def validate_inputs(self):
        """Validate required inputs"""
        errors = []
        
        if not self.telegram_token.get().strip():
            errors.append("Telegram Bot Token is required")
        if not self.cf_api_token.get().strip():
            errors.append("Cloudflare API Token is required")
        
        if self.access_mode.get() == "private":
            user_ids = self.user_ids_entry.get().strip()
            if not user_ids:
                errors.append("At least one User ID is required for private mode")
            else:
                for uid in user_ids.split(','):
                    uid = uid.strip()
                    if uid and not uid.isdigit():
                        errors.append(f"Invalid User ID: {uid} (must be numeric)")
        
        return errors
    
    def full_deploy(self):
        """Complete deployment flow: detect → save → deploy → webhook"""
        errors = self.validate_inputs()
        if errors:
            messagebox.showerror("Missing Information", "\n".join(errors))
            return
        
        # Disable button during deployment
        self.deploy_btn.config(state='disabled', text="⏳ Deploying...")
        
        # Show logs automatically during deployment
        if not self.log_visible.get():
            self.toggle_logs()
        
        def run_full_deploy():
            try:
                # Step 1: Detect Cloudflare configuration
                self.set_status("🔍 Detecting Cloudflare account...", self.fg_color)
                self.log("\n" + "="*50)
                self.log("Step 1: Detecting Cloudflare configuration...")
                
                if not self.detect_cf_sync():
                    self.deploy_btn.config(state='normal', text="🚀 Deploy to Cloudflare")
                    return
                
                # Step 2: Save configuration
                self.set_status("💾 Saving configuration...", self.fg_color)
                self.log("\nStep 2: Saving configuration...")
                
                if not self.save_configuration():
                    self.deploy_btn.config(state='normal', text="🚀 Deploy to Cloudflare")
                    return
                
                # Step 3: Install dependencies if needed
                project_dir = Path(__file__).parent
                node_modules = project_dir / "node_modules"
                if not node_modules.exists():
                    self.set_status("📦 Installing dependencies...", self.fg_color)
                    self.log("\nStep 3: Installing npm dependencies...")
                    result = subprocess.run(
                        ["npm", "install"],
                        cwd=project_dir,
                        capture_output=True,
                        text=True,
                        shell=True,
                        encoding='utf-8',
                        errors='replace'
                    )
                    if result.returncode != 0:
                        self.log(f"❌ npm install failed:\n{result.stderr}")
                        self.set_status("❌ Dependency installation failed", self.button_color)
                        self.deploy_btn.config(state='normal', text="🚀 Deploy to Cloudflare")
                        return
                    self.log("✅ Dependencies installed")
                
                # Step 4: Deploy to Cloudflare
                self.set_status("📤 Deploying to Cloudflare Workers...", self.fg_color)
                self.log("\nStep 4: Deploying to Cloudflare Workers...")
                
                result = subprocess.run(
                    ["npx", "wrangler", "deploy", "-c", "wrangler.local.toml"],
                    cwd=project_dir,
                    capture_output=True,
                    text=True,
                    shell=True,
                    encoding='utf-8',
                    errors='replace'
                )
                
                output = result.stdout + result.stderr
                self.log(output)
                
                if result.returncode != 0:
                    self.set_status("❌ Deployment failed", self.button_color)
                    self.deploy_btn.config(state='normal', text="🚀 Deploy to Cloudflare")
                    return
                
                self.log("✅ Deployment successful!")
                
                # Manual Activation Instructions
                self.log("\n" + "="*50)
                self.log("🎉 Deployment Complete!")
                self.log("")
                self.log("📋 TO ACTIVATE YOUR BOT:")
                self.log("1. Go to: dash.cloudflare.com/workers")
                self.log("2. Click on 'tg-chatbot' worker")
                self.log("3. Click the 'Visit' button at the top")
                self.log("")
                self.log("⏰ IMPORTANT: New workers take 2-5 minutes to go online.")
                self.log("   If you see an error, wait 1-2 mins and try again.")
                self.log("")
                self.log("✅ SUCCESS: You'll see 'Webhook Set Successfully ✅' when ready!")
                
                # Done!
                self.set_status("✅ Bot deployed! Follow instructions above to activate.", self.success_color)
                
            except Exception as e:
                self.log(f"❌ Error: {e}")
                self.set_status("❌ Deployment failed", self.button_color)
            finally:
                self.deploy_btn.config(state='normal', text="🚀 Deploy to Cloudflare")
        
        thread = threading.Thread(target=run_full_deploy)
        thread.start()
    
    def detect_cf_sync(self):
        """Detect Cloudflare account and KV (synchronous)"""
        try:
            # Get Account ID
            result = self.cf_api_request("/accounts?page=1&per_page=5")
            
            if not result.get("success") or not result.get("result"):
                self.log("❌ Failed to get Cloudflare account info")
                self.set_status("❌ Invalid Cloudflare API Token", self.button_color)
                return False
            
            account = result["result"][0]
            self.detected_account_id = account["id"]
            self.log(f"✅ Account found: {account.get('name', 'Unknown')}")
            
            # Check for existing KV namespace or create one
            kv_result = self.cf_api_request(f"/accounts/{self.detected_account_id}/storage/kv/namespaces")
            
            if kv_result.get("success"):
                namespaces = kv_result.get("result", [])
                
                # Look for existing TG_BOT_KV namespace
                existing = None
                for ns in namespaces:
                    if ns.get("title") == "TG_BOT_KV":
                        existing = ns
                        break
                
                if existing:
                    self.detected_kv_id = existing["id"]
                    self.log(f"✅ Using existing KV namespace: TG_BOT_KV")
                else:
                    # Create new namespace
                    self.log("📦 Creating KV namespace...")
                    create_result = self.cf_api_request(
                        f"/accounts/{self.detected_account_id}/storage/kv/namespaces",
                        method="POST",
                        data={"title": "TG_BOT_KV"}
                    )
                    
                    if create_result.get("success"):
                        self.detected_kv_id = create_result["result"]["id"]
                        self.log("✅ Created new KV namespace: TG_BOT_KV")
                    else:
                        self.log(f"❌ Failed to create KV namespace")
                        return False
            
            return True
            
        except urllib.error.HTTPError as e:
            self.log(f"❌ API Error: {e.code}")
            self.set_status("❌ Cloudflare API error", self.button_color)
            return False
        except Exception as e:
            self.log(f"❌ Error: {e}")
            return False
    
    def save_configuration(self):
        """Save configuration to .env and generate wrangler.toml"""
        config = {
            "TELEGRAM_TOKEN": self.telegram_token.get().strip(),
            "GROQ_API_KEY": self.groq_key.get().strip(),
            "GEMINI_API_KEY": self.gemini_key.get().strip() or "",
            "CF_API_TOKEN": self.cf_api_token.get().strip(),
            "CF_ACCOUNT_ID": self.detected_account_id,
            "CF_KV_NAMESPACE_ID": self.detected_kv_id,
            "ACCESS_MODE": self.access_mode.get(),
            "ALLOWED_USER_IDS": self.user_ids_entry.get().strip().replace(" ", "")
        }
        
        # Save .env file
        env_path = Path(__file__).parent / ".env"
        try:
            with open(env_path, 'w') as f:
                f.write("# TG-ChatBot Configuration\n")
                f.write("# Generated by setup.py\n\n")
                for key, value in config.items():
                    f.write(f"{key}={value}\n")
            self.log("✅ Saved .env file")
        except Exception as e:
            self.log(f"❌ Failed to save .env: {e}")
            return False
        
        # Generate wrangler.local.toml (for local deployment with secrets)
        wrangler_path = Path(__file__).parent / "wrangler.local.toml"
        try:
            wrangler_content = f'''name = "tg-chatbot"
compatibility_date = "2024-01-01"
account_id = "{config['CF_ACCOUNT_ID']}"
main = "src/index.ts"

[[kv_namespaces]]
binding = "TG_BOT_KV"
id = "{config['CF_KV_NAMESPACE_ID']}"

[vars]
TELEGRAM_TOKEN = "{config['TELEGRAM_TOKEN']}"
GEMINI_API_KEY = "{config['GEMINI_API_KEY']}"
GROQ_API_KEY = "{config['GROQ_API_KEY']}"
ACCESS_MODE = "{config['ACCESS_MODE']}"
ALLOWED_USER_IDS = "{config['ALLOWED_USER_IDS']}"
'''
            with open(wrangler_path, 'w') as f:
                f.write(wrangler_content)
            self.log("✅ Generated wrangler.toml")
        except Exception as e:
            self.log(f"❌ Failed to generate wrangler.toml: {e}")
            return False
        
        return True
    
    def parse_worker_url(self, output):
        """Parse the worker URL from wrangler deploy output"""
        import re
        patterns = [
            r'https://[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.workers\.dev',
            r'https://[a-zA-Z0-9-]+\.workers\.dev'
        ]
        for pattern in patterns:
            match = re.search(pattern, output)
            if match:
                return match.group(0)
        return None
    
    def auto_set_webhook(self, worker_url):
        """Automatically set the Telegram webhook via the worker"""
        setup_url = f"{worker_url}/setup-webhook"
        self.log(f"   Calling: {setup_url}")
        
        try:
            with urllib.request.urlopen(setup_url, timeout=30) as response:
                result = json.loads(response.read().decode())
                
            if result.get("success"):
                self.log("✅ Webhook configured successfully!")
            else:
                self.log(f"⚠️ Webhook setup returned: {result.get('error', 'Unknown')}")
                self.log(f"   Visit {setup_url} in your browser to set it manually")
                
        except Exception as e:
            self.log(f"⚠️ Could not auto-set webhook: {e}")
            self.log(f"   Visit {setup_url} in your browser to set it manually")


def main():
    root = tk.Tk()
    app = SetupApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
