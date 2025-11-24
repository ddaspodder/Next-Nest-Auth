import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  refreshSession,
  validateSession,
} from "./lib/action";

const privateRoutes = ["/training"];

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isPrivate = privateRoutes.some((route) =>
    new RegExp(`^${route}(/.*)?$`).test(pathname)
  );
  if (isPrivate) {
    const session = await validateSession();
    //todo this only if expired not on invalid
    if (!session) {
      await clearSessionCookie();
    }
    if (session && session.expired) {
      const token = await refreshSession();
      if (!token) {
        await clearSessionCookie();
      }
      //Session Refresh was completed, but cookies will be set after the request is complete, so if we let the request continue, it will still not have the cookies set, so we redirect to the same path to ensure cookies are set first
      return NextResponse.redirect(req.url);
    }
  }

  return NextResponse.next();
}
