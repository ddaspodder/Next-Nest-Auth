import "server-only";
import { cookies } from "next/headers";

export async function getTrainings() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access-token")?.value;
  if (!token) {
    return [];
  }
  return fetch(`${process.env.API_URL}/training`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch training sessions");
      return res.json();
    })
    .catch((error) => {
      console.error("Error fetching training sessions:", error);
      return [];
    });
}
