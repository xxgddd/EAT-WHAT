// ─── Core data types ──────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type SymptomType = 'nausea' | 'bloating' | 'pain' | 'diarrhea' | 'constipation';

export type Severity = 1 | 2 | 3;

export type FodmapTag =
  | 'dairy'     // 🥛 乳制品
  | 'gluten'    // 🍞 面食
  | 'egg'       // 🥚 鸡蛋
  | 'spicy'     // 🌶️ 辣
  | 'seafood'   // 🦐 海鲜
  | 'cold'      // 🧊 生冷
  | 'soy'       // 🫘 豆制品
  | 'alcohol'   // 🍺 酒精
  | 'coffee'    // ☕ 咖啡
  | 'fatty'     // 🧈 高油
  | 'garlic'    // 🧄 葱蒜
  | 'fructose'; // 🍎 高果糖

export type ExternalFactorType =
  | 'sleep_poor'
  | 'sleep_good'
  | 'cold_exposure'
  | 'stress'
  | 'menstrual';

export type DayStatus = 'good' | 'bad' | null;

export type ExperimentStatus = 'active' | 'paused' | 'completed';

export type ExperimentResult = 'effective' | 'not_effective' | 'uncertain';

// ─── Data structures ───────────────────────────────────────────────────────────

export interface UserProfile {
  gender: 'male' | 'female' | 'skip';
  trackMenstrual: boolean;
  cycleLength: number; // default 28
  lastPeriodStart?: string; // YYYY-MM-DD
  onboardingDone: boolean;
}

export interface Symptom {
  id: string;
  type: SymptomType;
  time: string; // HH:MM
  severity: Severity;
}

export interface Meal {
  id: string;
  type: MealType;
  time: string; // HH:MM
  tags: FodmapTag[];
  notes: string;
}

export interface ExternalFactor {
  type: ExternalFactorType;
  date: string; // YYYY-MM-DD
}

export interface DayRecord {
  date: string; // YYYY-MM-DD — primary key
  status: DayStatus;
  symptoms: Symptom[];
  meals: Meal[];
  externalFactors: ExternalFactor[];
  aiConclusion: string | null;
  isMenstrual: boolean;
}

export interface ExperimentDayLog {
  date: string;
  status: DayStatus;
}

export interface Experiment {
  id: string;
  food: FodmapTag;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  durationDays: number; // planned days, default 7
  status: ExperimentStatus;
  result?: ExperimentResult;
  dailyLog: ExperimentDayLog[];
  aiSuggested: boolean;
}

// ─── UI helpers ────────────────────────────────────────────────────────────────

export const FODMAP_META: Record<FodmapTag, { emoji: string; label: string; category: string }> = {
  dairy:    { emoji: '🥛', label: '乳制品', category: 'D类' },
  gluten:   { emoji: '🍞', label: '面食',   category: 'O类' },
  egg:      { emoji: '🥚', label: '鸡蛋',   category: '' },
  spicy:    { emoji: '🌶️', label: '辣',     category: '' },
  seafood:  { emoji: '🦐', label: '海鲜',   category: '' },
  cold:     { emoji: '🧊', label: '生冷',   category: '' },
  soy:      { emoji: '🫘', label: '豆制品', category: '' },
  alcohol:  { emoji: '🍺', label: '酒精',   category: '' },
  coffee:   { emoji: '☕', label: '咖啡',   category: '' },
  fatty:    { emoji: '🧈', label: '高油',   category: '' },
  garlic:   { emoji: '🧄', label: '葱蒜',   category: 'O类' },
  fructose: { emoji: '🍎', label: '高果糖', category: 'M类' },
};

export const SYMPTOM_META: Record<SymptomType, { emoji: string; label: string }> = {
  nausea:      { emoji: '🤢', label: '恶心' },
  bloating:    { emoji: '💨', label: '胀气' },
  pain:        { emoji: '😣', label: '肚子疼' },
  diarrhea:    { emoji: '🚽', label: '腹泻' },
  constipation:{ emoji: '😖', label: '便秘' },
};

export const MEAL_META: Record<MealType, { emoji: string; label: string; defaultTime: string }> = {
  breakfast: { emoji: '🌅', label: '早餐', defaultTime: '08:00' },
  lunch:     { emoji: '☀️', label: '午餐', defaultTime: '12:00' },
  dinner:    { emoji: '🌙', label: '晚餐', defaultTime: '18:30' },
  snack:     { emoji: '🍊', label: '加餐', defaultTime: '15:00' },
};
