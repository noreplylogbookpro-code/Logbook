# Logbook Plus — Modern Expense Intelligence

Logbook Plus is a local-first, zero-vendor-lock expense intelligence system. It combines client-side encrypted backups, multi-policy storage, and seamless sync capabilities, all hosted on your private cloud.

---

## 🚀 Key Features

- **Local-First & Encrypted**: All expense data is stored locally first, with end-to-end client-side encryption.
- **Redundancy & Sync**: Back up to a private cloud server with support for multi-policy storage and atomic JSON data persistence.
- **Self-Hostable Node.js Server**: Modular Express backend with core router extraction to `api.js` and global middlewares (compression, rate limiting, CORS, session management) defined in `server.js`.
- **Zero-Dependency Native SMTP Client & Email Service**:
  - Implements direct TLS (Port 465) and STARTTLS (Port 587/25) over native Node.js `tls`/`net` sockets without external runtime dependencies.
  - Full support for AUTH LOGIN (Base64) authentication, Gmail App Passwords (with automatic whitespace stripping and sender enforcement), and custom mail domains.
  - Generates branded, responsive HTML verification templates with single-use OTP codes and expiry notices.
  - Real-time connection & authentication health check endpoint (`GET /api/system/email-status`).
- **Account Deletion Flow with OTP & Multi-Factor Security**:
  - Secure self-service account termination workflow under user settings (`/user/delete-account/request-otp`, `/resend-otp`, `/confirm`).
  - Dispatches single-use 6-digit OTP codes with 10-minute validity and attempt throttling.
  - Multi-tiered authorization based on account configuration:
    - **TOTP 2FA**: Requires active 6-digit authenticator code if two-factor is enabled.
    - **Security Question**: Requires correct hashed answer check via bcrypt if configured.
    - **Password**: Fallback authorization check if no secondary factor is active.
  - Purges user profile records, 2FA credentials, and cloud backups (`uploads/<userId>/`).
  - Dedicated **Account Deletion Policy** page (`/account-deletion-policy`) and footer navigation links.
- **Telegram Bot Developer Notes Integration**:
  - Background polling listener and webhook endpoint (`POST /api/telegram/webhook`) for remote administrator broadcasts.
  - Supports quick-pipe syntax (`/devnote Title | Message | Badge | URL`) and multiline formats.
  - Commands include status inspection (`/devnote status`), temporary disabling (`/devnote off`), and re-enabling (`/devnote on`).
  - Strict chat authorization and admin whitelist validation.
  - Broadcasts live updates immediately across the Android App and Web Vault via `GET /api/developer-note`.
- **Strict Security Sanitization & Server Log Masking**:
  - Defense-in-depth sanitization in `logServerEvent` (`utils/logger.js`).
  - Plaintext 6-digit OTP codes and authentication credentials are automatically masked (`[REDACTED]`) before being written to console or `database/server_logs.json`.
  - Raw HTML email markup, MIME headers, and message bodies are scrubbed from server logs.
  - User emails are consistently masked in operational logs (e.g., `u****r@example.com`).
  - Safe SMTP timeout descriptors (`[EMAIL_CONTENT_PAYLOAD]`, `DATA`, `AUTH`) prevent credential/data leaks on network timeouts.
- **Real-Time User Online Status & Immediate Logout Cleanup**:
  - Active session tracking (`utils/serverState.js`) evaluates user activity across API requests.
  - Real-time `isOnline` indicators in the Master Dashboard (`GET /api/master/users`).
  - Guaranteed immediate offline state transition upon user logout (`POST /api/logout`).
- **At-Rest Database Encryption (2FA)**:
  - User and master TOTP secrets (`twoFactorSecret`, `tempTwoFactorSecret`) and replay-prevention sequence counters (`lastUsedTOTPCounter`) are encrypted with `AES-256-CBC`.
  - Transparent startup migration routine automatically encrypts existing plain-text values on boot.
