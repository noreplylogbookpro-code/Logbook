# Logbook Plus — Modern Expense Intelligence

Logbook Plus is a local-first, zero-vendor-lock expense intelligence system. It combines client-side encrypted backups, multi-policy storage, and seamless sync capabilities, all hosted on your private cloud.

---

## 🚀 Key Features

- **Local-First & Encrypted**: All your expense data is stored locally first, with end-to-end client-side encryption.
- **Redundancy & Sync**: Back up to a private cloud server with support for multi-policy storage.
- **Self-Hostable Node.js Server**: Modular Express backend with core router extraction to `api.js` and global middlewares (like CORS, body parser) defined in `server.js`.
- **At-Rest Database Encryption (2FA)**: All user and master TOTP secrets (`twoFactorSecret`, `tempTwoFactorSecret`) and replay-prevention sequence counters (`lastUsedTOTPCounter`) are fully encrypted in the database using `AES-256-CBC` encryption. Includes a transparent startup migration routine to automatically encrypt existing plain-text values on boot.
- **Flat File JSON Databases**: Application configurations, subscriber status, complaint tickets, and self-hosted licenses are stored in clean, editable JSON format under the `database/` directory.
- **Self-Hosted License Management**:
  - Master administrators can generate and revoke self-hosted cryptographic licenses.
  - Features an **Extend License** capability to extend expiration dates directly from the Master dashboard through a custom UI modal dialog/card overlay (regenerating signed JWT keys on-the-fly).
- **High-Performance Asset Optimization**:
  - Main brand logo and blog hero images are compressed to WebP format, achieving a **~4.3 MB (88%) size reduction** on disk.
  - Translation dictionary extracted from React bundle code to an external static `dictionary.json` file for code-splitting and independent compression.
  - Server-side **Gzip / Deflate compression middleware** enabled on all assets, reducing network transfer sizes by 60-70%.
- **Adaptive Mobile Layouts**:
  - The **Master Control Admin Dashboard** features a responsive sliding navigation drawer activated by a 3-line hamburger menu button on mobile/small devices, using fluid Framer Motion spring animations.
  - User and master dashboards feature responsive fluid container paddings (`px-4 md:px-8 lg:px-12`) and card margins (`p-4 sm:p-6`) to prevent squished layouts on mobile screens.
- **Profile Customization**: Users can select one of the 9 preset theme icon options or upload a custom image file as their profile picture. Includes an offline cleanup sequence that manages system file storage and wipes outdated profile pictures when resetting back to a preset.
- **Double-Layered 2FA Security**: Multi-factor authentication with QR code generation and copy-paste raw secret key fallback support on both user and master accounts.
- **Dynamic Pricing API & Toggle**: Features a dynamic pricing configuration parser endpoint (`/api/pricing`) integrated with a Monthly/Yearly plan selector on the frontend landing/billing page.
- **Admin Control Deck**: Built-in master admin area for system configuration, user plans, licensing configuration, and database logs.

---

## 🛠️ Tech Stack

- **Frontend**: React, TailwindCSS, Framer Motion, Lucide React
- **Backend**: Node.js & Express (with Gzip `compression` middleware)
- **Database**: NeDB (embedded datastores `server_users.db` and `server_logs.db`, fully separated and compacted) + Flat JSON stores under `database/` (`users_*.json`, `tickets_*.json`, `subscriptions.json`, `licenses.json`)
- **Security & Auth**: AES-256-CBC, JWT, BcryptJS, Express Rate Limit, TOTP (Speakeasy-compatible custom verification)

---

## 📁 Project Structure

```text
├── assets/                  # CSS, JS, and optimized WebP image brand assets
├── config/                  # Database configuration and connection setup
├── database/                # Flat JSON database directory (Tickets, Users, Licenses, Subs)
├── google_auth/             # Directory for Google Play Service Account JSON key
├── middleware/              # JWT and Master auth middlewares
├── public/                  # Frontend HTML/CSS/JS (Landing page, Dashboard, Pricing, Terms)
│   ├── app/                 # User App & Dashboard
│   ├── master/              # Admin/Master Dashboard
│   ├── pricing/             # Pricing pages
│   └── index.html           # Landing Page
├── utils/                   # Shared utility modules (logger, serverState, dbHelper)
├── .env                     # Configuration file for environment variables
├── api.js                   # Modularized API controller & routes mounting
├── server.js                # Core Express backend application & global middleware
└── package.json             # Node dependencies and scripts
```

---

## ⚙️ Configuration (`.env`)

Before running the server, configure the environment variables in `.env`:

```env
PORT=8080                                      # Port for the Node.js server to listen on
QUOTA_LIMIT=251658240                          # Storage limit quota per user in bytes (Default: 240 MB)
MASTER_USER=admin                              # Master username for the admin dashboard
MASTER_PASS=your-secure-password               # Master password (change before deploying!)
DB=server_users.db                             # NeDB database filename
SESSION_SECRET=your-random-session-secret      # Secret key for Express sessions
JWT_SECRET=your-random-jwt-secret              # Secret key used for signing JWTs
NODE_ENV=production                            # Node environment (development / production)
SECURE_COOKIE=false                            # Set to true ONLY when serving over HTTPS
DB_ENCRYPTION_KEY=your-db-encryption-key       # (Optional) AES key for encrypting 2FA secrets at rest

# Android App / Google Play Billing
GOOGLE_PLAY_PACKAGE_NAME=com.logbookplus       # Android package name
SERVICE_ACCOUNT_KEY_PATH=google_auth/key.json  # Path to Google Play Service Account JSON key
```

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- npm

### 2. Installation
Install project dependencies:
```bash
npm install
```

### 3. Run the Development Server
Start the server in development mode:
```bash
npm run dev
```
The server will start at `http://localhost:8080`.

### 4. Production Deployment
When deploying behind a reverse proxy (e.g. Nginx, Cloudflare):
1. Change `MASTER_PASS`, `SESSION_SECRET`, and `JWT_SECRET` in your `.env` file to strong random strings.
2. Set `SECURE_COOKIE=true` in `.env` to enable secure session cookies.
3. Ensure HTTPS is properly configured on your proxy.

---

## 🔒 Security

- **At-Rest Field Encryption**: User and admin secret keys are never stored in plain text inside `server_users.db`. They are encrypted using `AES-256-CBC` with custom IV vectors.
- **TOTP Replay Prevention**: The speakeasy validation tracks token validation counters dynamically (stored encrypted) to block token replay attacks.
- **Log Isolation**: System logs are stored in a dedicated database `server_logs.db`, automatically pruned to a sliding window of the last 500 events to prevent host system disk exhaustion.
- **Rate Limiting**: Applied on all sensitive login, signup, username check, and verification routes.
