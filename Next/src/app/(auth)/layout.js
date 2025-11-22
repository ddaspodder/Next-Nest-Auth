import "../globals.css";
import Logout from "@/components/logout";

export const metadata = {
  title: "Next Auth",
  description: "Next.js Authentication",
};

export default function AuthLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header id="auth-header">
          <p>Welcome back</p>
          <Logout />
        </header>
        {children}
      </body>
    </html>
  );
}