- **Flat File JSON Databases**:
  - Application configurations, subscriber status, complaint tickets, and self-hosted licenses are stored in clean, editable JSON under `database/`.
- **Self-Hosted License Management**:
  - Master administrators can generate, revoke, and extend self-hosted cryptographic licenses with on-the-fly signed JWT key regeneration.
- **Developer Portal & Interactive API Hub (`/dev-portal`)**:
  - Interactive live request execution with payload parsing and status indicators.
  - Multi-language code generator for **Kotlin Multiplatform (KMP), Java, Swift, JavaScript/Node.js, Python, Go, and cURL**.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Lucide React, React Markdown
- **Backend**: Node.js & Express 5 (with Gzip `compression`, Rate Limiting, and CORS)
- **Email Delivery**: Native SMTP Socket Transport (`tls`/`net`, STARTTLS, SSL, AUTH LOGIN)
- **Telegram Integration**: Telegram Bot Webhook & Long-Polling Engine (`https`, `crypto`)
- **Database**: Flat-file JSON database engine (`database/server_users.json`, `database/server_logs.json`, `database/server_2fa.json`, `database/server_licenses.json`, `database/server_developer_notes.json`, `database/tickets_*.json`) with atomic writes and startup field encryption
- **Security & Auth**: AES-256-CBC field & file encryption, JWT (JSON Web Tokens), BcryptJS password hashing, Express Rate Limit, Speakeasy-compatible TOTP MFA with replay defense, and automatic log sanitization

---

## 📁 Project Structure

```text
├── assets/                  # CSS, JS, and optimized WebP image brand assets
├── config/                  # Database configuration and connection setup (db.js)
├── controllers/             # API route handlers and ticket controller logic
├── database/                # Flat JSON datastores (Users, Logs, 2FA, Licenses, Dev Notes)
├── google_auth/             # Directory for Google Play Service Account JSON key
├── middleware/              # JWT, Master, and Super Admin auth middlewares
├── public/                  # Public static assets, helpdesk, and master templates
├── routes/                  # Modular express route definitions (tickets, auth)
├── scripts/                 # Build, maintenance & automated test suites
│   ├── test-logout-and-account-delete.js  # Online tracking & account deletion tests
│   ├── test-resend-and-email.js           # Native SMTP & OTP resend tests
│   ├── test-telegram-devnote.js           # Telegram bot remote devnote tests
│   ├── verify-all-apis.js                 # Complete 26-endpoint regression suite
│   ├── reset-master-2fa.js                # Emergency Master 2FA reset script
│   └── convert-images.js                  # Image optimization pipeline
├── src/                     # Modern React + Vite frontend source
│   ├── components/          # UI Components (DashboardView, MasterView, DevPortalView, etc.)
│   ├── hooks/               # Custom React hooks (useTheme, useLanguage)
│   ├── dictionary.json      # Localization translation dictionary
│   ├── index.css            # Tailwind & unified custom CSS styling
│   └── App.jsx              # Main React SPA routing and state management
├── utils/                   # Shared utility modules
│   ├── emailService.js      # Zero-dependency native SMTP email client
│   ├── telegramBotService.js# Telegram bot command handler & polling engine
│   ├── logger.js            # Sanitized logging engine with OTP & HTML redaction
│   ├── serverState.js       # User online activity & memory state management
│   └── dbHelper.js          # Flat-file database helpers and license management
├── uploads/                 # User uploaded files and profile avatars
├── .env                     # Configuration file for environment variables
├── api.js                   # Modularized API controller & routes mounting
├── server.js                # Core Express backend application & global middleware
├── vite.config.js           # Vite build and dev server configuration
└── package.json             # Node dependencies and scripts
```

---

## ⚙️ Configuration (`.env`)

Configure your environment variables in `.env`:

