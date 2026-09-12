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
- **Developer Portal & Interactive API Hub**: Full-featured developer portal (`/dev-portal`) featuring interactive live request execution, language-aware code generator supporting **Kotlin Multiplatform (KMP), Java, Swift, JavaScript/Node.js, Python, Go, and cURL**, unified sliding drawer navigation, and responsive typography optimized for both desktop and mobile screens.
- **Admin Control Deck**: Built-in master admin area for system configuration, user plans, licensing configuration, and database logs.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Lucide React, React Markdown
- **Backend**: Node.js & Express 5 (with Gzip `compression` middleware, Rate Limiting, and CORS)
- **Database**: Flat-file JSON database engine (`database/server_users.json`, `database/server_logs.json`, `database/server_2fa.json`, `database/server_licenses.json`, `database/server_changelog.json`, `database/tickets_*.json`) with atomic writes and automated startup field encryption
- **Security & Auth**: AES-256-CBC field & file encryption, JWT (JSON Web Tokens), BcryptJS password hashing, Express Rate Limit, Speakeasy-compatible TOTP MFA with replay defense

---

## 📁 Project Structure

```text
├── assets/                  # CSS, JS, and optimized WebP image brand assets
├── config/                  # Database configuration and connection setup
├── controllers/             # API route handlers and business logic
├── database/                # Flat JSON database directory (Users, Logs, 2FA, Licenses, Tickets)
├── google_auth/             # Directory for Google Play Service Account JSON key
├── middleware/              # JWT, Master, and Super Admin auth middlewares
├── public/                  # Public static assets, helpdesk, and master templates
├── routes/                  # Modular express route definitions
├── scripts/                 # Build & maintenance scripts (post-build, reset-master-2fa, convert-images)
├── src/                     # Modern React + Vite frontend source
│   ├── components/          # UI Components (DevPortalView, MasterView, DashboardView, etc.)
│   ├── hooks/               # Custom React hooks (useTheme, useLanguage)
│   ├── dictionary.json      # Extracted localization dictionary
│   ├── index.css            # Tailwind & custom CSS styling
│   └── App.jsx              # Main React SPA routing and state management
├── utils/                   # Shared utility modules (logger, serverState, dbHelper)
├── uploads/                 # User uploaded files and profile avatars
├── .env                     # Configuration file for environment variables
├── api.js                   # Modularized API controller & routes mounting
├── server.js                # Core Express backend application & global middleware
├── vite.config.js           # Vite build and dev server configuration
└── package.json             # Node dependencies and scripts
```

---

## ⚙️ Configuration (`.env`)

Before running the server, configure the environment variables in `.env`:

```env
PORT=8080                                      # Port for the Express backend server to listen on
QUOTA_LIMIT=104857600                          # Storage limit quota per user in bytes (Default: 100 MB)

# Master & Admin Credentials
MASTER_USER=admin                              # Master username for the admin dashboard
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

# Security, Sessions & Encryption
SESSION_SECRET=your-random-session-secret      # Secret key for Express sessions
JWT_SECRET=your-random-jwt-secret              # Secret key used for signing JWTs
DB_ENCRYPTION_KEY=your-32-byte-base64-key      # AES-256-CBC key for encrypting 2FA secrets at rest
FILE_ENCRYPTION_KEY=your-32-byte-base64-key    # AES-256-CBC key for encrypting uploaded files
SECURE_COOKIE=false                            # Set to true ONLY when serving over HTTPS

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
Clone the repository and install all dependencies:
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

### 4. Building for Production
Build the optimized frontend distribution bundle:
```bash
npm run build
```
This executes `vite build` followed by `scripts/post-build.js` to bundle assets and sync production files.

### 5. Production Deployment
To build the frontend bundle and start the production backend server in a single step:
```bash
npm run deploy
```

When deploying behind a reverse proxy (e.g. Nginx, Cloudflare, Caddy):
1. Configure strong random secrets in `.env` for `MASTER_PASS`, `SUPER_ADMIN_PASS`, `SESSION_SECRET`, `JWT_SECRET`, and `DB_ENCRYPTION_KEY`.
2. Set `SECURE_COOKIE=true` when HTTPS is enabled.
3. Proxy web traffic to port `8080`.

---

## 🛠️ Maintenance & CLI Utility Scripts

* **Reset Master 2FA**: If locked out of the Master dashboard 2FA, reset the secret key directly via CLI:
  ```bash
  node scripts/reset-master-2fa.js
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

## 🔒 Security

- **At-Rest Field Encryption**: User and admin secret keys are never stored in plain text inside `server_users.db`. They are encrypted using `AES-256-CBC` with custom IV vectors.
- **TOTP Replay Prevention**: The speakeasy validation tracks token validation counters dynamically (stored encrypted) to block token replay attacks.
- **Log Isolation**: System logs are stored in a dedicated database `server_logs.db`, automatically pruned to a sliding window of the last 500 events to prevent host system disk exhaustion.
- **Rate Limiting**: Applied on all sensitive login, signup, username check, and verification routes.

---

## 📜 Release Notes & Changelog

### Version 2.2.0 "Developer Hub & Unified Design" 🚀⚡
* **Interactive Developer Portal (`/dev-portal`)**:
  * Unified header bar and sliding navigation drawer synchronized with Master Portal.
  * Card layouts expanded to provide optimal space for documentation reading and API exploration.
  * Responsive typography optimized for mobile devices and wide desktop displays.
  * Interactive Request Runner with live response status indicators, error handling, and payload parsing.
  * Multi-language code generators for **Kotlin Multiplatform (KMP)**, **Java**, **Swift**, **JavaScript (Fetch/Node.js)**, **Python**, **Go**, and **cURL**.
* **Billing & Pricing Architecture**:
  * Added dynamic pricing configuration endpoint (`/api/pricing`) supporting monthly and yearly discount tiers.
  * Extended Google Play Billing v9 receipt verification service integration.
* **Security & Performance**:
  * Enhanced 2FA database encryption with zero-downtime startup migration.
  * Automated WebP compression pipeline with asset transfer bandwidth savings over 70%.