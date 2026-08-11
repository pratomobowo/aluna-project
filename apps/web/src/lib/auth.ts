import { apiFetch } from "./api";

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  isTherapist?: boolean;
  createdAt?: string;
}

export interface SessionResponse {
  session: { id: string; userId: string; expiresAt: Date | string } | null;
  user: AuthUser | null;
}

export async function getSession(): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/api/auth/get-session");
}

export async function signIn(email: string, password: string) {
  return apiFetch("/api/auth/sign-in/email", {
    method: "POST",
    body: { email, password },
  });
}

export async function signUp(name: string, email: string, password: string) {
  return apiFetch("/api/auth/sign-up/email", {
    method: "POST",
    body: { name, email, password },
  });
}

export async function signInSocial(provider: "google") {
  const res = await apiFetch<{ url?: string }>("/api/auth/sign-in/social", {
    method: "POST",
    body: { provider, callbackURL: `${window.location.origin}/` },
  });
  if (res.url) window.location.href = res.url;
}

export async function signOut() {
  return apiFetch("/api/auth/sign-out", {
    method: "POST",
    body: {},
  });
}

export async function requestPasswordReset(email: string) {
  return apiFetch("/api/auth/request-password-reset", {
    method: "POST",
    body: { email, redirectTo: `${window.location.origin}/reset-password` },
  });
}

export async function resetPassword(newPassword: string, token: string) {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: { newPassword, token },
  });
}
