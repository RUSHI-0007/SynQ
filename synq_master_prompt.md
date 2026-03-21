# SYNQ — MASTER LANDING PAGE PROMPT
# Model: claude-sonnet-4-6 (Extended Thinking ON)
# Target: Full landing page — single HTML file, zero dependencies except Google Fonts
# Reference: Resq.io cosmic dark SaaS aesthetic — replicated 1:1 for Synq

---

## SYSTEM CONTEXT (paste as system prompt in Antigravity IDE)

You are a world-class frontend engineer and UI designer specialising in SaaS landing pages with deep expertise in CSS animations, WebGL-free particle systems, and glassmorphism. You write production-ready single-file HTML with embedded CSS and vanilla JS. You never use external libraries except Google Fonts. Your animations are buttery-smooth 60fps CSS-only. Your code is clean, commented, and pixel-perfect.

---

## MASTER USER PROMPT

Build a complete, single-file HTML landing page for **SYNQ** — a cloud-based multiplayer IDE and collaboration platform built specifically for hackathon teams. The page must be a 1:1 aesthetic clone of the Resq.io cosmic SaaS design language described in full detail below, with all content replaced to match Synq's product.

---

### SECTION 1: GLOBAL DESIGN SYSTEM

#### Background
- Pure black `#000000` base on `<body>` and all section backgrounds
- Cosmic nebula effect: multiple `radial-gradient` layers positioned absolutely, never covering text
  - Top-left nebula: `radial-gradient(ellipse 900px 600px at -10% 20%, rgba(67,56,202,0.35) 0%, transparent 70%)`
  - Center-right nebula: `radial-gradient(ellipse 600px 400px at 110% 40%, rgba(99,102,241,0.18) 0%, transparent 60%)`
  - Bottom nebula (footer only): `radial-gradient(ellipse 700px 500px at 50% 120%, rgba(99,102,241,0.45) 0%, transparent 60%)` — this creates the upward purple spotlight in the CTA section
- Star particles: 80 absolutely positioned `<span>` elements, each `2px × 2px`, `border-radius: 50%`, `background: white`, scattered with `random()` JS across `100vw × 300vh`, opacity `0.3–0.8`, some with CSS `@keyframes twinkle` (opacity 1 → 0.2 → 1, duration 2–5s, infinite, random delays)

#### Color Tokens
```
--bg:           #000000
--surface:      rgba(12, 10, 28, 0.75)
--surface-2:    rgba(20, 16, 45, 0.60)
--border:       rgba(99, 102, 241, 0.18)
--border-hover: rgba(99, 102, 241, 0.45)
--purple-deep:  #1e1b4b
--purple-mid:   #4338ca
--purple-main:  #6366f1
--purple-light: #818cf8
--purple-glow:  rgba(99, 102, 241, 0.4)
--text-primary: #ffffff
--text-secondary: #94a3b8
--text-muted:   #64748b
--green:        #22c55e
--red:          #ef4444
--yellow:       #fbbf24
```

#### Typography
- Google Fonts import: `Inter` weights 300, 400, 500, 600, 700, 800
- `font-family: 'Inter', -apple-system, sans-serif` on `body`
- For code/terminal elements: `'JetBrains Mono', Consolas, monospace` — load via Google Fonts
- Hero H1: `font-size: clamp(42px, 6vw, 76px)`, `font-weight: 800`, `line-height: 1.05`, `letter-spacing: -0.03em`, color `#ffffff`
- Hero H1 first word "Ship" styled with `background: linear-gradient(135deg, #818cf8, #6366f1)`, `-webkit-background-clip: text`, `-webkit-text-fill-color: transparent`
- Section titles: `clamp(32px, 4vw, 52px)`, `font-weight: 700`, `#ffffff`
- Body: `16px`, `font-weight: 400`, `#94a3b8`, `line-height: 1.7`

