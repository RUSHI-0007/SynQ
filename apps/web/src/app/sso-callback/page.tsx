"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    // handleRedirectCallback can return undefined in some Clerk versions/states,
    // so we wrap in Promise.resolve to safely attach .catch without crashing.
    Promise.resolve(
      handleRedirectCallback({
        // Use the current non-deprecated prop names
        fallbackRedirectUrl: "/dashboard",
        signUpFallbackRedirectUrl: "/dashboard",
      })
    ).catch(() => {
      router.push("/");
    });
  }, [handleRedirectCallback, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
