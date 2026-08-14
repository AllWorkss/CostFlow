"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Send,
  Mail,
  Building2,
  User,
  ShieldCheck,
  CreditCard,
  Eye,
  Settings,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";
import type { ProformaInvoiceConfig } from "@/types/costing";
import { numberToWords } from "@/lib/utils/numberToWords";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ProformaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProformaInvoiceModal({ isOpen, onClose }: ProformaInvoiceModalProps) {
  const { blocks, summary, currency, projectName, companyName } = useCostingStore();

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "share">("preview");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Form State initialized with realistic defaults
  const [config, setConfig] = useState<ProformaInvoiceConfig>(() => {
    const today = new Date().toISOString().split("T")[0];
    const validUntil = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    return {
      quoteRefNo: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      quoteDate: today,
      validUntilDate: validUntil,

      // Sender
      senderCompany: companyName || "Precision CostFlow Technologies Pvt Ltd",
      senderGstin: "27AAACP1234H1Z5",
      senderAddress: "Suite 402, Apex Business Park, MIDC Industrial Area, Pune, MH 411057",
      senderPhone: "+91 98765 43210",
      senderEmail: "sales@costflow-tech.com",
      bankName: "HDFC Bank Ltd",
      bankAccountNo: "50200012345678",
      bankIfsc: "HDFC0000123",
      upiId: "costflow@hdfcbank",

      // Receiver
      clientCompany: "Acme Industrial Manufacturing Corp",
      clientBuyerName: "Rajesh Sharma (Procurement Head)",
      clientGstin: "27AACCA9876K1Z2",
      clientAddress: "Plot 88, Sector 12, Industrial Township, Gurugram, HR 122001",
      clientPhone: "+91 91234 56789",
      clientEmail: "procurement@acmeind.com",

      // Settings & Terms
      viewMode: "commercial",
      paymentTerms: "50% Advance along with PO, 50% Before Dispatch",
      deliveryTimeline: "2 to 3 Weeks from PO receipt",
      freightTerms: "Ex-Works Factory Gate",
      hsnSacCode: "8483 / 7326",
      gstRate: 18,
      unitMetric: "Units",
    };
  });

  if (!isOpen) return null;

  // Active blocks for line items
  const enabledBlocks = blocks.filter((b) => b.enabled && (b.result ?? 0) > 0);

  // Line items based on Commercial vs Open-Book view mode
  const lineItems =
    config.viewMode === "commercial"
      ? [
          {
            id: "commercial-summary",
            description: `${projectName} — Commercial Costing & Manufacturing Package`,
            hsn: config.hsnSacCode,
            qty: summary?.batchMultiplier ?? 1,
            metric: config.unitMetric,
            unitPrice: (summary?.sellingPrice ?? 0) / Math.max(summary?.batchMultiplier ?? 1, 1),
            totalPrice: summary?.sellingPrice ?? 0,
          },
        ]
      : enabledBlocks.map((b) => {
          const qty = summary?.batchMultiplier ?? 1;
          const blockTotal = b.result ?? 0;
          return {
            id: b.id,
            description: `${b.label} (${b.formula})`,
            hsn: config.hsnSacCode,
            qty: qty,
            metric: config.unitMetric,
            unitPrice: blockTotal / Math.max(qty, 1),
            totalPrice: blockTotal,
          };
        });

  // Calculate taxes and totals
  const subtotalBeforeTax = summary?.subtotal ?? 0;
  const gstAmount = (subtotalBeforeTax * config.gstRate) / 100;
  const grandTotal = subtotalBeforeTax + gstAmount;

  const totalInWordsText = numberToWords(grandTotal, currency);

  // PDF Export Handler using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Proforma_Invoice_${config.quoteRefNo}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Message Text
  const whatsAppMessage = `*PROFORMA INVOICE / QUOTATION*
📋 *Ref No:* ${config.quoteRefNo}
📅 *Date:* ${config.quoteDate} (Valid until: ${config.validUntilDate})

👤 *Prepared For:* ${config.clientCompany} (${config.clientBuyerName})
🏢 *From:* ${config.senderCompany}

📦 *Project:* ${projectName}
💵 *Subtotal:* ${currency === "INR" ? "₹" : "$"}${subtotalBeforeTax.toLocaleString("en-IN")}
🏛️ *GST (${config.gstRate}%):* ${currency === "INR" ? "₹" : "$"}${gstAmount.toLocaleString("en-IN")}
💰 *Grand Total:* ${currency === "INR" ? "₹" : "$"}${grandTotal.toLocaleString("en-IN")}

📜 *Key Commercial Terms:*
• Payment: ${config.paymentTerms}
• Delivery: ${config.deliveryTimeline}
• Freight: ${config.freightTerms}

🏦 *Bank Account Details:*
Bank: ${config.bankName}
A/C: ${config.bankAccountNo} | IFSC: ${config.bankIfsc}
UPI ID: ${config.upiId}

Thank you for choosing ${config.senderCompany}! Please contact us to confirm order execution.`;

  // Gmail / Email Subject & Body
  const emailSubject = `Quotation & Proforma Invoice ${config.quoteRefNo} — ${projectName} | ${config.senderCompany}`;
  const emailBody = `Dear ${config.clientBuyerName},

Greetings from ${config.senderCompany}!

Please find below our formal Proforma Invoice / Commercial Quotation for ${projectName}:

--------------------------------------------------
QUOTATION DETAILS:
--------------------------------------------------
Ref Number: ${config.quoteRefNo}
Date: ${config.quoteDate}
Valid Until: ${config.validUntilDate}

FINANCIAL SUMMARY:
- Net Subtotal: ${currency === "INR" ? "₹" : "$"}${subtotalBeforeTax.toLocaleString("en-IN")}
- Tax / GST (${config.gstRate}%): ${currency === "INR" ? "₹" : "$"}${gstAmount.toLocaleString("en-IN")}
- Total Payable: ${currency === "INR" ? "₹" : "$"}${grandTotal.toLocaleString("en-IN")}
(${totalInWordsText})

COMMERCIAL TERMS:
- Payment Terms: ${config.paymentTerms}
- Delivery Timeline: ${config.deliveryTimeline}
- Freight Terms: ${config.freightTerms}

BANK & PAYMENT DETAILS:
- Bank Name: ${config.bankName}
- Account No: ${config.bankAccountNo}
- IFSC Code: ${config.bankIfsc}
- UPI ID: ${config.upiId}

Please review the details and revert with your Purchase Order (PO) approval.

Best regards,

${config.senderCompany}
Phone: ${config.senderPhone} | Email: ${config.senderEmail}
GSTIN: ${config.senderGstin}`;

  // Copy WhatsApp handler
  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Copy Email handler
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black"
        >
          {/* Top Bar Navigation & Actions */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-30 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Proforma Invoice & Quotation Engine
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                    GST Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Convert costing estimations into high-resolution commercial PDF invoices & message drafts
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "preview"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye size={14} /> PDF Preview
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "edit"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Settings size={14} /> Configure & Terms
              </button>
              <button
                onClick={() => setActiveTab("share")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "share"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Send size={14} /> WhatsApp & Email Drafts
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg"
              >
                <Download size={14} /> {isGeneratingPdf ? "Generating PDF…" : "Download PDF"}
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-ghost border border-slate-700 text-xs py-1.5 px-3 text-slate-300 hover:bg-slate-800"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0">

            {/* ════ TAB 1: CONFIGURATION & TERMS ════ */}
            {activeTab === "edit" && (
              <div className="space-y-6 text-xs max-w-4xl mx-auto">

                {/* View Mode Privacy Switch */}
                <div className="card p-4 bg-slate-950/60 border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <Layers size={16} className="text-blue-400" /> Line-Item Commercial Privacy Mode
                    </h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Choose whether to hide internal raw material breakdown or present open-book itemization.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setConfig((c) => ({ ...c, viewMode: "commercial" }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        config.viewMode === "commercial"
                          ? "bg-blue-600 text-white shadow"
                          : "text-slate-400"
                      }`}
                    >
                      🔒 Commercial Summary (Client Facing)
                    </button>
                    <button
                      onClick={() => setConfig((c) => ({ ...c, viewMode: "open_book" }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        config.viewMode === "open_book"
                          ? "bg-indigo-600 text-white shadow"
                          : "text-slate-400"
                      }`}
                    >
                      📖 Open-Book Itemized
                    </button>
                  </div>
                </div>

                {/* Sender & Receiver Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Sender Box */}
                  <div className="card p-4 space-y-3 bg-slate-950/40 border-slate-800">
                    <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={14} /> My Company Details (Sender)
                    </h4>
                    <div>
                      <label className="text-slate-400 block mb-1">Company Name</label>
                      <input
                        value={config.senderCompany}
                        onChange={(e) => setConfig({ ...config, senderCompany: e.target.value })}
                        className="cf-input py-1.5 text-xs font-bold text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">GSTIN / Tax ID</label>
                        <input
                          value={config.senderGstin}
                          onChange={(e) => setConfig({ ...config, senderGstin: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Phone</label>
                        <input
                          value={config.senderPhone}
                          onChange={(e) => setConfig({ ...config, senderPhone: e.target.value })}
                          className="cf-input py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Email</label>
                      <input
                        value={config.senderEmail}
                        onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                        className="cf-input py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Registered Address</label>
                      <textarea
                        rows={2}
                        value={config.senderAddress}
                        onChange={(e) => setConfig({ ...config, senderAddress: e.target.value })}
                        className="cf-input py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* Receiver Box */}
                  <div className="card p-4 space-y-3 bg-slate-950/40 border-slate-800">
                    <h4 className="font-bold text-purple-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} /> Buyer / Client Details (Receiver)
                    </h4>
                    <div>
                      <label className="text-slate-400 block mb-1">Client Company Name</label>
                      <input
                        value={config.clientCompany}
                        onChange={(e) => setConfig({ ...config, clientCompany: e.target.value })}
                        className="cf-input py-1.5 text-xs font-bold text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Buyer Contact Person</label>
                        <input
                          value={config.clientBuyerName}
                          onChange={(e) => setConfig({ ...config, clientBuyerName: e.target.value })}
                          className="cf-input py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Buyer GSTIN</label>
                        <input
                          value={config.clientGstin}
                          onChange={(e) => setConfig({ ...config, clientGstin: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Client Email</label>
                      <input
                        value={config.clientEmail}
                        onChange={(e) => setConfig({ ...config, clientEmail: e.target.value })}
                        className="cf-input py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Billing / Shipping Address</label>
                      <textarea
                        rows={2}
                        value={config.clientAddress}
                        onChange={(e) => setConfig({ ...config, clientAddress: e.target.value })}
                        className="cf-input py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Banking & Quotation Terms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Bank Details Box */}
                  <div className="card p-4 space-y-3 bg-slate-950/40 border-slate-800">
                    <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={14} /> Bank Account & UPI Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Bank Name</label>
                        <input
                          value={config.bankName}
                          onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                          className="cf-input py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Account Number</label>
                        <input
                          value={config.bankAccountNo}
                          onChange={(e) => setConfig({ ...config, bankAccountNo: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">IFSC Code</label>
                        <input
                          value={config.bankIfsc}
                          onChange={(e) => setConfig({ ...config, bankIfsc: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">UPI ID</label>
                        <input
                          value={config.upiId}
                          onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono text-cyan-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms Box */}
                  <div className="card p-4 space-y-3 bg-slate-950/40 border-slate-800">
                    <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Commercial Terms & GST
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Quote Ref No</label>
                        <input
                          value={config.quoteRefNo}
                          onChange={(e) => setConfig({ ...config, quoteRefNo: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono text-blue-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">GST Rate %</label>
                        <select
                          value={config.gstRate}
                          onChange={(e) => setConfig({ ...config, gstRate: parseFloat(e.target.value) || 0 })}
                          className="cf-input py-1.5 text-xs font-bold"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">HSN/SAC Code</label>
                        <input
                          value={config.hsnSacCode}
                          onChange={(e) => setConfig({ ...config, hsnSacCode: e.target.value })}
                          className="cf-input py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Payment Terms</label>
                      <input
                        value={config.paymentTerms}
                        onChange={(e) => setConfig({ ...config, paymentTerms: e.target.value })}
                        className="cf-input py-1.5 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Delivery Timeline</label>
                        <input
                          value={config.deliveryTimeline}
                          onChange={(e) => setConfig({ ...config, deliveryTimeline: e.target.value })}
                          className="cf-input py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Freight Terms</label>
                        <input
                          value={config.freightTerms}
                          onChange={(e) => setConfig({ ...config, freightTerms: e.target.value })}
                          className="cf-input py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setActiveTab("preview")}
                    className="btn btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-xl"
                  >
                    Save & Generate Live PDF Preview <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ════ TAB 2: LIVE PROFORMA INVOICE PDF PREVIEW ════ */}
            {activeTab === "preview" && (
              <div className="max-w-4xl mx-auto">
                <div
                  ref={previewRef}
                  id="invoice-pdf-template"
                  className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 font-sans print:shadow-none print:border-none print:p-0 print:w-full"
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                    <div>
                      <div className="text-2xl font-black tracking-tight text-blue-900 uppercase">
                        {config.senderCompany}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 max-w-sm leading-relaxed">
                        {config.senderAddress}
                      </div>
                      <div className="text-xs font-mono text-slate-700 mt-1">
                        <strong>GSTIN:</strong> {config.senderGstin} | <strong>Mob:</strong> {config.senderPhone}
                      </div>
                      <div className="text-xs text-slate-600">
                        <strong>Email:</strong> {config.senderEmail}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-blue-900 text-white font-black text-sm uppercase tracking-widest rounded mb-2">
                        PROFORMA INVOICE
                      </span>
                      <div className="text-xs font-mono text-slate-800">
                        <div><strong>Quote No:</strong> {config.quoteRefNo}</div>
                        <div><strong>Date:</strong> {config.quoteDate}</div>
                        <div><strong>Valid Until:</strong> {config.validUntilDate}</div>
                      </div>
                    </div>
                  </div>

                  {/* Billed To / Shipped To Row */}
                  <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
                    <div>
                      <div className="font-bold text-blue-900 uppercase text-[11px] tracking-wider mb-1">
                        Billed To / Client Details:
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{config.clientCompany}</div>
                      <div className="text-slate-700 font-medium">{config.clientBuyerName}</div>
                      <div className="text-slate-600 mt-1">{config.clientAddress}</div>
                      <div className="font-mono text-slate-700 mt-1">
                        <strong>GSTIN:</strong> {config.clientGstin} | <strong>Ph:</strong> {config.clientPhone}
                      </div>
                    </div>

                    <div className="border-l border-slate-300 pl-6">
                      <div className="font-bold text-blue-900 uppercase text-[11px] tracking-wider mb-1">
                        Quotation Summary:
                      </div>
                      <div className="text-slate-700 space-y-1">
                        <div><strong>Project Name:</strong> {projectName}</div>
                        <div><strong>HSN/SAC Code:</strong> {config.hsnSacCode}</div>
                        <div><strong>Mode:</strong> {config.viewMode === "commercial" ? "Commercial Package" : "Open-Book Breakdown"}</div>
                        <div><strong>Currency:</strong> {currency}</div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <table className="w-full text-xs text-left mb-6 border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                        <th className="p-2.5 rounded-tl">#</th>
                        <th className="p-2.5">Description of Goods / Services</th>
                        <th className="p-2.5 text-center">HSN/SAC</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Rate ({currency === "INR" ? "₹" : "$"})</th>
                        <th className="p-2.5 text-right rounded-tr">Total ({currency === "INR" ? "₹" : "$"})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border-b border-slate-300">
                      {lineItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-900">{item.description}</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">{item.hsn}</td>
                          <td className="p-2.5 text-center font-bold">{item.qty} {item.metric}</td>
                          <td className="p-2.5 text-right font-mono">
                            {(item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {(item.totalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Calculation & Bank Row */}
                  <div className="grid grid-cols-12 gap-6 mb-6">

                    {/* Bank Details & Terms Left (7 cols) */}
                    <div className="col-span-7 space-y-4 text-xs">
                      {/* Total in words */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="font-bold text-blue-900 text-[11px] uppercase">Amount in Words:</div>
                        <div className="font-bold text-slate-800 mt-0.5 capitalize">{totalInWordsText}</div>
                      </div>

                      {/* Bank Account Box */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
                        <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1 flex items-center gap-1">
                          <CreditCard size={13} className="text-blue-900" /> Bank Payment Details:
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                          <div><strong>Bank:</strong> {config.bankName}</div>
                          <div><strong>Account No:</strong> <span className="font-mono font-bold">{config.bankAccountNo}</span></div>
                          <div><strong>IFSC Code:</strong> <span className="font-mono font-bold">{config.bankIfsc}</span></div>
                          <div><strong>UPI ID:</strong> <span className="font-mono text-blue-800 font-bold">{config.upiId}</span></div>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="text-[11px] text-slate-600 space-y-0.5 leading-tight">
                        <div className="font-bold text-slate-800 uppercase text-[10px]">Commercial Terms:</div>
                        <div>1. Payment Terms: {config.paymentTerms}</div>
                        <div>2. Delivery: {config.deliveryTimeline} | Freight: {config.freightTerms}</div>
                        <div>3. Quotation valid until {config.validUntilDate}. E.&O.E.</div>
                      </div>
                    </div>

                    {/* Financial Summary Right (5 cols) */}
                    <div className="col-span-5 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Net Subtotal:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {currency === "INR" ? "₹" : "$"}{subtotalBeforeTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {config.gstRate > 0 && (
                          <>
                            <div className="flex justify-between text-slate-600">
                              <span>CGST ({config.gstRate / 2}%):</span>
                              <span className="font-mono text-slate-800">
                                {currency === "INR" ? "₹" : "$"}{(gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>SGST ({config.gstRate / 2}%):</span>
                              <span className="font-mono text-slate-800">
                                {currency === "INR" ? "₹" : "$"}{(gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        )}

                        <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-black text-blue-950">
                          <span>Grand Total:</span>
                          <span className="font-mono text-base">
                            {currency === "INR" ? "₹" : "$"}{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Signature Box */}
                      <div className="mt-8 text-center pt-6 border-t border-slate-300">
                        <div className="font-bold text-slate-900 text-xs">For {config.senderCompany}</div>
                        <div className="h-10"></div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest border-t border-dashed border-slate-400 pt-1 mx-auto max-w-[160px]">
                          Authorized Signatory
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* ════ TAB 3: WHATSAPP & GMAIL DRAFT GENERATOR ════ */}
            {activeTab === "share" && (
              <div className="max-w-4xl mx-auto space-y-6">

                {/* WhatsApp Message Box */}
                <div className="card p-5 bg-slate-950/60 border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                      <Send size={16} /> Ready-to-Send WhatsApp Commercial Message
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyWhatsApp}
                        className="btn btn-ghost border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs py-1 px-3 flex items-center gap-1.5"
                      >
                        {copiedWhatsApp ? <Check size={14} /> : <Copy size={14} />}
                        {copiedWhatsApp ? "Copied!" : "Copy WhatsApp Draft"}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs py-1 px-3 flex items-center gap-1.5"
                      >
                        <Send size={14} /> Open WhatsApp
                      </a>
                    </div>
                  </div>
                  <textarea
                    rows={10}
                    readOnly
                    value={whatsAppMessage}
                    className="cf-input font-mono text-xs bg-slate-900 border-slate-800 text-slate-200 leading-relaxed"
                  />
                </div>

                {/* Gmail / Email Message Box */}
                <div className="card p-5 bg-slate-950/60 border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-blue-400 text-sm flex items-center gap-2">
                      <Mail size={16} /> Ready-to-Send Email / Gmail Client Draft
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyEmail}
                        className="btn btn-ghost border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs py-1 px-3 flex items-center gap-1.5"
                      >
                        {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
                        {copiedEmail ? "Copied!" : "Copy Email Draft"}
                      </button>
                      <a
                        href={`mailto:${config.clientEmail}?subject=${encodeURIComponent(
                          emailSubject
                        )}&body=${encodeURIComponent(emailBody)}`}
                        className="btn btn-primary bg-blue-600 hover:bg-blue-500 text-xs py-1 px-3 flex items-center gap-1.5"
                      >
                        <Mail size={14} /> Open in Email Client
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Subject Line:</label>
                    <input
                      readOnly
                      value={emailSubject}
                      className="cf-input font-bold text-xs bg-slate-900 border-slate-800 text-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Email Body:</label>
                    <textarea
                      rows={10}
                      readOnly
                      value={emailBody}
                      className="cf-input font-mono text-xs bg-slate-900 border-slate-800 text-slate-200 leading-relaxed"
                    />
                  </div>
                </div>

              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
