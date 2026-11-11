# Brand & UI/UX Standards: Anti-Vibe-Coding Manifesto

## 1. Core Principle
PG-Management-SaaS adheres strictly to **Enterprise Utility Design**. Software built for property operations, tenant KYC, and financial reconciliation must convey stability, precision, and authority. It must never look like an unverified novelty or generic vibe-coded prototype.

---

## 2. Hard Anti-Vibe-Coding Rules

| Category | Strictly Prohibited (Vibe-Coded Anti-Patterns) | Enforced Standard (Enterprise Quality) |
|---|---|---|
| **Color & Backgrounds** | Waffle gradients, rainbow mesh gradients, purple-to-cyan glows, noisy glassmorphism cards. | Solid, deliberate enterprise surfaces: Deep Slate (`#0B0F19`), Slate-950 (`#020617`), Slate-900 (`#0F172A`), with crisp borders (`#1E293B` / `#334155`). |
| **Interactive Buttons** | "Failed ship" buttons: bouncing gradient pills, continuous spinning glowing borders, bouncy hover physics. | Direct, high-contrast action buttons: solid Blue (`#2563EB`) with subtle hover darkening (`#1D4ED8`), standard focus rings. |
| **Icons & Symbols** | Emojis as UI icons (e.g. rocket, sparkles, fire symbols). | Crisp SVG vector line icons exclusively (Lucide / Feather / Heroicons). |
| **Typography & Punctuation** | Em dash characters, inconsistent quote marks, decorative serif titles. | Clean system sans-serif (Inter, -apple-system, Segoe UI), standard hyphens (-), colons (:), and high-contrast text hierarchies. |
| **Hero & Copywriting** | Vague, fluffy copy ("Supercharge your workflow with next-gen synergy", "Revolutionize property management"). | Direct, unambiguous, domain-specific copy: "Property Management System for Hostels and Paying Guest Accommodations. Centralize branch operations, room allocation, monthly rent dues, and tenant onboarding in one unified system." |
| **Metrics & Claims** | Fabricated metrics ("Trusted by 100,000+ happy PGs", "\$50M+ processed", "99.999% guaranteed uptime"). | Concrete architectural capabilities, real system specifications, and verifiable features only. |
| **Testimonials** | Fake customer reviews with AI-generated headshots ("John D., PG Owner: 'This app saved my life!'"). | Zero fake testimonials or fictional reviews. Product features speak directly through functional specs. |
| **Animations & Motion** | 3D card tilt on hover, trailing cursor bubbles, magnetic cursor dots, parallax scroll wobbly elements. | Native CSS transition timing (150-200ms `ease-in-out`). Zero scroll hijacking or custom cursor effects. |
| **Attribution Tags** | "Made with AI", "Powered by Bolt/v0/Lovable", template generator watermarks. | Strictly zero AI attribution tags anywhere in HTML headers, footers, metadata, or source code. |

---

## 3. Mandatory Pre-Launch Checklist

Every release must satisfy all 5 mandatory launch gates:

- [x] **Favicon Implemented**: Real vector SVG favicon (`/favicon.svg`) and fallback favicon configured in HTML head.
- [x] **Zero AI Tags**: Zero "Made with AI", "Powered by AI", or boilerplate generator meta tags in source code.
- [x] **Privacy Policy Live**: Legally structured Privacy Policy (`/privacy-policy`) detailing tenant KYC processing, data isolation, encryption, and data rights.
- [x] **Terms & Conditions Live**: Complete Terms of Service (`/terms-and-conditions`) covering multi-tenant licensing, acceptable use, and SLAs.
- [x] **Custom Domain Ready**: Nginx reverse proxy configuration (`infra/nginx/nginx.conf`) and DNS setup guide (`/domain-setup`) with automated Let's Encrypt TLS.
