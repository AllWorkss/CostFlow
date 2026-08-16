"use client";

import React, { useState, useEffect, useRef, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Zap,
  FileText,
  RefreshCw,
  ChevronDown,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";
import { processCopilotQuery, type CopilotMessageResult, type CopilotActionPayload } from "@/lib/copilot/copilotEngine";

interface CostFlowCopilotProps {
  onOpenInvoiceModal?: () => void;
  onStateApplied?: () => void;
}

const QUICK_CHIPS = [
  "Calculate 25mm Rod cost @ ₹80/kg",
  "Estimate 500ml Milk Pouch from 50k Liters Silo",
  "Solve my price for ₹150 target with 15% margin",
];

export function CostFlowCopilot({ onOpenInvoiceModal, onStateApplied }: CostFlowCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [appliedCardId, setAppliedCardId] = useState<string | null>(null);

  const [messages, setMessages] = useState<CopilotMessageResult[]>([
    {
      id: "welcome_1",
      role: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "complete",
      content: `👋 **Namaste! Main CostFlow AI Copilot hu.**\n\nAap kisi bhi metal geometry, bulk liquid batch, ya target selling price ka costing natural language (English / Hinglish) me pooch sakte hain. Main live calculation karke aapke dashboard par populate kar dunga!`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const applyCopilotState = useCostingStore((state) => state.applyCopilotState);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isOpen]);

  // Voice Recognition Handler (Web Speech API)
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser version. Please type your query.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // English & Hinglish friendly
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      handleSendMessage(transcript);
    };

    recognition.start();
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isThinking) return;

    const userMsg: CopilotMessageResult = {
      id: `user_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "complete",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsThinking(true);

    // Simulate real-time streaming/thinking transition
    setTimeout(() => {
      const response = processCopilotQuery(query, messages);
      setMessages((prev) => [...prev, response]);
      setIsThinking(false);
    }, 600);
  };

  const handleApplyState = (payload: CopilotActionPayload, cardMsgId: string) => {
    startTransition(() => {
      applyCopilotState(payload.data);
    });

    setAppliedCardId(cardMsgId);
    if (onStateApplied) onStateApplied();

    // Pulse animation trigger on canvas
    const canvasEl = document.querySelector(".max-w-screen-2xl");
    if (canvasEl) {
      canvasEl.classList.remove("copilot-pulse-green");
      void (canvasEl as HTMLElement).offsetWidth; // force reflow
      canvasEl.classList.add("copilot-pulse-green");
      setTimeout(() => canvasEl.classList.remove("copilot-pulse-green"), 3600);
    }
  };

  return (
    <>
      {/* ══════ FLOATING LAUNCHER BUTTON ══════ */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden sm:flex items-center gap-2 bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500/40 shadow-xl backdrop-blur-md"
            >
              <Sparkles size={13} className="text-cyan-400 animate-pulse" />
              <span>Ask CostFlow AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xl pulse-glow text-white relative transition-all"
          style={{ background: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)" }}
          aria-label="Toggle AI Costing Copilot"
        >
          {isOpen ? <X size={22} /> : <Sparkles size={24} className="animate-spin-slow" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
          )}
        </motion.button>
      </div>

      {/* ══════ CHAT MODAL WINDOW ══════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[620px] h-[80vh] flex flex-col rounded-2xl border shadow-2xl glass overflow-hidden"
            style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(15,22,41,0.92)" }}
          >
            {/* ── Modal Header ── */}
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                  <Sparkles size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    CostFlow Copilot
                    <span className="badge badge-blue text-[10px] py-0 px-1.5">AI Engine</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Autonomous Multi-Industry Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setMessages([
                      {
                        id: `reset_${Date.now()}`,
                        role: "assistant",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        status: "complete",
                        content: "Chat history cleared. How can I help with your costing breakdown?",
                      },
                    ])
                  }
                  title="Clear Chat"
                  className="btn btn-icon w-7 h-7 text-slate-400 hover:text-white"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="btn btn-icon w-7 h-7 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Messages List ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-200">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                      <Bot size={14} />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                          : "bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Rich Structured Card Inside Chat */}
                    {msg.structuredCard && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5 shadow-lg"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-cyan-300 text-xs truncate max-w-[200px]">
                            {msg.structuredCard.title}
                          </span>
                          <span className="badge badge-purple text-[10px]">
                            {msg.structuredCard.industry}
                          </span>
                        </div>

                        {/* Breakdown Rows */}
                        <div className="space-y-1 text-[11px]">
                          {msg.structuredCard.breakdown.map((row) => (
                            <div key={row.label} className="flex justify-between text-slate-300">
                              <span>{row.label}:</span>
                              <span className="font-mono font-semibold">₹{row.value.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800 text-xs">
                            <span>Calculated Selling Price:</span>
                            <span className="font-mono text-sm">
                              ₹{msg.structuredCard.sellingPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Warnings */}
                        {msg.structuredCard.warnings && msg.structuredCard.warnings.length > 0 && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] space-y-0.5">
                            {msg.structuredCard.warnings.map((w, idx) => (
                              <div key={idx}>{w}</div>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-1.5 flex flex-col gap-1.5">
                          <button
                            onClick={() => handleApplyState(msg.structuredCard!.payload, msg.id)}
                            className={`btn w-full py-2 text-xs font-bold justify-center rounded-lg transition-all ${
                              appliedCardId === msg.id
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "btn-primary pulse-glow"
                            }`}
                          >
                            {appliedCardId === msg.id ? (
                              <>
                                <CheckCircle2 size={14} /> Applied to Dashboard Canvas!
                              </>
                            ) : (
                              <>
                                <Zap size={14} /> ⚡ Apply to Dashboard Canvas
                              </>
                            )}
                          </button>

                          {onOpenInvoiceModal && (
                            <button
                              onClick={onOpenInvoiceModal}
                              className="btn btn-ghost border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 py-1.5 text-xs justify-center rounded-lg"
                            >
                              <FileText size={13} /> 📄 Generate Instant Proforma Invoice
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    <div
                      className={`text-[9px] text-slate-500 px-1 ${
                        msg.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing/Thinking Indicator */}
              {isThinking && (
                <div className="flex gap-2.5 items-center text-slate-400 text-xs italic">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400">
                    <Bot size={14} className="animate-bounce" />
                  </div>
                  <span>CostFlow AI is parsing parameters and computing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Prompt Chips ── */}
            <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputQuery(chip);
                    handleSendMessage(chip);
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 transition-colors flex-shrink-0"
                >
                  ✨ {chip}
                </button>
              ))}
            </div>

            {/* ── Input Box ── */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
              <input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type query in English / Hinglish (e.g. 25mm rod price)..."
                className="cf-input flex-1 py-2 text-xs bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500"
              />

              <button
                onClick={handleVoiceInput}
                title="Voice Search"
                className={`btn btn-icon w-9 h-9 ${
                  isListening ? "bg-red-500/20 text-red-400 border-red-500 animate-pulse" : ""
                }`}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isThinking}
                className="btn btn-primary w-9 h-9 p-0 rounded-xl"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
