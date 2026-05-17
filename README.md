# 安全小卫·闯海岛

戏曲风防溺水安全教育 H5 小游戏。13 道题 = 13 个独立图片交互小游戏。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:5173

# 3. 构建生产版本
npm run build
npm run preview
```

## AI 生图（开发期）

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑 .env 填入 OPENROUTER_API_KEY 和精确的 model id
#    （去 OpenRouter 后台确认 model 名称，不同时期可能不同）

# 3. 生成所有素材到 public/images/
npm run gen:assets
```

⚠️ **API Key 安全**：
- `.env` 已被 `.gitignore` 排除，不会进入仓库
- **绝不要**把 key 提交到代码里、发到聊天里、贴到 issue 里
- 如不慎泄露，立即去 OpenRouter 后台 revoke 并生成新 key

## 项目结构

```
sea-guard/
├── public/
│   ├── images/         # AI 生成的素材（commit 进仓库）
│   └── audio/          # 音效文件
├── src/
│   ├── components/
│   │   ├── shell/      # GameShell, FeedbackLayer 通用框架
│   │   └── games/      # Q01-Q13 各自独立的小游戏组件
│   ├── composables/    # useCountdown, useAudio, useSwipe
│   ├── data/           # 题库
│   ├── stores/         # 通关进度 (localStorage)
│   ├── styles/         # opera.css 戏曲风通用样式
│   ├── utils/          # AI 生图 prompts
│   └── views/          # Home, GamePage
└── scripts/
    └── generate-assets.mjs   # 批量调 OpenRouter 生图
```

## 当前实现状态

- ✅ 整体框架（路由、Shell、FeedbackLayer、Home）
- ✅ Q01_TidalRetreat（限时方向滑动）
- ⏳ Q02-Q13（占位中，按模板逐一开发）

## 添加新关卡

1. 在 `src/components/games/` 新建 `Q0X_Name.vue`
2. 接收 `question` prop，emit `correct` / `wrong` 事件
3. 在 `src/data/questions.js` 把对应题目的 `component` 字段从 null 改为组件名
4. 在 `src/utils/ai-image-fetch/prompts.js` 加上该题需要的图片 prompt
5. 跑 `npm run gen:assets` 生成素材

## 部署

### Vercel（推荐）

```bash
npm i -g vercel
vercel --prod
```

### GitHub Pages / 阿里云 OSS

```bash
npm run build
# 把 dist/ 目录上传到任意静态托管
```

URL 直访问：`https://your-domain/#/game/Q01`
