export const ADJECTIVES = [
  "Rápido",
  "Fuerte",
  "Listo",
  "Bravo",
  "Astuto",
  "Veloz",
  "Fiero",
  "Agil",
  "Salvaje",
  "Poderoso",
  "Hábil",
  "Intrépido",
  "Ágil",
  "Feroz",
  "Astuto",
  "Valiente",
  "Rápido",
  "Fuerte",
  "Listo",
  "Bravo",
];

export const NOUNS = [
  "Vicuña",
  "Alpaca",
  "Llama",
  "Puma",
  "Cóndor",
  "Jaguar",
  "Oso",
  "Mono",
  "Guanaco",
  "Zorro",
  "Puma",
  "Cóndor",
  "Jaguar",
  "Oso",
  "Mono",
  "Guanaco",
  "Zorro",
  "Vicuña",
  "Alpaca",
  "Llama",
];

export interface OrderIdentity {
  codeName: string;
  shortId: string;
}

export const generateOrderIdentity = (): OrderIdentity => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const shortId = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit ID

  return {
    codeName: `${noun} ${adjective}`,
    shortId,
  };
};
