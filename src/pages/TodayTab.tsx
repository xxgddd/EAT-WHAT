import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '../store/useAppStore';
import { analyzeDay } from '../services/deepseek';
import { MEAL_META, FODMAP_META, type MealType, type DayStatus } from '../types';
import { Mascot, type MascotMood } from '../components/Mascot';
import { SymptomPicker } from '../components/SymptomPicker';
import { MealLogger } from '../components/MealLogger';
import { FollowUpQuestion } from '../components/FollowUpQuestion';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// ── AI trigger debounce ──────────────────────────────────────────────────────

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ── Component ────────────────────────────────────────────────────────────────

export function TodayTab() {
  const store = useAppStore();
  const today = store.records[TODAY] ?? store.getOrCreateDay(TODAY);

  const [openMeal, setOpenMeal] = useState<MealType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [followUpDismissed, setFollowUpDismissed] = useState(false);
  const aiTriggeredRef = useRef<string>(''); // tracks last trigger hash

  // Mascot state
  const mascotMood: MascotMood =
    today.status === 'good'
      ? 'happy'
      : today.status === 'bad'
      ? 'concerned'
      : isAnalyzing
      ? 'thinking'
      : 'idle';

  const mascotSpeech: string | null = isAnalyzing
    ? '分析中...'
    : today.aiConclusion
    ? today.aiConclusion
    : today.status === null
    ? '今天怎么样？'
    : today.status === 'bad'
    ? '不舒服？我来帮你找原因 🔍'
    : '太棒了！记一下今天吃了什么吧 ✨';

  // ── Trigger AI analysis ────────────────────────────────────────────────────

  const triggerKey = JSON.stringify({
    status: today.status,
    mealCount: today.meals.length,
    tagCount: today.meals.flatMap((m) => m.tags).length,
  });

  const debouncedKey = useDebounce(triggerKey, 2000);

  const runAnalysis = useCallback(async () => {
    if (today.status === null) return;
    if (today.meals.length === 0 && today.status === 'good') return;
    if (aiTriggeredRef.current === debouncedKey) return;
    aiTriggeredRef.current = debouncedKey;

    setIsAnalyzing(true);
    try {
      const records = store.recentRecords(14);
      const yesterday = records.find(
        (r) => r.date === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
      ) ?? null;
      const history = records.filter((r) => r.date !== TODAY);
      const conclusion = await analyzeDay(today, yesterday, history, store.experiments);
      store.setAiConclusion(TODAY, conclusion);
      store.syncExperimentDayLogs();
    } finally {
      setIsAnalyzing(false);
    }
  }, [debouncedKey]); // eslint-disable-line

  useEffect(() => {
    runAnalysis();
  }, [debouncedKey]); // eslint-disable-line

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setStatus = (s: DayStatus) => {
    store.setDayStatus(TODAY, s);
    setFollowUpDismissed(false);
    aiTriggeredRef.current = '';
  };

  // ── Date display ───────────────────────────────────────────────────────────

  const dateLabel = format(new Date(), 'M月d日 EEEE', { locale: zhCN });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="scroll-area">
      <div className="px-4 pt-6 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">
              {dateLabel}
            </p>
            <h1 className="text-2xl font-extrabold text-ink mt-0.5">今日追踪</h1>
          </div>
          <Mascot mood={mascotMood} speech={mascotSpeech} size="sm" />
        </div>

        {/* ── Status picker ── */}
        <div className="card">
          <p className="section-title mb-3">今天感觉怎么样？</p>
          <div className="flex gap-3">
            <button
              id="status-good"
              onClick={() => setStatus('good')}
              className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-1 border-2
                          transition-all active:scale-95 font-bold
                          ${today.status === 'good'
                            ? 'status-good border-green-primary'
                            : 'border-ivory-300 bg-ivory-100 text-ink-secondary hover:border-green-light'
                          }`}
            >
              <span className="text-2xl">✅</span>
              <span className="text-sm">没事</span>
            </button>
            <button
              id="status-bad"
              onClick={() => setStatus('bad')}
              className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-1 border-2
                          transition-all active:scale-95 font-bold
                          ${today.status === 'bad'
                            ? 'status-bad border-terra'
                            : 'border-ivory-300 bg-ivory-100 text-ink-secondary hover:border-terra-light'
                          }`}
            >
              <span className="text-2xl">🚨</span>
              <span className="text-sm">有问题</span>
            </button>
          </div>

          {/* Symptom picker — expands when bad */}
          {today.status === 'bad' && (
            <div className="mt-4 pt-4 border-t border-ivory-300">
              <SymptomPicker date={TODAY} />
            </div>
          )}
        </div>

        {/* ── Follow-up question ── */}
        {!followUpDismissed && today.status === 'bad' && (
          <FollowUpQuestion
            date={TODAY}
            onAnswered={() => setFollowUpDismissed(true)}
          />
        )}

        {/* ── Meal timeline ── */}
        <div className="card">
          <p className="section-title mb-3">今日餐次</p>
          <div className="space-y-1">
            {MEAL_ORDER.map((mealType, idx) => {
              const meta = MEAL_META[mealType];
              const meal = today.meals.find((m) => m.type === mealType);
              const isLast = idx === MEAL_ORDER.length - 1;

              return (
                <div key={mealType}>
                  <button
                    id={`meal-${mealType}`}
                    className="w-full flex items-center gap-3 py-3 rounded-2xl px-2
                               hover:bg-ivory-100 active:scale-[0.98] transition-all text-left"
                    onClick={() => setOpenMeal(mealType)}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center self-stretch">
                      <div className={`meal-dot ${meal ? 'filled' : ''}`} />
                      {!isLast && <div className="meal-line mt-1" />}
                    </div>

                    {/* Meal icon */}
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-xl flex-shrink-0
                                  ${meal ? 'bg-green-pale' : 'bg-ivory-200'}`}
                    >
                      {meta.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{meta.label}</p>
                      {meal && meal.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {meal.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-green-pale text-green-dark px-2 py-0.5 rounded-full font-medium"
                            >
                              {FODMAP_META[tag].emoji} {FODMAP_META[tag].label}
                            </span>
                          ))}
                          {meal.tags.length > 4 && (
                            <span className="text-xs text-ink-muted">
                              +{meal.tags.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-muted mt-0.5">
                          {meal ? '已记录（无标签）' : '点击记录'}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <span className="text-ink-muted text-sm">›</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── AI analysis card ── */}
        {(today.status !== null || today.aiConclusion) && (
          <div className="ai-card animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🤖</span>
              <p className="text-xs font-bold text-green-dark uppercase tracking-wide">
                侦探结论
              </p>
              {!isAnalyzing && (
                <button
                  id="reanalyze"
                  className="ml-auto text-xs text-green-primary font-semibold hover:opacity-70 transition-opacity"
                  onClick={() => {
                    aiTriggeredRef.current = '';
                    runAnalysis();
                  }}
                >
                  ↻ 重新分析
                </button>
              )}
            </div>

            {isAnalyzing ? (
              <div className="flex items-center gap-2 py-1">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="text-sm text-ink-secondary ml-1">正在分析...</span>
              </div>
            ) : (
              <p className="text-sm font-semibold text-ink leading-relaxed">
                {today.aiConclusion ?? '记录完成后自动分析'}
              </p>
            )}
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* ── Meal logger bottom sheet ── */}
      {openMeal && (
        <MealLogger
          date={TODAY}
          mealType={openMeal}
          existingMeal={today.meals.find((m) => m.type === openMeal)}
          onClose={() => {
            setOpenMeal(null);
            aiTriggeredRef.current = '';
          }}
        />
      )}
    </div>
  );
}
