# 🫃 肠胃侦探 — Gemini 交接文档

## 项目概况

**项目路径：** `d:\BLINK\你吃啥了`
**线上部署：** Netlify（用户负责）
**当前状态：** 前端已全部完成，开发服务正在运行于 `http://localhost:5173`

这是一个为 IBS（肠易激综合征）患者设计的饮食 + 症状追踪 PWA。
核心逻辑：症状驱动记录 → FODMAP 标签分类 → AI 对比饮食差异 → 找出可疑食物 → 排除实验追踪。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Vite + React + TypeScript |
| 样式 | Tailwind CSS v3（大量自定义组件类） |
| 状态管理 | Zustand + persist（自动同步 localStorage） |
| AI 接口 | SiliconFlow / DeepSeek V3（OpenAI 兼容接口） |
| 日期工具 | date-fns v4 |
| 部署 | Netlify |

---

## 文件结构

```
src/
├── types/index.ts          # 所有 TS 接口 + FODMAP/症状/餐次 meta 常量
├── store/useAppStore.ts    # Zustand store，含所有 CRUD actions + derived selectors
├── services/deepseek.ts    # AI 服务（含 mock fallback，自动检测 API key）
├── components/
│   ├── Mascot.tsx          # 肠胃君角色，有语音气泡 + 5种 mood
│   ├── BottomNav.tsx       # 底部3 Tab 导航（今日居中凸起）
│   ├── SymptomPicker.tsx   # 症状快选 3+2 网格，含时间 + 严重度
│   ├── MealLogger.tsx      # FODMAP 标签快选底部弹窗
│   └── FollowUpQuestion.tsx # 条件触发追加问题（one-at-a-time）
├── pages/
│   ├── Onboarding.tsx      # 2屏 onboarding（性别 → 经期追踪）
│   ├── TodayTab.tsx        # 今日主页面（最复杂）
│   ├── LabTab.tsx          # 实验室（实验创建/进度/归档）
│   └── HistoryTab.tsx      # 历史追踪（可疑食物排行 + 日卡展开）
├── App.tsx                 # 根组件（onboarding gate + tab 路由）
├── main.tsx
└── index.css               # 全局样式系统（所有 .card .pill .tag-chip 等）
```

---

## ✅ 已完成的全部工作

- [x] 项目脚手架（Vite + React + TypeScript + Tailwind）
- [x] 全局样式系统（有机自然风，暖色调，大圆角，所有动画）
- [x] 数据类型（TypeScript interfaces + FODMAP/症状/餐次 meta）
- [x] Zustand store（完整 CRUD + localStorage 持久化）
- [x] AI 服务层（mock 模式已就绪，实际 API 结构完成）
- [x] 所有 React 组件（Mascot / BottomNav / SymptomPicker / MealLogger / FollowUpQuestion）
- [x] 所有页面（Onboarding / TodayTab / LabTab / HistoryTab）
- [x] 编译验证（`npm run build` 零报错）
- [x] 截图验证（App 全部流程人工测试通过）

---

## ❌ 唯一剩余任务：接入真实 AI API

### 第一步：创建环境变量文件

在项目根目录 `d:\BLINK\你吃啥了\` 创建 `.env.local`：

```
VITE_SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 用户在 SiliconFlow（https://siliconflow.cn）有额度，使用 DeepSeek V3 模型。
> Netlify 部署时，在 Netlify Dashboard → Environment Variables 添加同名变量即可。

### 第二步：验证 AI 接口

`src/services/deepseek.ts` 中有自动检测逻辑：

```typescript
const MOCK_MODE = !import.meta.env.VITE_SILICONFLOW_API_KEY;
```

有 API Key → 真实调用；无 Key → mock 随机返回结论句子。**无需改动任何代码**，只需提供 Key。

### 第三步（可选）：验证线上部署

```bash
npm run build
# 把 dist/ 上传 Netlify，或通过 Netlify CLI / GitHub 连接自动部署
```

---

## 设计系统速查

### 颜色 Token（Tailwind 自定义）

