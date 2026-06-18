"use client";
import { useEffect, useState, useCallback } from "react";

type Stats = {
  totalTrades: number; wins: number; losses: number; breakevens: number;
  winRate: number; netPnl: number; netPoints: number; profitFactor: number;
  avgWinPts: number; avgLossPts: number; bestTrade: number; worstTrade: number;
  strongTrades: number; normalTrades: number; returnPct: number;
  balance: number; startingBalance: number; openTrade: any; period: string;
};

type Trade = {
  id: string; symbol: string; direction: string; signal_type: string;
  session: string; entry_price: number; sl: number; tp: number;
  lot: number; rr: number; risk_amount: number; entry_time: string;
  exit_price: number | null; exit_time: string | null;
  pnl_points: number; pnl_money: number; result: string;
  balance_after: number; fake_direction: string; notes: string;
};

const periods = [
  { key: "1w", label: "1 Week" },
  { key: "1m", label: "1 Month" },
  { key: "2m", label: "2 Months" },
  { key: "3m", label: "3 Months" },
  { key: "1y", label: "1 Year" },
  { key: "all", label: "All Time" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`/api/stats?period=${period}`),
        fetch(`/api/trades?period=${period}&limit=100`),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (tRes.ok) { const d = await tRes.json(); setTrades(d.trades || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [fetchData]);

  const kpi = (label: string, value: string | number, color: string, sub?: string) => (
    <div style={{ background: "#12121a", borderRadius: 10, padding: "16px 18px", border: "1px solid #1e1e2a" }}>
      <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{sub}</div>}
    </div>
  );

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading dashboard...</div>;

  const s = stats || {} as Stats;
  const retColor = s.returnPct >= 20 ? "#22c55e" : s.returnPct >= 15 ? "#f59e0b" : s.returnPct >= 0 ? "#3b82f6" : "#ef4444";
  const wrColor = s.winRate >= 50 ? "#22c55e" : s.winRate >= 40 ? "#f59e0b" : "#ef4444";
  const pfColor = s.profitFactor >= 2 ? "#22c55e" : s.profitFactor >= 1.5 ? "#f59e0b" : "#ef4444";
  const pnlColor = s.netPnl >= 0 ? "#22c55e" : "#ef4444";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>ICT Midnight v4</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>
            Live Trading Dashboard
            {s.openTrade && <span style={{ color: s.openTrade.direction === "BUY" ? "#22c55e" : "#ef4444", marginLeft: 12, fontWeight: 600 }}>
              {s.openTrade.direction} OPEN @ {s.openTrade.entry_price}
            </span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer",
              background: period === p.key ? "#3b82f6" : "#1a1a24", color: period === p.key ? "#fff" : "#888",
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* KPI Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
        {kpi("Balance", `$${s.balance?.toFixed(2) || "0.00"}`, s.balance >= s.startingBalance ? "#22c55e" : "#ef4444", `Started: $${s.startingBalance}`)}
        {kpi("Return", `${s.returnPct >= 0 ? "+" : ""}${s.returnPct}%`, retColor, s.returnPct >= 15 ? "Target reached" : `${(15 - s.returnPct).toFixed(1)}% to 15% target`)}
        {kpi("Net P&L", `${s.netPnl >= 0 ? "+" : ""}$${s.netPnl?.toFixed(2)}`, pnlColor, `${s.netPoints} points`)}
        {kpi("Win Rate", `${s.winRate}%`, wrColor, `${s.wins}W / ${s.losses}L / ${s.breakevens}BE`)}
        {kpi("Profit Factor", `${s.profitFactor}`, pfColor, s.profitFactor >= 1.5 ? "Strong edge" : "Needs improvement")}
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpi("Trades", s.totalTrades, "#fff", `${s.strongTrades}S + ${s.normalTrades}N`)}
        {kpi("Avg Win", `${s.avgWinPts} pts`, "#22c55e")}
        {kpi("Avg Loss", `${s.avgLossPts} pts`, "#ef4444")}
        {kpi("Best Trade", `+$${s.bestTrade}`, "#22c55e")}
        {kpi("Worst Trade", `$${s.worstTrade}`, "#ef4444")}
      </div>

      {/* Open Position Banner */}
      {s.openTrade && (
        <div style={{
          background: s.openTrade.direction === "BUY" ? "#22c55e12" : "#ef444412",
          border: `1px solid ${s.openTrade.direction === "BUY" ? "#22c55e33" : "#ef444433"}`,
          borderRadius: 10, padding: "16px 20px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.openTrade.direction === "BUY" ? "#22c55e" : "#ef4444" }}>
                {s.openTrade.signal_type} {s.openTrade.direction} — LIVE
              </span>
              <span style={{ fontSize: 12, color: "#888", marginLeft: 12 }}>{s.openTrade.session} session</span>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#ccc" }}>
              <span>Entry: <b>{s.openTrade.entry_price}</b></span>
              <span>SL: <b style={{ color: "#ef4444" }}>{s.openTrade.sl}</b></span>
              <span>TP: <b style={{ color: "#22c55e" }}>{s.openTrade.tp}</b></span>
              <span>Lot: <b>{s.openTrade.lot}</b></span>
              <span>R:R: <b>{s.openTrade.rr}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* Trade Log */}
      <div style={{ background: "#12121a", borderRadius: 10, border: "1px solid #1e1e2a", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e1e2a", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#aaa" }}>Trade History</span>
          <span style={{ fontSize: 12, color: "#555" }}>{trades.length} trades</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e1e2a" }}>
                {["Time", "Session", "Type", "Dir", "Entry", "SL", "TP", "Lot", "R:R", "Result", "P&L", "Balance", "Notes"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 8px", color: "#555", fontWeight: 600, fontSize: 11, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const isWin = t.pnl_money > 0;
                const isOpen = t.result === "OPEN";
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #15151f" }}>
                    <td style={{ padding: "8px", color: "#888", whiteSpace: "nowrap" }}>{new Date(t.entry_time).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ padding: "8px", color: "#aaa" }}>{t.session}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: t.signal_type === "STRONG" ? "#f59e0b22" : "#33333344",
                        color: t.signal_type === "STRONG" ? "#f59e0b" : "#888"
                      }}>{t.signal_type}</span>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: t.direction === "BUY" ? "#22c55e18" : "#ef444418",
                        color: t.direction === "BUY" ? "#22c55e" : "#ef4444"
                      }}>{t.direction}</span>
                    </td>
                    <td style={{ padding: "8px", color: "#ccc", fontVariantNumeric: "tabular-nums" }}>{Number(t.entry_price).toFixed(2)}</td>
                    <td style={{ padding: "8px", color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>{Number(t.sl).toFixed(2)}</td>
                    <td style={{ padding: "8px", color: "#22c55e", fontVariantNumeric: "tabular-nums" }}>{Number(t.tp).toFixed(2)}</td>
                    <td style={{ padding: "8px", color: "#aaa" }}>{t.lot}</td>
                    <td style={{ padding: "8px", color: "#aaa" }}>{t.rr}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: isOpen ? "#3b82f618" : t.result === "TP" ? "#22c55e18" : t.result === "BE" ? "#f59e0b18" : "#ef444418",
                        color: isOpen ? "#3b82f6" : t.result === "TP" ? "#22c55e" : t.result === "BE" ? "#f59e0b" : "#ef4444",
                      }}>{t.result}</span>
                    </td>
                    <td style={{ padding: "8px", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                      color: isOpen ? "#3b82f6" : isWin ? "#22c55e" : t.pnl_money === 0 ? "#f59e0b" : "#ef4444"
                    }}>{isOpen ? "..." : `${t.pnl_money > 0 ? "+" : ""}$${Number(t.pnl_money).toFixed(2)}`}</td>
                    <td style={{ padding: "8px", color: "#666", fontVariantNumeric: "tabular-nums" }}>${Number(t.balance_after).toFixed(2)}</td>
                    <td style={{ padding: "8px", color: "#555", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notes}</td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr><td colSpan={13} style={{ padding: 40, textAlign: "center", color: "#444" }}>No trades yet. Start the bot to see live data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 20 }}>
        Auto-refreshes every 15s | ICT Midnight v4 Strategy
      </p>
    </div>
  );
}
