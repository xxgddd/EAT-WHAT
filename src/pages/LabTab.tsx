import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { FODMAP_META, type FodmapTag, type ExperimentResult } from '../types';

const TODAY = format(new Date(), 'yyyy-MM-dd');

// ── Result labels ──────────────────────────────────────────────────────────

const RESULT_META: Record<ExperimentResult, { label: string; color: string }> = {
  effective:     { label: '✅ 有效',     color: 'text-green-primary bg-green-pale' },
  not_effective: { label: '❌ 没效果',   color: 'text-ink-secondary bg-ivory-200' },
  uncertain:     { label: '🤷 不确定',   color: 'text-terra bg-terra-pale' },
};

// ── Lab Tab ────────────────────────────────────────────────────────────────

export function LabTab() {
  const store = useAppStore();
  const active = store.activeExperiments();
  const suspects = store.suspectFoods().slice(0, 5);
  const completed = store.experiments.filter((e) => e.status === 'completed');
  const [showArchive, setShowArchive] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="scroll-area">
      <div className="px-4 pt-6 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold text-ink">实验室</h1>
          <p className="text-sm text-ink-muted mt-1">
            用排除法找出你的食物诱因 🔬
          </p>
        </div>

        {/* ── Active experiments ── */}
        <section>
          <p className="section-title mb-3">
            进行中实验 ({active.length}/2)
          </p>

          {active.length === 0 ? (
            <div className="card text-center py-8 border-2 border-dashed border-ivory-300">
              <p className="text-3xl mb-2">🧪</p>
              <p className="text-sm text-ink-secondary font-medium">
                还没有进行中的实验
              </p>
              <p className="text-xs text-ink-muted mt-1">
                从下方选择一个可疑食物开始
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((exp) => {
                const days = differenceInDays(new Date(TODAY), new Date(exp.startDate));
                const progress = Math.min(days, exp.durationDays);
                const pct = Math.round((progress / exp.durationDays) * 100);
                const meta = FODMAP_META[exp.food];

                return (
                  <div key={exp.id} className="experiment-card">
                    {/* Card header */}
                    <div className="experiment-card-header">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-[14px] flex items-center justify-center text-2xl shadow-soft">
                          {meta.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-ink">戒掉 {meta.label}</p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            第 {progress + 1} 天 / 共 {exp.durationDays} 天
                          </p>
                        </div>
                        <span className="text-lg font-extrabold text-green-primary">
                          {pct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="suspect-bar-bg mt-3">
                        <div className="suspect-bar" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Daily log dots */}
                    <div className="px-4 py-3">
                      <p className="text-xs text-ink-muted mb-2">每日状态</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: exp.durationDays }).map((_, i) => {
                          const log = exp.dailyLog[i];
                          const mood = log?.status === 'good'
                            ? 'good'
                            : log?.status === 'bad'
                            ? 'bad'
                            : 'empty';
                          const emoji = mood === 'good' ? '😊' : mood === 'bad' ? '😖' : '─';
                          return (
                            <div key={i} className={`day-dot ${mood}`}>
                              {emoji}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        className="flex-1 py-2.5 rounded-2xl border-2 border-ivory-300 text-sm
                                   font-semibold text-ink-secondary hover:border-ink-muted transition-colors"
                        onClick={() => store.updateExperimentStatus(exp.id, 'paused')}
                      >
                        暂停
                      </button>
                      <FinishButton
                        onFinish={(result) => store.finishExperiment(exp.id, result)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── AI suggested / new ── */}
        {suspects.length > 0 && active.length < 2 && (
          <section>
            <p className="section-title mb-3">侦探建议</p>
            <div className="space-y-2">
              {suspects
                .filter((s) => !active.some((e) => e.food === s.food))
                .slice(0, 3)
                .map(({ food, count }) => {
                  const meta = FODMAP_META[food];
                  const danger = count >= 3;
                  return (
                    <div
                      key={food}
                      className={`card flex items-center gap-3 ${danger ? 'border-2 border-terra-light' : ''}`}
                    >
                      <div className={`w-11 h-11 rounded-[13px] flex items-center justify-center text-xl
                                      ${danger ? 'bg-terra-pale' : 'bg-ivory-200'}`}>
                        {meta.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-ink text-sm">{meta.label}</p>
                        <p className={`text-xs mt-0.5 ${danger ? 'text-terra font-semibold' : 'text-ink-muted'}`}>
                          {danger ? '🔴' : '🟡'} {count} 次异常关联
                        </p>
                      </div>
                      <button
                        id={`start-exp-${food}`}
                        onClick={() => store.createExperiment(food, 7, true)}
                        className="pill pill-green text-xs px-3 py-2"
                      >
                        开始实验
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* ── Manual create ── */}
        {active.length < 2 && (
          <section>
            <button
              id="create-experiment"
              className="w-full py-4 rounded-3xl border-2 border-dashed border-ivory-300
                         text-ink-secondary text-sm font-semibold hover:border-green-primary
                         hover:text-green-primary transition-colors flex items-center justify-center gap-2"
              onClick={() => setShowCreate(!showCreate)}
            >
              <span>＋</span>
              <span>自定义实验</span>
            </button>

            {showCreate && (
              <CreateExperimentPanel
                onCreated={() => setShowCreate(false)}
                existingFoods={active.map((e) => e.food)}
              />
            )}
          </section>
        )}

        {/* ── Completed archive ── */}
        {completed.length > 0 && (
          <section>
            <button
              className="w-full flex items-center justify-between py-2"
              onClick={() => setShowArchive(!showArchive)}
            >
              <p className="section-title">已完成实验 ({completed.length})</p>
              <span className="text-ink-muted text-sm">{showArchive ? '▲' : '▼'}</span>
            </button>

            {showArchive && (
              <div className="space-y-2 mt-2 animate-fade-up">
                {completed.map((exp) => {
                  const meta = FODMAP_META[exp.food];
                  const result = exp.result ? RESULT_META[exp.result] : null;
                  return (
                    <div key={exp.id} className="card flex items-center gap-3">
                      <div className="w-10 h-10 bg-ivory-200 rounded-[12px] flex items-center justify-center text-xl">
                        {meta.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{meta.label}</p>
                        <p className="text-xs text-ink-muted">{exp.startDate} · {exp.durationDays}天</p>
                      </div>
                      {result && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${result.color}`}>
                          {result.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FinishButton({ onFinish }: { onFinish: (r: ExperimentResult) => void }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="flex-[2] flex gap-1.5 animate-spring-in">
        {(['effective', 'not_effective', 'uncertain'] as ExperimentResult[]).map((r) => (
          <button
            key={r}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${RESULT_META[r].color}`}
            onClick={() => onFinish(r)}
          >
            {RESULT_META[r].label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <button
      className="flex-[2] py-2.5 rounded-2xl bg-green-pale text-green-dark text-sm font-bold
                 hover:bg-green-primary hover:text-white transition-colors"
      onClick={() => setOpen(true)}
    >
      结束并记录
    </button>
  );
}

const ALL_FOODS: FodmapTag[] = [
  'dairy', 'gluten', 'egg', 'spicy', 'seafood', 'cold',
  'soy', 'alcohol', 'coffee', 'fatty', 'garlic', 'fructose',
];

function CreateExperimentPanel({
  onCreated,
  existingFoods,
}: {
  onCreated: () => void;
  existingFoods: FodmapTag[];
}) {
  const { createExperiment } = useAppStore();
  const [food, setFood] = useState<FodmapTag | null>(null);
  const [days, setDays] = useState(7);

  const submit = () => {
    if (!food) return;
    createExperiment(food, days, false);
    onCreated();
  };

  return (
    <div className="card mt-3 space-y-4 animate-fade-up">
      <div>
        <p className="section-title mb-2">选择要排除的食物</p>
        <div className="flex flex-wrap gap-2">
          {ALL_FOODS.filter((f) => !existingFoods.includes(f)).map((f) => {
            const meta = FODMAP_META[f];
            return (
              <button
                key={f}
                className={`tag-chip ${food === f ? 'selected' : ''}`}
                onClick={() => setFood(f)}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-title mb-2">实验天数</p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={3}
            max={14}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="flex-1 accent-green-primary"
          />
          <span className="text-xl font-extrabold text-green-primary w-10 text-center">{days}</span>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!food}
        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all
          ${food
            ? 'bg-green-primary text-white shadow-[0_4px_12px_rgba(74,124,89,0.3)] active:scale-95'
            : 'bg-ivory-200 text-ink-muted cursor-not-allowed'
          }`}
      >
        {food ? `开始戒 ${FODMAP_META[food].emoji} ${FODMAP_META[food].label}` : '请先选择食物'}
      </button>
    </div>
  );
}