| Token | 颜色 | 用途 |
|-------|------|------|
| `bg-ivory-100` | `#FAF7F2` | 页面背景 |
| `text-ink` | `#2D2D2D` | 主文字 |
| `text-ink-muted` | `#9E9890` | 次要文字 |
| `bg-green-primary` | `#4A7C59` | 主色（按钮/激活态） |
| `bg-green-pale` | `#EAF2EC` | 绿色浅底（好的状态） |
| `text-terra` | `#E07A5F` | 点缀色（症状/警告） |
| `bg-terra-pale` | `#FDF0EC` | 橙色浅底（坏的状态） |

### 常用 CSS 类

```css
.card          /* 白色圆角卡片，阴影 */
.pill          /* 胶囊按钮基类 */
.pill-green    /* 绿色填充胶囊 */
.pill-outline  /* 边框胶囊 */
.tag-chip      /* FODMAP 标签chip */
.tag-chip.selected /* 已选 chip */
.bottom-sheet  /* 底部弹出面板 */
.overlay       /* 背景遮罩 */
.section-title /* 小节标题（大写小字） */
.gut-input     /* 带圆角的文本输入框 */
```

---

## Store API 速查（useAppStore）

```typescript
// 读数据
store.todayRecord()           // 今日记录（自动创建如果不存在）
store.recentRecords(14)       // 最近N天有记录的日期
store.suspectFoods()          // 可疑食物排行 [{food, count}]
store.activeExperiments()     // 进行中实验列表

// 写数据
store.setDayStatus(date, 'good' | 'bad' | null)
store.addSymptom(date, {type, time, severity})
store.removeSymptom(date, symptomId)
store.upsertMeal(date, meal)
store.addExternalFactor(date, {type, date})
store.setAiConclusion(date, text)
store.createExperiment(food, durationDays?, aiSuggested?)
store.finishExperiment(id, result)
store.syncExperimentDayLogs() // 把今日状态同步进进行中实验的记录
```

---

## 已知细节 & 注意事项

1. **日期格式**：全局统一使用 `YYYY-MM-DD` 字符串作为主键，时间使用 `HH:MM`。

2. **今日日期**：TodayTab 中 `TODAY = format(new Date(), 'yyyy-MM-dd')`，每次页面渲染时固定。如果需要跨天测试，临时修改这个值即可。

3. **AI 分析触发**：`TodayTab.tsx` 中通过 `useDebounce` 2秒防抖，在 status 或 meals 变化时**自动**触发。已有去重机制（`aiTriggeredRef`），不会重复调用。

4. **实验上限**：同时只能有 2 个进行中实验，在 `createExperiment` 中有 guard。

5. **FollowUpQuestion 去重**：`followUpDismissed` 状态保存在 TodayTab 的 useState 中（非 store），刷新后会重置。如果需要持久化"今天已回答"，需要把它存进 DayRecord 或 store。

6. **date-fns 中文 locale**：已在 TodayTab 和 HistoryTab 里 `import { zhCN } from 'date-fns/locale'`，给 `format()` 函数使用。

7. **字体**：Google Fonts `Plus Jakarta Sans`，在 `index.html` 中引入，Tailwind 中配置为 `fontFamily.sans` 首选。离线/网络差时降级到系统中文字体。

8. **`npm run dev`**：目前正在运行，端口 `5173`。重启命令：`npm run dev`（在 `d:\BLINK\你吃啥了` 目录下）。

---

## 可选后续改进方向（低优先级）

- [ ] **📷 拍照识别**：MealLogger 中已有占位按钮（disabled），接入多模态 API 即可
- [ ] **经期预测**：根据 `profile.lastPeriodStart + cycleLength` 自动标注排班中的 `isMenstrual`
- [ ] **PWA 配置**：添加 `manifest.json` + service worker，让用户可以"安装到桌面"
- [ ] **通知提醒**：Notification API，晚饭后温和提醒记录（需用户授权）
- [ ] **数据导出**：导出为 CSV 给医生看

---

*Claude 完成于 2026-03-17 17:28 UTC+8。祝 Gemini 顺利！🫃*
