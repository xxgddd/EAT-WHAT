/**
 * DeepSeek AI Service via SiliconFlow
 *
 * TODO for Gemini: Replace the MOCK_MODE flag with real API logic.
 * - Set MOCK_MODE = false to enable real API calls.
 * - The env var is VITE_SILICONFLOW_API_KEY (set in .env.local or Netlify env).
 * - baseURL: https://api.siliconflow.cn/v1
 * - model: deepseek-ai/DeepSeek-V3
 */

import OpenAI from 'openai';
import type { DayRecord, Experiment, FodmapTag } from '../types';
import { FODMAP_META } from '../types';

// ─── Config ────────────────────────────────────────────────────────────────────

const MOCK_MODE = !import.meta.env.VITE_SILICONFLOW_API_KEY;

const client = MOCK_MODE
  ? null
  : new OpenAI({
      apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY,
      baseURL: 'https://api.siliconflow.cn/v1',
      dangerouslyAllowBrowser: true,
    });

// ─── Mock responses ────────────────────────────────────────────────────────────

const MOCK_CONCLUSIONS = [
  '今天没有新变量 👌',
  '⚠️ 今天新增了 🥛 乳制品，下午出现胀气，明天试试去掉它',
  '今天饮食和昨天差不多，状态也还行 ✨',
  '🔴 🍞 面食已连续3次关联不适，高度怀疑',
  '今天新增了 🌶️ 辣，需要观察后续反应',
  '没有明显的新变量，继续保持 💪',
];

const mockConclusion = () =>
  MOCK_CONCLUSIONS[Math.floor(Math.random() * MOCK_CONCLUSIONS.length)];

// ─── Prompt builder ────────────────────────────────────────────────────────────

const buildTagList = (records: DayRecord[]): string =>
  records
    .map((r) => {
      const tags = r.meals
        .flatMap((m) => m.tags)
        .map((t) => `${FODMAP_META[t].emoji}${FODMAP_META[t].label}`)
        .join('、');
      const statusStr = r.status === 'bad' ? '有问题' : r.status === 'good' ? '没事' : '未知';
      return `${r.date}(${statusStr}): ${tags || '无记录'}`;
    })
    .join('\n');

const countSuspects = (
  recent: DayRecord[],
  food: FodmapTag
): number =>
  recent.filter(
    (r) => r.status === 'bad' && r.meals.some((m) => m.tags.includes(food))
  ).length;

const buildPrompt = (
  today: DayRecord,
  yesterday: DayRecord | null,
  history: DayRecord[],
  _experiments: Experiment[]
): string => {
  const todayTags = today.meals.flatMap((m) => m.tags);
  const yesterdayTags = yesterday?.meals.flatMap((m) => m.tags) ?? [];
  const newTags = todayTags.filter((t) => !yesterdayTags.includes(t));

  const suspectLines = newTags
    .filter((t) => countSuspects(history, t) >= 2)
    .map(
      (t) =>
        `${FODMAP_META[t].emoji}${FODMAP_META[t].label} 累计${countSuspects(history, t)}次异常关联`
    )
    .join('、');

  return `你是一个专注IBS（肠易激综合征）的饮食分析助手。只输出一句话中文结论，不超过40字，不要解释，不要建议，只陈述发现。

今日状态：${today.status === 'bad' ? '有问题（' + today.symptoms.map((s) => s.type).join('、') + '）' : '没事'}
今日食物：${todayTags.map((t) => `${FODMAP_META[t].emoji}${FODMAP_META[t].label}`).join('、') || '无'}
昨日食物：${yesterdayTags.map((t) => `${FODMAP_META[t].emoji}${FODMAP_META[t].label}`).join('、') || '无'}
今日新增：${newTags.map((t) => `${FODMAP_META[t].emoji}${FODMAP_META[t].label}`).join('、') || '无'}
${suspectLines ? `高频嫌疑：${suspectLines}` : ''}

近期记录：
${buildTagList(history.slice(0, 5))}

规则：
1. 如果今日没事且无新变量：输出"今天没有新变量 👌"
2. 如果今日有问题且有新增食物：点名新增食物，说明症状
3. 如果某食物累计≥3次异常：在结论前加"🔴 "并说"高度怀疑"
4. 如果今日有问题但无新变量：说"今天状态不佳，但没有新变量，可能是外部因素"
5. 永远只输出一句话`;
};

// ─── Main export ───────────────────────────────────────────────────────────────

export async function analyzeDay(
  today: DayRecord,
  yesterday: DayRecord | null,
  history: DayRecord[],
  experiments: Experiment[]
): Promise<string> {
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200)); // simulate latency
    return mockConclusion();
  }

  try {
    const prompt = buildPrompt(today, yesterday, history, experiments);
    const completion = await client!.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() ?? '分析完成 👌';
  } catch (err) {
    console.error('[DeepSeek] API error:', err);
    return '暂时无法分析，请稍后再试';
  }
}
