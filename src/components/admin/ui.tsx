import type { ReactNode } from "react";

export const adminField =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold-leaf";

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xs uppercase tracking-[0.25em] text-mercury">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-full bg-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-obsidian disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function GoldButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-full bg-gold-leaf px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-obsidian disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
