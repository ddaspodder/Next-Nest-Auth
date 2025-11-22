"use client";
import AuthForm from "@/components/auth-form";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "signup";

  if (mode === "login") {
    return <AuthForm mode="login" />;
  }
  return <AuthForm />;
}
