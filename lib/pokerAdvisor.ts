// Poker Advisor – Monte Carlo equity + simple action advice + possible hands
// Usage:
// adviseAction(["Ah","Kd"], ["7c","8c","Qd"], 2, {trials: 40000, pot: 100, toCall: 50})

export type Card = `${Rank}${Suit}`
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A"
export type Suit = "c" | "d" | "h" | "s"

export interface AdviseOptions {
  trials?: number
  pot?: number // current pot before your action
  toCall?: number // amount you must call right now (0 if checking)
}

export interface AdviceResult {
  successPct: number // your equity to win at showdown (ties split)
  recommendedAction: "fold" | "check" | "call" | "raise"
  rationale: string // short explanation of thresholds used
  street: "preflop" | "flop" | "turn" | "river"
  possibleHands: PossibleHands
}

export interface PossibleHands {
  made: Array<{ type: HandCategoryName; kickers: string[] }>
  draws: Array<{ type: DrawType; outs: number; cards: Card[] }>
  bestMade?: { type: HandCategoryName; cards: Card[]; label: string }
  madeCombos?: Array<{ type: HandCategoryName; cards: Card[]; label: string }>
}

type DrawType =
  | "flush draw"
  | "straight draw (open-ended)"
  | "straight draw (gutshot)"
  | "set draw"
  | "two-pair draw"
  | "full house draw"
  | "quads draw"

// === Card / Deck helpers ===
const RANK_ORDER: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"]
const RANK_VALUE: Record<Rank, number> = Object.fromEntries(RANK_ORDER.map((r, i) => [r, i + 2])) as any
const SUITS: Suit[] = ["c", "d", "h", "s"]

function makeDeck(exclude: Card[] = []): Card[] {
  const ex = new Set(exclude)
  const deck: Card[] = []
  for (const r of RANK_ORDER)
    for (const s of SUITS) {
      const c = `${r}${s}` as Card
      if (!ex.has(c)) deck.push(c)
    }
  return deck
}

function parseCard(c: string): { r: Rank; s: Suit; v: number } {
  if (c.length !== 2) throw new Error(`Bad card: ${c}`)
  const r = c[0] as Rank
  const s = c[1] as Suit
  if (!RANK_VALUE[r] || !SUITS.includes(s)) throw new Error(`Bad card: ${c}`)
  return { r, s, v: RANK_VALUE[r] }
}

// === Hand evaluation (5-card) ===
// Score is a tuple encoded into a big integer for fast compare (higher is better)
// Category order: 8=Straight Flush,7=Quads,6=Full House,5=Flush,4=Straight,3=Trips,2=Two Pair,1=Pair,0=High

type HandCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type HandCategoryName =
  | "High Card"
  | "Pair"
  | "Two Pair"
  | "Three of a Kind"
  | "Straight"
  | "Flush"
  | "Full House"
  | "Four of a Kind"
  | "Straight Flush"

const CAT_NAME: Record<HandCategory, HandCategoryName> = {
  0: "High Card",
  1: "Pair",
  2: "Two Pair",
  3: "Three of a Kind",
  4: "Straight",
  5: "Flush",
  6: "Full House",
  7: "Four of a Kind",
  8: "Straight Flush",
}

function combinations<T>(arr: T[], k: number): T[][] {
  const res: T[][] = []
  const cur: T[] = []
  function go(start: number, need: number) {
    if (need === 0) { res.push(cur.slice()); return }
    for (let i = start; i <= arr.length - need; i++) {
      cur.push(arr[i]); go(i + 1, need - 1); cur.pop()
    }
  }
  go(0, k)
  return res
}

const SUIT_SYM: Record<Suit, string> = { c: "♣", d: "♦", h: "♥", s: "♠" }

function prettyCard(c: Card): string {
  const r = c[0] as Rank
  const s = c[1] as Suit
  return `${r}${SUIT_SYM[s]}`
}

function handLabel(cards: Card[], type: HandCategoryName): string {
  return `${cards.map(prettyCard).join(" ")} -> ${type}`
}


