"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"
import { adviseAction, type Card, type AdviceResult } from "@/lib/pokerAdvisor"

interface InputFormProps {
  onResult: (result: AdviceResult) => void
  isCalculating: boolean
  setIsCalculating: (val: boolean) => void
}

export default function InputForm({ onResult, isCalculating, setIsCalculating }: InputFormProps) {
  const [hand, setHand] = useState("Ah Kd")
  const [board, setBoard] = useState("7c 8c Qd")
  const [opponents, setOpponents] = useState(2)
  const [showExtra, setShowExtra] = useState(false)
  const [trials, setTrials] = useState(40000)
  const [pot, setPot] = useState(100)
  const [toCall, setToCall] = useState(50)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const normalizeCard = (c: string): string => {
    if (c.length !== 2) return c
    return c[0].toUpperCase() + c[1].toLowerCase()
  }

  const parseCards = (input: string): Card[] => {
    return input
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(normalizeCard) as Card[]
  }

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {}

    try {
      const handCards = parseCards(hand)
      if (handCards.length !== 2) {
        newErrors.hand = "Must provide exactly 2 cards"
      }

      const boardCards = parseCards(board)
      if (![0, 3, 4, 5].includes(boardCards.length)) {
        newErrors.board = "Board must have 0, 3, 4, or 5 cards"
      }

      // Check for duplicates
      const allCards = [...handCards, ...boardCards]
      const uniqueCards = new Set(allCards)
      if (uniqueCards.size !== allCards.length) {
        newErrors.board = "Duplicate cards detected"
      }

      if (opponents < 1 || opponents > 8) {
        newErrors.opponents = "Opponents must be between 1 and 8"
      }

      if (showExtra) {
        if (trials < 1000) {
          newErrors.trials = "Trials must be at least 1000"
        }
        if (pot < 0) {
          newErrors.pot = "Pot must be non-negative"
        }
        if (toCall < 0) {
          newErrors.toCall = "To call must be non-negative"
        }
      }
    } catch (e) {
      newErrors.general = e instanceof Error ? e.message : "Invalid input"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateInputs()) return

    setIsCalculating(true)

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        const handCards = parseCards(hand) as [Card, Card]
        const boardCards = parseCards(board)

        const opts = showExtra ? { trials, pot, toCall } : { trials: 30000 }

        const result = adviseAction(handCards, boardCards, opponents, opts)
        onResult(result)
        setErrors({})
      } catch (e) {
        setErrors({ general: e instanceof Error ? e.message : "Calculation failed" })
      } finally {
        setIsCalculating(false)
      }
    }, 100)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border-2 border-amber-200">
      <div className="space-y-4">
        <div>
          <Label htmlFor="hand" className="text-amber-900">
            Your Hand
          </Label>
          <Input
            id="hand"
            value={hand}
            onChange={(e) => setHand(e.target.value)}
            placeholder="Ah Kd"
            className="font-mono"
            disabled={isCalculating}
          />
          {errors.hand && <p className="text-sm text-red-600 mt-1">{errors.hand}</p>}
        </div>

        <div>
          <Label htmlFor="board" className="text-amber-900">
            Table Cards
          </Label>
          <Input
            id="board"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            placeholder="7c 8c Qd"
            className="font-mono"
            disabled={isCalculating}
          />
          {errors.board && <p className="text-sm text-red-600 mt-1">{errors.board}</p>}
        </div>

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
          {errors.opponents && <p className="text-sm text-red-600 mt-1">{errors.opponents}</p>}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowExtra(!showExtra)}
          className="w-full"
          disabled={isCalculating}
        >
          Extra inputs
          {showExtra ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
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
                value={trials}
                onChange={(e) => setTrials(Number.parseInt(e.target.value) || 30000)}
                disabled={isCalculating}
              />
              {errors.trials && <p className="text-sm text-red-600 mt-1">{errors.trials}</p>}
            </div>

            <div>
              <Label htmlFor="pot" className="text-amber-900">
                Pot
              </Label>
              <Input
                id="pot"
                type="number"
                min={0}
                value={pot}
                onChange={(e) => setPot(Number.parseInt(e.target.value) || 0)}
                disabled={isCalculating}
              />
              {errors.pot && <p className="text-sm text-red-600 mt-1">{errors.pot}</p>}
            </div>

            <div>
              <Label htmlFor="toCall" className="text-amber-900">
                To Call
              </Label>
              <Input
                id="toCall"
                type="number"
                min={0}
                value={toCall}
                onChange={(e) => setToCall(Number.parseInt(e.target.value) || 0)}
                disabled={isCalculating}
              />
              {errors.toCall && <p className="text-sm text-red-600 mt-1">{errors.toCall}</p>}
            </div>
          </div>
        )}

        {errors.general && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.general}</p>}

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Calculate"}
        </Button>
      </div>
    </form>
  )
}
