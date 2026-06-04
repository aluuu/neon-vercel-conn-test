export const metadata = {
  title: "Neon × Vercel connectivity test",
  description: "Minimal app to verify Neon-Vercel integration env vars work at runtime.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ui-monospace, monospace", padding: 24, maxWidth: 900 }}>
        {children}
      </body>
    </html>
  );
}
