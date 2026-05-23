import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diet App",
  description: "Track your diet and nutrition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
