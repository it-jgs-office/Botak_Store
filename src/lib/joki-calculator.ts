import { mlbbRankStarRange } from "./pricing";
import type { JokiPackage } from "./types";

export const MLBB_CALCULATOR_RANKS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
] as const;

export type CalculatorRankPackage = JokiPackage & { rank: string };

export function packageRank(item: JokiPackage) {
  if (item.rank?.trim()) return item.rank.trim();

  const name = item.name.toLowerCase();
  return [...MLBB_CALCULATOR_RANKS]
    .reverse()
    .find((rank) => name.includes(rank.toLowerCase()));
}

export function calculatorPackages(items: JokiPackage[]): CalculatorRankPackage[] {
  const byRank = new Map<string, CalculatorRankPackage>();

  items
    .filter((item) => item.gameSlug === "mobile-legends" && item.status === "active" && item.perStar)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((item) => {
      const rank = packageRank(item);
      if (rank && !byRank.has(rank)) byRank.set(rank, { ...item, rank });
    });

  return MLBB_CALCULATOR_RANKS
    .map((rank) => byRank.get(rank))
    .filter((item): item is CalculatorRankPackage => Boolean(item));
}

export function calculatePerStarBoost(
  packages: CalculatorRankPackage[],
  fromRank: string,
  toRank: string,
  fromStars: number,
  toStars: number,
) {
  const fromIndex = packages.findIndex((item) => item.rank === fromRank);
  const toIndex = packages.findIndex((item) => item.rank === toRank);
  if (fromIndex < 0 || toIndex <= fromIndex) return { stars: 0, total: 0 };

  let stars = 0;
  let total = 0;

  for (let index = fromIndex; index < toIndex; index += 1) {
    const current = packages[index]!;
    const range = mlbbRankStarRange(current.rank);
    const currentStars = index === fromIndex ? fromStars : range.min;
    const needed = Math.max(0, range.max - currentStars + 1);
    stars += needed;
    total += needed * current.price;
  }

  const target = packages[toIndex]!;
  const targetRange = mlbbRankStarRange(target.rank);
  const targetStars = Math.max(targetRange.min, toStars);
  const targetNeeded = Math.max(0, targetStars - targetRange.min);
  stars += targetNeeded;
  total += targetNeeded * target.price;

  return { stars, total };
}
