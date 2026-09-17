import * as FileSystem from 'expo-file-system/legacy';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';
import { BOOKS } from './database';

const ACHIEVEMENTS_DIR = `${FileSystem.documentDirectory}achievements/`;

// Inicializar diretório se não existir
export async function ensureAchievementsDir() {
  const dirInfo = await FileSystem.getInfoAsync(ACHIEVEMENTS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ACHIEVEMENTS_DIR, { intermediates: true });
  }
}

// Marcar achievement como completado
export async function completeAchievement(achievementId: string) {
  try {
    await ensureAchievementsDir();
    const filePath = `${ACHIEVEMENTS_DIR}${achievementId}.txt`;
    await FileSystem.writeAsStringAsync(filePath, 'completed');
  } catch (e) {
    console.error(`Erro ao completar achievement ${achievementId}:`, e);
  }
}

// Verificar se achievement foi completado
export async function isAchievementCompleted(achievementId: string): Promise<boolean> {
  try {
    const filePath = `${ACHIEVEMENTS_DIR}${achievementId}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  } catch (e) {
    console.error(`Erro ao verificar achievement ${achievementId}:`, e);
    return false;
  }
}

// Obter todos os achievements completados
export async function getCompletedAchievements(): Promise<string[]> {
  try {
    await ensureAchievementsDir();
    const files = await FileSystem.readDirectoryAsync(ACHIEVEMENTS_DIR);
    return files.map(f => f.replace('.txt', ''));
  } catch (e) {
    console.error('Erro ao obter achievements completados:', e);
    return [];
  }
}

// Verificar achievements de progresso
export async function checkAchievementsForProgress(progress: number): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (achievement.trigger.type === 'progress') {
      const targetProgress = Number(achievement.trigger.value);
      if (progress >= targetProgress) {
        const isCompleted = await isAchievementCompleted(achievement.id);
        if (!isCompleted) {
          await completeAchievement(achievement.id);
          unlockedAchievements.push(achievement);
        }
      }
    }
  }

  return unlockedAchievements;
}

// Verificar achievements de capítulo específico
export async function checkAchievementsForChapter(
  bookCode: string,
  chapterNumber: number
): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];
  const chapterKey = `${bookCode}_${chapterNumber}`;

  for (const achievement of ACHIEVEMENTS) {
    if (achievement.trigger.type === 'chapter') {
      if (achievement.trigger.value === chapterKey) {
        const isCompleted = await isAchievementCompleted(achievement.id);
        if (!isCompleted) {
          await completeAchievement(achievement.id);
          unlockedAchievements.push(achievement);
        }
      }
    }
  }

  return unlockedAchievements;
}

// Verificar achievements de seção
export async function checkAchievementsForSection(
  booksCodes: string[]
): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (achievement.trigger.type === 'section') {
      const sectionKey = String(achievement.trigger.value);
      const shouldUnlock = await shouldUnlockSectionAchievement(sectionKey, booksCodes);

      if (shouldUnlock) {
        const isCompleted = await isAchievementCompleted(achievement.id);
        if (!isCompleted) {
          await completeAchievement(achievement.id);
          unlockedAchievements.push(achievement);
        }
      }
    }
  }

  return unlockedAchievements;
}

// Verificar se uma seção foi completada
function shouldUnlockSectionAchievement(sectionKey: string, completedBooks: string[]): boolean {
  const sectionMap: { [key: string]: string[] } = {
    law: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'],
    history: ['JOS', 'JDG', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'],
    wisdom: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG'],
    major_prophets: ['ISA', 'JER', 'LAM', 'EZK', 'DAN'],
    minor_prophets: ['HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'],
    gospels: ['MAT', 'MRK', 'LUK', 'JHN'],
    paul_letters: ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM'],
    general_letters: ['HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'],
    revelation: ['REV'],
    ot: [
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
      '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
      'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
      'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
    ],
    nt: [
      'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
      'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
      '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
    ],
    pentateuch: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'],
    synoptic: ['MAT', 'MRK', 'LUK'],
    acts_epistles: ['ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'],
    psalms_proverbs: ['PSA', 'PRO'],
  };

  const requiredBooks = sectionMap[sectionKey];
  if (!requiredBooks) return false;

  // Verifica se todos os livros da seção foram completados
  return requiredBooks.every(bookCode => completedBooks.includes(bookCode));
}
