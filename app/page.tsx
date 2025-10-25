"use client"

import { useState } from "react"
import Header from "@/components/header"
import InputForm from "@/components/input-form"
import ResultCard from "@/components/result-card"
import NotationHelp from "@/components/notation-help"
import type { AdviceResult } from "@/lib/pokerAdvisor"

export default function Home() {
  const [result, setResult] = useState<AdviceResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr,300px] gap-8">
          <div className="space-y-6">
            <InputForm onResult={setResult} isCalculating={isCalculating} setIsCalculating={setIsCalculating} />

            {result && <ResultCard result={result} />}

            <div className="lg:hidden">
              <NotationHelp />
            </div>
          </div>

          <div className="hidden lg:block">
            <NotationHelp />
          </div>
        </div>
      </main>
    </div>
  )
}
