import { createHash, randomBytes } from "node:crypto";

export const INVITATION_DAYS = 7;

export function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function invitationToken(): string {
  return randomBytes(32).toString("hex");
}

export function invitationTokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function validInvitationToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}
