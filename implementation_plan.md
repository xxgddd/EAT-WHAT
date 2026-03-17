# 肠胃侦探 — Implementation Plan

React + TypeScript SPA for tracking IBS symptoms and diet. Based on the low-FODMAP framework. No backend — all data lives in `localStorage`. AI analysis via Gemini API.

---

## User Review Required

> [!IMPORTANT]
> **AI API Key**: 分析功能需要 Gemini API Key。用户需在 `.env.local` 中提供 `VITE_GEMINI_API_KEY`，否则 AI 分析模块会优雅降级（显示"暂无分析"）。

> [!IMPORTANT]
> **图片识别（拍照上传）**: 本期暂不实现，设计预留入口，标注 "即将上线"。复杂度较高，放第二期。

---

## Proposed Changes

### 1. 项目初始化

#### [NEW] 项目根目录 `d:\BLINK\你吃啥了\`

- `npx create-vite@latest ./ --template react-ts`
- 安装 Tailwind CSS v3 + PostCSS
- 安装依赖：`@google/generative-ai`、`date-fns`（日期工具）、`zustand`（轻量状态管理）

目录结构：
```
src/
  types/        # TypeScript interfaces
  store/        # zustand stores (持久化到localStorage)
  services/     # AI service
  components/   # 可复用组件
  pages/        # 三个 Tab 页面 + Onboarding
  assets/       # 静态资源
```

---

### 2. 数据模型

#### [NEW] `src/types/index.ts`

```typescript
// 用户档案
interface UserProfile {
  gender: 'male' | 'female' | 'skip';
  trackMenstrual: boolean;
  cycleLength?: number;         // 周期天数，默认28
  lastPeriodStart?: string;     // YYYY-MM-DD
  onboardingDone: boolean;
}

// 当日记录（核心数据单元）
interface DayRecord {
  date: string;                 // YYYY-MM-DD，作为主键
  status: 'good' | 'bad' | null;
  symptoms: Symptom[];
  meals: Meal[];
  externalFactors: ExternalFactor[];
  aiConclusion: string | null;
  isMenstrual: boolean;         // 自动计算或手动标注
}

// 症状
interface Symptom {
  type: 'nausea' | 'bloating' | 'pain' | 'diarrhea' | 'constipation';
  time: string;                 // HH:MM
  severity: 1 | 2 | 3;
}

// 餐次
interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  tags: FodmapTag[];
  notes: string;
}

// FODMAP 分类标签
type FodmapTag =
  | 'dairy'      // 🥛 乳制品 (D类)
  | 'gluten'     // 🍞 面食 (O类)
  | 'egg'        // 🥚 鸡蛋
  | 'spicy'      // 🌶️ 辣
  | 'seafood'    // 🦐 海鲜
  | 'cold'       // 🧊 生冷
  | 'soy'        // 🫘 豆制品
  | 'alcohol'    // 🍺 酒精
  | 'coffee'     // ☕ 咖啡
  | 'fatty'      // 🧈 高油
  | 'garlic'     // 🧄 葱蒜 (O类，补充)
  | 'fructose';  // 🍎 高果糖 (M类，补充)

// 外部变量（one-at-a-time 采集）
interface ExternalFactor {
  type: 'sleep_poor' | 'sleep_good' | 'cold_exposure' | 'stress' | 'menstrual';
  date: string;
}

// 排除实验
interface Experiment {
  id: string;
  food: FodmapTag;
  startDate: string;
  endDate?: string;
  durationDays: number;         // 计划天数（默认7）
  status: 'active' | 'paused' | 'completed';
  result?: 'effective' | 'not_effective' | 'uncertain';
  dailyLog: { date: string; status: 'good' | 'bad' | null }[];
  aiSuggested: boolean;
}
```

#### [NEW] `src/store/useAppStore.ts`

使用 `zustand` + `persist` 中间件，将所有状态自动序列化到 `localStorage`：
- `profile: UserProfile`
- `records: Record<string, DayRecord>` (key = YYYY-MM-DD)
- `experiments: Experiment[]`

提供 actions：`addSymptom`、`addMeal`、`saveAIConclusion`、`createExperiment`、`updateExperiment` 等。

---

### 3. Onboarding 页面

#### [NEW] `src/pages/Onboarding.tsx`

2个屏幕，全屏居中卡片风格：

**Screen 1 — 性别**
- 肠胃君 emoji 大图居中
- 欢迎语：`"嗨！我是你的肠胃侦探 🔍 先认识一下你？"`
- 3个大按钮：`♂️ 男生` / `♀️ 女生` / `跳过`

**Screen 2 — 经期（仅女性）**
- `"要追踪生理周期吗？有助于找出激素诱因"`
- 两个选项 + 周期天数滑条（可跳过）

完成后设置 `profile.onboardingDone = true`，跳转主界面。

---

### 4. 主界面 + 底部导航

#### [NEW] `src/App.tsx` + `src/components/BottomNav.tsx`

三个 Tab：
```
🧪 实验室  |  🫃 今日（居中，略大）  |  📊 历史
```
默认激活"今日"。路由使用简单的 state 切换，不引入 React Router（无需URL路由）。

---

### 5. 今日 Tab

#### [NEW] `src/pages/TodayTab.tsx`

**流程设计（症状驱动优先）**

