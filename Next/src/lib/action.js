"use server";

import { verifyPassword } from "./hash";
import {
  createSession,
  decryptSessionData,
  encryptSessionData,
  deleteSession,
} from "./session";
import { createUser, getUserByEmail } from "./user";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionById } from "./session";

export async function signup(prevState, formData) {
  //validation logic can be added here
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { type: "error", message: "User exists already!" };
    }
    await createUser(email, password);
    const user = await getUserByEmail(email);
    if (!user) {
      return { type: "error", message: "User can't be found after creation." };
    }
    await createSession(user.id);
    // redirect to training page after successful signup
    redirect("/training");
    return { type: "success", message: "You successfully signed up!" };
  } catch (err) {
    // Rethrow Next.js redirect exceptions so they can perform navigation
    if (err && (err.digest || "").toString().includes("NEXT_REDIRECT"))
      throw err;
    console.log("Error in creating user:", err);
    return { type: "error", message: "Sign up failed. Please try again." };
  }
}

export async function login(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      console.log("No user found with email:", email);
      return { type: "error", message: "Invalid email or password." };
    }
    const isValidPassword = await verifyPassword(user.password, password);
    if (!isValidPassword) {
      console.log("Password mismatch for user:", email);
      return { type: "error", message: "Invalid email or password." };
    }
    await createSession(user.id);
    // redirect to training page after successful login
    redirect("/training");
    return { type: "success", message: "You successfully logged in!" };
  } catch (err) {
    // Rethrow Next.js redirect exceptions so they can perform navigation
    if (err && (err.digest || "").toString().includes("NEXT_REDIRECT"))
      throw err;
    console.log("Error in logging in user:", err);
    return { type: "error", message: "Login failed. Please try again." };
  }
}

export async function validateSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return null;
  }
  try {
    const sessionData = await decryptSessionData(sessionCookie.value);
    if (!sessionData) {
      return null;
    }
    const { sessionId, expiresAt } = sessionData;
    if (Date.now() > expiresAt) {
      return null;
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return null;
    }

    return session;
  } catch (err) {
    return null;
  }
}

export async function refreshSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    if (!sessionCookie) {
      return null;
    }
    const session = await decryptSessionData(sessionCookie.value);
    const { sessionId } = session;
    const newExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const encryptedSessionData = await encryptSessionData({
      sessionId,
      expiresAt: newExpiresAt,
    });
    cookieStore.set("session", encryptedSessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(newExpiresAt),
    });
    return session;
  } catch (err) {
    console.log("Error in refreshing session:", err);
    return null;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session", { path: "/" });
}

export async function logout() {
  try {
    await deleteSession();
    redirect("/?mode=login");
  } catch (err) {
    console.log("Error in logging out:", err);
    return {
      type: "error",
      message: "Logout failed. Please try again.",
    };
  }
}
