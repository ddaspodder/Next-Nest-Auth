"use client";
import Link from "next/link";
import { signup, login } from "../lib/action";
import { useActionState } from "react";
export default function AuthForm({ mode = "signup" }) {
  const [state, action] = useActionState(mode === "signup" ? signup : login, {
    type: "",
    message: "",
  });
  return (
    <div>
      {state.message && (
        <p id={state.type === "error" ? "error-message" : "success-message"}>
          {state.message}
        </p>
      )}
      <form id="auth-form" action={action}>
        <div>
          <img src="/images/auth-icon.jpg" alt="A lock icon" />
        </div>
        <p>
          <label htmlFor="email">Email</label>
          <input type="email" name="email" id="email" />
        </p>
        <p>
          <label htmlFor="password">Password</label>
          <input type="password" name="password" id="password" />
        </p>
        <p>
          <button type="submit">
            {mode === "signup" ? "Create Account" : "Login"}
          </button>
        </p>
        {mode === "signup" && (
          <p>
            <Link href="/?mode=login">Login with existing account.</Link>
          </p>
        )}
        {mode === "login" && (
          <p>
            <Link href="/?mode=signup">Create a new account.</Link>
          </p>
        )}
      </form>
    </div>
  );
}
