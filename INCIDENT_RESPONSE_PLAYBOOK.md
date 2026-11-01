# Data Breach Incident Response & Notification Playbook
**Framework:** Section 8(6) Digital Personal Data Protection (DPDP) Act, 2023 | CERT-In Directions 2022 | GDPR Articles 33 & 34  
**Data Fiduciary:** Aamir Shaikh (Logbook Plus)  
**Security Lead & Grievance Redressal Officer:** grievance@logbookplus.co.in / support@logbookplus.co.in  
**Operating Domains:** logbookplus.co.in | master.logbookplus.co.in | helpdesk.logbookplus.co.in  

---

## 1. Statutory Mandates & Reporting Timelines

| Authority / Entity | Statutory Framework | Mandatory Notification Window | Contact / Portal |
| :--- | :--- | :--- | :--- |
| **Indian Computer Emergency Response Team (CERT-In)** | Section 70B(6) IT Act, 2000 & Directions 2022 | Within **6 Hours** of detecting / being notified of incident | `incident@cert-in.org.in` / +91-1800-11-4949 |
| **Data Protection Board of India (DPBI)** | Section 8(6) DPDP Act, 2023 | Within **72 Hours** of confirmed personal data breach | Digital Portal of the Data Protection Board of India |
| **European Data Protection Authorities (EU DPA)** | Article 33 GDPR | Within **72 Hours** where EU residents' data is affected | Relevant Lead Supervisory Authority |
| **Affected Data Principals / Users** | Section 8(6) DPDP Act & Art. 34 GDPR | Without undue delay following containment and risk assessment | Direct registered email & prominent notification banner |

---

## 2. Five-Stage Incident Response Workflow

```
   [Stage 1: Identification & Triage] (T+0 to T+2 hrs)
                    │
                    ▼
   [Stage 2: Containment & Forensic Capture] (T+2 to T+6 hrs) ──> CERT-In Intimation (Within 6 hrs)
                    │
                    ▼
   [Stage 3: Harm Assessment & Scope Analysis] (T+6 to T+24 hrs)
                    │
                    ▼
   [Stage 4: Regulatory Intimation to DPBI] (Within 72 hrs)
                    │
                    ▼
   [Stage 5: Data Principal Notification & Remediation]
```

---

### Stage 1: Identification & Immediate Triage (T+0 to T+2 Hours)
1. **Trigger Events:**
   - Automated server alert via Telegram/CallMeBot (`ALARM` / `CRITICAL` log levels).
   - Rate limit breach bursts or brute-force alerts on `/api/login` or `/api/signup`.
   - Notification from security researcher via `support@logbookplus.co.in`.
   - Abnormal egress traffic or unauthorized administrative access to `/master` console.
2. **Immediate Action:**
   - Convene the Incident Response Lead (Grievance Redressal Officer).
   - Record initial discovery timestamp in the internal incident register.

---

### Stage 2: Containment & Forensic Log Capture (T+2 to T+6 Hours)
1. **Isolate Affected Systems:**
   - Terminate suspicious user/admin sessions via session cache invalidation.
   - If server compromise is suspected, immediately cycle:
     - `JWT_SECRET` in `.env`
     - Database encryption key buffers (`DB_ENCRYPTION_KEY`)
     - Master admin password (`MASTER_PASS` / `SUPER_ADMIN_PASS`)
2. **Forensic Evidence Preservation (CERT-In Compliance):**
   - Take read-only snapshot of database datafiles (`database/*.db`).
   - Export rolling 365-day security logs from `logsDb` (`type: 'server_log'`).
   - Preserve reverse-proxy access logs (IP addresses, request headers, timestamps).
3. **CERT-In Initial Report (Within 6 Hours):**
   - Transmit preliminary incident notice to `incident@cert-in.org.in` covering incident type, affected systems, and initial mitigation actions.

---

### Stage 3: Harm Assessment & Data Classification (T+6 to T+24 Hours)
Evaluate what categories of personal data were exposed:
- **Zero Exposure / Client-Side Encrypted:**
  - Client-side AES-256 encrypted backups (`.enc` / `.sqlite` vaults) where user keys are stored only locally on client devices. Under DPDP Act guidance, encrypted data without accessible decryption keys presents minimal risk to Data Principals.
- **Moderate / High Exposure:**
  - Salted bcrypt password hashes, account usernames, email addresses, helpdesk ticket transcripts.

---

### Stage 4: Formal Intimation to Data Protection Board of India (Within 72 Hours)
In compliance with Section 8(6) of the DPDP Act 2023, prepare and submit the digital intimation to the **Data Protection Board of India (DPBI)** containing:
1. **Nature of Breach:** Unauthorized access, exfiltration, data destruction, or disclosure.
2. **Timing:** Approximate date, time, and discovery interval.
3. **Impact Scope:** Estimated count of affected Data Principals and geographic scope.
4. **Data Categories:** Personal identifiers involved.
5. **Mitigation Actions:** Security patches deployed, key rotations, firewall rule updates.
6. **Designated Point of Contact:** Grievance Redressal Officer details.

---

### Stage 5: Data Principal Notification & Transparency
If the breach involves personal data likely to pose harm or privacy impact:
1. Dispatch notification to all impacted registered email addresses.
2. Display an urgent security notice on user dashboards.
3. Include clear remediation advice:
   - Request users reset their account password and security question answers.
   - Clarify that client-encrypted database vaults remain mathematically protected by AES-256 client keys.
   - Provide direct contact for queries: `grievance@logbookplus.co.in`.

---

## 3. Incident Documentation & Post-Mortem Register
All security events, containment logs, and regulatory correspondence must be securely retained in the internal incident log repository for a **minimum period of 5 years** following resolution.
