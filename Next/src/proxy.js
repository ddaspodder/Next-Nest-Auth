import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  refreshSession,
  validateSession,
} from "./lib/action";

export async function proxy(req) {
  const session = await validateSession();
  if (session) await refreshSession();
  else await clearSessionCookie();
  return NextResponse.next();
}