function score5(cards: Card[]): { cat: HandCategory; score: number; rankBreakdown: number[] } {
  if (cards.length !== 5) throw new Error("score5 needs 5 cards")
  const ps = cards.map(parseCard)
  const ranks = ps.map((p) => p.v).sort((a, b) => b - a)
  const suits = ps.map((p) => p.s)

  // counts by rank
  const count = new Map<number, number>()
  for (const v of ranks) count.set(v, (count.get(v) || 0) + 1)
  const groups = Array.from(count.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return b[0] - a[0]
  }) // sorted by multiplicity then rank desc

  const isFlush = SUITS.some((s) => suits.filter((x) => x === s).length === 5)
  // Straight (handle wheel A-2-3-4-5)
  const uniq = Array.from(new Set(ranks)).sort((a, b) => b - a)
  let straightHigh = 0
  for (let i = 0; i <= uniq.length - 5; i++) {
    if (uniq[i] - uniq[i + 4] === 4) {
      straightHigh = uniq[i]
      break
    }
  }
  if (!straightHigh && uniq.includes(14) && uniq.slice(-4).toString() === [5, 4, 3, 2].toString()) straightHigh = 5

  const isStraight = straightHigh > 0
  if (isStraight && isFlush) {
    // get flush ranks only
    const flushSuit = SUITS.find((s) => suits.filter((x) => x === s).length === 5)!
    const franks = ps
      .filter((p) => p.s === flushSuit)
      .map((p) => p.v)
      .sort((a, b) => b - a)
    const funiq = Array.from(new Set(franks))
    let fHigh = 0
    for (let i = 0; i <= funiq.length - 5; i++)
      if (funiq[i] - funiq[i + 4] === 4) {
        fHigh = funiq[i]
        break
      }
    if (!fHigh && funiq.includes(14) && funiq.slice(-4).toString() === [5, 4, 3, 2].toString()) fHigh = 5
    if (fHigh) return { cat: 8, score: encodeScore(8, [fHigh]), rankBreakdown: [fHigh] }
  }
  // Quads
  if (groups[0][1] === 4) {
    const four = groups[0][0]
    const kicker = groups[1][0]
    return { cat: 7, score: encodeScore(7, [four, kicker]), rankBreakdown: [four, kicker] }
  }
  // Full House
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return { cat: 6, score: encodeScore(6, [groups[0][0], groups[1][0]]), rankBreakdown: [groups[0][0], groups[1][0]] }
  }
  // Flush
  if (isFlush) {
    return { cat: 5, score: encodeScore(5, ranks), rankBreakdown: ranks }
  }
  // Straight
  if (isStraight) {
    return { cat: 4, score: encodeScore(4, [straightHigh]), rankBreakdown: [straightHigh] }
  }
  // Trips
  if (groups[0][1] === 3) {
    const kickers = groups
      .slice(1)
      .map((g) => g[0])
      .sort((a, b) => b - a)
    return { cat: 3, score: encodeScore(3, [groups[0][0], ...kickers]), rankBreakdown: [groups[0][0], ...kickers] }
  }
  // Two Pair
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const highPair = Math.max(groups[0][0], groups[1][0])
    const lowPair = Math.min(groups[0][0], groups[1][0])
    const kicker = groups[2][0]
    return { cat: 2, score: encodeScore(2, [highPair, lowPair, kicker]), rankBreakdown: [highPair, lowPair, kicker] }
  }
  // One Pair
  if (groups[0][1] === 2) {
    const kickers = groups
      .slice(1)
      .map((g) => g[0])
      .sort((a, b) => b - a)
    return { cat: 1, score: encodeScore(1, [groups[0][0], ...kickers]), rankBreakdown: [groups[0][0], ...kickers] }
  }
  // High card
  return { cat: 0, score: encodeScore(0, ranks), rankBreakdown: ranks }
}

function encodeScore(cat: HandCategory, ranks: number[]): number {
  // Fixed-width base-15 packing: [cat][r1][r2][r3][r4][r5]
  const base = 15;
  const arr = ranks.slice();           // copy
  while (arr.length < 5) arr.push(0);  // pad to 5 ranks
  let n = cat;
  for (const r of arr) n = n * base + r;
  return n;
}

