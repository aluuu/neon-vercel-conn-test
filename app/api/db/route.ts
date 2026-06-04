// JSON probe — useful for curl-based tests + Vercel deployment status checks.
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL;
  const t0 = Date.now();
  if (!url) {
    return Response.json(
      { ok: false, error: "DATABASE_URL not set", durationMs: 0 },
      { status: 500 },
    );
  }
  try {
    const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 8 });
    const [row] = await sql<
      { now: string; db: string; user: string; version: string }[]
    >`
      SELECT NOW()::text AS now,
             current_database() AS db,
             current_user AS "user",
             version() AS version
    `;
    await sql.end({ timeout: 2 });
    return Response.json({
      ok: true,
      durationMs: Date.now() - t0,
      result: {
        now: row.now,
        db: row.db,
        user: row.user,
        serverVersion: row.version,
      },
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        durationMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
