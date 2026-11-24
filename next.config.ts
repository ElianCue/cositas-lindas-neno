import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "media-src 'self'",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self' https://*.supabase.co${isDev ? " ws: wss:" : ""}`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const noStore = [{ key: "Cache-Control", value: "no-store, max-age=0" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    // Fija la raíz en este proyecto (la carpeta padre tiene su propio
    // package.json/pnpm-lock.yaml que Turbopack detectaría por error).
    root: path.join(__dirname, "."),
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin/:path*", headers: [...noStore, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/auth/:path*", headers: noStore },
      { source: "/login", headers: noStore },
      {
        source: "/pedido/:path*",
        headers: [
          ...noStore,
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
