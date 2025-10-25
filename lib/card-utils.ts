// Card utility types and functions for poker card input normalization

export type Suit = "c" | "d" | "h" | "s"
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A"
export type Card = `${Rank}${Suit}`

const SUIT_IN: Record<string, Suit> = {
  c: "c",
  C: "c",
  "♣": "c",
  CLUBS: "c",
  d: "d",
  D: "d",
  "♦": "d",
  DIAMONDS: "d",
  h: "h",
  H: "h",
  "♥": "h",
  HEARTS: "h",
  s: "s",
  S: "s",
  "♠": "s",
  SPADES: "s",
}

const RANK_IN: Record<string, Rank> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  T: "T",
  "10": "T",
  t: "T",
  J: "J",
  j: "J",
  Q: "Q",
  q: "Q",
  K: "K",
  k: "K",
  A: "A",
  a: "A",
}

export function normalizeCardToken(raw: string): Card | null {
  const s = raw.trim().replaceAll(/\s+/g, "").replaceAll(/[._-]/g, "")
  if (!s) return null

  // support inputs like "Ah", "A♥", "10d", "Q♦", "as", "K-heart"
  const suitMatch = s.match(/[cdhs♣♦♥♠]$/i)
  if (!suitMatch) return null
  const suit = SUIT_IN[suitMatch[0]]
  if (!suit) return null

  const rankPart = s.slice(0, s.length - suitMatch[0].length)
  const rank = RANK_IN[rankPart]
  if (!rank) return null

  return `${rank}${suit}` as Card
}

export function prettyCard(c: Card): string {
  const suit = c.slice(1) as Suit
  const rank = c[0]
  const sym = { c: "♣", d: "♦", h: "♥", s: "♠" }[suit]
  return `${rank}${sym}`
}

export function tokenizeCards(input: string): string[] {
  // split by space, comma, slash, pipe
  return input.split(/[\s,|/]+/).filter(Boolean)
}

export function parseCardList(input: string, used = new Set<Card>()) {
  const tokens = tokenizeCards(input)
  const cards: Card[] = []
  const errors: string[] = []
  for (const t of tokens) {
    const c = normalizeCardToken(t)
    if (!c) {
      errors.push(`Invalid card: "${t}"`)
      continue
    }
    if (used.has(c) || cards.includes(c)) {
      errors.push(`Duplicate card: ${prettyCard(c)}`)
      continue
    }
    cards.push(c)
  }
  return { cards, errors }
}
