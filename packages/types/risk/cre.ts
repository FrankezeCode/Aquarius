/**
 * CRE / SELVA escalation stage — shared kernel (Aave + Kamino risk surfaces).
 * Keep protocol folders from importing each other; depend on this type instead.
 */
export type CreEscalationStage = "info" | "confirm" | "invalidate";
