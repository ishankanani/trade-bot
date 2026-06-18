import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { balance, time } = await req.json();
  await sql`INSERT INTO balance_log (balance, recorded_at) VALUES (${balance}, ${time})`;
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all";

  let dateFilter = "";
  const now = new Date();
  if (period === "1w") dateFilter = new Date(now.getTime() - 7 * 86400000).toISOString();
  else if (period === "1m") dateFilter = new Date(now.getTime() - 30 * 86400000).toISOString();
  else if (period === "2m") dateFilter = new Date(now.getTime() - 60 * 86400000).toISOString();
  else if (period === "3m") dateFilter = new Date(now.getTime() - 90 * 86400000).toISOString();
  else if (period === "1y") dateFilter = new Date(now.getTime() - 365 * 86400000).toISOString();

  const closedFilter = dateFilter
    ? sql`WHERE result != 'OPEN' AND entry_time >= ${dateFilter}`
    : sql`WHERE result != 'OPEN'`;

  const stats = await sql`
    SELECT
      COUNT(*) as total_trades,
      SUM(CASE WHEN result = 'TP' OR (result = 'BE' AND pnl_money > 0) THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN result = 'SL' THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN result = 'BE' AND pnl_money = 0 THEN 1 ELSE 0 END) as breakevens,
      SUM(pnl_money) as net_pnl,
      SUM(pnl_points) as net_points,
      SUM(CASE WHEN pnl_money > 0 THEN pnl_money ELSE 0 END) as gross_wins,
      SUM(CASE WHEN pnl_money < 0 THEN ABS(pnl_money) ELSE 0 END) as gross_losses,
      AVG(CASE WHEN pnl_money > 0 THEN pnl_points ELSE NULL END) as avg_win_pts,
      AVG(CASE WHEN pnl_money < 0 THEN ABS(pnl_points) ELSE NULL END) as avg_loss_pts,
      MAX(CASE WHEN pnl_money > 0 THEN pnl_money ELSE 0 END) as best_trade,
      MIN(CASE WHEN pnl_money < 0 THEN pnl_money ELSE 0 END) as worst_trade,
      SUM(CASE WHEN signal_type = 'STRONG' THEN 1 ELSE 0 END) as strong_trades,
      SUM(CASE WHEN signal_type = 'NORMAL' THEN 1 ELSE 0 END) as normal_trades
    FROM trades ${closedFilter}
  `;

  const openTrade = await sql`SELECT * FROM trades WHERE result = 'OPEN' LIMIT 1`;
  const balanceHistory = await sql`
    SELECT balance, recorded_at FROM balance_log ORDER BY recorded_at DESC LIMIT 100
  `;

  const s = stats[0];
  const totalTrades = parseInt(s.total_trades) || 0;
  const wins = parseInt(s.wins) || 0;
  const losses = parseInt(s.losses) || 0;
  const winRate = totalTrades > 0 ? (wins / totalTrades * 100) : 0;
  const grossWins = parseFloat(s.gross_wins) || 0;
  const grossLosses = parseFloat(s.gross_losses) || 0;
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : 0;
  const netPnl = parseFloat(s.net_pnl) || 0;
  const startBal = parseFloat(process.env.STARTING_BALANCE || "1000");
  const returnPct = startBal > 0 ? (netPnl / startBal * 100) : 0;

  return NextResponse.json({
    totalTrades,
    wins,
    losses,
    breakevens: parseInt(s.breakevens) || 0,
    winRate: Math.round(winRate * 10) / 10,
    netPnl: Math.round(netPnl * 100) / 100,
    netPoints: Math.round(parseFloat(s.net_points || "0") * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWinPts: Math.round(parseFloat(s.avg_win_pts || "0") * 10) / 10,
    avgLossPts: Math.round(parseFloat(s.avg_loss_pts || "0") * 10) / 10,
    bestTrade: Math.round(parseFloat(s.best_trade || "0") * 100) / 100,
    worstTrade: Math.round(parseFloat(s.worst_trade || "0") * 100) / 100,
    strongTrades: parseInt(s.strong_trades) || 0,
    normalTrades: parseInt(s.normal_trades) || 0,
    returnPct: Math.round(returnPct * 10) / 10,
    balance: Math.round((startBal + netPnl) * 100) / 100,
    startingBalance: startBal,
    openTrade: openTrade[0] || null,
    balanceHistory: balanceHistory.reverse(),
    period,
  });
}
