// 开发期批量生成 AI 图片的脚本
// 用法：1. 复制 .env.example 为 .env 填入 OPENROUTER_API_KEY
//      2. npm run gen:assets                       # 生成全部
//         npm run gen:assets characters/xiaoqiang  # 仅生成某前缀
// 生成的图存到 public/images/ 下，commit 进仓库后运行时不依赖 API
//
// OpenRouter 图像生成走 chat/completions 端点（不是 images/generations）
// 详见 ../API.md

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { prompts } from '../src/utils/ai-image-fetch/prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/images');

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-5.4-image-2';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!API_KEY) {
  console.error('❌ 缺少 OPENROUTER_API_KEY，请在 .env 中配置');
  process.exit(1);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 解析 data URL：data:image/png;base64,xxxx → { mime, buffer }
 */
function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error('无法解析 data URL');
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function extFromMime(mime) {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return 'png';
}

/**
 * 把本地图片读成 data URL（用于喂给图生图 API）
 */
async function fileToDataUrl(relPath) {
  const abs = path.resolve(PROJECT_ROOT, relPath);
  const buf = await fs.readFile(abs);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'webp' ? 'image/webp' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function generateOne(name, entry) {
  // 兼容两种格式：字符串 = 纯文生图；对象 = 可带参考图
  const prompt = typeof entry === 'string' ? entry : entry.prompt;
  const refs = typeof entry === 'string' ? [] : (entry.references || []);

  // 检查是否已存在（任意扩展名都跳过）
  for (const ext of ['png', 'jpg', 'webp']) {
    const p = path.join(OUTPUT_DIR, `${name}.${ext}`);
    if (await fileExists(p)) {
      console.log(`⏭️  跳过已存在：${name}.${ext}`);
      return;
    }
  }

  await ensureDir(path.join(OUTPUT_DIR, path.dirname(name)));

  console.log(`🎨 生成：${name}${refs.length ? `（图生图 x${refs.length}）` : ''} ...`);

  // 组装 message.content
  let content;
  if (refs.length === 0) {
    content = prompt;
  } else {
    const parts = [{ type: 'text', text: prompt }];
    for (const ref of refs) {
      const url = await fileToDataUrl(ref);
      parts.push({ type: 'image_url', image_url: { url } });
    }
    content = parts;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'sea-guard',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content }],
      modalities: ['image', 'text'],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 500)}`);
  }

  const json = await res.json();
  const message = json.choices?.[0]?.message;
  const images = message?.images;

  if (!Array.isArray(images) || images.length === 0) {
    throw new Error(
      `返回中无图片。response: ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  const dataUrl = images[0]?.image_url?.url;
  if (!dataUrl) throw new Error('image_url.url 为空');

  const { mime, buffer } = parseDataUrl(dataUrl);
  const ext = extFromMime(mime);
  const outPath = path.join(OUTPUT_DIR, `${name}.${ext}`);
  await fs.writeFile(outPath, buffer);
  console.log(`✅ 保存：${name}.${ext} (${(buffer.length / 1024).toFixed(1)}KB)`);
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  // 命令行参数：作为前缀过滤（如 "characters/xiaoqiang" 只生成小强相关）
  const filters = process.argv.slice(2);
  let entries = Object.entries(prompts);
  if (filters.length) {
    entries = entries.filter(([name]) =>
      filters.some((f) => name.startsWith(f))
    );
  }

  const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY) || 3);

  console.log(`📋 共 ${entries.length} 张图，模型：${MODEL}，并发：${CONCURRENCY}`);
  if (filters.length) console.log(`🔍 过滤：${filters.join(', ')}`);
  console.log('');

  const failed = [];
  let cursor = 0;

  async function worker(workerId) {
    while (true) {
      const idx = cursor++;
      if (idx >= entries.length) return;
      const [name, entry] = entries[idx];
      try {
        await generateOne(name, entry);
      } catch (err) {
        console.error(`❌ [w${workerId}] ${name} 失败：${err.message}`);
        failed.push({ name, error: err.message });
      }
      // 每个 worker 之间轻微限速，避免突刺
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, entries.length) }, (_, i) =>
      worker(i + 1)
    )
  );

  if (failed.length) {
    await fs.writeFile(
      path.join(PROJECT_ROOT, 'scripts/failed.json'),
      JSON.stringify(failed, null, 2)
    );
    console.log(`\n⚠️  ${failed.length} 张失败，记录到 scripts/failed.json`);
  } else {
    console.log('\n🎉 全部生成完成！');
  }
}

main().catch((err) => {
  console.error('💥 致命错误：', err);
  process.exit(1);
});
