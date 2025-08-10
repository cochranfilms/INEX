# 🖥️ INEX Systems Portal – 2.0 Demo by Cochran Films

<div align="center">

![INEX Systems](https://img.shields.io/badge/INEX%20Systems%20&%20Designs-Innovation%20Driven-red?style=for-the-badge&logo=appveyor)
![Status](https://img.shields.io/badge/Status-Live%20Demo-brightgreen?style=for-the-badge&logo=vercel)
![Theme](https://img.shields.io/badge/Theme-Dark%20%26%20Light-blueviolet?style=for-the-badge&logo=tailwindcss)
![Version](https://img.shields.io/badge/Version-2.0-orange?style=for-the-badge&logo=github)

</div>

---

## 🚀 Overview
This repository contains the **2.0 version** of the INEX Systems & Designs portal concept, built to demonstrate how **Cochran Films – Systems Division** can deliver a fully branded, centralized operations dashboard.

Unlike 1.0, this upgraded demo:
- Runs a **dark/light theme toggle**
- Includes **inline SVG charts** for a more “productized” feel
- Keeps all views in a **single HTML file** (no reloads)
- Is fully **INEX branded** with their logo in both versions

---

## 🌟 Key Features in 2.0
- **Theme Toggle** – Seamless switch between light and dark modes
- **Single Page View** – All navigation loads instantly without page reloads
- **Branded UI** – INEX logo embedded into headers
- **Animated Cards** – Smooth hover and load animations
- **Sparkline Dashboard Chart** – Built with pure SVG (no external libs)
- **Scalable Structure** – Ready for API integration and real client data

---

## 🗺️ Navigation Map
```mermaid
flowchart LR
  A[Topbar + Theme Toggle] --> B[Router hashchange]
  B --> C[Dashboard]
  B --> D[Projects]
  B --> E[Jobs and Scheduling]
  B --> F[Inventory]
  B --> G[RMA and Warranties]
  B --> H[SLAs and Performance]
  B --> I[Knowledge Base]
  B --> J[Clients]
  B --> K[Careers]
  B --> L[Settings]
  C --> M[Inline SVG Charts]
  A --> N[Local Storage theme]

---

## 🔧 Setup
1. Install dependencies: `npm install`
2. Run dev server: `./serve.sh`
3. Configure environment variables as needed (if using APIs).

### Environment Variables
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_APP_ID
- FIREBASE_MESSAGING_SENDER_ID
- EMAILJS_SERVICE_ID
- EMAILJS_TEMPLATE_ID
- EMAILJS_PUBLIC_KEY
- EMAILJS_TO_EMAIL (optional; must be one of: info@inexsystemsdesigns.com, info@cochranfilms.com)
- ENCRYPTION_KEY (base64, 32 bytes)

Local dev: create a `.env` file in the project root with the values above. The `api/firebase/public-config` endpoint will 404 when Firebase envs are missing; deploy with envs set to enable email‑link login gating.
