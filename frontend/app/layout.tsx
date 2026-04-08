import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethinos Marketing Platform",
  description: "Multi-client marketing analytics and AI reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
