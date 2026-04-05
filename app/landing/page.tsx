"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Users,
  Smartphone,
  Globe,
  ChevronDown,
  Star,
  Activity,
  Lock,
  Menu,
  X,
} from "lucide-react"

// ─── Animation variants ────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

// ─── Scroll-reveal wrapper ─────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeInUp}
      custom={delay}
    >
      {children}
    </motion.div>
  )
}

// ─── CTA Button ────────────────────────────────────────────────────────
function CTAButton({
  children,
  variant = "primary",
  onClick,
  fullWidth = false,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
  onClick?: () => void
  fullWidth?: boolean
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium text-sm tracking-wide uppercase transition-all duration-200 rounded-lg min-h-[48px] px-8"
  const variants = {
    primary:
      "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25 hover:shadow-orange-600/40 hover:-translate-y-0.5",
    secondary:
      "bg-white hover:bg-orange-50 text-orange-700 border-2 border-orange-200 hover:border-orange-300",
    ghost: "text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-4",
  }

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </button>
  )
}

// ─── Section wrapper ───────────────────────────────────────────────────
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`}>
      {children}
    </section>
  )
}

// ─── Badge ─────────────────────────────────────────────────────────────
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-100 text-orange-700">
      {children}
    </span>
  )
}

// ─── FAQ Item ──────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-semibold text-gray-900 pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-gray-600 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  const navLinks = [
    ["Features", "#features"],
    ["How It Works", "#how-it-works"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ════════════════════════════════════════════════════ NAV */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <span className="text-lg font-bold tracking-tight">Aahaar</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push("/auth/login")}
                className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
              >
                Sign In
              </button>
              <CTAButton onClick={() => router.push("/auth/register")}>
                Get Started Free
              </CTAButton>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenu(false)}
                  className="block text-sm text-gray-600 hover:text-orange-600 py-2"
                >
                  {label}
                </a>
              ))}
              <div className="pt-2 space-y-2">
                <CTAButton
                  fullWidth
                  onClick={() => {
                    router.push("/auth/register")
                    setMobileMenu(false)
                  }}
                >
                  Get Started Free
                </CTAButton>
                <button
                  onClick={() => {
                    router.push("/auth/login")
                    setMobileMenu(false)
                  }}
                  className="w-full text-sm text-gray-600 py-2"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════ HERO */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-100/40 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge>Food Court Management Platform</Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-gray-900"
              >
                Run your food court{" "}
                <span className="text-orange-600">like a well-oiled machine</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl"
              >
                Real-time orders, revenue intelligence, and role-based control — one platform
                that transforms chaotic food courts into precision-run operations. Setup in under
                an hour.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row gap-3"
              >
                <CTAButton onClick={() => router.push("/auth/register")}>
                  Start Managing Free
                  <ArrowRight className="w-4 h-4" />
                </CTAButton>
                <CTAButton variant="secondary" onClick={() => router.push("/auth/login")}>
                  See It in Action
                </CTAButton>
              </motion.div>

              {/* Social proof micro-bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center gap-4 text-sm text-gray-500"
              >
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-orange-200 border-2 border-white flex items-center justify-center text-xs font-medium text-orange-700"
                    >
                      {["A", "R", "M", "S"][i]}
                    </div>
                  ))}
                </div>
                <span>
                  Trusted by <strong className="text-gray-700">40+ food courts</strong>
                </span>
              </motion.div>
            </div>

            {/* Right: Hero visual — outcome illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-6">
                {/* Mock dashboard */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Today&apos;s Revenue
                    </p>
                    <p className="text-3xl font-bold text-gray-900">₹48,352</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +12.5%
                  </div>
                </div>

                {/* Chart bars */}
                <div className="flex items-end gap-2 h-32 mb-4">
                  {[35, 55, 40, 70, 85, 60, 90, 75, 95, 80, 65, 88].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                      className={`flex-1 rounded-t ${
                        i === 8 ? "bg-orange-500" : "bg-orange-100"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>10 PM</span>
                </div>

                {/* Live orders ticker */}
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Live Orders
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { item: "Butter Chicken x2", vendor: "Spice Kitchen", time: "2m ago" },
                      { item: "Veg Biryani x1", vendor: "Hyderabad House", time: "4m ago" },
                      { item: "Paneer Roll x3", vendor: "Rolls Express", time: "5m ago" },
                    ].map((order, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                            <span className="text-xs">🍽</span>
                          </div>
                          <span className="font-medium text-gray-800">{order.item}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{order.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating metric cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Uptime</p>
                    <p className="text-sm font-bold text-gray-900">99.97%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Order Speed</p>
                    <p className="text-sm font-bold text-gray-900">&lt; 200ms</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ SOCIAL PROOF BAR */}
      <Section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-sm text-gray-500 font-medium">
                Powering operations across India&apos;s busiest food courts
              </p>
            </div>
          </Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "2,400+", label: "Daily Transactions" },
              { value: "99.97%", label: "Platform Uptime" },
              { value: "< 200ms", label: "Order Latency" },
              { value: "40+", label: "Active Food Courts" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                custom={i * 0.1}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-orange-600">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ PROBLEM */}
      <Section id="problem">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <Badge>The Problem</Badge>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Your food court is bleeding revenue.
                <br />
                <span className="text-gray-400">You just can&apos;t see it yet.</span>
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Peak hour hits. Orders pile up. Vendors scramble. Customers wait. And somewhere in
                the chaos, revenue slips through the cracks you can&apos;t track.
              </p>
            </Reveal>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Flying Blind on Data",
                desc: "Making decisions on yesterday&apos;s spreadsheets while today&apos;s opportunities vanish.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Vendors Without Tools",
                desc: "Guessing demand, missing peak patterns, losing repeat customers every single day.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Tools That Don&apos;t Talk",
                desc: "Every platform is a different login, different workflow, different headache. Nothing connects.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                custom={i * 0.15}
                className="bg-red-50/50 rounded-2xl p-8 border border-red-100"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ FEATURES */}
      <Section id="features" className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <Badge>The Solution</Badge>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                One platform. Complete control. Zero guesswork.
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                From the moment a customer taps &ldquo;order&rdquo; to the final revenue report —
                everything flows through a single, elegant system built for scale.
              </p>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Real-Time Order Command",
                desc: "Every order synced across all vendor stations in under 200ms. From customer tap to kitchen ticket — no gaps, no delays.",
                color: "orange",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Revenue Intelligence",
                desc: "Peak hour patterns, vendor performance, item velocity — consolidated into dashboards so clear you&apos;ll spot opportunities instantly.",
                color: "blue",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Access Architecture",
                desc: "Granular permissions across Admins, Managers, and Staff. Everyone sees exactly what they need. Nothing more.",
                color: "green",
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: "PWA Ready",
                desc: "Native app experience without the app store. Works offline, syncs when connected, runs on any device.",
                color: "purple",
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Multi-Court Scale",
                desc: "Whether you run one court or forty, Aahaar scales with you. Centralized oversight with localized control.",
                color: "amber",
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Enterprise Security",
                desc: "Role-based access, encrypted communications, and enterprise-grade protocols protecting your data at every level.",
                color: "slate",
              },
            ].map((feature, i) => {
              const colorMap: Record<string, { bg: string; icon: string }> = {
                orange: { bg: "bg-orange-50", icon: "text-orange-600" },
                blue: { bg: "bg-blue-50", icon: "text-blue-600" },
                green: { bg: "bg-green-50", icon: "text-green-600" },
                purple: { bg: "bg-purple-50", icon: "text-purple-600" },
                amber: { bg: "bg-amber-50", icon: "text-amber-600" },
                slate: { bg: "bg-slate-50", icon: "text-slate-600" },
              }
              const c = colorMap[feature.color]
              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  custom={i * 0.1}
                  className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:shadow-gray-100/80 transition-shadow duration-300"
                >
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center ${c.icon} mb-5`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ HOW IT WORKS */}
      <Section id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <Badge>How It Works</Badge>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Three steps to full operation
              </h2>
            </div>
          </Reveal>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Configure Your Court",
                desc: "Zones, vendors, menus, and staff — mapped with precision before a single order is placed. Setup takes under an hour.",
                icon: <Globe className="w-6 h-6" />,
              },
              {
                step: "02",
                title: "Onboard Your Vendors",
                desc: "Each vendor receives exactly the tools, data, and visibility their role requires. No training manuals needed.",
                icon: <Users className="w-6 h-6" />,
              },
              {
                step: "03",
                title: "Operate with Certainty",
                desc: "Every transaction processed. Every metric captured. Every decision informed by data that&apos;s always current.",
                icon: <Activity className="w-6 h-6" />,
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div
                  className={`flex gap-6 md:gap-10 ${
                    i < 2 ? "pb-12 mb-12 border-b border-gray-100" : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <div className="text-center mt-12">
              <CTAButton onClick={() => router.push("/auth/register")}>
                Start Your Setup Today
                <ArrowRight className="w-4 h-4" />
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ TESTIMONIALS */}
      <Section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <Badge>Social Proof</Badge>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Numbers don&apos;t lie. Neither do our operators.
              </h2>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {[
              {
                quote:
                  "Before Aahaar, we were managing 12 vendors with spreadsheets and WhatsApp. Now I can see every order, every rupee, every peak hour pattern from my phone. It&apos;s not just better — it&apos;s a different business.",
                name: "Court Manager",
                role: "Tier-1 Mall Food Court",
                rating: 5,
              },
              {
                quote:
                  "Our vendor complaints dropped 73% in the first month. Not because we changed our vendors — because we finally gave them tools that work.",
                name: "Operations Head",
                role: "Multi-Location Food Courts",
                rating: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                custom={i * 0.15}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <blockquote className="text-gray-700 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-sm font-semibold text-orange-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ PRICING */}
      <Section id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <Badge>Pricing</Badge>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Plans that scale with your court
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Start free. Upgrade when you&apos;re ready. No credit card required.
              </p>
            </div>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {[
              {
                name: "Starter",
                price: "Free",
                desc: "For single-court operators getting started",
                features: [
                  "Up to 5 vendors",
                  "Real-time order management",
                  "Basic analytics dashboard",
                  "Email support",
                ],
                cta: "Start Free",
                highlighted: false,
              },
              {
                name: "Professional",
                price: "₹2,999",
                period: "/month",
                desc: "For growing courts that need the full picture",
                features: [
                  "Up to 20 vendors",
                  "Advanced revenue analytics",
                  "Role-based access control",
                  "Priority support",
                  "PWA deployment",
                ],
                cta: "Start Free Trial",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                desc: "For operators managing multiple courts at scale",
                features: [
                  "Unlimited vendors",
                  "Multi-court management",
                  "Custom integrations",
                  "Dedicated account manager",
                  "White-label options",
                ],
                cta: "Talk to Sales",
                highlighted: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                custom={i * 0.15}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-orange-600 text-white shadow-xl shadow-orange-600/20 ring-4 ring-orange-600 ring-offset-2 relative"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3
                  className={`text-lg font-semibold ${
                    plan.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-orange-200" : "text-gray-500"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-2 text-sm ${
                    plan.highlighted ? "text-orange-100" : "text-gray-500"
                  }`}
                >
                  {plan.desc}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.highlighted ? "text-orange-200" : "text-green-500"
                        }`}
                      />
                      <span className={plan.highlighted ? "text-orange-50" : "text-gray-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <CTAButton
                  variant={plan.highlighted ? "secondary" : "primary"}
                  fullWidth
                  onClick={() => router.push("/auth/register")}
                >
                  {plan.cta}
                </CTAButton>
              </motion.div>
            ))}
          </motion.div>

          <Reveal delay={0.4}>
            <p className="text-center mt-8 text-sm text-gray-500">
              <Clock className="w-4 h-4 inline mr-1" />
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ FAQ */}
      <Section id="faq" className="bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <Badge>FAQ</Badge>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Common questions
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div>
              <FAQItem
                q="How long does setup take?"
                a="Most courts are fully operational within an hour. Our guided setup walks you through zones, vendors, menus, and staff configuration step by step."
              />
              <FAQItem
                q="Do vendors need training?"
                a="No. Aahaar is designed to be intuitive. Vendors receive exactly the tools and visibility they need for their role — nothing complex, nothing overwhelming."
              />
              <FAQItem
                q="What happens if internet goes down?"
                a="Aahaar works offline through PWA technology. Orders queue locally and sync automatically when connectivity returns. Zero data loss, zero downtime."
              />
              <FAQItem
                q="Can I manage multiple food courts?"
                a="Yes. Our Enterprise plan supports unlimited courts with centralized oversight and localized control for each location."
              />
              <FAQItem
                q="How do payments work?"
                a="Aahaar integrates with Razorpay for seamless payment processing. All transactions are tracked, reconciled, and reported in real-time."
              />
              <FAQItem
                q="Is my data secure?"
                a="Absolutely. Role-based access, encrypted communications, and enterprise-grade security protocols protect your data at every level."
              />
              <FAQItem
                q="Can I try before I commit?"
                a="Yes. Start with our free plan — no credit card required. Upgrade when you&apos;re ready to unlock the full platform."
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ FINAL CTA */}
      <Section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <Badge>
              <span className="text-orange-300 bg-orange-900/50">Ready to begin</span>
            </Badge>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-6 text-3xl md:text-5xl font-bold tracking-tight">
              Your court deserves{" "}
              <span className="text-orange-400">this level of control</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Join the food court operators who chose precision over compromise. Set up in under an
              hour. Run with confidence from day one. Every day you wait is another day of lost
              revenue.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <CTAButton
                onClick={() => router.push("/auth/register")}
              >
                Create Your Free Account
                <ArrowRight className="w-4 h-4" />
              </CTAButton>
              <CTAButton
                variant="ghost"
                onClick={() => router.push("/auth/login")}
              >
                Sign In to Platform
              </CTAButton>
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required · No commitment · Cancel anytime
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════════ FOOTER */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-sm" />
              </div>
              <span className="text-sm font-semibold text-white">Aahaar CMS</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Aahaar CMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