#### Buttons
**Primary CTA (pill, filled):**
```css
background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
border: 1px solid rgba(129,140,248,0.4);
border-radius: 100px;
padding: 14px 32px;
font-size: 15px; font-weight: 600; color: #fff;
box-shadow: 0 0 32px rgba(99,102,241,0.5), 0 0 64px rgba(99,102,241,0.2);
transition: all 0.3s ease;
cursor: pointer;
```
On hover: `box-shadow: 0 0 48px rgba(99,102,241,0.7), 0 0 80px rgba(99,102,241,0.35)`, `transform: translateY(-1px)`

**Secondary CTA (pill, ghost):**
```css
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.2);
border-radius: 100px;
padding: 14px 32px;
font-size: 15px; font-weight: 500; color: #e2e8f0;
backdrop-filter: blur(8px);
```
On hover: `border-color: rgba(99,102,241,0.5)`, `background: rgba(99,102,241,0.1)`

#### Cards (glassmorphism)
```css
background: rgba(12, 10, 28, 0.75);
border: 1px solid rgba(99,102,241,0.18);
border-radius: 16px;
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
```
On hover: `border-color: rgba(99,102,241,0.4)`, `transform: translateY(-3px)`, `transition: all 0.3s ease`

---

### SECTION 2: NAVBAR

Layout: `position: fixed`, `top: 0`, `width: 100%`, `z-index: 100`
Background: `rgba(0,0,0,0.6)`, `backdrop-filter: blur(20px)`, `border-bottom: 1px solid rgba(99,102,241,0.1)`
Height: `64px`

