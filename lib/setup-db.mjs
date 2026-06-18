import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log("Setting up database...");
  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      signal_type TEXT NOT NULL,
      session TEXT NOT NULL,
      entry_price NUMERIC NOT NULL,
      sl NUMERIC NOT NULL,
      tp NUMERIC NOT NULL,
      lot NUMERIC NOT NULL,
      rr NUMERIC NOT NULL,
      risk_amount NUMERIC NOT NULL,
      entry_time TIMESTAMPTZ NOT NULL,
      exit_price NUMERIC,
      exit_time TIMESTAMPTZ,
      pnl_points NUMERIC DEFAULT 0,
      pnl_money NUMERIC DEFAULT 0,
      result TEXT DEFAULT 'OPEN',
      ticket BIGINT DEFAULT 0,
      balance_after NUMERIC DEFAULT 0,
      fake_direction TEXT,
      mss_price NUMERIC,
      ob_top NUMERIC,
      ob_bottom NUMERIC,
      partial_done BOOLEAN DEFAULT FALSE,
      notes TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS balance_log (
      id SERIAL PRIMARY KEY,
      balance NUMERIC NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("Done!");
}

setup().catch(console.error);
