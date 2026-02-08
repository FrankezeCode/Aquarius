import type { LucideProps } from "lucide-react";
import { AaveLogo } from "@/components/protocol-shell/protocol-logos";

export interface ProtocolMetaItem {
  name: string;
  logo: React.ComponentType<LucideProps>;
  learnPath: string;
}

export const protocolMeta: Record<string, ProtocolMetaItem> = {
  aave: {
    name: "Aave",
    logo: AaveLogo,
    learnPath: "/protocol/aave/learn",
  },
};
