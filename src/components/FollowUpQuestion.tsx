import { useAppStore } from '../store/useAppStore';
import type { ExternalFactorType } from '../types';

interface Option {
  label: string;
  factorType?: ExternalFactorType;
}

interface Question {
  prompt: string;
  options: Option[];
}

interface FollowUpQuestionProps {
  date: string;
  onAnswered: () => void;
}

export function FollowUpQuestion({ date, onAnswered }: FollowUpQuestionProps) {
  const store = useAppStore();
  const rec = store.records[date];
  const profile = store.profile;

  if (!rec || rec.status !== 'bad') return null;

  // Pick the right question
  const recentDays = Object.values(store.records)
    .filter((r) => r.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const recentBad = recentDays.filter((r) => r.status === 'bad').length;

  let question: Question;

  if (profile.gender === 'female' && profile.trackMenstrual) {
    question = {
      prompt: '小问一下：今天是生理期吗？',
      options: [
        { label: '是的 🌹', factorType: 'menstrual' },
        { label: '不是', factorType: undefined },
        { label: '跳过', factorType: undefined },
      ],
    };
  } else if (recentBad >= 1) {
    question = {
      prompt: '昨晚睡得怎么样？',
      options: [
        { label: '😴 睡得好', factorType: 'sleep_good' },
        { label: '😵 睡得差', factorType: 'sleep_poor' },
        { label: '跳过', factorType: undefined },
      ],
    };
  } else {
    question = {
      prompt: '今天接触生冷的东西了吗？',
      options: [
        { label: '🧊 有的', factorType: 'cold_exposure' },
        { label: '没有', factorType: undefined },
        { label: '跳过', factorType: undefined },
      ],
    };
  }

  const handleAnswer = (opt: Option) => {
    if (opt.factorType) {
      store.addExternalFactor(date, { type: opt.factorType, date });
    }
    onAnswered();
  };

  return (
    <div className="card animate-fade-up border border-ivory-300">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">💬</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink mb-3">{question.prompt}</p>
          <div className="flex gap-2 flex-wrap">
            {question.options.map((opt, i) => (
              <button
                key={i}
                className="pill pill-outline text-sm"
                onClick={() => handleAnswer(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
