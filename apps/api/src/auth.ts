import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import "dotenv/config";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (process.env.NODE_ENV === "production") {
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set and at least 32 characters in production");
  }
}

// ponytail: warn once so devs notice SMTP isn't configured without spamming logs
let warnedResetSmtp = false;

async function sendResetPassword({ user, url, token }: { user: { email: string }; url: string; token: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warnedResetSmtp) {
      console.warn("[aluna] RESEND_API_KEY not set — skipping reset password email");
      warnedResetSmtp = true;
    }
    return;
  }
  const from = process.env.RESEND_FROM ?? "Aluna <no-reply@aluna.id>";
  // ponytail: Better Auth's url is <baseURL>/reset-password/:token?callbackURL=… (an API endpoint);
  // rebuild so the click lands on the SPA with the token as a query param.
  const m = url.match(/reset-password\/([^/?]+)/);
  const tokenFromUrl = m?.[1] ?? token;
  const resetUrl = `${(process.env.FRONTEND_URL ?? "http://localhost:5173").split(",")[0]}/reset-password?token=${tokenFromUrl}`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: user.email,
      subject: "Reset password Aluna",
      html: `<p>Halo,</p><p>Klik tautan berikut untuk mengatur ulang password Aluna kamu:</p><p><a href="${resetUrl}">Reset password</a></p><p>Jika kamu tidak meminta ini, abaikan email ini.</p>`,
      text: `Reset password Aluna: ${resetUrl}`,
    }),
  });
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword,
  },
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
  trustedOrigins: (process.env.FRONTEND_URL ?? "").split(","),
  advanced: {
    cookiePrefix: "aluna",
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
    },
  },
});
