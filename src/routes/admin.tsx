import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import logo from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — ALTAIRSTORE" },
      { name: "description", content: "Private ALTAIRSTORE management console." },
      { property: "og:title", content: "Admin Console — ALTAIRSTORE" },
      { property: "og:description", content: "Private ALTAIRSTORE management console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-obsidian text-white/60">
        <p className="eyebrow">Verifying access…</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-obsidian px-6 text-center text-white">
        <div>
          <img src={logo.url} alt="" className="mx-auto h-14 w-14 invert" />
          <h1 className="mt-6 font-display text-xl uppercase tracking-[0.2em]">Restricted</h1>
          <p className="mt-3 text-sm text-white/60">
            This console is limited to the ALTAIRSTORE administrator account.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-obsidian"
          >
            Back to the store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="ALTAIRSTORE" className="h-8 w-8 invert" />
          <span className="font-display text-xs uppercase tracking-[0.28em]">Admin</span>
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/" });
          }}
          className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50"
        >
          Sign out
        </button>
      </header>
      <Outlet />
    </div>
  );
}
