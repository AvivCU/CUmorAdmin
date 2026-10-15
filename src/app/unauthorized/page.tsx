import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl dark:bg-red-950">
        🔒
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Access denied
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {user?.email ? `${user.email} is` : "Your account is"} signed in, but
        doesn&apos;t have superadmin access to this admin area.
      </p>
      <Link
        href="/login"
        className="mt-6 text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
      >
        Try a different account
      </Link>
      <SignOutButton className="mt-2" />
    </main>
  );
}
