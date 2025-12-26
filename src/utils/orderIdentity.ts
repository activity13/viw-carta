export const ADJECTIVES = [
  "Fresco",
  "Sabroso",
  "Crujiente",
  "Marino",
  "Soleado",
  "Aromático",
  "Dorado",
  "Brillante",
  "Alegre",
  "Festivo",
  "Rústico",
  "Vibrante",
  "Práctico",
  "Express",
  "Cálido",
  "Natural",
  "Delicioso",
  "Jugoso",
  "Sencillo",
  "Ñame",
];

export const NOUNS = [
  "del Mar",
  "de la Costa",
  "del Mercado",
  "del Sabor",
  "del Plato",
  "de la Canasta",
  "del Pescador",
  "del Atardecer",
  "del Paseo",
  "de la Parrilla",
  "del Fogón",
  "del Rincón",
  "del Encuentro",
  "del Antojo",
  "de la Playa",
  "de la Calle",
  "del Bocadillo",
  "del Paladar",
  "del Barrio",
  "del Día",
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
    // Format: "Adjetivo + Situación" -> e.g. "Sabroso del Mercado"
    codeName: `${adjective} ${noun}`,
    shortId,
  };
};