```env
PORT=8080                                      # Port for Express backend server
QUOTA_LIMIT=104857600                          # Storage limit quota per user in bytes (Default: 100 MB)

# Master & Admin Credentials
MASTER_USER=admin                              # Master username for admin dashboard
MASTER_PASS=your-secure-password               # Master password (change before deploying!)
SUPER_ADMIN_USER=master                        # Super admin username
SUPER_ADMIN_PASS=your-super-admin-password     # Super admin password
DISABLE_MASTER_2FA=false                       # Set to true to temporarily bypass Master 2FA

# Flat JSON Databases
DB=database/server_users.json                  # User records datastore
LOGS_DB=database/server_logs.json              # Server event logs datastore
CHANGELOG_DB=database/server_changelog.json    # Changelog entries datastore
LICENSES_DB=database/server_licenses.json      # Self-hosted cryptographic licenses datastore
TWOFACTOR_DB=database/server_2fa.json          # 2FA secrets datastore
DEVNOTES_DB=database/server_developer_notes.json # Developer notes datastore

# Security, Sessions & Encryption
SESSION_SECRET=your-random-session-secret      # Secret key for Express sessions
JWT_SECRET=your-random-jwt-secret              # Secret key used for signing JWTs
DB_ENCRYPTION_KEY=your-32-byte-base64-key      # AES-256-CBC key for encrypting 2FA secrets at rest
FILE_ENCRYPTION_KEY=your-32-byte-base64-key    # AES-256-CBC key for encrypting uploaded files
SECURE_COOKIE=false                            # Set to true ONLY when serving over HTTPS

# SMTP Email Service Configuration
SMTP_HOST=smtp.gmail.com                       # SMTP host (e.g., smtp.gmail.com)
SMTP_PORT=587                                  # SMTP port (587 for STARTTLS, 465 for SSL)
SMTP_USER=your-email@gmail.com                 # SMTP authentication username
SMTP_PASS=your-app-password                    # SMTP app password (spaces auto-stripped for Gmail)
SMTP_FROM="Logbook Plus Security" <your-email@gmail.com> # Sender display name and email address
SMTP_SECURE=false                              # true for Port 465 SSL; false for Port 587 STARTTLS

# Telegram Bot Developer Notes Integration (Optional)
DEVNOTE_TELEGRAM_BOT_TOKEN=                    # Telegram Bot token for Developer Notes
DEVNOTE_TELEGRAM_BOT_CHAT_ID=                  # Authorized Telegram Chat ID
TELEGRAM_ADMIN_CHAT_IDS=                       # Comma-separated list of authorized chat/user IDs

# Android App / Google Play Billing Verification
GOOGLE_PLAY_PACKAGE_NAME=com.logbookplus       # Android package name
SERVICE_ACCOUNT_KEY_PATH=google_auth/key.json  # Path to Google Play Service Account JSON key
```

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later recommended
- **npm**: v8.0.0 or later

### 2. Installation
```bash
npm install
```

### 3. Running in Development Mode
Start both the Express backend API and the Vite frontend dev server concurrently:
```bash
npm run dev
```
* **Frontend (Vite HMR)**: `http://localhost:3000`
* **Backend API Server**: `http://localhost:8080`

> **Tip:** You can also run the servers individually:
> * `npm run server` — Runs the Express backend only.
> * `npm run client` — Runs the Vite frontend development server only.

### 4. Running Automated Tests
Run the comprehensive verification suites:
```bash
# Full 26-endpoint API regression suite
node scripts/verify-all-apis.js

# Real-time logout online status & multi-factor account deletion tests
node scripts/test-logout-and-account-delete.js

# Native SMTP client & OTP resend diagnostics tests
node scripts/test-resend-and-email.js

# Telegram Bot developer notes remote command tests
node scripts/test-telegram-devnote.js
```

### 5. Building for Production
```bash
npm run build
```
This executes `vite build` followed by `scripts/post-build.js` to bundle assets and sync production files.

### 6. Production Deployment
```bash
npm run deploy
```

