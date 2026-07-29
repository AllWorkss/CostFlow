"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, FileSpreadsheet, Zap, Shield, BarChart2,
  Sparkles, Activity, ArrowRight, ChevronRight,
  Factory, GraduationCap, ShoppingCart, Globe, HardHat,
  Sun, Moon, Menu, X, type LucideProps,
} from "lucide-react";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { useCostingStore } from "@/lib/store/costingStore";
import type { Domain } from "@/types/costing";

/* ── Icon maps ── */
const DOMAIN_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  manufacturing: Factory, school: GraduationCap,
  retail: ShoppingCart, ecommerce: Globe, construction: HardHat,
};

const FEATURES: { icon: React.ComponentType<LucideProps>; title: string; desc: string; color: string }[] = [
  { icon: FileSpreadsheet, title: "Live Excel Export",      desc: "Real =SUM() & =PRODUCT() formulas, not hardcoded values",               color: "#10B981" },
  { icon: Activity,        title: "ML Anomaly Detection",   desc: "Z-score analysis flags unusual cost spikes automatically",               color: "#8B5CF6" },
  { icon: BarChart2,       title: "React Flow Diagram",     desc: "Interactive costing flow map — click any node to see its formula",       color: "#3B82F6" },
  { icon: Sparkles,        title: "AI Price Recommender",   desc: "Break-even optimizer with target margin & elasticity analysis",          color: "#F59E0B" },
  { icon: Shield,          title: "5 Industry Presets",     desc: "Manufacturing, Retail, School, E-Commerce & Construction ready",         color: "#EF4444" },
  { icon: Zap,             title: "Dynamic Formula Engine", desc: "Custom variable expressions computed in real-time as you type",          color: "#06B6D4" },
];

