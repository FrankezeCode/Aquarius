import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/aqua-logo-white.png.png"
                alt="Aquarius logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-semibold">Aquarius</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The new standard for protecting on-chain finance—built to prevent avoidable losses before they happen.
            </p>
          </div>

          {/* Protocols */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Protocols</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/protocol/aave" className="hover:text-foreground transition-colors">
                  Aave
                </Link>
              </li>
              <li className="text-muted-foreground/50">Compound (Coming)</li>
              <li className="text-muted-foreground/50">Uniswap (Coming)</li>
              <li className="text-muted-foreground/50">Lido (Coming)</li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-foreground transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Connect</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 Aquarius DeFi Lab. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
              Verified on-chain data
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
