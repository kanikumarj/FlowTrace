// ─── Confluence OAuth Token Management ──────────────────────
// Encrypts/decrypts tokens at rest using AES-256-GCM.

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CONFLUENCE_TOKEN_ENCRYPTION_KEY ?? "";

function getKeyBuffer(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error("CONFLUENCE_TOKEN_ENCRYPTION_KEY is required");
  }
  return crypto.scryptSync(ENCRYPTION_KEY, "flowtrace-salt", 32);
}

export function encryptToken(plaintext: string): string {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(ciphertext: string): string {
  const key = getKeyBuffer();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted token format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function getConfluenceAuthUrl(workspaceId: string): string {
  const clientId = process.env.CONFLUENCE_CLIENT_ID ?? "";
  const redirectUri = process.env.CONFLUENCE_REDIRECT_URI ?? "";
  const scopes = [
    "read:confluence-space.summary",
    "read:confluence-content.all",
    "write:confluence-content",
    "read:confluence-content.summary",
  ].join(" ");

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: workspaceId,
    response_type: "code",
    prompt: "consent",
  });

  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.CONFLUENCE_CLIENT_ID,
      client_secret: process.env.CONFLUENCE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.CONFLUENCE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.CONFLUENCE_CLIENT_ID,
      client_secret: process.env.CONFLUENCE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
  };
}