// Best 5 out of 6 known cards
function score6(cards: Card[]): { cat: HandCategory; score: number; rankBreakdown: number[] } {
  if (cards.length !== 6) throw new Error("score6 needs 6 cards");
  let best = { cat: 0 as HandCategory, score: -1, rankBreakdown: [] as number[] };
  for (let drop = 0; drop < 6; drop++) {
    const five = cards.filter((_, i) => i !== drop);
    const s = score5(five);
    if (s.score > best.score) best = { cat: s.cat, score: s.score, rankBreakdown: s.rankBreakdown };
  }
  return best;
}


// Evaluate best 5 out of 7
function score7(cards: Card[]): { cat: HandCategory; score: number; breakdown: number[] } {
  if (cards.length !== 7) throw new Error("score7 needs 7 cards")
  let best = { cat: 0 as HandCategory, score: -1, breakdown: [] as number[] }
  const idx = [0, 1, 2, 3, 4, 5, 6]
  
  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++) {
      const five = idx.filter((i) => i !== a && i !== b).map((i) => cards[i])
      const s = score5(five)
      if (s.score > best.score) best = { cat: s.cat, score: s.score, breakdown: s.rankBreakdown }
    }
  return best
}

function compare7(a: Card[], b: Card[]): number {
  const A = score7(a),
    B = score7(b)
  return Math.sign(A.score - B.score)
}

