import { Badge } from "@/components/ui/badge";
import type { AdviceResult, Card } from "@/lib/pokerAdvisor";

interface ResultCardProps {
  result: AdviceResult;
}

const SUIT_SYM: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" };

function prettyCard(c: Card): string {
  const r = c[0];
  const s = c[1];
  return `${r}${SUIT_SYM[s] || s}`;
}

export default function ResultCard({ result }: ResultCardProps) {
  const actionColors = {
    raise: "bg-green-600 text-white",
    call: "bg-teal-600 text-white",
    check: "bg-amber-600 text-white",
    fold: "bg-red-600 text-white",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200">
      <div className="space-y-6">
        {/* Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-green-200">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-4xl font-bold text-green-700">
              {result.successPct.toFixed(1)}%
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Recommended Action</p>
            <Badge
              className={`${
                actionColors[result.recommendedAction]
              } text-lg px-4 py-2`}
            >
              {result.recommendedAction.toUpperCase()}
            </Badge>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600 mb-1">Street</p>
            <p className="text-xl font-semibold text-amber-700 capitalize">
              {result.street}
            </p>
          </div>
        </div>

        {/* Rationale */}
        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-amber-900">{result.rationale}</p>
        </div>

        {/* Possible Hands */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3">
              What You Have
            </h3>
            <div className="space-y-3">
              {/* Best option */}
              {result.possibleHands.bestMade && (
                <div className="bg-green-100 p-3 rounded border-2 border-green-300">
                  <p className="text-sm text-green-700 font-medium mb-1">
                    Best option:
                  </p>
                  <p className="font-bold text-green-900">
                    {result.possibleHands.bestMade.type}
                  </p>
                </div>
              )}

              {/* All possible combinations */}
              {result.possibleHands.madeCombos &&
                result.possibleHands.madeCombos.length > 0 && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-2">
                      Possible combinations (from best to worst):
                    </p>
                    <div className="space-y-1 text-sm text-green-900 font-mono">
                      {result.possibleHands.madeCombos.map((combo, idx) => (
                        <div key={idx} className="text-xs leading-relaxed">
                          {combo.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Ranks */}
              {result.possibleHands.made[0] &&
                result.possibleHands.made[0].kickers.length > 0 && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-900">
                      <span className="font-medium">Ranks:</span>{" "}
                      <span className="font-mono">
                        {result.possibleHands.made[0].kickers.join(", ")}
                      </span>
                    </p>
                  </div>
                )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-amber-700 mb-3">
              Possible combinations on next card draw:
            </h3>
            {result.possibleHands.draws.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                {result.street === "river"
                  ? "No future draws (river)"
                  : "No draws available"}
              </p>
            ) : (
              <div className="space-y-2">
                {result.possibleHands.draws.map((draw, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-50 p-3 rounded border border-amber-200"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-amber-900 mt-0.5">•</span>
                      <div className="flex-1">
                        <p className="font-semibold text-amber-900 capitalize">
                          {draw.type}{" "}
                          <span className="font-normal text-sm">
                            – {draw.outs} possible{" "}
                            {draw.outs === 1 ? "card" : "cards"}
                          </span>
                        </p>
                        <p className="text-xs text-amber-700 font-mono mt-1">
                          {draw.cards.map(prettyCard).join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
