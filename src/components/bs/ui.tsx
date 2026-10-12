import { useEffect, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_META, PAYMENT_STATUS_META, type Tone } from "@/lib/format";
import type { Game, OrderStatus, PaymentStatus } from "@/lib/types";
import { useDB } from "@/lib/store";

const toneCls: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/15 text-primary-glow border-primary/30",
  info: "bg-info/15 text-info border-info/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

export function ToneBadge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", toneCls[tone], className)}>
      {children}
    </span>
  );
}
export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <ToneBadge tone={ORDER_STATUS_META[status].tone}>{ORDER_STATUS_META[status].label}</ToneBadge>
);
export const PaymentBadge = ({ status }: { status: PaymentStatus }) => (
  <ToneBadge tone={PAYMENT_STATUS_META[status].tone}>{PAYMENT_STATUS_META[status].label}</ToneBadge>
);

/** Data-driven game cover (hue comes from game data). */
export function GameTile({ game, className, size = "md" }: { game: Pick<Game, "short" | "hue" | "name">; className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div
      aria-label={game.name}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-display font-bold text-foreground",
        size === "sm" && "h-10 w-10 text-xs", size === "md" && "h-14 w-14 text-sm", size === "lg" && "h-full w-full text-3xl",
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, oklch(0.55 0.17 ${game.hue}), oklch(0.22 0.06 ${game.hue}))` }}
    >
      <span className="relative z-10 tracking-wider drop-shadow">{game.short}</span>
      <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-foreground/10" />
    </div>
  );
}

export function Avatar({ name, hue = 280, className }: { name: string; hue?: number; className?: string }) {
  const init = name.replace(/'.*'/, "").trim().split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground", className)}
      style={{ backgroundColor: `oklch(0.45 0.13 ${hue})` }}>
      {init}
    </div>
  );
}

export function EmptyState({ title, desc, icon: Icon = Inbox, action }: { title: string; desc?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <p className="mt-3 font-semibold">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "primary" }: { label: string; value: ReactNode; icon: LucideIcon; hint?: string; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("rounded-lg border p-2", toneCls[tone])}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string | undefined; hint?: string | undefined; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function NativeSelect({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cn("h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}>
      {children}
    </select>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function useSession() {
  const db = useDB();
  const user = db.session ? db.users.find((u) => u.id === db.session!.userId) : undefined;
  return { session: db.session, user };
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
