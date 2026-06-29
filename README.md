# Logbook Plus — Modern Expense Intelligence

Logbook Plus is a local-first, zero-vendor-lock expense intelligence system. It combines client-side encrypted backups, multi-policy storage, and seamless sync capabilities, all hosted on your private cloud.

---

## 🚀 Key Features

- **Local-First & Encrypted**: All your expense data is stored locally first, with end-to-end client-side encryption.
- **Redundancy & Sync**: Back up to a private cloud server with support for multi-policy storage.
- **Self-Hostable Node.js Server**: Easily deployable Express backend powered by NeDB database.
- **Admin Dashboard**: Built-in master admin area for system configuration and user management.
- **Google Play Purchase Verification**: Includes APIs to verify Android billing/subscriptions using Google Play developer service accounts.

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express
- **Database**: NeDB (embedded database, stored in local `.db` files)
- **Security & Auth**: JSON Web Tokens (JWT), BcryptJS, Express Rate Limit
- **Integrations**: Google APIs Client Library (Google Play Billing verification)

---

## 📁 Project Structure

```text
├── assets/                  # CSS, JS, and image assets for the landing pages
├── config/                  # Database configuration and connection setup
├── google_auth/             # Directory for Google Play Service Account JSON key
├── middleware/              # JWT and Master auth middlewares
├── public/                  # Frontend HTML/CSS/JS (Landing page, Dashboard, Pricing, Terms)
│   ├── app/                 # User App & Dashboard
│   ├── master/              # Admin/Master Dashboard
│   ├── pricing/             # Pricing pages
│   └── index.html           # Landing Page
├── .env                     # Configuration file for environment variables
├── server.js                # Core Express backend application
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

# Android App / Google Play Billing
GOOGLE_PLAY_PACKAGE_NAME=com.logbookplus       # Android package name
SERVICE_ACCOUNT_KEY_PATH=google_auth/key.json  # Path to Google Play API Service Account JSON key
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

- Rate limits are applied on sensitive authentication routes (`/api/login`, `/api/signup`, `/api/forgot-password`).
- Server logs are automatically kept in a sliding window of 500 events to prevent disk space exhaustion.
- Password hashes are stored using strong BcryptJS hashing.

## Dependencies
- @google-cloud/local-auth: For Google Play API authentication
- @googleapis/androidpublisher: For Google Play Android Publisher API
- bcryptjs: For password hashing
- cors: For Cross-Origin Resource Sharing
- dotenv: For environment variables
- express: For the web framework
- express-rate-limit: For rate limiting
- jsonwebtoken: For JSON Web Tokens
- nedb-promises: For the database
- serve-favicon: For serving favicons
- zip-local: For creating zip files
- zlib: For compression



