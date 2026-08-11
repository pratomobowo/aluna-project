import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import "dotenv/config";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google:
      googleClientId && googleClientSecret
        ? { clientId: googleClientId, clientSecret: googleClientSecret }
        : undefined
  },
  user: {
    modelName: "users",
    additionalFields: {
      isTherapist: { type: "boolean", defaultValue: false }
    }
  },
  trustedOrigins: (process.env.FRONTEND_URL ?? "").split(",")
});
