"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-xl dark:bg-zinc-50">
        🛠️
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        CUmor Admin
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Restricted to superadmins. Sign in with Google to continue.
      </p>
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isLoading ? "Redirecting..." : "Continue with Google"}
      </button>
      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      )}
    </main>
  );
}
