import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  refreshSession,
  validateSession,
} from "./lib/action";

const privateRoutes = ["/training"];

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isPrivate = privateRoutes.some((route) => pathname.startsWith(route));
  if (isPrivate) {
    console.log("Validating session for route:", pathname);
    let token = await validateSession();
    if (!token) {
      console.log("Access token invalid or missing, attempting to refresh...");
      token = await refreshSession();
      console.log("Session refreshed successfully:", token);
      //Session Refresh was completed but still the training page session is null for this request, it gets set only in the next request why ?
      if (!token) {
        console.log("Refresh failed, clearing session cookies.");
        await clearSessionCookie();
      }
    }
  }

  return NextResponse.next();
}
