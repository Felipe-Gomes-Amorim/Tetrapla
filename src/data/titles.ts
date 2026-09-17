export interface Title {
  name: string;
  percentage: number;
}

export interface Tier {
  tier: number;
  tierColor: string;
  minPercentage: number;
  maxPercentage: number;
  badge: string;
  titles: Title[];
}

export const TITLES_TIERS: Tier[] = [
  {
    tier: 1,
    tierColor: '#8B4513', // Marrom
    minPercentage: 0,
    maxPercentage: 14.29,
    badge: '"Ninguém despreze a tua mocidade."',
    titles: [
      { name: 'Ouvinte', percentage: 2.04 },
      { name: 'Curioso', percentage: 4.08 },
      { name: 'Iniciante', percentage: 6.12 },
      { name: 'Buscador', percentage: 8.16 },
      { name: 'Aprendiz', percentage: 10.2 },
      { name: 'Leitor', percentage: 12.24 },
      { name: 'Timóteo', percentage: 14.29 },
    ],
  },
  {
    tier: 2,
    tierColor: '#4169E1', // Azul
    minPercentage: 14.29,
    maxPercentage: 28.57,
    badge: '"Fala, Senhor, porque o teu servo ouve."',
    titles: [
      { name: 'Discípulo', percentage: 16.33 },
      { name: 'Estudante', percentage: 18.37 },
      { name: 'Meditador', percentage: 20.41 },
      { name: 'Observador', percentage: 22.45 },
      { name: 'Semeador', percentage: 24.49 },
      { name: 'Caminhante', percentage: 26.53 },
      { name: 'Samuel', percentage: 28.57 },
    ],
  },
  {
    tier: 3,
    tierColor: '#228B22', // Verde
    minPercentage: 28.57,
    maxPercentage: 42.86,
    badge: '"Homem segundo o coração de Deus."',
    titles: [
      { name: 'Perseverante', percentage: 30.61 },
      { name: 'Guardador', percentage: 32.65 },
      { name: 'Servo', percentage: 34.69 },
      { name: 'Investigador', percentage: 36.73 },
      { name: 'Fiel', percentage: 38.78 },
      { name: 'Dedicado', percentage: 40.82 },
      { name: 'Davi', percentage: 42.86 },
    ],
  },
  {
    tier: 4,
    tierColor: '#FFD700', // Amarelo/Ouro
    minPercentage: 42.86,
    maxPercentage: 57.14,
    badge: '"Escriba hábil na Lei de Moisés."',
    titles: [
      { name: 'Intérprete', percentage: 44.9 },
      { name: 'Entendedor', percentage: 46.94 },
      { name: 'Conselheiro', percentage: 48.98 },
      { name: 'Escriba', percentage: 51.02 },
      { name: 'Zeloso', percentage: 53.06 },
      { name: 'Instrutor', percentage: 55.1 },
      { name: 'Esdras', percentage: 57.14 },
    ],
  },
  {
    tier: 5,
    tierColor: '#FF8C00', // Laranja
    minPercentage: 57.14,
    maxPercentage: 71.43,
    badge: '"Deus lhe deu sabedoria sem medida."',
    titles: [
      { name: 'Expositor', percentage: 59.18 },
      { name: 'Sábio', percentage: 61.22 },
      { name: 'Mestre', percentage: 63.27 },
      { name: 'Ancião', percentage: 65.31 },
      { name: 'Douto', percentage: 67.35 },
      { name: 'Guardião', percentage: 69.39 },
      { name: 'Salomão', percentage: 71.43 },
    ],
  },
  {
    tier: 6,
    tierColor: '#DC143C', // Vermelho
    minPercentage: 71.43,
    maxPercentage: 85.71,
    badge: '"Combati o bom combate, completei a carreira, guardei a fé."',
    titles: [
      { name: 'Teólogo', percentage: 73.47 },
      { name: 'Doutor', percentage: 75.51 },
      { name: 'Patriarca', percentage: 77.55 },
      { name: 'Vigia', percentage: 79.59 },
      { name: 'Luminar', percentage: 81.63 },
      { name: 'Defensor', percentage: 83.67 },
      { name: 'Paulo de Tarso', percentage: 85.71 },
    ],
  },
  {
    tier: 7,
    tierColor: '#8B00FF', // Roxo
    minPercentage: 85.71,
    maxPercentage: 100,
    badge: '"Fizeste-nos para Ti, e inquieto está o nosso coração até descansar em Ti."',
    titles: [
      { name: 'Pilar', percentage: 87.76 },
      { name: 'Coluna', percentage: 89.8 },
      { name: 'Arquivo Vivo', percentage: 91.84 },
      { name: 'Oráculo', percentage: 93.88 },
      { name: 'Santo Doutor', percentage: 95.92 },
      { name: 'Patriarca da Tradição', percentage: 97.96 },
      { name: 'Agostinho de Hipona 👑', percentage: 100 },
    ],
  },
];

export function getTitleAndBadge(progress: number): {
  title: string | null;
  badge: string | null;
  tierColor: string;
} {
  let maxTitle: Title | null = null;
  let maxTier: Tier | null = null;

  // Procura por todos os títulos e encontra o maior que foi alcançado
  for (const tier of TITLES_TIERS) {
    for (const titleObj of tier.titles) {
      // Se o progresso alcançou este título
      if (progress >= titleObj.percentage) {
        // Se este é o primeiro título ou maior que o anterior
        if (!maxTitle || titleObj.percentage > maxTitle.percentage) {
          maxTitle = titleObj;
          maxTier = tier;
        }
      }
    }
  }

  if (maxTitle && maxTier) {
    return {
      title: maxTitle.name,
      badge: maxTier.badge,
      tierColor: maxTier.tierColor,
    };
  }

  // Se não alcançou nenhum título
  return {
    title: null,
    badge: null,
    tierColor: '#a0a0a0',
  };
}
