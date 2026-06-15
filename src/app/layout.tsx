import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeningMata Travel - Cari Tiket Pesawat Murah",
  description: "Bandingkan rute, jadwal, dan harga penerbangan terbaik untuk perjalananmu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
