// Returns presence (not values) for every Neon-managed env var. Useful for
// verifying the integration wired the right vars on a deployment without
// leaking secrets via the response.
export const dynamic = "force-dynamic";

const NAMES = [
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

export async function GET() {
  return Response.json({
    deploymentEnv: process.env.VERCEL_ENV || null, // production | preview | development
    vercelUrl: process.env.VERCEL_URL || null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF || null,
    presence: Object.fromEntries(
      NAMES.map((n) => [n, typeof process.env[n] === "string" && process.env[n] !== ""]),
    ),
  });
}
