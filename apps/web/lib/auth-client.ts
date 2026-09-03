import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Matches BETTER_AUTH_URL on the server — must be the same origin
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
