# Scratchpad: API User-Agent Architecture (Android App vs Web Browser)

## 1. Overview & Requested User-Agent Signatures

You specified three Cloudflare WAF / HTTP User-Agent conditions for your API:
1. `(http.user_agent eq "okhttp/5.5.0")` — Standard OkHttp client default signature.
2. `(ends_with(http.user_agent, "LogbookPlusApp/1.0"))` — Custom branded signature ending with your app identifier.
3. `(http.user_agent eq "ktor-client")` — Ktor HTTP engine default signature.

We have implemented the backend middleware in [`middleware/userAgentGuard.js`](./middleware/userAgentGuard.js) and mounted it directly on Express in [`server.js`](./server.js).

---

## 2. What Happens if the API is Accessed by a Web Browser?

### The Core Problem: Browsers Forbid Custom User-Agent Headers
Under the **W3C / WHATWG Fetch & XMLHttpRequest Standard**, `User-Agent` is strictly designated as a **Forbidden Header Name**.

If frontend JavaScript running in Google Chrome, Safari, Firefox, or Edge tries to execute:
```javascript
// ❌ THIS WILL FAIL OR BE SILENTLY IGNORED IN BROWSERS
fetch('/api/login', {
    method: 'POST',
    headers: {
        'User-Agent': 'okhttp/5.5.0', // Refused by browser security sandbox!
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
});
```

### The Impact
- In web browsers, the browser engine **always** forces its own User-Agent string (e.g. `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`).
- **If you strictly block any request that does not have `okhttp/5.5.0`, `ktor-client`, or `LogbookPlusApp/1.0`:**
  - 🛑 Every single web user will be **locked out** with `403 Forbidden`.
  - 🛑 Web login, newsletter subscriptions, public contact forms, helpdesk tickets, and dashboards in the browser will fail.

---

## 3. The Dual-Channel Solution (Android App + Web Browser)

To keep the web app functioning while securing Android app traffic, your API now supports **Dual-Channel Verification**:

```
                                      ┌─────────────────────────────────────────────────────────────┐
                                      │                      Incoming HTTP Request                  │
                                      └──────────────────────────────┬──────────────────────────────┘
                                                                     │
                                             Does User-Agent match one of the 3 rules?
                                          - "okhttp/5.5.0"
                                          - ends_with "LogbookPlusApp/1.0"
                                          - "ktor-client"
                                             /                               \
                                           YES                               NO
                                           /                                   \
                 ┌──────────────────────────────────────┐          Is it a legitimate Web Browser?
                 │   req.clientPlatform = 'ANDROID_APP' │          - UA starts with Mozilla/5.0
                 │   req.isAndroidApp = true            │          - Origin/Referer = logbookplus.co.in
                 │                                      │          - sec-fetch-site = same-origin
                 │   -> ALLOW (Full Mobile Access)      │                     /             \
                 └──────────────────────────────────────┘                   YES              NO
                                                                            /                  \
                                            ┌───────────────────────────────────┐    ┌────────────────────────┐
                                            │ req.clientPlatform = 'WEB_BROWSER'│    │ 403 Forbidden          │
                                            │ req.isBrowser = true              │    │ (Unknown Bot / Scraper)│
                                            │                                   │    └────────────────────────┘
                                            │ -> ALLOW (Web App Access)         │
                                            └───────────────────────────────────┘
```

---

## 4. Cloudflare WAF Configuration Guide

If you are applying this rule in **Cloudflare Security > WAF > Custom Rules**:

### ⚠️ AVOID THIS (Breaks Web Browsers):
```text
(http.request.uri.path contains "/api/") and not (
    (http.user_agent eq "okhttp/5.5.0") or 
    (ends_with(http.user_agent, "LogbookPlusApp/1.0")) or 
    (http.user_agent eq "ktor-client")
)
Action: Block
```
*Result: Blocks all web browsers attempting to use the web application.*

---

###  RECOMMENDED CLOUDFLARE WAF EXPRESSION (Dual-Channel):
This allows authorized Android User-Agents **AND** legitimate browser requests from your domain.

> **Important**: Paste **ONLY** the expression below into the Expression Editor box. Do **NOT** type `Action: Block` into the box (choose **Block** from the dropdown menu below the box).

```text
(http.request.uri.path contains "/api/") and not (http.user_agent eq "okhttp/5.5.0" or ends_with(http.user_agent, "LogbookPlusApp/1.0") or http.user_agent eq "ktor-client" or http.referer contains "logbookplus.co.in")
```

**Choose Action**: Select `Block` from the Action dropdown.

### 📱 OPTION B: DEDICATED MOBILE-ONLY ENDPOINTS:
If you want certain endpoints reserved **strictly** for mobile apps (e.g. `/api/v1/mobile/` or `/api/app/`):
```text
(http.request.uri.path contains "/api/app/") and not (
    (http.user_agent eq "okhttp/5.5.0") or 
    (ends_with(http.user_agent, "LogbookPlusApp/1.0")) or 
    (http.user_agent eq "ktor-client")
)
Action: Block
```

---

## 5. Android Client Code Implementation

### A. OkHttp (Android / Kotlin)
```kotlin
import okhttp3.OkHttpClient
import okhttp3.Request

val client = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val original = chain.request()
        val requestWithUa = original.newBuilder()
            // Option 1: Exactly okhttp/5.5.0 (Default in OkHttp 5.5.0)
            // Option 2: Custom version ending with LogbookPlusApp/1.0
            .header("User-Agent", "Mozilla/5.0 LogbookPlusApp/1.0")
            .build()
        chain.proceed(requestWithUa)
    }
    .build()
```

### B. Ktor Client (Android / Kotlin)
```kotlin
import io.ktor.client.*
import io.ktor.client.plugins.*

val client = HttpClient {
    // Option 1: Default ktor-client
    install(UserAgent) {
        agent = "ktor-client"
    }
    
    // OR Option 2: Custom signature ending with LogbookPlusApp/1.0
    // install(UserAgent) {
    //     agent = "Android LogbookPlusApp/1.0"
    // }
}
```

---

## 6. How the Backend Code Handles This
In your Node.js backend:
- [`middleware/userAgentGuard.js`](./middleware/userAgentGuard.js) exports:
  - `classifyClient`: Automatically stamps `req.clientPlatform` (`ANDROID_APP`, `WEB_BROWSER`, `UNKNOWN`) and sets the `X-Client-Type` HTTP response header.
  - `requireAndroidApp`: Apply directly to routes that must **never** be accessed via a browser:
    ```javascript
    const { requireAndroidApp } = require('./middleware/userAgentGuard');
    router.post('/api/mobile-sync', requireAndroidApp, (req, res) => { ... });
    ```
  - `dualChannelGuard`: Guards against automated bots / web scrapers while letting both your Android app and your browser app access the endpoint.
