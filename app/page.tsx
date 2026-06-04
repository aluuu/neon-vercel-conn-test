// Server component — runs the DB query at request time so we don't try to
// connect during `next build`. (Build-time connection would fail anyway from
// the Vercel build container if DATABASE_URL points at *.localtest.me.)
export const dynamic = "force-dynamic";

import postgres from "postgres";

type DBProbeResult =
  | { ok: true; now: string; db: string; dbUser: string; serverVersion: string; durationMs: number }
  | { ok: false; error: string; durationMs: number };

async function probeDB(): Promise<DBProbeResult> {
  const url = process.env.DATABASE_URL;
  const t0 = Date.now();
  if (!url) {
    return { ok: false, error: "DATABASE_URL not set", durationMs: 0 };
  }
  try {
    const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 8 });
    const [row] = await sql<{ now: string; db: string; user: string; version: string }[]>`
      SELECT NOW()::text AS now,
             current_database() AS db,
             current_user AS "user",
             version() AS version
    `;
    await sql.end({ timeout: 2 });
    return {
      ok: true,
      now: row.now,
      db: row.db,
      dbUser: row.user,
      serverVersion: row.version,
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
    };
  }
}

function envPresence() {
  // Don't expose values — just presence — so we can confirm the integration
  // wired the var on the deployment without leaking credentials.
  const names = [
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "PGHOST",
    "PGHOST_UNPOOLED",
    "PGUSER",
    "PGDATABASE",
    "PGPASSWORD",
    "NEON_AUTH_BASE_URL",
    "VITE_NEON_AUTH_URL",
  ];
  return names.map((n) => ({ name: n, present: typeof process.env[n] === "string" && process.env[n] !== "" }));
}

export default async function Page() {
  const result = await probeDB();
  const env = envPresence();
  return (
    <main>
      <h1>Neon × Vercel connectivity test</h1>

      <h2>DB probe</h2>
      <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 6 }}>
        {JSON.stringify(result, null, 2)}
      </pre>

      <h2>Env-var presence</h2>
      <table cellPadding={6} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr><th align="left">Variable</th><th align="left">Present?</th></tr>
        </thead>
        <tbody>
          {env.map((e) => (
            <tr key={e.name}>
              <td>{e.name}</td>
              <td>{e.present ? "✓ set" : "— missing"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
        For more detail: <a href="/api/db">/api/db</a> · <a href="/api/env">/api/env</a>
      </p>
    </main>
  );
}
