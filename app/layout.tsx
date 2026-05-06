import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plotverse Automation Studio",
  description: "Personal multi-agent studio for matching real-estate properties with clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
