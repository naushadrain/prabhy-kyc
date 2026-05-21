// Re-exports the canonical refresh client so old imports don't break.
// All token refresh logic lives in src/api/auth/refreshTokenClient.ts
export { refreshAccessToken as refreshToken, refreshAccessToken } from "@/api/auth/refreshTokenClient";
