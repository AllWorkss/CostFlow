# CostFlow — Master Development Roadmap
## CSF Costing System · 10-Phase Build Plan

> **Vision**: CostFlow becomes the **Stripe of costing tools** — the universal infrastructure layer for pricing intelligence across every industry in India and globally.
> Every business, from a kirana store owner to a construction firm, can cost their products and services with enterprise-grade precision in minutes.

---

## Current Status: Phase 1 Complete ✅

| Item | Status |
|---|---|
| Next.js 14 + TypeScript scaffold | ✅ Done |
| 5 industry domain presets | ✅ Done |
| Dynamic formula engine | ✅ Done |
| ExcelJS real formula export | ✅ Done |
| React Flow architecture diagram | ✅ Done |
| ML anomaly detection (Z-score) | ✅ Done |
| Zustand state + localStorage | ✅ Done |
| GitHub repo: AllWorkss/CostFlow | ✅ Done |

---

## PHASE 1 — Foundation & Core Engine ✅ DONE
**Timeline**: Week 1 | **Status**: Complete

### Delivered
- Next.js 14 App Router + TypeScript + Tailwind CSS
- 5 domain presets: Manufacturing, School, Retail, E-Commerce, Construction
- Dynamic block-based costing architecture
- Live formula evaluator with variable injection
- ExcelJS export with 3 sheets + real formula cells
- React Flow interactive costing diagram
- ML anomaly detection with Z-score / IQR
- Dark/Light theme system with glassmorphism

---

## PHASE 2 — UI Polish, Mobile-First & UX Overhaul ✅ DONE
**Timeline**: Week 1–2 | **Status**: Complete

### Goals
- [x] Full mobile responsiveness (320px → 4K)
- [x] Bottom navigation bar for mobile
- [x] Collapsible block cards with swipe gestures
- [x] Fix pie chart legend (show real category names)
- [x] Add skeleton loaders for smooth UX
- [x] Keyboard shortcuts (⌘E = export, ⌘R = reset)
- [x] Block drag-and-drop reorder (mouse + touch)
- [x] Smooth page transitions with Framer Motion
- [x] Onboarding tooltip tour (first-time users)
- [x] Print-friendly CSS mode
- [x] Accessibility: ARIA labels, focus rings, screen reader support

---

## PHASE 3 — Google Auth + User Accounts
**Timeline**: Week 2–3

### Goals
- [ ] Google OAuth 2.0 login (using Google Cloud Console credentials)
- [ ] NextAuth.js v5 integration
- [ ] User profile page (name, company, logo upload)
- [ ] Session persistence with JWT tokens
- [ ] Protected routes (dashboard behind auth)
- [ ] Guest mode (limited features without login)
- [ ] User avatar in navbar

### Tech
```
next-auth@5
@auth/prisma-adapter
prisma + PostgreSQL (Supabase free tier)
```

---

## PHASE 4 — Subscription & Monetization Model
**Timeline**: Week 3–4

### Pricing Tiers

| Plan | Price | Features |
|---|---|---|
| **Free** | ₹0/mo | 1 project, 5 blocks, basic export |
| **Starter** | ₹299/mo | 5 projects, all presets, Excel export |
| **Pro** | ₹899/mo | Unlimited projects, AI insights, team share |
| **Enterprise** | Custom | White-label, API access, priority support |

### Goals
- [ ] Razorpay integration (Indian payments, UPI, cards)
- [ ] Stripe integration (international)
- [ ] Feature gating based on plan tier
- [ ] Subscription management dashboard
- [ ] Invoice generation (PDF)
- [ ] 14-day free Pro trial
- [ ] Webhook for payment events
- [ ] Grace period + dunning management

### Tech
```
razorpay (India)
stripe (global)
prisma schema: User, Subscription, Plan, Invoice
```

---

## PHASE 5 — Gemini AI Integration
**Timeline**: Week 4–5

