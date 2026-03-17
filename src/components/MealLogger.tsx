import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  FODMAP_META,
  MEAL_META,
  type MealType,
  type FodmapTag,
  type Meal,
} from '../types';

const ALL_TAGS: FodmapTag[] = [
  'dairy', 'gluten', 'egg', 'spicy', 'seafood', 'cold',
  'soy', 'alcohol', 'coffee', 'fatty', 'garlic', 'fructose',
];

interface MealLoggerProps {
  date: string;
  mealType: MealType;
  existingMeal?: Meal;
  onClose: () => void;
}

export function MealLogger({ date, mealType, existingMeal, onClose }: MealLoggerProps) {
  const { upsertMeal } = useAppStore();
  const meta = MEAL_META[mealType];

  const [selectedTags, setSelectedTags] = useState<FodmapTag[]>(existingMeal?.tags ?? []);
  const [notes, setNotes] = useState(existingMeal?.notes ?? '');
  const [time, setTime] = useState(existingMeal?.time ?? meta.defaultTime);

  const toggle = (tag: FodmapTag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const save = () => {
    const meal: Meal = {
      id: existingMeal?.id ?? `meal-${Date.now()}`,
      type: mealType,
      time,
      tags: selectedTags,
      notes: notes.trim(),
    };
    upsertMeal(date, meal);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} />

      {/* Sheet */}
      <div className="bottom-sheet">
        <div className="sheet-handle" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-ivory-200 rounded-[14px] flex items-center justify-center text-2xl">
            {meta.emoji}
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">{meta.label}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-ink-muted">时间：</span>
              <input
                type="time"
                className="time-select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* FODMAP tags */}
        <p className="section-title mb-2">吃了哪类食物？</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ALL_TAGS.map((tag) => {
            const { emoji, label } = FODMAP_META[tag];
            const sel = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                id={`tag-${tag}`}
                className={`tag-chip ${sel ? 'selected' : ''}`}
                onClick={() => toggle(tag)}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <p className="section-title mb-2">备注（可选）</p>
        <input
          id="meal-notes"
          type="text"
          className="gut-input mb-4"
          placeholder="比如：吃了两碗、外带..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Photo placeholder */}
        <button
          disabled
          className="w-full py-3 rounded-2xl border-2 border-dashed border-ivory-300
                     text-ink-muted text-sm mb-5 flex items-center justify-center gap-2
                     opacity-60 cursor-not-allowed"
        >
          <span>📷</span>
          <span>拍照识别</span>
          <span className="bg-ivory-200 text-ink-muted text-xs px-2 py-0.5 rounded-full">
            即将上线
          </span>
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-2xl border-2 border-ivory-300 text-ink font-semibold
                       hover:border-ink-muted transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            id="save-meal"
            onClick={save}
            className="flex-[2] py-3 rounded-2xl bg-green-primary text-white font-bold
                       shadow-[0_4px_12px_rgba(74,124,89,0.3)] active:scale-95 transition-transform"
          >
            记录{selectedTags.length > 0 ? ` (${selectedTags.length} 项)` : ''}
          </button>
        </div>
      </div>
    </>
  );
}