Left: **SYNQ** logo — `font-family: 'JetBrains Mono'`, `font-size: 18px`, `font-weight: 700`, `letter-spacing: 0.22em`, `color: #fff`. The letter "Q" has color `#4ade80` (Synq's green accent)

Center nav links: `Solutions`, `Features`, `Pricing`, `Docs` — `font-size: 14px`, `color: #94a3b8`, hover `color: #fff`, `transition: 0.2s`

Right: `Log in` ghost link + `Get Early Access` primary pill button (smaller: `padding: 10px 20px`, `font-size: 14px`)

---

### SECTION 3: HERO SECTION

Full viewport height (`100vh`), `display: flex`, `flex-direction: column`, `align-items: center`, `justify-content: flex-start`, `padding-top: 140px`

**Background effects:**
- Top-left diagonal light beam: A `div` absolutely positioned, `width: 2px`, `height: 60vh`, rotated `35deg`, `background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)`, `top: 80px`, `left: 8%`, `pointer-events: none`
- A wider blurred version behind it: `width: 120px`, same position, `background: linear-gradient(180deg, rgba(99,102,241,0.2) 0%, transparent 100%)`, `filter: blur(40px)`
- Scattered star particles (the JS-generated ones described above)

**Text content (centered):**
1. Top badge pill: `"✦ Now in open beta — Built for hackathon teams"`, pill shape, `background: rgba(99,102,241,0.12)`, `border: 1px solid rgba(99,102,241,0.3)`, `border-radius: 100px`, `padding: 6px 18px`, `font-size: 12px`, `color: #818cf8`, `font-weight: 500`, with a `5px` green pulsing dot on the left
2. H1: `"Ship together."` (line 1, "Ship" in purple gradient) — `"Zero merge hell."` (line 2) — `"Real-time. In the cloud."` (line 3, `color: #64748b`)
3. Subtitle paragraph: `"A multiplayer cloud IDE where your whole team codes simultaneously, runs a shared terminal, and uses consensus-based Git merges — no setup, no conflicts, no 'works on my machine'."` — `max-width: 560px`, centered
4. Two CTA buttons side by side: `"Start a Sandbox →"` (primary) + `"Watch Demo ▶"` (secondary)
5. Social proof micro-text below buttons: `"Free during beta · No credit card · Docker sandbox in 30 seconds"` — `font-size: 13px`, `color: #475569`

**Entrance animation on all text elements:**
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
Badge: `animation: fadeUp 0.6s ease 0.1s both`
H1: `animation: fadeUp 0.7s ease 0.25s both`
Subtitle: `animation: fadeUp 0.7s ease 0.4s both`
Buttons: `animation: fadeUp 0.7s ease 0.55s both`

**Hero Dashboard Mockup** (lower portion of hero, partially cropped at bottom):
A browser-chrome container (`border-radius: 12px 12px 0 0`, `border: 1px solid rgba(99,102,241,0.25)`, `box-shadow: 0 -20px 80px rgba(99,102,241,0.15), 0 0 0 1px rgba(255,255,255,0.05)`) containing a miniaturised Synq IDE preview:
- Browser chrome bar: dark `#09090b`, three colored dots (red/yellow/green), centered URL text `"synq.dev/sandbox/hackathon-2024"`, `font-size: 11px`, `color: #52525b`
- Inside: Render an exact replica of the Synq IDE interface — left file-tree sidebar (`190px` wide), main Monaco editor area with syntax-highlighted code (purple keywords, blue functions, green strings, JetBrains Mono `10px`), bottom terminal panel (`90px` tall, `#030305` bg, green prompt), top header bar with container-active green dot badge, team avatars (RK/AM/SK/PD colored circles), voice bars animation, "PROPOSE MERGE" yellow badge
- The editor shows this exact code:
```
import { useYjs } from '@/hooks/useYjs'
import { LiveKit } from '@livekit/components-react'

export default function Page() {
  const { doc, awareness } = useYjs()       // ← purple cursor here
  return <Editor doc={doc} awareness={awareness} />  // ← pink cursor here
}
```
- Float animation on entire mockup: `@keyframes heroFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`, `animation: heroFloat 5s ease-in-out infinite`
- Mockup `max-width: 820px`, `width: 90%`, `margin-top: 48px`

---

### SECTION 4: LOGO STRIP

Dark section, `padding: 48px 0`, `border-top: 1px solid rgba(99,102,241,0.08)`, `border-bottom: 1px solid rgba(99,102,241,0.08)`

Label: `"Trusted by teams at"` — `font-size: 12px`, `color: #475569`, `letter-spacing: 0.1em`, `text-transform: uppercase`, centered, `margin-bottom: 24px`

5 company/tech logos in a row, equally spaced, `color: rgba(255,255,255,0.35)`, `font-size: 16px`, `font-weight: 700`, `letter-spacing: 0.02em`:
`SUPABASE` · `LIVEKIT` · `VERCEL` · `DOCKER` · `GITHUB`

Each has a small SVG-style geometric icon prefix. On hover: `color: rgba(255,255,255,0.7)`, `transition: 0.2s`

---

### SECTION 5: PROBLEM SECTION — "Merge conflicts arise every sprint"

Full-width card: `margin: 80px auto`, `max-width: 900px`, `border-radius: 24px`, glassmorphism card styles, `padding: 64px`

Two-column layout (`display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center`):

**Left column:**
- Small label: `"THE PROBLEM"` — monospace, `11px`, `letter-spacing: 0.14em`, `color: #4ade80`
- H2: `"Merge conflicts arise every sprint."` — `32px`, bold, white
- Body: `"'Works on my machine' kills hackathon momentum. Your team wastes hours on environment setup, Git conflicts, and switching between Slack, VSCode, and 5 other tabs. Synq eliminates all of it."` — `#94a3b8`
- Small `"See how →"` link in purple

**Right column — Floating pill labels** (the signature animation from the video):
5 pill-shaped labels connected by thin vertical `1px` lines (`rgba(99,102,241,0.3)`), suspended like a mobile. Each pill:
- `background: rgba(12,10,28,0.9)`, `border: 1px solid rgba(99,102,241,0.3)`, `border-radius: 100px`, `padding: 8px 18px`, `font-size: 13px`, `color: #e2e8f0`, `backdrop-filter: blur(8px)`
- Pills (top to bottom): `"It works on my machine"` · `"Container ready in 30s"` · `"All systems active"` · `"Merge approved ✓"` · `"Shipped to GitHub"`
- Each pill has individual float animation at different speeds and delays:
```css
@keyframes floatPill {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-10px) rotate(1deg); }
}
pill-1: animation: floatPill 3.2s ease-in-out infinite 0.0s
pill-2: animation: floatPill 2.8s ease-in-out infinite 0.4s
pill-3: animation: floatPill 3.5s ease-in-out infinite 0.8s
pill-4: animation: floatPill 2.6s ease-in-out infinite 1.2s
pill-5: animation: floatPill 3.8s ease-in-out infinite 0.2s
```
- The `"Container ready in 30s"` pill is highlighted: `background: rgba(99,102,241,0.25)`, `border-color: rgba(99,102,241,0.6)`, `color: #a5b4fc`, `box-shadow: 0 0 16px rgba(99,102,241,0.3)`
- The `"Merge approved ✓"` pill: `background: rgba(34,197,94,0.12)`, `border-color: rgba(34,197,94,0.4)`, `color: #86efac`

---

### SECTION 6: FEATURES OVERVIEW — "One platform. Every tool your team needs."

`padding: 100px 40px`, centered

Subtitle above: `"PLATFORM"` monospace uppercase label
H2: `"One platform. Every tool your team needs."` — centered, white, large
Body: `"From spinning up a Docker sandbox to pushing code to GitHub — everything lives in one browser tab."` — centered, `#94a3b8`, `max-width: 560px`

**Feature cards grid + central element layout:**
`display: grid; grid-template-columns: 1fr auto 1fr; gap: 40px; align-items: center; margin-top: 64px; max-width: 900px; margin-left: auto; margin-right: auto`

**Left column (2 feature cards stacked):**
Card 1 — `"Multiplayer Editor"`: Glassmorphism card, `padding: 28px`, icon (two overlapping cursors SVG in purple), title `18px bold white`, desc `13px #94a3b8 "Yjs CRDTs sync every keystroke in under 50ms. Live colored cursors per teammate."`
Card 2 — `"Consensus Merge"`: Same card style, icon (git-merge SVG with checkmarks), desc `"No rogue pushes. Code only ships to GitHub when every teammate votes Approve."`

**Center element — Docker Container Visualization:**
A `180px × 180px` square `border-radius: 24px`, `background: linear-gradient(135deg, rgba(67,56,202,0.6), rgba(99,102,241,0.8))`, `box-shadow: 0 0 60px rgba(99,102,241,0.5), 0 0 120px rgba(99,102,241,0.2)` with:
- Large `"🐳"` emoji or SVG whale, `48px`, centered
- Label below: `"node:20-alpine"` monospace, `11px`, `rgba(255,255,255,0.7)`
- Circuit board trace lines radiating outward (SVG `<path>` elements) in all 4 directions, `stroke: rgba(99,102,241,0.5)`, `stroke-width: 1.5`, `fill: none`
- Animated: `@keyframes pulseGlow { 0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.4)} 50%{box-shadow:0 0 80px rgba(99,102,241,0.7)} }`, `animation: pulseGlow 2.5s ease-in-out infinite`
- Circuit trace path animation: `stroke-dasharray: 200; stroke-dashoffset: 200; animation: drawTrace 2s linear infinite` — creates "electricity running through wires" effect

**Right column (2 feature cards stacked):**
Card 3 — `"Integrated Terminal"`: Icon (>_ terminal), desc `"xterm.js piped into your Docker container over WebSockets. Full bash, shared with your whole team."`
Card 4 — `"Voice Chat"`: Icon (mic waveform), desc `"LiveKit WebRTC audio channels built directly in. Talk while you type — zero tab switching."`

---

### SECTION 7: CAPABILITIES SECTION — "All-in-one platform capabilities"

`padding: 100px 40px`, `max-width: 1000px`, `margin: 0 auto`

H2 centered: `"All-in-one platform capabilities"` — white, `52px bold`

**2×2 bento grid** (`display: grid; grid-template-columns: 1fr 2fr; grid-template-rows: 1fr 1fr; gap: 16px; margin-top: 64px`):

**Cell A (top-left) — Purple brand card:**
`background: linear-gradient(145deg, #4338ca, #6366f1)`, `border-radius: 20px`, `padding: 40px 36px`
- White text, `28px bold`: `"Your world, simplified in one sandbox."`
- Smaller: `"Full visibility across your team's code, containers, and merges — with zero environment setup."` — `rgba(255,255,255,0.75)`
- Small decorative white dots scattered over the card background (5–8 dots, `3px`, `rgba(255,255,255,0.4)`)

**Cell B (top-right) — Dashboard screenshot card:**
Glassmorphism card containing the full Synq IDE mockup (same as hero but slightly different zoom, showing more of the interface), tilted `perspective(1200px) rotateY(-4deg) rotateX(2deg)`, `box-shadow: -20px 20px 60px rgba(0,0,0,0.5)`

**Cell C (bottom-left) — Merge activity card:**
Glassmorphism card showing a live activity feed:
- Header: `"Merge Activity"`, monospace, small
- 3 activity rows with avatar + name + action + timestamp:
  - 🟢 `"rushi.khalate proposed merge to main"` · `"2s ago"`
  - ✅ `"ayaan.mehta approved"` · `"just now"`
  - ⏳ `"shruti.kadam reviewing..."` · `"live"` (pulsing dot)
- At bottom: `"Discover →"` purple outline pill button

**Cell D (bottom-right) — AI SRE-style card:**
Dark card, white text:
- `"Consensus merge works like your best PR reviewer — automatically."` — `24px bold white`
- `"Every push requires unanimous team approval. No accidental overwrites. No broken main branches."` — `#94a3b8`

---

### SECTION 8: FOUNDATION SECTION — "Built on a rock-solid stack"

`padding: 100px 40px`, dark background

Label: `"FOUNDATION"`, monospace uppercase, `#4ade80`
H2: `"Built on a rock-solid stack"` centered, white
Subtitle: `"Every technology was chosen for one reason: it works at 3am during a hackathon."` — `#94a3b8`

**5 scattered/staggered feature cards** (`position: relative`, `height: 600px`, `max-width: 900px`, `margin: 64px auto 0`) — each card `position: absolute`:

Card 1 — `"Yjs CRDTs"` — `top: 0`, `left: 15%`, `transform: rotate(-4deg)` — `width: 200px`, glassmorphism, `border-radius: 20px`, `padding: 28px 24px`, center-aligned:
- Icon: purple rounded square (`56px`) with `Y` symbol in white, `background: linear-gradient(135deg, rgba(99,102,241,0.6), rgba(67,56,202,0.8))`
- Title `"Yjs CRDTs"`, `16px bold white`
- Desc `"Zero-conflict real-time sync across all editors"` `12px #94a3b8`

Card 2 — `"Supabase Realtime"` — `top: 20px`, `right: 12%`, `transform: rotate(3deg)` — same card style:
- Icon: teal/green gradient square with database icon
- `"Supabase Realtime"`, desc `"Presence, voting, and file-tree updates in real time"`

Card 3 — `"LiveKit WebRTC"` — `top: 200px`, `left: 8%`, `transform: rotate(-2deg)` — highlighted (purple fill):
- `background: linear-gradient(135deg, #4338ca, #6366f1)` (full purple card, like the "Integrations" card in the video)
- Icon: white mic waveform
- `"LiveKit WebRTC"`, desc `"Sub-100ms voice audio. No Discord tab required."`

Card 4 — `"Dockerode"` — `top: 240px`, `left: calc(50% - 100px)`, `transform: rotate(1deg)`:
- Icon: whale/container icon
- `"Dockerode"`, desc `"Dynamic container spin-up, isolated per project"`

Card 5 — `"Monaco + xterm.js"` — `top: 220px`, `right: 8%`, `transform: rotate(4deg)`:
- Icon: editor icon
- `"Monaco + xterm.js"`, desc `"Industry-grade editor and real bash terminal"`

**Scroll entrance animation on cards:**
```css
@keyframes cardDrop {
  from { opacity: 0; transform: translateY(-60px) rotate(var(--rot)); }
  to   { opacity: 1; transform: translateY(0)      rotate(var(--rot)); }
}
```
Each card uses `--rot` CSS variable set to its `rotate()` value, staggered `animation-delay: 0s, 0.15s, 0.3s, 0.45s, 0.6s`
Use `IntersectionObserver` to trigger when section enters viewport.

---

### SECTION 9: CTA SECTION — "Ready to ship without the chaos?"

Full-width section, `min-height: 100vh`, `display: flex; flex-direction: column; align-items: center; justify-content: center`

**Background:** The signature upward purple spotlight:
```css
background: radial-gradient(ellipse 700px 600px at 50% 100%, rgba(99,102,241,0.45) 0%, rgba(67,56,202,0.2) 30%, transparent 70%);
```
Plus additional star particles concentrated in this section.

**Content (centered):**
1. Small logo: `"SYNQ"` monospace, `14px`, `#94a3b8`, `letter-spacing: 0.2em`
2. H2: `"Ready to ship without the chaos?"` — `clamp(40px, 6vw, 72px)`, `font-weight: 800`, white, centered
3. Subtitle: `"Join the teams that stopped fighting Git and started actually shipping."` — `#94a3b8`
4. Primary CTA button (large): `"Start a Sandbox →"` — primary pill button style but larger (`padding: 18px 48px`, `font-size: 17px`)
   - Extra glow effect: the button has `position: relative` with a `::after` pseudo-element that is a blurred copy of the button, `z-index: -1`, `filter: blur(24px)`, creates the "light spilling below the button" effect seen in the video

**Footer links (minimal, below):**
`Solutions · Features · Pricing · Docs` on left, `Careers · GitHub · Privacy` on right
`"© 2025 Synq. Built for hackers."` centered, small, `#475569`

---

### SECTION 10: ANIMATION MASTER LIST

Implement ALL of the following animations:

1. **`@keyframes twinkle`** — star particles: `opacity 0.3 → 0.9 → 0.3`, random durations 2s–6s, random delays 0s–8s
2. **`@keyframes heroFloat`** — hero mockup: `translateY(0) → translateY(-8px) → translateY(0)`, `5s ease-in-out infinite`
3. **`@keyframes fadeUp`** — entrance on all hero text elements, staggered delays
4. **`@keyframes floatPill`** — each problem-section pill, `translateY` ± 10px, individual durations & delays
5. **`@keyframes pulseGlow`** — Docker center card box-shadow oscillation, `2.5s infinite`
6. **`@keyframes drawTrace`** — SVG circuit trace `stroke-dashoffset` from `200 → 0`, `2s linear infinite`, looped
7. **`@keyframes cardDrop`** — foundation cards entrance from above, triggered by `IntersectionObserver`
8. **`@keyframes navBlur`** — navbar background transitions from fully transparent to `rgba(0,0,0,0.8)` on scroll past 80px — use `window.addEventListener('scroll', ...)` to toggle class
9. **`@keyframes buttonPulse`** — primary CTA `::after` glow breathing: `opacity 0.6 → 1 → 0.6`, `3s infinite`
10. **`@keyframes voiceBars`** — 5 vertical bars in the IDE mockup's voice indicator, each `scaleY 0.3 → 1 → 0.3` at different speeds and delays

---

### SECTION 11: JAVASCRIPT REQUIREMENTS

```javascript
// 1. Generate star particles
function generateStars(count = 80) {
  const container = document.getElementById('stars');
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 300}vh;
      width: ${Math.random() * 2 + 1}px;
      height: ${Math.random() * 2 + 1}px;
      opacity: ${Math.random() * 0.5 + 0.2};
      animation-duration: ${Math.random() * 4 + 2}s;
      animation-delay: ${Math.random() * 8}s;
    `;
    container.appendChild(star);
  }
}

