"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { NotationDictionary } from "@/lib/pokerAdvisor"

export default function NotationHelp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-amber-200 overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 lg:cursor-default"
      >
        <span className="font-semibold text-amber-900">Card Notation Help</span>
        <span className="lg:hidden">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </Button>

      <div className={`${isOpen ? "block" : "hidden"} lg:block p-4 pt-0`}>
        <div className="space-y-4">
          {/* Ranks */}
          <div>
            <h4 className="font-semibold text-sm text-amber-900 mb-2">Ranks</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(NotationDictionary.ranks).map(([token, meaning]) => (
                <div key={token} className="flex gap-2">
                  <span className="font-mono font-bold text-green-700">{token}</span>
                  <span className="text-gray-600">→ {meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suits */}
          <div>
            <h4 className="font-semibold text-sm text-amber-900 mb-2">Suits</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(NotationDictionary.suits).map(([token, meaning]) => (
                <div key={token} className="flex gap-2">
                  <span className="font-mono font-bold text-green-700">{token}</span>
                  <span className="text-gray-600">→ {meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <h4 className="font-semibold text-sm text-amber-900 mb-2">Examples</h4>
            <div className="space-y-1 text-sm">
              {NotationDictionary.examples.map((ex) => (
                <div key={ex.card} className="flex gap-2">
                  <span className="font-mono font-bold text-green-700">{ex.card}</span>
                  <span className="text-gray-600">= {ex.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
