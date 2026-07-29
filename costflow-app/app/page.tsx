"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, FileSpreadsheet, Zap, Shield, BarChart2,
  ArrowRight, ChevronRight, Sparkles, Activity,
  Factory, GraduationCap, ShoppingCart, Globe, HardHat,
  type LucideProps,
} from "lucide-react";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { useCostingStore } from "@/lib/store/costingStore";
import type { Domain } from "@/types/costing";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Factory, GraduationCap, ShoppingCart, Globe, HardHat,
};

const FEATURES: { icon: React.ComponentType<LucideProps>; title: string; desc: string; color: string }[] = [
  { icon: FileSpreadsheet, title: "Live Excel Export", desc: "Real =SUM() & =PRODUCT() formulas, not hardcoded values", color: "#10B981" },
  { icon: Activity, title: "ML Anomaly Detection", desc: "Z-score statistical analysis highlights unusual cost inputs", color: "#8B5CF6" },
  { icon: BarChart2, title: "React Flow Diagram", desc: "Interactive costing architecture visualization with node drilldown", color: "#3B82F6" },
  { icon: Sparkles, title: "AI Price Recommender", desc: "Break-even optimizer with target margin and elasticity analysis", color: "#F59E0B" },
  { icon: Shield, title: "5 Industry Presets", desc: "Manufacturing, Retail, School, E-Commerce, Construction", color: "#EF4444" },
  { icon: Zap, title: "Dynamic Formula Engine", desc: "User-defined variable expressions computed in real-time", color: "#06B6D4" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const router = useRouter();
  const { setDomain } = useCostingStore();
  const [selectedDomain, setSelectedDomain] = useState<Domain>("manufacturing");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cf-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
    else setTheme("dark");
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("cf-theme", theme);
    }
  }, [theme, mounted]);

  const handleLaunch = () => {
    setDomain(selectedDomain);
    router.push("/dashboard");
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}
      style={{ background: theme === "dark" ? "#0F1629" : "#F8FAFF" }}>

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: theme === "dark" ? "rgba(59,130,246,0.15)" : "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3B82F6, #06B6D4)" }}>
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <span className="font-bold text-lg gradient-text">CostFlow</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full cf-badge cf-badge-blue">CSF Costing</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="cf-btn-secondary text-sm py-2 px-4">
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
          <button onClick={handleLaunch} className="cf-btn-primary">
            Open Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.section initial="hidden" animate="visible" variants={containerVariants}
        className="max-w-7xl mx-auto px-8 pt-16 pb-12 text-center">
        <motion.div variants={itemVariants}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium cf-badge cf-badge-blue">
          <Sparkles size={14} /> Universal Multi-Industry Costing Platform
        </motion.div>

        <motion.h1 variants={itemVariants}
          className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          style={{ color: theme === "dark" ? "#F1F5F9" : "#0F1629" }}>
          <span className="gradient-text">CostFlow</span><br />
          <span className="text-4xl md:text-5xl font-bold opacity-80">CSF Costing System</span>
        </motion.h1>

        <motion.p variants={itemVariants}
          className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
          style={{ color: theme === "dark" ? "#94A3B8" : "#475569" }}>
          AI/ML powered universal costing for <strong>Manufacturing, Retail, Education, E-Commerce & Construction.</strong>
          {" "}Live Excel export with real <code className="font-mono text-blue-400">=SUM()</code> formulas,
          interactive flow diagrams & anomaly detection.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-16">
          <button onClick={handleLaunch} className="cf-btn-primary text-base px-8 py-3 pulse-glow">
            <Zap size={18} /> Launch Dashboard
          </button>
          <button onClick={() => router.push("/flow")} className="cf-btn-secondary text-base px-8 py-3">
            <BarChart2 size={18} /> View Flow Diagram
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { value: "5", label: "Industry Presets" },
            { value: "3", label: "Excel Sheets" },
            { value: "AI/ML", label: "Anomaly Detect" },
            { value: "∞", label: "Custom Blocks" },
          ].map((stat) => (
            <div key={stat.label} className="metric-card text-center">
              <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
              <div className="text-sm" style={{ color: theme === "dark" ? "#64748B" : "#94A3B8" }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Domain Selector ── */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-2xl font-bold mb-2 text-center gradient-text">Select Your Industry</h2>
        <p className="text-center mb-8 text-sm" style={{ color: "#64748B" }}>
          Each preset auto-populates the correct costing blocks for your domain
        </p>
        <motion.div initial="hidden" animate="visible" variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
          {DOMAIN_PRESETS.map((preset) => {
            const Icon = ICON_MAP[preset.icon] ?? Factory;
            const isSelected = selectedDomain === preset.id;
            return (
              <motion.div key={preset.id} variants={itemVariants}
                onClick={() => setSelectedDomain(preset.id as Domain)}
                className={`domain-card p-5 cursor-pointer border-2 transition-all ${isSelected ? "active" : ""}`}
                style={{
                  background: theme === "dark"
                    ? isSelected ? `${preset.color}18` : "#1A2440"
                    : isSelected ? `${preset.color}0D` : "#FFFFFF",
                  borderColor: isSelected ? preset.color : theme === "dark" ? "#1E3A5F" : "#E2E8F0",
                  boxShadow: isSelected ? `0 0 0 2px ${preset.color}, 0 12px 32px ${preset.color}30` : "none",
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${preset.color}20` }}>
                  <Icon size={22} color={preset.color} />
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: isSelected ? preset.color : theme === "dark" ? "#F1F5F9" : "#0F1629" }}>
                  {preset.label}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
                  {preset.description}
                </p>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: preset.color }}>
                    <ChevronRight size={14} /> Selected
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center">
          <button onClick={handleLaunch}
            className="cf-btn-primary text-base px-10 py-3">
            Start Costing with {DOMAIN_PRESETS.find(p => p.id === selectedDomain)?.label} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="max-w-7xl mx-auto px-8 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: theme === "dark" ? "#F1F5F9" : "#0F1629" }}>
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title}
                whileHover={{ y: -4 }}
                className="metric-card flex gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${feature.color}18` }}>
                  <Icon size={22} color={feature.color} />
                </div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: theme === "dark" ? "#F1F5F9" : "#0F1629" }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: "#64748B" }}>{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center pb-8 text-sm" style={{ color: "#475569" }}>
        <span className="gradient-text font-bold">CostFlow</span> — CSF Costing System · Built with Next.js 14 + AI/ML
      </footer>
    </div>
  );
}
