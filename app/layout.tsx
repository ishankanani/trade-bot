import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ICT Midnight v4 — Trading Dashboard",
  description: "Live trade monitoring for ICT Midnight Strategy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0f", color: "#e2e2e8", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
