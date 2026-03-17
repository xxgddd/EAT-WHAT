import { useAppStore } from '../store/useAppStore';
import { SYMPTOM_META, type SymptomType, type Severity } from '../types';

const TYPES: SymptomType[] = ['nausea', 'bloating', 'pain', 'diarrhea', 'constipation'];

interface SymptomPickerProps {
  date: string;
}

export function SymptomPicker({ date }: SymptomPickerProps) {
  const { records, addSymptom, removeSymptom } = useAppStore();
  const symptoms = records[date]?.symptoms ?? [];

  const get = (t: SymptomType) => symptoms.find((s) => s.type === t);
  const isSelected = (t: SymptomType) => !!get(t);

  const toggle = (t: SymptomType) => {
    const existing = get(t);
    if (existing) {
      removeSymptom(date, existing.id);
    } else {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      addSymptom(date, { type: t, time: `${hh}:${mm}`, severity: 2 });
    }
  };

  const setTime = (t: SymptomType, time: string) => {
    const s = get(t);
    if (!s) return;
    removeSymptom(date, s.id);
    addSymptom(date, { type: t, time, severity: s.severity });
  };

  const setSeverity = (t: SymptomType, severity: Severity) => {
    const s = get(t);
    if (!s) return;
    removeSymptom(date, s.id);
    addSymptom(date, { type: t, time: s.time, severity });
  };

  return (
    <div className="animate-slide-down space-y-3 mt-1">
      <p className="section-title">你哪里不舒服？</p>

      {/* Symptom grid — 3+2 */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.slice(0, 3).map((t) => (
          <SymptomCard
            key={t}
            type={t}
            selected={isSelected(t)}
            onToggle={() => toggle(t)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TYPES.slice(3).map((t) => (
          <SymptomCard
            key={t}
            type={t}
            selected={isSelected(t)}
            onToggle={() => toggle(t)}
          />
        ))}
      </div>

      {/* Selected detail rows */}
      {symptoms.length > 0 && (
        <div className="space-y-2 pt-1">
          {symptoms.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 bg-terra-pale rounded-2xl px-4 py-3 animate-fade-in"
            >
              <span className="text-lg">{SYMPTOM_META[s.type].emoji}</span>
              <span className="text-sm font-semibold text-ink flex-1">
                {SYMPTOM_META[s.type].label}
              </span>

              {/* Time */}
              <input
                type="time"
                className="time-select"
                value={s.time}
                onChange={(e) => setTime(s.type, e.target.value)}
              />

              {/* Severity */}
              <div className="flex gap-1.5">
                {([1, 2, 3] as Severity[]).map((sv) => (
                  <button
                    key={sv}
                    className={`severity-dot ${s.severity >= sv ? 'active' : ''}`}
                    onClick={() => setSeverity(s.type, sv)}
                    aria-label={`严重程度 ${sv}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function SymptomCard({
  type,
  selected,
  onToggle,
}: {
  type: SymptomType;
  selected: boolean;
  onToggle: () => void;
}) {
  const { emoji, label } = SYMPTOM_META[type];
  return (
    <button
      id={`symptom-${type}`}
      className={`symptom-card ${selected ? 'selected' : ''}`}
      onClick={onToggle}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-xs font-semibold">{label}</span>
      {selected && <span className="text-[10px] text-terra font-bold">已选</span>}
    </button>
  );
}
