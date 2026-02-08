import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/protocol-shell/navbar";
import Footer from "@/components/protocol-shell/footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold mb-2">How It Works</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Choose a protocol, see live activity, and act with clarity. No complexity, no guesswork.
      </p>
      <Link href="/protocol/aave">
        <Button>Explore Aave</Button>
      </Link>
      </main>
      <Footer />
    </div>
  );
}
