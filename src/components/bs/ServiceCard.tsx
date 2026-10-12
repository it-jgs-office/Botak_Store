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
      <div className="relative h-28">
        {game && <GameTile game={game} size="lg" className="rounded-none" />}
        {service.badge && <ToneBadge tone={service.badge === "Promo" ? "warning" : service.badge === "Terlaris" ? "primary" : "info"} className="absolute left-3 top-3 bg-background/80">{service.badge}</ToneBadge>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-muted-foreground">{game?.name}</p>
        <h3 className="font-semibold leading-tight group-hover:text-primary-glow">{service.name}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{service.rating} ({service.reviews})</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{service.estimate}</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Mulai dari</p>
            <p className="font-display text-lg font-bold">{rupiah(startingPrice(service))}</p>
          </div>
          <span className="text-xs text-muted-foreground">{service.sold.toLocaleString("id-ID")} terjual</span>
        </div>
      </div>
    </Link>
  );
}
