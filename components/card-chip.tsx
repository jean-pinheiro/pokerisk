"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, prettyCard } from "@/lib/card-utils";

interface CardChipProps {
  card: Card;
  onRemove: () => void;
  disabled?: boolean;
}

export default function CardChip({ card, onRemove, disabled }: CardChipProps) {
  const pretty = prettyCard(card);
  const suit = card.slice(1) as "c" | "d" | "h" | "s";
  const isRed = suit === "d" || suit === "h";

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 ${
        isRed
          ? "border-red-500 bg-red-50 text-red-700"
          : "border-gray-700 bg-gray-50 text-gray-700"
      } font-mono text-sm font-semibold`}
      title={card}
    >
      <span>{pretty}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 hover:bg-transparent"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
