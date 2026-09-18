import type { NextConfig } from "next";

/**
 * Header keamanan dasar (S16). Tanpa ini Next.js tidak memasang apa pun:
 * halaman bisa di-*frame* (clickjacking alur bagikan) dan respons API tidak
 * menyatakan `nosniff`. Tidak ada CSP penuh — aplikasi memakai gaya inline
 * (Satori/`next/og` dan banyak `style={{...}}`), jadi CSP ketat akan
 * mematahkan render; header di bawah ini aman tanpa itu.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
