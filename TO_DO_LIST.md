# 🚀 PawPal Insights: Deployment & Infrastructure To-Do List

This document outlines the roadmap for migrating from OpenAI to your own self-hosted AI, setting up security, and building management tools.

### ⚠️ Important Note on OpenAI
**OpenAI is NOT free for life.** It is a pay-per-use service with no free tier for API calls once initial trial credits (usually $5-$18) expire. Using Ollama on your own 8GB RAM AWS server is the best way to achieve **unlimited analysis** at a fixed hardware cost.

---

## 🏗️ 1. Infrastructure & AI Setup (AWS + Ollama)
Goal: Replace OpenAI with a self-hosted vision model on your 8GB RAM server.

- [ ] **Install Ollama on AWS**:
  - Run `curl -fsSL https://ollama.com/install.sh | sh`
- [ ] **Deploy Vision Model**:
  - Run `ollama run llava` (The 7B model is recommended for 8GB RAM).
- [ ] **Expose AI API**:
  - Install Nginx: `sudo apt install nginx`
  - **Configure Reverse Proxy**:
    - Create config: `sudo nano /etc/nginx/sites-available/ollama`
    - **Paste this content** (Using Port 9696):
      ```nginx
      server {
          listen 9696;
          server_name _; # Accepts all IP/Domains on this port

          location / {
              proxy_pass http://localhost:11434;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          }
      }
      ```
    - Enable site: `sudo ln -sf /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/`
    - **Test & Restart**: `sudo nginx -t && sudo systemctl restart nginx`
  - **Security**: Set up a custom header check or API key in Nginx so only your Supabase Functions can talk to the server.
- [x] **Connect Supabase to AWS**:
  - Update `analyze-pet-mood` Edge Function to call your AWS public IP/Domain instead of OpenAI.

## 🛡️ 2. Security & DDoS Mitigation
Goal: Protect your server and user data from attacks.

- [ ] **Cloudflare Configuration**:
  - Point your new domain's DNS to Cloudflare.
  - Enable the **Proxy (Orange Cloud)** to hide your real AWS IP address.
  - Set up "WAF" (Web Application Firewall) rules to block suspicious traffic.
- [ ] **Server Hardening**:
  - **UFW Firewall**: `sudo ufw allow 80, 443, 22/tcp` then `sudo ufw enable`.
  - **Fail2Ban**: Install to auto-ban IPs that try to guess your SSH password.
  - **SSL Certification**: Use `certbot` to enable HTTPS (SSL) on your AWS server.
- [ ] **Rate Limiting**:
  - Configure Nginx to limit how many requests one user can make per minute.

## 📊 3. Web Management Dashboard (Admin CMS)
Goal: A web interface to manage users, plans, and pet data.

- [ ] **Dashboard Framework**:
  - Create a separate Next.js or Vite project specifically for admin use.
- [ ] **Key Features**:
  - **User & Plan Management**: View and edit user subscription tiers.
  - **Analytics**: See daily usage stats (how many pets analyzed today).
  - **Direct DB Access**: Use Supabase's built-in "Table Editor" as a temporary CMS.

## 🔍 4. SOC & Monitoring Tool
Goal: Real-time visibility into server health and logs.

- [ ] **Logging Dashboard**:
  - **Better Stack (Logtail)**: Connect your server logs to a visual dashboard for easy debugging.
- [ ] **Uptime Alerts**:
  - Set up **Better Uptime** to call/email you if the AWS server or AI service stops responding.
- [ ] **SOC Dashboard**:
  - Install **Wazuh** (Open Source) if you want a professional-grade SOC dashboard to monitor threats across your server.

---

## 💰 5. Mobile Payment Integration (In-App Purchases)
Goal: Enable native subscription payments via Apple App Store and Google Play Store.

- [x] **Capacitor Purchases Plugin**:
  - Install `cordova-plugin-purchase` or `revenuecat` (recommended for easier management).
  - **RevenueCat** is highly recommended for cross-platform subscription syncing.
  - **Get API Keys:**
    1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/) > **Project Settings** > **API Keys**.
    2. Click **Create new Public API Key**.
    3. Name it "Android" (or iOS) and copy the key (starts with `goog_` or `appl_`).
    4. Add them to `.env`: `VITE_REVENUECAT_ANDROID_KEY=...`
- [ ] **Store Setup**:
- **Google Play Console Setup**:
    1. **Create Merchant Account**:
       - Go to **Setup** > **Payments profile** in Play Console.
       - Click "Create payments profile" and enter business details.
       - **MCC (Merchant Category Code)**: Select **"Computer Software Stores" (5734)** or **"Digital Goods – Applications"**.
       - **LEI**: Leave blank (not required for individuals/small devs).
       - **Website**: Use your landing page URL (or temporary Netlify link).
       - *Note: Verification may take 24-48 hours.*
    2. **Create Subscription**:
       - Go to **Monetize** > **Products** > **Subscriptions**.
       - Click "Create subscription".
       - **Product ID**: Use something consistent like `pawmood_pro_monthly`.
    3. **Configure Base Plan**:
       - Inside the subscription, click "Add base plan".
       - Select **Auto-renewing**.
       - Set **Billing period** (e.g., Monthly) and **Price**.
       - Click **Activate** to enable it for testing.
  - **App Store Connect**: Create In-App Purchase products, set up tax/banking info.
- [ ] **Backend Integration**:
  - Set up Webhooks (from RevenueCat or Stores) to update the User's plan in Supabase automatically.

## 🛠️ Immediate Next Steps (Priority)
1. [ ] Buy your domain name.
2. [ ] Install Ollama on your 8GB AWS instance.
3. [ ] Set up Cloudflare and point it to your AWS server.
