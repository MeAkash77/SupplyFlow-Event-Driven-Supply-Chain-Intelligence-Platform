import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const googleEnabled =
  Boolean(googleClientId && googleClientSecret) &&
  !googleClientId.startsWith("REPLACE_") &&
  !googleClientSecret.startsWith("REPLACE_");

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],

  emailAndPassword: {
    enabled: true,
  },

  ...(googleEnabled
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        },
      }
    : {}),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;