// 2. Navbar scroll behavior
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 80) {
    nav.classList.add('scrolled'); // adds darker bg + stronger blur
  } else {
    nav.classList.remove('scrolled');
  }
});

// 3. IntersectionObserver for staggered card entrance
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// 4. Terminal typewriter in hero mockup
const terminalLines = [
  '➜ npm install',
  'added 312 packages in 4.2s',
  '➜ npm run dev',
  '▲ Next.js 14 · localhost:3000',
  '➜ █'
];
// Type each line sequentially with 60ms per character, 400ms between lines

// 5. Live uptime counter in IDE header badge
let seconds = 2834;
setInterval(() => {
  seconds++;
  const h = String(Math.floor(seconds/3600)).padStart(2,'0');
  const m = String(Math.floor((seconds%3600)/60)).padStart(2,'0');
  const s = String(seconds%60).padStart(2,'0');
  document.getElementById('uptime').textContent = `${h}:${m}:${s}`;
}, 1000);
```

---

### SECTION 12: RESPONSIVE BREAKPOINTS

**1024px and below:**
- Hero H1 scales down via `clamp()`
- Feature grid: `grid-template-columns: 1fr` (stack vertically, center element becomes a divider)
- Bento: `grid-template-columns: 1fr` (all cells stack)
- Foundation cards: switch from absolute scatter layout to CSS grid `2×3`

**768px and below:**
- Navbar: hide center nav links, show hamburger menu
- Hero buttons: stack vertically (`flex-direction: column`, `align-items: center`)
- Hero mockup: show only the top header bar + a simplified 2-line editor preview
- Logo strip: `flex-wrap: wrap; gap: 24px`

**480px and below:**
- H1 min size `36px`
- Section padding reduces to `60px 20px`
- All cards: `border-radius: 12px`

---

### SECTION 13: SYNQ-SPECIFIC CONTENT MAP

Replace all Resq.io incident-management content with these exact Synq values:

| Resq.io Original | Synq Replacement |
|---|---|
| "Act fast when challenges arise" | "Ship together. Zero merge hell." |
| "Complete AI support for incidents" | "Multiplayer cloud IDE for hackathon teams" |
| "Book a demo" | "Start a Sandbox →" |
| "Try it free" | "Watch Demo ▶" |
| "Welcome in, Caroline" | "Welcome in, Rushi" |
| "Critical issues: 38" | "Container uptime: 00:47:32" |
| "Days spent: 26" | "Files synced: 4,218" |
| "Overnight work: 103" | "Merges voted: 7" |
| Incident frequency line chart | Code commit frequency line chart (green + purple lines) |
| "Triage / Fixing / Investigating" | "Multiplayer / Merges / Containers" |
| Summary panel | Active team panel (4 colored avatars with online dots) |
| Vulnerability card | Consensus merge vote card |
| "Unified incident platform" | "One platform. Every tool your team needs." |
| Response / On-call / AI SRE / Status Pages | Multiplayer Editor / Consensus Merge / Docker Sandbox / Voice Chat |
| AI chip center | Docker whale center |
| "Issues arise every day" | "Merge conflicts arise every sprint" |
| "Built on a solid foundation" | "Built on a rock-solid stack" |
| Insights / Catalog / Integrations / Workflows / AI | Yjs CRDTs / Supabase Realtime / LiveKit WebRTC / Dockerode / Monaco + xterm.js |
| "Book Your Demo Today" | "Ready to ship without the chaos?" |
| Resq.io footer | SYNQ footer |

---

### OUTPUT REQUIREMENTS

Produce a **single `index.html` file** containing:
- All HTML structure
- `<style>` block with complete CSS (no external CSS files)
- `<script>` block with complete JS (no external JS files)
- Google Fonts `<link>` in `<head>` (Inter + JetBrains Mono only)
- Inline SVG for all icons (no icon libraries)
- All animations via `@keyframes` in CSS
- Pixel-perfect at 1440px viewport width
- Smooth 60fps on Chrome/Safari
- No console errors
- Fully responsive down to 320px

Total estimated output: ~800–1200 lines of clean, commented HTML/CSS/JS.

---

### THINKING INSTRUCTIONS FOR claude-sonnet-4-6

Before writing any code, use your extended thinking budget to:
1. Map out the complete component tree mentally
2. Plan the CSS custom property system
3. Decide the exact absolute positions for all scattered elements
4. Pre-calculate all animation timing curves for visual harmony
5. Plan the JS module structure to avoid race conditions (stars → observer → typewriter → counter in order)
6. Consider the `z-index` stack carefully: stars (1) → nebula gradients (2) → content (10) → sticky nav (100)

Then output the complete file in one continuous block with no interruptions.
