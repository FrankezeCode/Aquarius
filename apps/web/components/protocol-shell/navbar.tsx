"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolDropdown } from "@/components/navigation";
import { protocolMeta } from "@/lib/protocol-meta";
import { getProtocolNavItems } from "@/registry/protocols";
import { getSupportedChains, getDefaultChain } from "@/registry/protocolChains";
import { useProtocolChain } from "@/context/protocol-chain-context";
import { ChainIcon } from "@/components/navigation/chain-icon";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProtocolOpen, setIsMobileProtocolOpen] = useState(false);
  const [mobileNetworkOpen, setMobileNetworkOpen] = useState<string | null>(null);
  const pathname = usePathname();

  const match = pathname.match(/^\/protocol\/([^/]+)/);
  const activeProtocolSlug = match?.[1];
  const activeProtocol = activeProtocolSlug
    ? protocolMeta[activeProtocolSlug]
    : null;

  const { activeChain, switchChain, monitorTargetProtocolId } =
    useProtocolChain();

  const monitorMeta = protocolMeta[monitorTargetProtocolId];
  const monitorHref = `/protocol/${monitorTargetProtocolId}`;
  /** monitorTargetProtocolId is aave|kamino from context; fallback if meta missing */
  const monitorLabel = monitorMeta
    ? `Monitor ${monitorMeta.name} Risk`
    : "Monitor protocol risk";

  const isActive = (path: string) => pathname.startsWith(path);
  const navItems = getProtocolNavItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/brand/aqua-logo-white.png.png"
              alt="Aquarius logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain transition-transform group-hover:scale-110"
              priority
            />
            <span className="text-xl font-semibold tracking-tight">
              Aquarius
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Protocol Dropdown (Radix Popover-based) */}
            <ProtocolDropdown />

            <Link
              href="/how-it-works"
              className={`text-sm transition-colors ${
                isActive("/how-it-works")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              How it Works
            </Link>
          </div>

          {/* Auth Buttons or Protocol Learn Link */}
          <div className="hidden md:flex items-center gap-4">
            {activeProtocol ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <activeProtocol.logo className="h-6 w-6" />
                  <Link
                    href={activeProtocol.learnPath}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Learn about {activeProtocol.name}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href={monitorHref}>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {monitorLabel}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Protocols Collapsible */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsMobileProtocolOpen(!isMobileProtocolOpen)}
                  className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Protocols
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      isMobileProtocolOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isMobileProtocolOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {navItems.map((item) => {
                        const isCurrent = item.slug === activeProtocolSlug;
                        const chains =
                          item.status === "active"
                            ? getSupportedChains(item.slug)
                            : [];
                        const currentChain = isCurrent
                          ? activeChain
                          : item.status === "active"
                            ? getDefaultChain(item.slug) ?? null
                            : null;
                        const isNetworkExpanded =
                          mobileNetworkOpen === item.slug;

                        return (
                          <div key={item.slug}>
                            <div className="flex items-center justify-between py-2">
                              {item.status === "active" ? (
                                <Link
                                  href={`/protocol/${item.slug}`}
                                  className={`text-sm ${
                                    isCurrent
                                      ? "text-foreground font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {item.name}
                                </span>
                              )}

                              {item.status === "coming" ? (
                                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                                  Soon
                                </span>
                              ) : currentChain && chains.length > 0 ? (
                                <button
                                  onClick={() =>
                                    setMobileNetworkOpen(
                                      isNetworkExpanded ? null : item.slug
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card/50 px-2.5 py-1 text-xs"
                                >
                                  <ChainIcon
                                    chainId={currentChain.id}
                                    className="h-4 w-4 text-[8px]"
                                  />
                                  <span className="text-foreground">
                                    {currentChain.name}
                                  </span>
                                  <ChevronDown
                                    className={`h-3 w-3 text-muted-foreground transition-transform ${
                                      isNetworkExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              ) : null}
                            </div>

                            {/* Mobile chain list */}
                            <AnimatePresence>
                              {isNetworkExpanded && chains.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="ml-4 space-y-0.5 overflow-hidden pb-2"
                                >
                                  {chains.map((chain) => {
                                    const isSelected =
                                      chain.id === currentChain?.id;
                                    return (
                                      <button
                                        key={chain.id}
                                        onClick={() => {
                                          switchChain(chain.id);
                                          setMobileNetworkOpen(null);
                                        }}
                                        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                                          isSelected
                                            ? "bg-accent text-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        }`}
                                      >
                                        <ChainIcon
                                          chainId={chain.id}
                                          className="h-4 w-4 text-[8px]"
                                        />
                                        <span>{chain.name}</span>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/how-it-works"
                className={`block py-2 text-sm ${
                  isActive("/how-it-works")
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How it Works
              </Link>

              <div className="pt-4 border-t border-border space-y-2">
                {activeProtocol ? (
                  <Link
                    href={activeProtocol.learnPath}
                    className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <activeProtocol.logo className="h-5 w-5" />
                    Learn about {activeProtocol.name}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href={monitorHref}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button className="w-full bg-primary text-primary-foreground">
                        {monitorLabel}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
