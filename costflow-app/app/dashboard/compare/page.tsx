"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, GitCompare, RefreshCw, Layers } from "lucide-react";
import Link from "next/link";
import { useCostingStore } from "@/lib/store/costingStore";

type ProjectStub = {
  id: string;
  name: string;
  updatedAt: string;
};

export default function ComparePage() {
  const [projects, setProjects] = useState<ProjectStub[]>([]);
  const [projectA, setProjectA] = useState<string>("");
  const [projectB, setProjectB] = useState<string>("");
  
  const [dataA, setDataA] = useState<any>(null);
  const [dataB, setDataB] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (projectA) {
      fetch(`/api/projects/${projectA}`)
        .then(res => res.json())
        .then(p => setDataA(p.data ? JSON.parse(p.data) : null));
    } else {
      setDataA(null);
    }
  }, [projectA]);

  useEffect(() => {
    if (projectB) {
      fetch(`/api/projects/${projectB}`)
        .then(res => res.json())
        .then(p => setDataB(p.data ? JSON.parse(p.data) : null));
    } else {
      setDataB(null);
    }
  }, [projectB]);

  const renderCostSheet = (data: any, label: string) => {
    if (!data) return <div className="text-gray-400 dark:text-gray-600 text-center py-20 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">Select a project to view</div>;
    
    // Quick summary calculation
    const totalCost = data.blocks?.filter((b: any) => b.enabled).reduce((acc: number, b: any) => acc + (b.result || 0), 0) || 0;
    const margin = data.targetMarginPct || 0.25;
    const sellingPrice = totalCost / (1 - margin);
    const profit = sellingPrice - totalCost;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm rounded-2xl">
          <h3 className="text-xl font-bold mb-4">{label}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Cost</div>
              <div className="text-2xl font-black mt-1 text-gray-900 dark:text-white">
                {data.currency === "INR" ? "₹" : "$"}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl">
              <div className="text-xs text-green-600 uppercase font-semibold tracking-wider">Selling Price</div>
              <div className="text-2xl font-black mt-1 text-green-700 dark:text-green-400">
                {data.currency === "INR" ? "₹" : "$"}{sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers size={14} /> Cost Breakdown
            </div>
            {data.blocks?.filter((b: any) => b.enabled).map((b: any) => (
              <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color || '#ccc' }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{b.label}</span>
                </div>
                <span className="font-mono text-sm font-semibold">
                  {data.currency === "INR" ? "₹" : "$"}{(b.result || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black p-4 md:p-10 pt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="btn btn-icon bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <GitCompare size={24} className="text-[var(--cf-blue)]" /> Compare Cost Sheets
            </h1>
            <p className="text-gray-500 text-sm">Analyze margins and cost blocks side-by-side.</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Column A */}
            <div className="space-y-4">
              <select 
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm outline-none focus:border-[var(--cf-blue)] text-gray-900 dark:text-white"
                value={projectA}
                onChange={e => setProjectA(e.target.value)}
              >
                <option value="">-- Select Project A --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {renderCostSheet(dataA, projects.find(p => p.id === projectA)?.name || "Project A")}
            </div>

            {/* Column B */}
            <div className="space-y-4">
              <select 
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm outline-none focus:border-[var(--cf-blue)] text-gray-900 dark:text-white"
                value={projectB}
                onChange={e => setProjectB(e.target.value)}
              >
                <option value="">-- Select Project B --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {renderCostSheet(dataB, projects.find(p => p.id === projectB)?.name || "Project B")}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