// === Monte Carlo equity ===
function monteCarloEquity(
  hole: Card[],
  board: Card[],
  opponents: number,
  trials: number,
): { winPct: number; tiePct: number } {
  const used = [...hole, ...board]
  const deck0 = makeDeck(used)
  let wins = 0,
    ties = 0
  const need = 5 - board.length
  for (let t = 0; t < trials; t++) {
    
    // shuffle a copy
    const deck = deck0.slice()
    for (let i = deck.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    const runout = need > 0 ? (deck.splice(0, need) as Card[]) : []
    const fullBoard = [...board, ...runout]
    const villainHands: Card[][] = []
    for (let p = 0; p < opponents; p++) villainHands.push([deck.shift() as Card, deck.shift() as Card])

    const hero7 = [...hole, ...fullBoard]
    const heroScore = score7(hero7).score
    let best = heroScore
    let numBest = 1
    const debug = {
      fullBoard,
      villainHands,
      hero7,
      heroCat: CAT_NAME[score7(hero7).cat],
    };
    console.log(JSON.stringify(debug));
    for (const hand of villainHands) {
      const vScore = score7([...hand, ...fullBoard]).score
      if (vScore > best) {
        best = vScore
        numBest = 1
      } else if (vScore === best) {
        numBest++
      }
    }
    if (best === heroScore) {
      if (numBest === 1) wins++
      else ties++
    }
  }
  const winPct = (wins / trials) * 100
  const tiePct = (ties / trials) * 100
  return { winPct, tiePct }
}

// === Draw detection (single-card lookahead on turn; basic on flop) ===
function listPossibleHands(hole: Card[], board: Card[]): PossibleHands {
  const street = inferStreet(board)
  const made: PossibleHands["made"] = []
  const allKnown = [...hole, ...board];
  let madeNow:
    | { cat: HandCategory; score: number; rankBreakdown: number[] };

  if (allKnown.length === 5) {
    madeNow = score5(allKnown);
  } else if (allKnown.length === 6) {
    madeNow = score6(allKnown);
  } else if (allKnown.length === 7) {
    const s7 = score7(allKnown);
    madeNow = { cat: s7.cat, score: s7.score, rankBreakdown: s7.breakdown };
  } else {
    throw new Error("Expect 5, 6, or 7 known cards total.");
  }

  made.push({ type: CAT_NAME[madeNow.cat], kickers: madeNow.rankBreakdown.map(displayRank) });

  const all5 = combinations(allKnown, 5)
    .map((five) => {
      const s = score5(five)
      return {
        cards: five,
        type: CAT_NAME[s.cat],
        score: s.score,
        label: handLabel(five, CAT_NAME[s.cat]),
      }
    })
    .sort((a, b) => b.score - a.score) // best -> worst

  const bestMade = all5[0] ? { type: all5[0].type as HandCategoryName, cards: all5[0].cards, label: all5[0].label } : undefined
  const madeCombos = all5.map(({ type, cards, label }) => ({ type: type as HandCategoryName, cards, label }))


  const draws: PossibleHands["draws"] = []
  const used = new Set<Card>([...hole, ...board])
  const deck = makeDeck([...used])

  // Flush draws
  const all = [...hole, ...board].map(parseCard)
  const suitCounts: Record<Suit, number> = { c: 0, d: 0, h: 0, s: 0 }
  for (const p of all) suitCounts[p.s]++
  for (const s of SUITS) {
    if (street !== "river" && suitCounts[s] === 4) {
      const outs = deck.filter((c) => c.endsWith(s))
      draws.push({ type: "flush draw", outs: outs.length, cards: outs })
    }
  }

  // Straight draws (simple check using rank sets)
  const ranks = Array.from(new Set(all.map((p) => p.v))).sort((a, b) => a - b)
  const sequences = [
    [2, 3, 4, 5, 6],
    [3, 4, 5, 6, 7],
    [4, 5, 6, 7, 8],
    [5, 6, 7, 8, 9],
    [6, 7, 8, 9, 10],
    [7, 8, 9, 10, 11],
    [8, 9, 10, 11, 12],
    [9, 10, 11, 12, 13],
    [10, 11, 12, 13, 14],
  ]
  for (const seq of sequences) {
    const have = seq.filter((v) => ranks.includes(v)).length
    if (have === 4 && street !== "river") {
      // open-ended or gutshot depends on gap
      const missing = seq.filter((v) => !ranks.includes(v))
      const outs = deck.filter((c) => RANK_VALUE[c[0] as Rank] === missing[0])
      const isOpenEnded =
        seq[4] - seq[0] === 4 &&
        ((ranks.includes(seq[0] + 1) && ranks.includes(seq[4])) || (ranks.includes(seq[0]) && ranks.includes(seq[3])))
      draws.push({
        type: isOpenEnded ? "straight draw (open-ended)" : "straight draw (gutshot)",
        outs: outs.length,
        cards: outs,
      })
    }
  }

  // Set / two pair / boat / quads draws (based on pairs/trips on board+hand)
  const counts = new Map<number, number>()
  for (const v of all.map((x) => x.v)) counts.set(v, (counts.get(v) || 0) + 1)
  // If you have a pair (via hole or board), list set/full/quads improvements on next card
  if (street !== "river") {
    for (const [v, c] of counts) {
      if (c === 2) {
        const outs = deck.filter((card) => RANK_VALUE[card[0] as Rank] === v)
        draws.push({ type: "set draw", outs: outs.length, cards: outs })
      }
      if (c === 3) {
        // full house on one card: any of the remaining cards matching any other rank that pairs the board/hand
        const pairRanks = Array.from(counts.keys()).filter((x) => x !== v)
        const outs = deck.filter((card) => pairRanks.includes(RANK_VALUE[card[0] as Rank]))
        draws.push({ type: "full house draw", outs: outs.length, cards: outs })
        const outsQ = deck.filter((card) => RANK_VALUE[card[0] as Rank] === v)
        draws.push({ type: "quads draw", outs: outsQ.length, cards: outsQ })
      }
      if (c === 1) {
        // two-pair draw when you pair this rank
        const outs = deck.filter((card) => RANK_VALUE[card[0] as Rank] === v)
        draws.push({ type: "two-pair draw", outs: outs.length, cards: outs })
      }
    }
  }

  // Sort made highest to lowest category; draws by outs desc
  made.sort((a, b) => categoryWeight(b.type) - categoryWeight(a.type))
  draws.sort((a, b) => b.outs - a.outs)
  return { made, draws, bestMade, madeCombos }
}

function categoryWeight(name: HandCategoryName): number {
  const keys: HandCategoryName[] = [
    "High Card",
    "Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
  ]
  return keys.indexOf(name)
}

function displayRank(n: number): string {
  const map: Record<number, string> = {}
  for (const r of RANK_ORDER) map[RANK_VALUE[r]] = r
  return map[n]
}

function inferStreet(board: Card[]): AdviceResult["street"] {
  if (board.length === 0) return "preflop"
  if (board.length === 3) return "flop"
  if (board.length === 4) return "turn"
  if (board.length === 5) return "river"
  throw new Error("Board must have 0,3,4,5 cards")
}

function padBoard(board: Card[]): Card[] {
  // pad with arbitrary non-conflicting cards to allow score7 on <7 cards
  const need = 5 - board.length
  const deck = makeDeck(board as Card[])
  return [...board, ...deck.slice(0, Math.max(0, need))]
}

// === Action advice ===
function recommendAction(
  equityPct: number,
  street: AdviceResult["street"],
  opponents: number,
  pot?: number,
  toCall?: number,
): { action: AdviceResult["recommendedAction"]; rationale: string } {
  // If we know pot/toCall, use pot-odds threshold for calls
  if (toCall !== undefined && pot !== undefined) {
    if (toCall === 0) return { action: "check", rationale: "No bet to call; checking realizes equity." }
    const threshold = (toCall / (pot + toCall)) * 100
    if (equityPct + 1e-9 < threshold)
      return { action: "fold", rationale: `Equity ${equityPct.toFixed(1)}% < call threshold ${threshold.toFixed(1)}%.` }
    // Above threshold: call or raise? Use a simple value/semi-bluff heuristic
    const valueBump = Math.max(0, 10 - 3 * opponents) // tighter multiway
    if (equityPct >= threshold + 20 + valueBump)
      return { action: "raise", rationale: `Strong edge over threshold (Δ≥${20 + valueBump}%).` }
    return { action: "call", rationale: `Equity clears threshold ${threshold.toFixed(1)}%.` }
  }
  // Heuristic bands when pot odds unknown
  const baseRaise = opponents <= 1 ? 60 : 60 + 5 * (opponents - 1)
  const baseCall = opponents <= 1 ? 40 : 40 + 5 * (opponents - 1)
  if (equityPct >= baseRaise) return { action: "raise", rationale: `Equity ≥ ${baseRaise}% for ${opponents + 1}-way.` }
  if (equityPct >= baseCall) return { action: "call", rationale: `Equity in the playable band (≥ ${baseCall}%).` }
  return {
    action: street === "preflop" ? "fold" : "check",
    rationale: `Equity below conservative threshold for ${opponents + 1}-way.`,
  }
}

// === Public API ===
export function adviseAction(
  hole: [Card, Card],
  board: Card[],
  numOpponents: number,
  opts: AdviseOptions = {},
): AdviceResult {
  if (![0, 3, 4, 5].includes(board.length)) throw new Error("board must have 0,3,4,5 cards")
  if (numOpponents < 1) throw new Error("numOpponents must be ≥ 1")
  const trials = Math.max(1000, opts.trials ?? 30000)
  const street = inferStreet(board)

  console.log({ hole, board, numOpponents, street: inferStreet(board) });
  const { winPct, tiePct } = monteCarloEquity(hole, board, numOpponents, trials)
  const equityPct = winPct + tiePct / 2
  const { action, rationale } = recommendAction(equityPct, street, numOpponents, opts.pot, opts.toCall)
  
  const possibleHands = listPossibleHands(hole, board)

  console.log({
    made: possibleHands.made,
    drawsCount: possibleHands.draws.length,
    rationale
  });
  return {
    successPct: round1(equityPct),
    recommendedAction: action,
    rationale: `${rationale} (trials=${trials})`,
    street,
    possibleHands,
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

// === Convenience export: notation dictionary
export const NotationDictionary = {
  ranks: {
    "2": "Two",
    "3": "Three",
    "4": "Four",
    "5": "Five",
    "6": "Six",
    "7": "Seven",
    "8": "Eight",
    "9": "Nine",
    T: "Ten",
    J: "Jack",
    Q: "Queen",
    K: "King",
    A: "Ace",
  },
  suits: {
    c: "Clubs (♣)",
    d: "Diamonds (♦)",
    h: "Hearts (♥)",
    s: "Spades (♠)",
  },
  examples: [
    { card: "Ah", meaning: "Ace of Hearts" },
    { card: "Kd", meaning: "King of Diamonds" },
    { card: "7c", meaning: "Seven of Clubs" },
    { card: "Ts", meaning: "Ten of Spades" },
  ],
}

// === End ===