```
打开今日Tab
      ↓
[顶部] 日期 + 肠胃君角色（contextual台词）
      ↓
[状态区] 今天怎么样？
  → 没事 ✅ / 有问题 🚨
      ↓（选"有问题"时展开）
[症状快选] 🤢 🌀 😣 🚽 💩
  + 时间点选择（滚轮 HH:MM）
  + 严重程度: 轻 / 中 / 重
      ↓
[追加一问] 昨晚睡得怎么样？ 😴好 / 😵差 / 跳过
  （连续2次坏才问；每天只追加1个外部变量）
      ↓
[餐次时间线] 早 / 午 / 晚 / 加餐
  点击任一餐次 → 展开 FODMAP 标签快选 + 文字备注
      ↓
[AI分析区] 每次记录后触发，显示单句结论
```

#### [NEW] `src/components/MealLogger.tsx`

展开式面板，包含：
- 12个 FODMAP 标签（大 emoji 按钮，可多选）
- 文字备注输入框（一行，非必填）
- 📷 占位按钮（标注"即将上线"，不可点击）

#### [NEW] `src/components/FollowUpQuestion.tsx`

逻辑：
1. 每天最多问 1 个外部变量
2. 优先队列：睡眠 → 着凉 → 压力 → 经期（如适用）
3. 连续2次出现 bad day 才触发
4. 三选一按钮：积极 / 消极 / 跳过

---

### 6. 实验室 Tab

#### [NEW] `src/pages/LabTab.tsx`

**上半区 — 进行中实验**（最多同时2个）

```
┌─────────────────────────────┐
│ 🧪 实验中：戒掉🥛 牛奶       │
│ 第 3 天 / 7 天              │
│ 😊 😊 😖 ─ ─ ─ ─           │ ← 每天一格
│ [暂停] [完结并记录结果]      │
└─────────────────────────────┘
```

**下半区 — AI建议 + 手动新建**

- AI基于历史分析出高频关联食物，显示建议卡片
- "我想自己试" → 选择食物标签 + 设置天数 → 开始

**已完成实验归档列表**（折叠在底部）

---

### 7. 历史 Tab

#### [NEW] `src/pages/HistoryTab.tsx`

**顶部 — 可疑食物排行**

```
🔴 🥛 牛奶  出现 4 次异常关联
🟡 🍞 面食  出现 2 次异常关联
```

**主体 — 日历/列表切换视图**

每个 DayRecord 卡片：
- 日期 + 星期 + 状态 emoji
- 当日 FODMAP 标签（只显示有记录的）
- AI 结论一句话
- 点击展开详情（完整餐次、症状时间线）

空白日显示：`"─ 未记录"` 灰色，不假设数据

---

### 8. AI 服务

#### [NEW] `src/services/gemini.ts`

每次记录完成后调用，传入：
```typescript
{
  today: DayRecord,
  yesterday: DayRecord | null,
  history: DayRecord[],    // 最近14天
  experiments: Experiment[]
}
```

Prompt 核心逻辑：
```
角色：你是一个专注IBS的饮食分析助手，只输出一句话中文结论（≤30字）。
规则：
1. 对比今日 vs 昨日食物标签差异
2. 如果今日状态是bad，找出新增/增量食物
3. 如果该食物已 ≥3 次关联异常，升级为 🔴 高度怀疑
4. 如果今日状态是good且无新变量，输出"今天没有新变量 👌"
5. 绝不输出超过一句话。不要解释，不要建议，只陈述发现。
```

Gemini API 调用使用 `gemini-2.0-flash`（快速、低cost）。

---

### 9. 肠胃君角色

#### [NEW] `src/components/Mascot.tsx`

轻量实现，不用自定义图片，使用 emoji + CSS 动画：
- 正常态：`🫃` 静止
- 思考态：`🫃` 配合 loading 时轻微左右晃动
- 好天气：`🫃 ✨`
- 坏天气：`🫃 💙`

台词根据 context 变化，固定在今日 Tab 顶部，小而存在感轻。

---

### 10. 全局样式

#### [NEW] `src/index.css` + `tailwind.config.js`

配色：
```
背景：#FAF7F2（暖象牙白）
主色：#4A7C59（深茶绿）
点缀：#E07A5F（软橙/terra cotta）
文字：#2D2D2D（近黑）
卡片：#FFFFFF，圆角 20px，轻阴影
```

字体：Google Fonts — `Plus Jakarta Sans`（英文/数字）+ 系统中文字体

---

## Verification Plan

### 本地运行测试
```bash
cd "d:\BLINK\你吃啥了"
npm run dev
# 在浏览器打开 http://localhost:5173
```

### 功能测试清单（手动，使用浏览器工具）
1. **Onboarding**: 选择性别 → 选择经期追踪 → 确认跳转到主界面
2. **今日Tab-症状流**: 点"有问题" → 选症状 + 时间 → 验证数据保存
3. **今日Tab-餐次流**: 点早餐 → 选 FODMAP 标签 → 输入备注 → 保存
4. **追加问题**: 连续2天选坏 → 第3天确认出现追加问题
5. **AI分析**: 填写当日记录 → 确认AI结论出现（需API Key）
6. **实验室**: 创建实验 → 验证进行中卡片显示 → 完结实验
7. **历史**: 翻看历史卡片 → 确认可疑食物排行正确
8. **数据持久化**: 刷新页面 → 确认数据未丢失

### AI降级测试
不提供 API Key 时，AI分析区显示 `"暂无分析"` 而不是报错。
