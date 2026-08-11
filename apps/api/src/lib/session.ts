import type { Context } from "hono";
import { auth } from "../auth";

export async function currentUser(c: Context) {
  const headers = new Headers();
  const cookie = c.req.header("cookie");
  if (cookie) headers.set("cookie", cookie);
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}
