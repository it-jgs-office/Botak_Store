import { Link } from "@tanstack/react-router";
import { Clock, Star } from "lucide-react";
import { rupiah } from "@/lib/format";
import { startingPrice } from "@/lib/pricing";
import type { Game, JokiService } from "@/lib/types";
import { GameTile, ToneBadge } from "./ui";

export function ServiceCard({ service, game }: { service: JokiService; game?: Game | undefined }) {
  return (
    <Link to="/joki/$slug" params={{ slug: service.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
      <div className="relative h-20 sm:h-28">
        {game && <GameTile game={game} size="lg" className="rounded-none" />}
        {service.badge && <ToneBadge tone={service.badge === "Promo" ? "warning" : service.badge === "Terlaris" ? "primary" : "info"} className="absolute left-3 top-3 bg-background/80">{service.badge}</ToneBadge>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <p className="text-xs text-muted-foreground">{game?.name}</p>
        <h3 className="text-sm font-semibold leading-tight group-hover:text-primary-glow sm:text-base">{service.name}</h3>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:gap-3 sm:text-xs">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{service.rating} ({service.reviews})</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{service.estimate}</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Mulai dari</p>
            <p className="font-display text-sm font-bold sm:text-lg">{rupiah(startingPrice(service))}</p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">{service.sold.toLocaleString("id-ID")} terjual</span>
        </div>
      </div>
    </Link>
  );
}
