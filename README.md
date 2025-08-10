# 🚀 INEX Systems Portal — Concept Demo (1.0 Light ↔ 2.0 Dark)

<div align="center">

<img src="inex-logo.png" height="60" alt="INEX Systems & Designs" />

<br><br>

<img alt="Status" src="https://img.shields.io/badge/Demo-Live-success?style=for-the-badge&logo=firefoxbrowser">
<img alt="Mode" src="https://img.shields.io/badge/Themes-Light%20%7C%20Dark-black?style=for-the-badge&logo=semanticuireact">
<img alt="Charts" src="https://img.shields.io/badge/Charts-Inline%20SVG-blue?style=for-the-badge&logo=svg">
<img alt="Stack" src="https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JS-informational?style=for-the-badge">

<br><br>

<!-- Gradient hero card -->
<div style="padding:18px 22px;border-radius:16px;background:linear-gradient(135deg,#A62E3F,#5b1520);color:#fff;box-shadow:0 18px 40px rgba(166,46,63,.35);display:inline-block;text-align:left;max-width:900px;">
  <div style="font-size:20px;font-weight:800;letter-spacing:.3px;">From One‑Click Meetings to One‑Click Operations</div>
  <div style="opacity:.92;margin-top:6px;line-height:1.55;">
    A branded, white‑label portal concept that extends INEX’s <em>ClickShare‑driven</em> room experience into client ops:
    Projects, Jobs & Scheduling, Inventory, RMA/Warranty, SLAs, Knowledge, Clients, Careers, and Settings.
  </div>
  <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
    <a href="https://inex.cochranfilms.com/?utm_source=github&utm_medium=readme&utm_campaign=inex_demo" style="background:#FFB200;color:#111;text-decoration:none;font-weight:800;padding:10px 14px;border-radius:10px;border:1px solid #e6a300;">🌐 View Live Demo</a>
    <a href="#quick-start" style="background:#ffffff1a;color:#fff;text-decoration:none;font-weight:800;padding:10px 14px;border-radius:10px;border:1px solid #ffffff33;">⚡ Quick Start</a>
  </div>
</div>

</div>

---

## ✨ Highlights

- **Dual‑Mode UI:** 1.0 Light (current) ↔ 2.0 Dark (future) via a top‑right toggle (persisted with `localStorage`).
- **Single‑File App:** In‑view routing (hash‑based) with no bundler required.
- **Productized Feel:** Inline **sparkline** + **bar charts** (pure SVG—no libraries or CORS worries).
- **INEX Branding:** Logo in header + 2.0 banner, tokens aligned to INEX maroon `#A62E3F` and accent `#FFB200`.
- **Client‑Facing Tabs:** Projects, Jobs & Scheduling, Inventory, RMA/Warranties, SLAs, Knowledge, Clients, Careers, Settings.

---

## 🧩 Screens & Flow (Demo)

<details>
<summary><b>Dashboard</b> — At‑a‑glance metrics + charts</summary>

- **Project Timeline** + sparkline
- **Open Tickets** + mini bar chart
- **Quick Actions** (create ticket, add inventory, post role)
- **ClickShare vs INEX Integrated** side‑by‑side explainer
- **SLA Performance** sparkline

</details>

<details>
<summary><b>Projects</b> — Installs & rollouts by site</summary>

Search, filter, phases, SOW/Docs placeholders.

</details>

<details>
<summary><b>Jobs & Scheduling</b> — Dispatch board</summary>

Weekly schedule, create ticket form, technician hand‑off copy.

</details>

<details>
<summary><b>Inventory</b> — ClickShare units, cameras, mics, cables</summary>

Search + status tags, locations, low‑stock indicators.

</details>

<details>
<summary><b>RMA & Warranties</b> — Defects & vendor workflows</summary>

Open RMAs table + “Generate RMA” form (email/packing slip placeholder).

</details>

<details>
<summary><b>SLAs & Performance</b> — Response/Resolution targets</summary>

Weekly KPIs + recent tickets table.

</details>

<details>
<summary><b>Knowledge, Clients, Careers, Settings</b></summary>

Guides, client inventories, recruiting, branding & notification toggles.

</details>

---

## 🏗️ Architecture (Concept)

```mermaid
flowchart LR
  A[Topbar + Theme Toggle] --> B{Router (hashchange)}
  B -->|#/dashboard| C[Dashboard]
  B -->|#/projects| D[Projects]
  B -->|#/jobs| E[Jobs & Scheduling]
  B -->|#/inventory| F[Inventory]
  B -->|#/rma| G[RMA & Warranties]
  B -->|#/slas| H[SLAs & Performance]
  B -->|#/knowledge| I[Knowledge Base]
  B -->|#/clients| J[Clients]
  B -->|#/careers| K[Careers]
  B -->|#/settings| L[Settings]

  C --> M[Inline SVG Charts]
  A --> N[localStorage (theme)]
