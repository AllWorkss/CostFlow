import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CostFlow — CSF Costing | Universal Multi-Industry Costing Platform",
  description:
    "Enterprise-grade AI/ML powered costing system for Manufacturing, Retail, Education, E-Commerce, and Construction. Live Excel export with real formulas, React Flow visualization, and anomaly detection.",
  keywords: "costing software, CSF costing, BOM costing, manufacturing costing, Excel export, AI pricing",
  openGraph: {
    title: "CostFlow — CSF Costing",
    description: "Universal multi-industry AI-powered costing platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}

// Inline theme script to avoid flash of wrong theme
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var theme = localStorage.getItem('cf-theme') || 'dark';
            document.documentElement.classList.toggle('dark', theme === 'dark');
          })();
        `,
      }}
    />
  );
}