### Goals
- [ ] **Gemini Flash 2.0** API integration (using user's free API key)
- [ ] Natural language costing: *"Add a packaging cost of ₹45 with 10% GST"*
- [ ] AI cost block auto-generator from product description
- [ ] Smart price suggestion based on market data
- [ ] Anomaly explanation in plain English: *"Your labor rate is 3x the industry average"*
- [ ] AI cost report generator (download as PDF narrative)
- [ ] Voice-to-cost entry (Web Speech API + Gemini)
- [ ] Gemini-powered formula builder: type a formula in plain English → gets converted to code

### Tech
```
@google/generative-ai (Gemini SDK)
API key stored in user settings (encrypted)
```

---

## PHASE 6 — Multi-Project Management & Workspace
**Timeline**: Week 5–6

### Goals
- [ ] Project folders / workspaces
- [ ] Project versioning (save snapshots like Git commits)
- [ ] Project templates library (community-shared)
- [ ] Project comparison: side-by-side two cost sheets
- [ ] Duplicate project / fork template
- [ ] Archive / restore deleted projects
- [ ] Project sharing with read-only link
- [ ] Real-time collaboration (Liveblocks or Yjs)
- [ ] Team workspaces with role-based access (Owner, Editor, Viewer)

### Tech
```
prisma: Project, ProjectVersion, Workspace, TeamMember
liveblocks OR yjs + y-websocket (real-time collab)
```

---

## PHASE 7 — Advanced Analytics & Reporting
**Timeline**: Week 6–7

### Goals
- [ ] Historical cost trend charts (30/60/90 days)
- [ ] Margin erosion tracking: auto-alert when costs rise > 5%
- [ ] Break-even volume simulator with slider
- [ ] Sensitivity analysis: "What if raw material cost rises 20%?"
- [ ] Competitor price benchmarking (manual input + AI estimate)
- [ ] Exportable PDF cost reports with charts
- [ ] Summary email digest (weekly cost snapshot)
- [ ] Dashboard home with multi-project KPI overview

### Tech
```
recharts (already installed)
jspdf + html2canvas (PDF reports)
nodemailer (email digest)
```

---

## PHASE 8 — Integrations & API
**Timeline**: Week 7–8

### Goals
- [ ] **Public REST API** for CostFlow (for developers)
- [ ] Webhook support (notify external systems on export)
- [ ] Tally / ERP integration (export cost sheet as Tally XML)
- [ ] WhatsApp Business API (send cost summary via WhatsApp)
- [ ] Google Sheets sync (push live data to a linked Sheet)
- [ ] Notion integration (create cost pages in Notion)
- [ ] Zapier / Make.com connector
- [ ] API key management UI

### Tech
```
next.js API routes (public API)
swagger-ui-react (API documentation)
```

---

## PHASE 9 — Mobile App (React Native / PWA)
**Timeline**: Week 8–10

### Goals
- [ ] Progressive Web App (PWA) manifest + service worker
- [ ] Offline mode: compute costs without internet
- [ ] Install on Android / iPhone home screen
- [ ] Push notifications: *"Your steel cost just spiked 15%"*
- [ ] Camera scan: scan a supplier invoice → auto-fill costs (Gemini Vision)
- [ ] Android APK via Capacitor.js (optional, Phase 10)
- [ ] Biometric login (Touch ID / Face ID via WebAuthn)

### Tech
```
next-pwa
workbox
capacitor (optional native wrapper)
```

---

## PHASE 10 — Enterprise & White-Label
**Timeline**: Month 3+

### Goals
- [ ] White-label: custom domain + logo + colors per company
- [ ] Multi-tenant SaaS architecture
- [ ] Custom domain support (e.g., costing.yourcompany.com)
- [ ] Admin panel for platform management
- [ ] Data residency options (India / EU / US)
- [ ] SOC2 compliance checklist
- [ ] GSTIN-aware tax module (HSN code lookup)
- [ ] Chartered Accountant collaboration mode
- [ ] Bulk import via CSV / Excel upload
- [ ] ERP connectors (SAP, Oracle, Zoho Books)

---

## 🏗️ Planned Tech Stack Evolution

```
CURRENT (Phase 1)        FUTURE (Phase 10)
─────────────────────────────────────────────────
Next.js 14 App Router  → Next.js + Edge Runtime
Zustand (local state)  → Zustand + Server State (React Query)
localStorage           → PostgreSQL (Supabase) + Redis cache
No auth                → NextAuth v5 + Google OAuth
No payments            → Razorpay + Stripe
No AI                  → Gemini Flash 2.0 (full NLP costing)
Single user            → Multi-tenant SaaS
Manual entry           → Camera scan + voice entry
Web only               → PWA + Android APK
```

---

## 💰 Revenue Model

```
Year 1 Target: ₹15,00,000 ARR
  → 50 Pro users × ₹899/mo × 12 months
  → 5 Enterprise × ₹5000/mo × 12 months

Year 2 Target: ₹1,00,00,000 ARR
  → Scale to 500 Pro + 30 Enterprise + API revenue
```

---

## 🔑 API Keys Needed (Future)

| Service | When Needed | Notes |
|---|---|---|
| **Gemini API Key** | Phase 5 | Free tier available from user |
| **Google OAuth** | Phase 3 | Google Cloud Console |
| **Razorpay** | Phase 4 | Indian payments + UPI |
| **Stripe** | Phase 4 | International cards |
| **Supabase** | Phase 3 | Free PostgreSQL + Auth |
| **Liveblocks** | Phase 6 | Real-time collaboration |

---

## 📁 Planned Folder Structure (Full)

```
costflow-app/
├── app/
│   ├── (auth)/                    # Auth routes (Phase 3)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/               # Protected layout
│   │   ├── layout.tsx             # Auth guard
│   │   ├── dashboard/page.tsx     # ← Current
│   │   ├── projects/page.tsx      # Phase 6
│   │   ├── analytics/page.tsx     # Phase 7
│   │   ├── settings/page.tsx      # Phase 4
│   │   └── billing/page.tsx       # Phase 4
│   ├── api/
│   │   ├── export/route.ts        # ← Current
│   │   ├── auth/[...nextauth]/    # Phase 3
│   │   ├── ai/suggest/route.ts    # Phase 5
│   │   ├── projects/route.ts      # Phase 6
│   │   └── v1/                    # Public API (Phase 8)
│   └── flow/page.tsx              # ← Current
├── components/
│   ├── ui/                        # Shadcn primitives
│   ├── blocks/                    # Block components
│   ├── ai/                        # AI chat panel
│   ├── billing/                   # Subscription UI
│   └── analytics/                 # Charts & reports
├── lib/
│   ├── engine/                    # ← Current
│   ├── ml/                        # ← Current
│   ├── excel/                     # ← Current
│   ├── store/                     # ← Current
│   ├── ai/gemini.ts               # Phase 5
│   ├── auth/                      # Phase 3
│   ├── db/prisma.ts               # Phase 3
│   └── payments/                  # Phase 4
└── prisma/
    └── schema.prisma              # Phase 3+
```

---

## 🎯 Immediate Next Steps (Phase 2 - This Week)

1. **Fix UI** — mobile layout, responsive grid, pie chart legend
2. **Mobile nav** — bottom tab bar for mobile, hamburger for tablet
3. **Block UX** — drag-to-reorder, swipe-to-delete on mobile
4. **Skeleton loaders** — smooth loading states
5. **Chart fixes** — correct legend labels, better colors
6. **Push to GitHub** — tag `v0.2.0`
