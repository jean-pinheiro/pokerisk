"use client";

import { Button } from "@/components/ui/button";
import type { Card, Rank, Suit } from "@/lib/card-utils";

interface DeckGridProps {
  onCardSelect: (card: Card) => void;
  usedCards: Set<Card>;
  disabled?: boolean;
}

const RANKS: Rank[] = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];
const SUITS: Suit[] = ["s", "h", "d", "c"];
const SUIT_LABELS = { s: "♠", h: "♥", d: "♦", c: "♣" };

export default function DeckGrid({
  onCardSelect,
  usedCards,
  disabled,
}: DeckGridProps) {
  return (
    <div className="space-y-2">
      {SUITS.map((suit) => {
        const isRed = suit === "d" || suit === "h";
        return (
          <div key={suit} className="flex gap-1 items-center">
            <div
              className={`w-6 text-center font-bold text-lg ${
                isRed ? "text-red-600" : "text-gray-800"
              }`}
            >
              {SUIT_LABELS[suit]}
            </div>
            <div className="flex gap-1 flex-wrap">
              {RANKS.map((rank) => {
                const card = `${rank}${suit}` as Card;
                const isUsed = usedCards.has(card);
                return (
                  <Button
                    key={card}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-8 w-8 p-0 font-mono text-xs font-semibold ${
                      isUsed
                        ? "opacity-30 cursor-not-allowed"
                        : isRed
                        ? "text-red-600 hover:bg-red-50 border-red-300"
                        : "text-gray-800 hover:bg-gray-50 border-gray-300"
                    }`}
                    onClick={() => !isUsed && onCardSelect(card)}
                    disabled={disabled || isUsed}
                  >
                    {rank === "T" ? "10" : rank}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
