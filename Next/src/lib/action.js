"use server";

import { cookies } from "next/headers";
import { validateJwt } from "./validate";
import { redirect } from "next/navigation";

export async function signup(prevState, formData) {
  //validation logic can be added here
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    const response = await fetch(`${process.env.API_URL}/user/signup`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { token, refreshToken } = await response.json();

    const cookieStore = await cookies();

    cookieStore.set("access-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });

    cookieStore.set("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

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
    const response = await fetch(`${process.env.API_URL}/user/signin`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { token, refreshToken } = await response.json();

    const cookieStore = await cookies();

    cookieStore.set("access-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });

    cookieStore.set("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

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
  const sessionCookie = cookieStore.get("access-token");
  if (!sessionCookie) {
    return null;
  }

  try {
    const token = sessionCookie.value;
    const { valid } = validateJwt(token);
    if (valid) return token;
    return null;
  } catch (err) {
    return null;
  }
}

export async function refreshSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("refresh-token");
    if (!sessionCookie) {
      return null;
    }
    const refreshToken = sessionCookie.value;
    const response = await fetch(`${process.env.API_URL}/user/refresh-token`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const { token, refreshToken: newRefreshToken } = await response.json();

    cookieStore.set("access-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });
    cookieStore.set("refresh-token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return token;
  } catch (err) {
    console.log("Error in refreshing session:", err);
    return null;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("access-token", { path: "/" });
  cookieStore.delete("refresh-token", { path: "/" });
}

export async function logout() {
  try {
    await clearSessionCookie();
    redirect("/?mode=login");
    return { type: "success", message: "You have been logged out." };
  } catch (err) {
    if (err && (err.digest || "").toString().includes("NEXT_REDIRECT"))
      throw err;
    console.log("Error in logging out:", err);
    return {
      type: "error",
      message: "Logout failed. Please try again.",
    };
  }
}
