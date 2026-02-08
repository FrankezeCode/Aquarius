import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ProtocolChainProvider } from "@/context/protocol-chain-context";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Aquarius DeFi Lab",
  description: "API-first, real-time DeFi intelligence system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={fontSans.variable}>
        <ProtocolChainProvider>{children}</ProtocolChainProvider>
      </body>
    </html>
  );
}