---

## 🛠️ Maintenance & CLI Utility Scripts

* **Reset Master 2FA**: If locked out of Master dashboard 2FA, reset the secret key directly via CLI:
  ```bash
  node scripts/reset-master-2fa.js
  ```
* **Verify SMTP Mail Status**: Check active email credentials and socket connection:
  ```bash
  curl http://localhost:8080/api/system/email-status
  ```
* **Image Compression**: Re-compress brand and blog imagery to optimized WebP:
  ```bash
  node scripts/convert-images.js
  ```
* **Extract Localization Dictionary**: Sync and extract UI translation keys to `dictionary.json`:
  ```bash
  node scripts/extract-dictionary.js
  ```

---

## 🔒 Security & Privacy Guarantees

- **OTP & Sensitive Token Masking**: Plaintext 6-digit OTP codes, passwords, and sensitive tokens are permanently shielded from terminal stdout and server log storage (`database/server_logs.json`).
- **MIME & HTML Email Payload Scrubbing**: HTML email bodies and MIME templates are filtered out of logs to ensure zero log exposure.
- **Email Masking**: Operational logs mask recipient email addresses (e.g. `u****r@example.com`).
- **At-Rest Field Encryption**: User and admin secret keys are never stored in plain text inside `server_users.json`. They are encrypted using `AES-256-CBC` with custom IV vectors.
- **TOTP Replay Prevention**: Speakeasy validation tracks token validation counters dynamically (stored encrypted) to block token replay attacks.
- **Log Isolation & Sliding Window**: System logs are stored in a dedicated database (`server_logs.json`), automatically pruned to a sliding window of the last 500 events to prevent disk exhaustion.
- **Rate Limiting**: Applied on all sensitive login, signup, OTP request, username check, and verification routes.

---

## 📜 Release Notes & Changelog

### Version 2.3.0 "Security Hardening & Communication Channels" 🛡️✉️
* **Zero-Dependency Native SMTP Client**:
  * Implemented pure Node.js socket transport supporting STARTTLS (Port 587) and Direct TLS (Port 465).
  * Auto-sanitizes Gmail App Passwords and enforces sender compliance.
  * Added live delivery diagnostic checks and "Resend Email" capabilities in User Dashboard.
* **Account Deletion & Data Privacy**:
  * Added multi-step account termination with single-use OTP verification.
  * Added secondary authorization requiring TOTP 2FA, security question check, or password verification.
  * Dedicated Account Deletion Policy page and footer navigation.
* **Server Log Sanitization**:
  * Zero-leak log policy: automated redaction of OTP codes (`[REDACTED]`), email masking, and stripping of raw HTML payloads.
* **Telegram Bot Remote Developer Notes**:
  * Added background polling and webhook endpoints to manage live site announcements directly from Telegram.
* **Real-Time User Online Tracking**:
  * Immediate offline status transition upon user logout.
  * Systems Status cleanly retired from the user experience.

### Version 2.2.0 "Developer Hub & Unified Design" 🚀⚡
* **Interactive Developer Portal (`/dev-portal`)**:
  * Unified header bar and sliding navigation drawer synchronized with Master Portal.
  * Card layouts expanded to provide optimal space for documentation reading and API exploration.
  * Interactive Request Runner with live response status indicators, error handling, and payload parsing.
  * Multi-language code generators for **Kotlin Multiplatform (KMP)**, **Java**, **Swift**, **JavaScript (Fetch/Node.js)**, **Python**, **Go**, and **cURL**.
* **Billing & Pricing Architecture**:
  * Dynamic pricing configuration endpoint (`/api/pricing`) supporting monthly and yearly discount tiers.
  * Google Play Billing v9 receipt verification integration.
* **Security & Performance**:
  * 2FA database encryption with zero-downtime startup migration.
  * Automated WebP compression pipeline with asset transfer bandwidth savings over 70%.