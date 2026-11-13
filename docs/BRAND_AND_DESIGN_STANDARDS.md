# Brand & UI/UX Standards: Design System & Anti-Vibe-Coding Manifesto

## 1. Official Color Palette & Design Tokens

For the entire frontend of this project (web and mobile), strictly follow this three-color palette using the exact HEX values specified below. Do not replace, modify, or approximate these HEX tokens.

| Color | HEX Code | Role & Distribution |
|---|---|---|
| **Ice Blue** | `#EAF6FF` | **60% Primary:** Main page backgrounds, content section backgrounds, cards, containers, dashboard surfaces, and form backgrounds. |
| **Midnight Navy** | `#142B4A` | **30% Secondary:** Headings, body text, navigation bars, sidebars, footer sections, icons, borders, labels, and secondary UI elements. |
| **Tangerine** | `#FF8C42` | **10% Accent:** Primary CTA buttons, important action buttons, active navigation indicators, links, highlights, badges, and focus highlights. |

---

## 2. UI Interaction States

Maintain the exact palette across all interactive components:

- **Primary CTA:** Tangerine (`#FF8C42`) background with Midnight Navy (`#142B4A`) text.
- **Primary CTA Hover / Pressed:** `#E8752E`.
- **Secondary Button:** Midnight Navy (`#142B4A`) background with Ice Blue (`#EAF6FF`) text.
- **Secondary Button Hover / Pressed:** `#1D3D63`.
- **Input Focus:** Tangerine (`#FF8C42`) border.
- **Active State:** Tangerine (`#FF8C42`) highlight.
- **Disabled State:** Muted neutral gray (`#D1D5DB`) with reduced contrast text (`#6B7280`).

---

## 3. Hard Anti-Vibe-Coding Rules

| Category | Strictly Prohibited (Vibe-Coded Anti-Patterns) | Enforced Standard (Enterprise Quality) |
|---|---|---|
| **Color & Backgrounds** | Waffle gradients, rainbow mesh gradients, purple-to-cyan glows, noisy glassmorphism cards, arbitrary color themes per page. | Strict 60-30-10 Ice Blue (`#EAF6FF`), Midnight Navy (`#142B4A`), and Tangerine (`#FF8C42`) design system. Subtle tints/shades of these three colors only when required. |
| **Interactive Buttons** | "Failed ship" buttons: bouncing gradient pills, continuous spinning glowing borders, bouncy hover physics. | Direct, high-contrast action buttons following the exact CTA and Secondary interaction states. |
| **Icons & Symbols** | Emojis as UI icons (e.g. rocket, sparkles, fire symbols). | Crisp SVG vector line icons exclusively (Lucide / Feather / Heroicons). |
| **Typography & Punctuation** | Em dash characters, inconsistent quote marks, decorative serif titles. | Clean system sans-serif (Inter, -apple-system, Segoe UI), standard hyphens (-), colons (:), and high-contrast text hierarchies. |
| **Hero & Copywriting** | Vague, fluffy copy ("Supercharge your workflow with next-gen synergy"). | Direct, unambiguous, domain-specific copy: "Paying Guest and Hostel Property Management System. Centralize branch operations, room allocation, monthly rent dues, and tenant onboarding in one unified platform." |
| **Metrics & Claims** | Fabricated metrics ("Trusted by 100,000+ happy PGs", "99.999% guaranteed uptime"). | Concrete architectural capabilities, real system specifications, and verifiable features only. |
| **Testimonials** | Fake customer reviews with AI-generated headshots. | Zero fake testimonials or fictional reviews. |
| **Animations & Motion** | 3D card tilt on hover, trailing cursor bubbles, magnetic cursor dots, parallax scroll wobbly elements. | Native CSS transition timing (150-200ms). Zero scroll hijacking or custom cursor effects. |
| **Attribution Tags** | "Made with AI", "Powered by Bolt/v0/Lovable", template generator watermarks. | Strictly zero AI attribution tags anywhere in HTML headers, footers, metadata, or source code. |

---

## 4. Mandatory Pre-Launch Checklist

- [x] **Official 60-30-10 Color System**: Enforced across `web/` and `mobile/`.
- [x] **Favicon Implemented**: Vector SVG favicon (`/favicon.svg`) using `#142B4A`, `#EAF6FF`, and `#FF8C42`.
- [x] **Zero AI Tags**: Zero "Made with AI", "Powered by AI", or boilerplate generator meta tags.
- [x] **Privacy Policy Live**: Privacy Policy (`/privacy-policy`) detailing tenant KYC processing, isolation, encryption, and data rights.
- [x] **Terms & Conditions Live**: Terms of Service (`/terms-and-conditions`) covering multi-tenant licensing, acceptable use, and SLAs.
- [x] **Custom Domain Ready**: Nginx reverse proxy configuration (`infra/nginx/nginx.conf`) and DNS setup guide (`/domain-setup`) with Let's Encrypt TLS.
