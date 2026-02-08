/**
 * Shared protocol definition type.
 * Each protocol folder exports a definition conforming to this.
 */

export type ProtocolStatus = "active" | "preview";

export interface ProtocolMetadata {
  category: string;
  status: ProtocolStatus;
}

export interface ProtocolDefinition {
  id: string;
  name: string;
  metadata: ProtocolMetadata;
}
