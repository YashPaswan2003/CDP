"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = getAuthToken();
    if (!token) {
      // Auto-login for development/testing
      if (process.env.NODE_ENV === "development") {
        localStorage.setItem("token", "dev-token-12345");
        router.push("/dashboard");
      } else {
        router.push("/auth");
      }
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  if (!isClient) return null;

  return null;
}
