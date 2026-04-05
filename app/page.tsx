"use client"

import React, { useEffect, useRef, useState, type CSSProperties } from "react"
import { DM_Serif_Display, DM_Sans } from "next/font/google"
import { useRouter } from "next/navigation"

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
})

// ─── Monochromatic Palette — warm neutral ──────────────────────────────────────
const T = {
  ink:    "hsl(30, 10%, 5%)",
  deep:   "hsl(30, 8%, 9%)",
  dark:   "hsl(30, 6%, 13%)",
  shade:  "hsl(30, 5%, 21%)",
  tone:   "hsl(30, 4%, 45%)",
  muted:  "hsl(30, 3%, 62%)",
  ghost:  "hsl(30, 2%, 78%)",
  silver: "hsl(30, 2%, 87%)",
  pale:   "hsl(30, 1%, 94%)",
  chalk:  "hsl(40, 20%, 98%)",
  bDark:  "hsl(30, 5%, 18%)",
  bLight: "hsl(30, 2%, 88%)",
} as const

// â”€â”€â”€ Scroll-reveal hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, on }
}

const reveal = (on: boolean, delay = 0): CSSProperties => ({
  opacity: on ? 1 : 0,
  transform: on ? "translateY(0)" : "translateY(20px)",
  transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
})

