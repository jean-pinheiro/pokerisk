"use client";

import type React from "react";
import { useState, type FormEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";
import { adviseAction, type AdviceResult } from "@/lib/pokerAdvisor";
import { parseCardList, type Card } from "@/lib/card-utils";
import CardChip from "./card-chip";
import DeckGrid from "./deck-grid";

interface InputFormProps {
  onResult: (result: AdviceResult) => void;
  isCalculating: boolean;
  setIsCalculating: (val: boolean) => void;
}

export default function InputForm({
  onResult,
  isCalculating,
  setIsCalculating,
}: InputFormProps) {
  const [handCards, setHandCards] = useState<Card[]>(["Ah", "Kd"]);
  const [boardCards, setBoardCards] = useState<Card[]>(["7c", "8c", "Qd"]);
  const [opponents, setOpponents] = useState(2);

  // Extra inputs UX
  const [showExtra, setShowExtra] = useState(false);
  const [trialsStr, setTrialsStr] = useState("40000"); // strings for smooth typing
  const [potStr, setPotStr] = useState("100");
  const [toCallStr, setToCallStr] = useState("50");

  const [handInput, setHandInput] = useState("");
  const [boardInput, setBoardInput] = useState("");
  const [showHandDeck, setShowHandDeck] = useState(false);
  const [showBoardDeck, setShowBoardDeck] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const handInputRef = useRef<HTMLInputElement>(null);
  const boardInputRef = useRef<HTMLInputElement>(null);

  const usedCards = new Set<Card>([...handCards, ...boardCards]);

  const handleHandInputChange = (value: string) => {
    setHandInput(value);
    if (value.trim()) {
      const result = parseCardList(value, usedCards);
      if (result.errors.length === 0 && result.cards.length > 0) {
        const newCards = [...handCards, ...result.cards].slice(0, 2);
        setHandCards(newCards);
        setHandInput("");
      }
    }
  };

  const handleBoardInputChange = (value: string) => {
    setBoardInput(value);
    if (value.trim()) {
      const result = parseCardList(value, usedCards);
      if (result.errors.length === 0 && result.cards.length > 0) {
        const newCards = [...boardCards, ...result.cards].slice(0, 5);
        setBoardCards(newCards);
        setBoardInput("");
      }
    }
  };

  const handleHandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && handInput === "" && handCards.length > 0) {
      setHandCards(handCards.slice(0, -1));
    }
  };

  const handleBoardKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && boardInput === "" && boardCards.length > 0) {
      setBoardCards(boardCards.slice(0, -1));
    }
  };

  const handleHandCardSelect = (card: Card) => {
    if (handCards.length < 2) setHandCards([...handCards, card]);
  };
  const handleBoardCardSelect = (card: Card) => {
    if (boardCards.length < 5) setBoardCards([...boardCards, card]);
  };

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (handCards.length !== 2) newErrors.hand = "Must provide exactly 2 cards";
    if (![0, 3, 4, 5].includes(boardCards.length))
      newErrors.board = "Board must have 0, 3, 4, or 5 cards";
    if (opponents < 1 || opponents > 8)
      newErrors.opponents = "Opponents must be between 1 and 8";

    if (showExtra) {
      const t = Number.parseInt(trialsStr, 10);
      const p = Number.parseFloat(potStr);
      const c = Number.parseFloat(toCallStr);
      if (!Number.isFinite(t) || t < 1000)
        newErrors.trials = "Trials must be at least 1000";
      if (!Number.isFinite(p) || p < 0)
        newErrors.pot = "Pot must be non-negative";
      if (!Number.isFinite(c) || c < 0)
        newErrors.toCall = "To call must be non-negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsCalculating(true);

    setTimeout(() => {
      try {
        // Only pass extras if section is open
        const opts = showExtra
          ? {
              trials: Number.parseInt(trialsStr, 10),
              pot: Number.parseFloat(potStr),
              toCall: Number.parseFloat(toCallStr),
            }
          : ({} as const);

        const result = adviseAction(
          handCards as [Card, Card],
          boardCards,
          opponents,
          opts
        );
        onResult(result);
        setErrors({});
      } catch (e) {
        setErrors({
          general: e instanceof Error ? e.message : "Calculation failed",
        });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 border-2 border-amber-200"
    >
      <div className="space-y-4">
        {/* Hand */}
        <div>
          <Label htmlFor="hand" className="text-amber-900">
            Your Hand (2 cards)
          </Label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border-2 border-amber-200 rounded-md bg-amber-50">
              {handCards.map((card, idx) => (
                <CardChip
                  key={`${card}-${idx}`}
                  card={card}
                  onRemove={() =>
                    setHandCards(handCards.filter((_, i) => i !== idx))
                  }
                  disabled={isCalculating}
                />
              ))}
              {handCards.length < 2 && (
                <Input
                  ref={handInputRef}
                  id="hand"
                  value={handInput}
                  onChange={(e) => handleHandInputChange(e.target.value)}
                  onKeyDown={handleHandKeyDown}
                  placeholder="Type: Ah, A♥, or click below..."
                  className="flex-1 min-w-[150px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                  disabled={isCalculating}
                />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHandDeck((v) => !v)}
              disabled={isCalculating}
              className="w-full"
            >
              {showHandDeck ? "Hide" : "Show"} Deck Picker
              {showHandDeck ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
            {showHandDeck && (
              <div className="p-3 border-2 border-amber-200 rounded-md bg-amber-50">
                <DeckGrid
                  onCardSelect={handleHandCardSelect}
                  usedCards={usedCards}
                  disabled={isCalculating}
                />
              </div>
            )}
          </div>
          {errors.hand && (
            <p className="text-sm text-red-600 mt-1">{errors.hand}</p>
          )}
        </div>

        {/* Board */}
        <div>
          <Label htmlFor="board" className="text-amber-900">
            Table Cards (0, 3, 4, or 5 cards)
          </Label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border-2 border-amber-200 rounded-md bg-amber-50">
              {boardCards.map((card, idx) => (
                <CardChip
                  key={`${card}-${idx}`}
                  card={card}
                  onRemove={() =>
                    setBoardCards(boardCards.filter((_, i) => i !== idx))
                  }
                  disabled={isCalculating}
                />
              ))}
              {boardCards.length < 5 && (
                <Input
                  ref={boardInputRef}
                  id="board"
                  value={boardInput}
                  onChange={(e) => handleBoardInputChange(e.target.value)}
                  onKeyDown={handleBoardKeyDown}
                  placeholder="Type: 7c 8c Qd or click below..."
                  className="flex-1 min-w-[150px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                  disabled={isCalculating}
                />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBoardDeck((v) => !v)}
              disabled={isCalculating}
              className="w-full"
            >
              {showBoardDeck ? "Hide" : "Show"} Deck Picker
              {showBoardDeck ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
            {showBoardDeck && (
              <div className="p-3 border-2 border-amber-200 rounded-md bg-amber-50">
                <DeckGrid
                  onCardSelect={handleBoardCardSelect}
                  usedCards={usedCards}
                  disabled={isCalculating}
                />
              </div>
            )}
          </div>
          {errors.board && (
            <p className="text-sm text-red-600 mt-1">{errors.board}</p>
          )}
        </div>

        {/* Opponents */}
        <div>
          <Label htmlFor="opponents" className="text-amber-900">
            Number of Opponents
          </Label>
          <Input
            id="opponents"
            type="number"
            min={1}
            max={8}
            value={opponents}
            onChange={(e) => setOpponents(Number.parseInt(e.target.value) || 1)}
            disabled={isCalculating}
          />
          {errors.opponents && (
            <p className="text-sm text-red-600 mt-1">{errors.opponents}</p>
          )}
        </div>

        {/* Extra inputs */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowExtra((v) => !v)}
          className="w-full"
          disabled={isCalculating}
        >
          Extra inputs{" "}
          {showExtra ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>

        {showExtra && (
          <div className="space-y-4 pt-2 border-t border-amber-200">
            <div>
              <Label htmlFor="trials" className="text-amber-900">
                Trials
              </Label>
              <Input
                id="trials"
                type="number"
                min={1000}
                step={1000}
                value={trialsStr}
                onChange={(e) => setTrialsStr(e.target.value)} // keep as string
                disabled={isCalculating}
              />
              {errors.trials && (
                <p className="text-sm text-red-600 mt-1">{errors.trials}</p>
              )}
            </div>

            <div>
              <Label htmlFor="pot" className="text-amber-900">
                Pot
              </Label>
              <Input
                id="pot"
                type="number"
                min={0}
                step="any"
                value={potStr}
                onChange={(e) => setPotStr(e.target.value)} // keep as string
                disabled={isCalculating}
              />
              {errors.pot && (
                <p className="text-sm text-red-600 mt-1">{errors.pot}</p>
              )}
            </div>

            <div>
              <Label htmlFor="toCall" className="text-amber-900">
                To Call
              </Label>
              <Input
                id="toCall"
                type="number"
                min={0}
                step="any"
                value={toCallStr}
                onChange={(e) => setToCallStr(e.target.value)} // keep as string
                disabled={isCalculating}
              />
              {errors.toCall && (
                <p className="text-sm text-red-600 mt-1">{errors.toCall}</p>
              )}
            </div>
          </div>
        )}

        {errors.general && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {errors.general}
          </p>
        )}

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isCalculating}
        >
          {isCalculating ? "Calculating..." : "Calculate"}
        </Button>
      </div>
    </form>
  );
}
