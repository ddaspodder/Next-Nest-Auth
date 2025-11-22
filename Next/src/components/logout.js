"use client";
import { logout } from "@/lib/action";
import { useActionState } from "react";

export default function Logout() {
  const [state, action] = useActionState(logout, { type: "", message: "" });
  console.log("Logout component state:", state);
  return (
    <div>
      {state.message && state.type === "error" && (
        <p id="error-message-toast">{state.message}</p>
      )}
      <form action={action}>
        <button>Logout</button>
      </form>
    </div>
  );
}
