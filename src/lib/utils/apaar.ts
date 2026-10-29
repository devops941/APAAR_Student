/**
 * APAAR ID normalization and masking utilities.
 *
 * The APAAR ID (Automated Permanent Academic Account Registry) is a
 * sensitive 12-digit numeric identifier. It must be:
 * - Masked everywhere by default (XXXXXXXX1234 — only last 4 digits)
 * - Normalized to digits-only before storage
 * - Validated with a strict regex
 */

/**
 * Normalize a raw APAAR ID input: remove spaces and dashes, validate 12 digits.
 * Throws an error if the format is invalid.
 */
export function normalizeApaarId(input?: string): string | undefined {
  if (!input) return undefined;
  const cleaned = input.replace(/[\s-]/g, "").trim();
  if (!/^\d{12}$/.test(cleaned)) {
    throw new Error("Invalid APAAR ID format. Must be a 12-digit number.");
  }
  return cleaned;
}

/**
 * Mask an APAAR ID, showing only the last 4 digits.
 * @example maskApaarId("123456789012") → "XXXXXXXX9012"
 */
export function maskApaarId(apaarId?: string): string {
  if (!apaarId || apaarId.length < 4) return "—";
  return `XXXXXXXX${apaarId.slice(-4)}`;
}

/**
 * Format an APAAR ID for display with spaces (e.g. "1234 5678 9012").
 */
export function formatApaarId(apaarId?: string): string {
  if (!apaarId) return "—";
  return apaarId.replace(/(\d{4})(?=\d)/g, "$1 ");
}