// â”€â”€â”€ Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Btn({ children, onClick, invert = false, outline = false }: {
  children: React.ReactNode
  onClick?: () => void
  invert?: boolean
  outline?: boolean
}) {
  const [hov, setHov] = useState(false)
  const base: CSSProperties = {
    padding: "0.78rem 2.2rem",
    fontSize: "0.7rem",
    fontFamily: "var(--font-dm-sans)",
    fontWeight: 500,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.22s ease",
  }
  if (outline) return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, border: `1px solid ${invert ? T.tone : T.ghost}`, backgroundColor: "transparent",
        color: invert ? (hov ? T.ink : T.shade) : (hov ? T.chalk : T.silver) }}
    >{children}</button>
  )
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, border: "none",
        backgroundColor: invert ? (hov ? T.shade : T.ink) : (hov ? T.tone : T.chalk),
        color: invert ? T.silver : T.ink }}
    >{children}</button>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function HomePage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  const featReveal    = useReveal()
  const philReveal    = useReveal()
  const metricsReveal = useReveal()
  const processReveal = useReveal()

  const features = [
    {
      label: "Order Management",
      headline: "Every order, under your command",
      body: "Real-time synchronisation across all vendor stations. No gaps, no delays â€” from customer tap to kitchen ticket in under 200ms.",
    },
    {
      label: "Revenue Intelligence",
      headline: "Numbers that tell the full story",
      body: "Peak hour patterns, vendor performance, item velocity, and retention data â€” consolidated into a single visual language of absolute clarity.",
    },
    {
      label: "Access Architecture",
      headline: "The right access, for the right role",
      body: "Granular permissions across Super Administrators, Court Managers, and Vendor Staff. Role-based trust, without compromise.",
    },
  ]

  const metrics = [
    { value: "2,400+",  unit: "Daily Transactions" },
    { value: "99.97%",  unit: "Platform Uptime" },
    { value: "< 200ms", unit: "Order Latency" },
    { value: "40+",     unit: "Active Food Courts" },
  ]

  const steps = [
    { n: "01", title: "Configure Your Court",   body: "Zones, vendors, menus, and staff â€” mapped with precision before a single order is placed." },
    { n: "02", title: "Onboard Your Vendors",   body: "Each vendor receives exactly the tools, data, and visibility their role requires. Nothing more." },
    { n: "03", title: "Operate with Certainty", body: "Every transaction processed. Every metric captured. Every decision informed by data that is always current." },
  ]

  const marqueeItems = [
    "Real-Time Orders", "Role-Based Access", "PWA Support", "Vendor Analytics",
    "Kitchen Queuing", "Revenue Reporting", "Mobile Optimised", "Multi-Court Management",
  ]

  return (
    <div
      className={`${dmSerif.variable} ${dmSans.variable}`}
      style={{ backgroundColor: T.ink, color: T.chalk, overflowX: "hidden", fontFamily: "var(--font-dm-sans)" }}
    >
      <style>{`
        @keyframes mo-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes mo-fade-up { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        .mo-hero-eyebrow { animation: mo-fade-up 0.9s ease 0.05s both }
        .mo-hero-h1      { animation: mo-fade-up 0.9s ease 0.2s both }
        .mo-hero-body    { animation: mo-fade-up 0.9s ease 0.45s both }
        .mo-feat-card:hover { background-color: hsl(30, 6%, 17%) !important }
        @media (max-width: 768px) {
          .mo-nav-links       { display: none !important }
          .mo-hero-sub-inner  { grid-template-columns: 1fr !important; gap: 1.5rem !important }
          .mo-feat-grid       { grid-template-columns: 1fr !important }
          .mo-phil-grid       { grid-template-columns: 1fr !important; gap: 3rem !important }
          .mo-metrics-grid    { grid-template-columns: repeat(2, 1fr) !important }
        }
      `}</style>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• NAV */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: `1px solid ${scrolled ? T.bDark : "transparent"}`,
        backgroundColor: scrolled ? `${T.ink}f2` : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.4s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, backgroundColor: T.chalk, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, backgroundColor: T.ink }} />
            </div>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: "0.82rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.chalk }}>Aahaar</span>
          </div>

          <nav className="mo-nav-links" style={{ display: "flex", gap: "2.5rem" }}>
            {[["Platform", "#platform"], ["Solutions", "#solutions"], ["Process", "#process"]].map(([label, href]) => (
              <a key={label} href={href} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.66rem", fontWeight: 400, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ghost, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = T.silver)}
                onMouseLeave={e => (e.currentTarget.style.color = T.ghost)}
              >{label}</a>
            ))}
          </nav>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <a href="/auth/login" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: T.ghost, textDecoration: "none" }}>Sign In</a>
            <Btn onClick={() => router.push("/auth/register")}>Get Access</Btn>
          </div>
        </div>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", padding: "6rem 2rem 4rem" }}>
        {/* Tonal vertical grid lines */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.035 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${(i + 1) * 10}%`, width: "1px", backgroundColor: T.silver }} />
          ))}
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div className="mo-hero-eyebrow">
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.6rem", letterSpacing: "0.4em", textTransform: "uppercase", color: T.muted, margin: "0 0 2.8rem" }}>
              Aahaar Â· Food Court Management Platform
            </p>
          </div>
          <div className="mo-hero-h1">
            <h1 style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontSize: "clamp(3.4rem, 8.5vw, 7.5rem)", letterSpacing: "-0.02em", lineHeight: 0.98, color: T.chalk, margin: "0 0 0.08em" }}>
              Total Command
            </h1>
            <h1 style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontStyle: "italic", fontSize: "clamp(3.4rem, 8.5vw, 7.5rem)", letterSpacing: "-0.02em", lineHeight: 0.98, color: T.silver, margin: "0 0 3.5rem" }}>
              of Every Kitchen.
            </h1>
          </div>
          <div className="mo-hero-body">
            <div className="mo-hero-sub-inner" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", alignItems: "start", maxWidth: 860 }}>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "1.05rem", lineHeight: 1.85, color: T.ghost, margin: 0 }}>
                The unified operating platform for food courts that refuse the compromise between operational precision and ease of use.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", paddingTop: "0.2rem" }}>
                <Btn onClick={() => router.push("/auth/register")}>Get Started</Btn>
                <Btn onClick={() => router.push("/auth/login")} outline>Sign In</Btn>
              </div>
            </div>

            {/* Bottom stats bar */}
            <div style={{ marginTop: "5rem", paddingTop: "2rem", borderTop: `1px solid ${T.bDark}`, display: "flex", gap: "3.5rem", flexWrap: "wrap" }}>
              {[["2,400+", "daily transactions"], ["99.97%", "uptime"], ["< 200ms", "order latency"]].map(([v, l]) => (
                <div key={v}>
                  <p style={{ fontFamily: "var(--font-dm-serif)", fontSize: "1.6rem", color: T.silver, margin: "0 0 0.2rem", letterSpacing: "-0.01em" }}>{v}</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, margin: 0 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MARQUEE BAND */}
      <div style={{ backgroundColor: T.deep, borderTop: `1px solid ${T.bDark}`, borderBottom: `1px solid ${T.bDark}`, padding: "1rem 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "mo-marquee 30s linear infinite", width: "max-content" }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: T.muted, padding: "0 3rem", whiteSpace: "nowrap" }}>
              {item} <span style={{ color: T.bDark, margin: "0 0.5rem" }}>â€”</span>
            </span>
          ))}
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FEATURES */}
      <section id="platform" style={{ backgroundColor: T.dark, padding: "7rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div ref={featReveal.ref}>
            {/* Section header */}
            <div style={{ ...reveal(featReveal.on, 0), marginBottom: "3.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `1px solid ${T.bDark}`, paddingBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.36em", textTransform: "uppercase", color: T.muted, margin: "0 0 0.9rem" }}>Platform Capabilities</p>
                <h2 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 400, color: T.chalk, margin: 0, letterSpacing: "-0.01em" }}>
                  Built for the <em style={{ fontStyle: "italic" }}>demands</em> of scale
                </h2>
              </div>
              <a href="/auth/register" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: T.ghost, textDecoration: "none", paddingBottom: "3px", borderBottom: `1px solid ${T.tone}`, flexShrink: 0 }}>
                All capabilities â†’
              </a>
            </div>

            {/* Cards â€” 1px gap creates tonal hairline borders */}
            <div className="mo-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", backgroundColor: T.bDark }}>
              {features.map((f, i) => (
                <div
                  key={i}
                  className="mo-feat-card"
                  style={{
                    ...reveal(featReveal.on, 100 + i * 120),
                    backgroundColor: T.dark,
                    padding: "2.8rem",
                    transition: "background-color 0.25s ease, opacity 0.8s ease, transform 0.8s ease",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.56rem", letterSpacing: "0.28em", textTransform: "uppercase", color: T.muted, margin: "0 0 1.8rem" }}>{String(i + 1).padStart(2, "0")}</p>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.26em", textTransform: "uppercase", color: T.muted, margin: "0 0 0.8rem" }}>{f.label}</p>
                  <h3 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "1.45rem", fontWeight: 400, color: T.chalk, lineHeight: 1.22, margin: "0 0 1rem", letterSpacing: "-0.01em" }}>{f.headline}</h3>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.9rem", lineHeight: 1.82, color: T.ghost, margin: 0 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PHILOSOPHY â€” INVERTED LIGHT SECTION */}
      <section id="solutions" style={{ backgroundColor: T.chalk, padding: "7rem 2rem" }}>
        <div
          ref={philReveal.ref}
          className="mo-phil-grid"
          style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "center" }}
        >
          <div style={reveal(philReveal.on, 0)}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.36em", textTransform: "uppercase", color: T.tone, margin: "0 0 1.2rem" }}>Our Conviction</p>
            <h2 style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontSize: "clamp(2rem, 4vw, 3.4rem)", letterSpacing: "-0.02em", color: T.ink, lineHeight: 1.1, margin: 0 }}>
              Operational clarity<br />
              <em style={{ fontStyle: "italic", color: T.tone }}>is the product.</em>
            </h2>
          </div>
          <div style={reveal(philReveal.on, 180)}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "1.05rem", lineHeight: 1.9, color: T.shade, margin: "0 0 1.3rem" }}>
              We built Aahaar because food courts deserve infrastructure as precise as any enterprise. The chaos of peak hours, fragmented vendor tools, and opaque revenue data is not inevitable â€” it is a solvable problem.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.95rem", lineHeight: 1.9, color: T.shade, margin: "0 0 2.5rem" }}>
              Every feature exists to remove friction between a decision and its execution. Nothing more. Nothing superfluous.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Btn invert onClick={() => router.push("/auth/register")}>Start Free Trial</Btn>
              <Btn invert outline onClick={() => router.push("/auth/login")}>Sign In</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• METRICS BAND */}
      <section style={{ backgroundColor: T.shade, borderTop: `1px solid ${T.bDark}`, borderBottom: `1px solid ${T.bDark}`, padding: "4.5rem 2rem" }}>
        <div
          ref={metricsReveal.ref}
          className="mo-metrics-grid"
          style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem" }}
        >
          {metrics.map((m, i) => (
            <div key={i} style={{ ...reveal(metricsReveal.on, i * 100), textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontFamily: "var(--font-dm-serif)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, color: T.silver, margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>{m.value}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.26em", textTransform: "uppercase", color: T.muted, margin: 0 }}>{m.unit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PROCESS */}
      <section id="process" style={{ backgroundColor: T.ink, padding: "7rem 2rem" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ marginBottom: "4rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.36em", textTransform: "uppercase", color: T.muted, margin: "0 0 1rem" }}>Getting Started</p>
            <h2 style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: T.chalk, letterSpacing: "-0.01em", margin: 0 }}>
              Three steps to <em style={{ fontStyle: "italic" }}>full operation.</em>
            </h2>
          </div>

          <div ref={processReveal.ref}>
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  ...reveal(processReveal.on, i * 140),
                  display: "grid",
                  gridTemplateColumns: "64px 1fr",
                  gap: "2.5rem",
                  padding: "3rem 0",
                  borderTop: `1px solid ${T.bDark}`,
                  alignItems: "start",
                }}
              >
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.6rem", letterSpacing: "0.2em", color: T.muted, margin: "0.65rem 0 0", fontWeight: 500 }}>{s.n}</p>
                <div>
                  <h3 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "1.7rem", fontWeight: 400, color: T.chalk, margin: "0 0 0.75rem", letterSpacing: "-0.01em" }}>{s.title}</h3>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "1rem", lineHeight: 1.85, color: T.ghost, margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.bDark}` }} />
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FINAL CTA */}
      <section style={{ backgroundColor: T.chalk, padding: "8rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.38em", textTransform: "uppercase", color: T.tone, margin: "0 0 1.5rem" }}>Ready to begin</p>
          <h2 style={{ fontFamily: "var(--font-dm-serif)", fontWeight: 400, fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", letterSpacing: "-0.02em", color: T.ink, lineHeight: 1.08, margin: "0 0 1.5rem" }}>
            Your court deserves<br />
            <em style={{ fontStyle: "italic", color: T.tone }}>this level of control.</em>
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "1rem", lineHeight: 1.85, color: T.shade, margin: "0 0 3rem" }}>
            Join the food court operators who chose precision over compromise. Set up in under an hour. Run with confidence from day one.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Btn invert onClick={() => router.push("/auth/register")}>Create Free Account</Btn>
            <Btn invert outline onClick={() => router.push("/auth/login")}>Sign In to Platform</Btn>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FOOTER */}
      <footer style={{ backgroundColor: T.deep, borderTop: `1px solid ${T.bDark}`, padding: "2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, backgroundColor: T.shade, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 8, height: 8, backgroundColor: T.ghost }} />
            </div>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: T.ghost }}>Aahaar CMS</span>
          </div>
          <div style={{ display: "flex", gap: "2rem" }}>
            {["Terms", "Privacy", "Contact"].map(l => (
              <a key={l} href="#" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.ghost, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem", letterSpacing: "0.12em", color: T.muted, margin: 0 }}>
            Â© {new Date().getFullYear()} Aahaar CMS
          </p>
        </div>
      </footer>
    </div>
  )
}

