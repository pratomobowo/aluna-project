import type { Context } from "hono";
import { currentUser } from "./session";

// ponytail: admin = isTherapist flag OR listed email; no role system yet
export async function isAdmin(c: Context) {
  const user = await currentUser(c);
  if (!user) return false;
  if (user.isTherapist) return true;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  return admins.includes(user.email ?? "");
}