const STATS = [
  { value: "5",     label: "Industry Presets" },
  { value: "27",    label: "Unit Conversions"  },
  { value: "AI/ML", label: "Anomaly Detect"   },
  { value: "3",     label: "Excel Sheets"      },
];

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };
const rise    = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function LandingPage() {
  const router = useRouter();
  const { setDomain } = useCostingStore();
  const [selected, setSelected] = useState<Domain>("manufacturing");
  const [theme, setTheme]       = useState<"dark"|"light">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cf-theme") as "dark"|"light" | null;
    setTheme(saved ?? "dark");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("cf-theme", theme);
  }, [theme, mounted]);

  const launch = () => { setDomain(selected); router.push("/dashboard"); };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "dark" : ""}`} style={{ background: "var(--bg)" }}>

      {/* ══════ NAVBAR ══════ */}
      <header className="sticky top-0 z-50 glass border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
              <TrendingUp color="white" size={16} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg g-text">CostFlow</span>
              <span className="badge badge-blue hidden sm:inline-flex">CSF Costing</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="btn btn-icon">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={launch} className="btn btn-primary">
              Open Dashboard <ArrowRight size={15} />
            </button>
          </div>

          {/* Mobile actions */}
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="btn btn-icon">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="btn btn-icon">
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            className="sm:hidden border-t px-4 py-4 space-y-2" style={{ borderColor:"var(--border)", background:"var(--bg-card)" }}>
            <button onClick={launch} className="btn btn-primary w-full justify-center">
              Launch Dashboard <ArrowRight size={15} />
            </button>
            <button onClick={() => router.push("/flow")} className="btn btn-ghost w-full justify-center">
              View Flow Diagram
            </button>
          </motion.div>
        )}
      </header>

      {/* ══════ HERO ══════ */}
      <motion.section initial="hidden" animate="visible" variants={stagger}
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12 text-center">

        <motion.div variants={rise}
          className="inline-flex items-center gap-2 mb-5 badge badge-blue text-xs sm:text-sm px-4 py-2">
          <Sparkles size={13} /> Universal Multi-Industry Costing Platform
        </motion.div>

        <motion.h1 variants={rise}
          className="font-black leading-tight mb-5"
          style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", color: "var(--text-1)" }}>
          <span className="g-text">CostFlow</span><br />
          <span style={{ fontSize: "clamp(1.3rem, 3.5vw, 2.2rem)", fontWeight: 700, opacity: 0.8 }}>
            CSF Costing System
          </span>
        </motion.h1>

        <motion.p variants={rise}
          className="max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)", color: "var(--text-2)" }}>
          AI/ML powered costing for <strong style={{ color:"var(--text-1)" }}>Manufacturing, Retail,
          Education, E-Commerce & Construction.</strong> Live Excel export with real{" "}
          <code className="mono text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded text-sm">=SUM()</code>{" "}
          formulas, interactive flow diagrams & anomaly detection.
        </motion.p>

        <motion.div variants={rise}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <button onClick={launch}
            className="btn btn-primary pulse-glow text-base px-8 py-3 sm:py-3.5">
            <Zap size={17} /> Launch Dashboard
          </button>
          <button onClick={() => router.push("/flow")}
            className="btn btn-ghost text-base px-8 py-3">
            <BarChart2 size={17} /> View Flow Diagram
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={rise}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14">
          {STATS.map(s => (
            <div key={s.label} className="metric-card text-center py-4">
              <div className="font-black g-text mb-1" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
                {s.value}
              </div>
              <div className="text-xs sm:text-sm" style={{ color:"var(--text-3)" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ══════ DOMAIN SELECTOR ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="text-center mb-8">
          <h2 className="font-bold mb-2" style={{ fontSize:"clamp(1.3rem,3vw,1.8rem)", color:"var(--text-1)" }}>
            Select Your Industry
          </h2>
          <p className="text-sm sm:text-base" style={{ color:"var(--text-2)" }}>
            Each preset auto-populates the correct costing blocks for your domain
          </p>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="sm:hidden overflow-x-auto pb-3 -mx-4 px-4">
          <div className="flex gap-3" style={{ width: "max-content" }}>
            {DOMAIN_PRESETS.map(preset => {
              const Icon = DOMAIN_ICONS[preset.id] ?? Factory;
              const active = selected === preset.id;
              return (
                <button key={preset.id} onClick={() => setSelected(preset.id as Domain)}
                  className={`domain-card text-left ${active ? "active" : ""}`}
                  style={{ width: 180, background: active ? `${preset.color}12` : "var(--bg-card)",
                    borderColor: active ? preset.color : "var(--border)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                    style={{ background: `${preset.color}18` }}>
                    <Icon size={20} color={preset.color} />
                  </div>
                  <div className="font-bold text-sm mb-1" style={{ color: active ? preset.color : "var(--text-1)" }}>
                    {preset.label}
                  </div>
                  {active && (
                    <div className="flex items-center gap-1 text-xs font-semibold mt-1" style={{ color: preset.color }}>
                      <ChevronRight size={13} /> Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid on ≥ sm */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {DOMAIN_PRESETS.map(preset => {
            const Icon = DOMAIN_ICONS[preset.id] ?? Factory;
            const active = selected === preset.id;
            return (
              <motion.button key={preset.id} onClick={() => setSelected(preset.id as Domain)}
                whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                className={`domain-card text-left ${active ? "active" : ""}`}
                style={{ background: active ? `${preset.color}12` : "var(--bg-card)",
                  borderColor: active ? preset.color : "var(--border)",
                  boxShadow: active ? `0 0 0 1px ${preset.color}, 0 12px 32px ${preset.color}25` : undefined }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${preset.color}18` }}>
                  <Icon size={22} color={preset.color} />
                </div>
                <div className="font-bold text-sm mb-1.5" style={{ color: active ? preset.color : "var(--text-1)" }}>
                  {preset.label}
                </div>
                <p className="text-xs leading-relaxed" style={{ color:"var(--text-3)" }}>
                  {preset.description}
                </p>
                {active && (
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: preset.color }}>
                    <ChevronRight size={12} /> Selected
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="text-center mt-6">
          <button onClick={launch} className="btn btn-primary text-base px-10 py-3.5">
            Start with {DOMAIN_PRESETS.find(p => p.id === selected)?.label.split("—")[0].trim()}
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* ══════ FEATURES GRID ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="font-bold text-center mb-8"
          style={{ fontSize:"clamp(1.2rem,3vw,1.7rem)", color:"var(--text-1)" }}>
          Platform Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} whileHover={{ y:-3 }} className="card flex gap-4 p-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:`${f.color}14` }}>
                  <Icon size={22} color={f.color} />
                </div>
                <div>
                  <div className="font-bold mb-1 text-sm sm:text-base" style={{ color:"var(--text-1)" }}>{f.title}</div>
                  <div className="text-xs sm:text-sm leading-relaxed" style={{ color:"var(--text-2)" }}>{f.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════ PHASE ROADMAP TEASER ══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="card p-6 sm:p-8"
          style={{ background: isDark ? "linear-gradient(135deg,rgba(59,130,246,0.06),rgba(6,182,212,0.06))" : "linear-gradient(135deg,#EFF6FF,#F0FDFA)",
            borderColor: "rgba(59,130,246,0.2)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="badge badge-blue mb-3">🗺️ Roadmap — 10 Phases Planned</div>
              <h3 className="font-bold mb-1" style={{ fontSize:"clamp(1.1rem,2.5vw,1.4rem)", color:"var(--text-1)" }}>
                Coming Soon: Auth, Subscriptions & Gemini AI
              </h3>
              <p className="text-sm" style={{ color:"var(--text-2)" }}>
                Google Login · Razorpay / Stripe · Gemini NLP Costing · Team Collaboration · PWA · WhatsApp export
              </p>
            </div>
            <button onClick={launch} className="btn btn-primary flex-shrink-0">
              Start Free <ArrowRight size={15} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            {["Phase 2: Mobile UI","Phase 3: Google Auth","Phase 4: Subscriptions","Phase 5: Gemini AI",
              "Phase 6: Projects","Phase 7: Analytics","Phase 8: API","Phase 9: PWA","Phase 10: Enterprise"].map(p => (
              <span key={p} className="badge badge-blue text-xs">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t py-6 text-center text-sm" style={{ borderColor:"var(--border)", color:"var(--text-3)" }}>
        <span className="g-text font-bold">CostFlow</span> — CSF Costing System ·
        Built with Next.js 16 + AI/ML ·{" "}
        <a href="https://github.com/AllWorkss/CostFlow" target="_blank" rel="noopener"
          className="hover:underline" style={{ color:"var(--cf-blue)" }}>
          GitHub ↗
        </a>
      </footer>
    </div>
  );
}
