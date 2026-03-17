import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Mascot } from '../components/Mascot';

export function Onboarding() {
  const { setProfile, completeOnboarding, profile } = useAppStore();
  const [screen, setScreen] = useState<1 | 2>(1);

  // ── Screen 1: gender ─────────────────────────────────────────────────────────
  const handleGender = (gender: 'male' | 'female' | 'skip') => {
    setProfile({ gender });
    if (gender === 'female') {
      setScreen(2);
    } else {
      completeOnboarding();
    }
  };

  // ── Screen 2: menstrual ──────────────────────────────────────────────────────
  const [trackMenstrual, setTrackMenstrual] = useState(false);
  const [cycleLength, setCycleLength] = useState(28);

  const handleMenstrual = (track: boolean) => {
    setProfile({ trackMenstrual: track, cycleLength: track ? cycleLength : 28 });
    completeOnboarding();
  };

  // ── Skip from profile (loaded in App) ────────────────────────────────────────
  const skipAll = () => {
    setProfile({ gender: 'skip', trackMenstrual: false });
    completeOnboarding();
  };

  return (
    <div className="onboarding-bg">
      {/* ── Screen 1 ── */}
      {screen === 1 && (
        <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-spring-in">
          <Mascot
            mood="happy"
            speech="嗨！我是你的肠胃侦探 🔍"
            size="lg"
          />

          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-ink mb-2">
              肠胃侦探
            </h1>
            <p className="text-ink-secondary text-sm leading-relaxed">
              帮你找出让肠胃不舒服的食物线索<br />
              不评判，只观察 🫃
            </p>
          </div>

          <div className="w-full space-y-3">
            <p className="text-center text-sm font-semibold text-ink-secondary mb-1">
              先认识一下你？
            </p>

            <button
              id="gender-male"
              onClick={() => handleGender('male')}
              className="w-full py-4 rounded-3xl bg-white shadow-card border-2 border-transparent
                         hover:border-green-primary transition-all font-bold text-ink text-base
                         active:scale-95"
            >
              ♂️ &nbsp;男生
            </button>
            <button
              id="gender-female"
              onClick={() => handleGender('female')}
              className="w-full py-4 rounded-3xl bg-white shadow-card border-2 border-transparent
                         hover:border-green-primary transition-all font-bold text-ink text-base
                         active:scale-95"
            >
              ♀️ &nbsp;女生
            </button>
            <button
              id="gender-skip"
              onClick={() => handleGender('skip')}
              className="w-full py-3 rounded-3xl text-ink-muted text-sm font-medium
                         hover:text-ink transition-colors"
            >
              跳过
            </button>
          </div>
        </div>
      )}

      {/* ── Screen 2: menstrual ── */}
      {screen === 2 && (
        <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-spring-in">
          <div className="w-20 h-20 bg-terra-pale rounded-[24px] flex items-center justify-center text-4xl shadow-soft">
            📅
          </div>

          <div className="text-center">
            <h2 className="text-xl font-extrabold text-ink mb-2">
              追踪生理周期？
            </h2>
            <p className="text-ink-secondary text-sm leading-relaxed max-w-[260px]">
              部分 IBS 症状与激素变化相关<br/>追踪周期有助于找出规律
            </p>
          </div>

          {/* Cycle length slider */}
          {trackMenstrual && (
            <div className="w-full bg-white rounded-3xl p-5 shadow-card animate-fade-up">
              <p className="text-sm font-semibold text-ink mb-3">
                周期大概多少天？
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={21}
                  max={40}
                  value={cycleLength}
                  onChange={(e) => setCycleLength(Number(e.target.value))}
                  className="flex-1 accent-green-primary"
                />
                <span className="text-2xl font-extrabold text-green-primary w-12 text-center">
                  {cycleLength}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1 text-right">天</p>
            </div>
          )}

          <div className="w-full space-y-3">
            <button
              id="menstrual-yes"
              onClick={() => {
                setTrackMenstrual(true);
                if (trackMenstrual) handleMenstrual(true);
              }}
              className={`w-full py-4 rounded-3xl border-2 transition-all font-bold text-base active:scale-95
                ${trackMenstrual
                  ? 'bg-green-primary text-white border-green-primary shadow-[0_4px_16px_rgba(74,124,89,0.3)]'
                  : 'bg-white text-ink border-transparent shadow-card hover:border-green-primary'
                }`}
            >
              {trackMenstrual ? '🌹 开始追踪 →' : '🌹 是的，要追踪'}
            </button>
            <button
              id="menstrual-no"
              onClick={() => handleMenstrual(false)}
              className="w-full py-3 rounded-3xl text-ink-muted text-sm font-medium
                         hover:text-ink transition-colors"
            >
              先不用
            </button>
          </div>

          <button
            className="text-xs text-ink-muted underline"
            onClick={skipAll}
          >
            跳过所有设置
          </button>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        <div className={`w-2 h-2 rounded-full transition-colors ${screen === 1 ? 'bg-green-primary' : 'bg-ivory-300'}`} />
        {profile.gender === 'female' && (
          <div className={`w-2 h-2 rounded-full transition-colors ${screen === 2 ? 'bg-green-primary' : 'bg-ivory-300'}`} />
        )}
      </div>
    </div>
  );
}
