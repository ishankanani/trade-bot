import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== process.env.API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const trade = await req.json();

  await sql`
    INSERT INTO trades (id, symbol, direction, signal_type, session, entry_price, sl, tp, lot, rr,
      risk_amount, entry_time, exit_price, exit_time, pnl_points, pnl_money, result, ticket,
      balance_after, fake_direction, mss_price, ob_top, ob_bottom, partial_done, notes)
    VALUES (${trade.id}, ${trade.symbol}, ${trade.direction}, ${trade.signal_type}, ${trade.session},
      ${trade.entry_price}, ${trade.sl}, ${trade.tp}, ${trade.lot}, ${trade.rr},
      ${trade.risk_amount}, ${trade.entry_time}, ${trade.exit_price}, ${trade.exit_time},
      ${trade.pnl_points}, ${trade.pnl_money}, ${trade.result}, ${trade.ticket},
      ${trade.balance_after}, ${trade.fake_direction}, ${trade.mss_price},
      ${trade.ob_top}, ${trade.ob_bottom}, ${trade.partial_done || false}, ${trade.notes})
    ON CONFLICT (id) DO UPDATE SET
      exit_price = EXCLUDED.exit_price,
      exit_time = EXCLUDED.exit_time,
      pnl_points = EXCLUDED.pnl_points,
      pnl_money = EXCLUDED.pnl_money,
      result = EXCLUDED.result,
      balance_after = EXCLUDED.balance_after,
      partial_done = EXCLUDED.partial_done,
      notes = EXCLUDED.notes
  `;

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  let dateFilter = "";
  const now = new Date();
  if (period === "1w") dateFilter = new Date(now.getTime() - 7 * 86400000).toISOString();
  else if (period === "1m") dateFilter = new Date(now.getTime() - 30 * 86400000).toISOString();
  else if (period === "2m") dateFilter = new Date(now.getTime() - 60 * 86400000).toISOString();
  else if (period === "3m") dateFilter = new Date(now.getTime() - 90 * 86400000).toISOString();
  else if (period === "1y") dateFilter = new Date(now.getTime() - 365 * 86400000).toISOString();

  let trades;
  let total;

  if (dateFilter) {
    trades = await sql`
      SELECT * FROM trades WHERE entry_time >= ${dateFilter}
      ORDER BY entry_time DESC LIMIT ${limit} OFFSET ${offset}
    `;
    total = await sql`SELECT COUNT(*) as count FROM trades WHERE entry_time >= ${dateFilter}`;
  } else {
    trades = await sql`
      SELECT * FROM trades ORDER BY entry_time DESC LIMIT ${limit} OFFSET ${offset}
    `;
    total = await sql`SELECT COUNT(*) as count FROM trades`;
  }

  return NextResponse.json({
    trades,
    total: parseInt(total[0].count),
    page,
    limit,
  });
}
