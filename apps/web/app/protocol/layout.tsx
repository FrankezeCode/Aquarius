import { ProtocolShell } from "@/components/protocol-shell";

/**
 * Protocol Shell — "We are inside protocol labs."
 * Navbar, content, footer. Wraps all protocol pages.
 */
export default function ProtocolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtocolShell>
      <div className="container mx-auto px-4 py-6 md:py-8">{children}</div>
    </ProtocolShell>
  );
}
