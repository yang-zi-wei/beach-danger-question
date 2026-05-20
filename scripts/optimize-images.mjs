#!/usr/bin/env node
/**
 * 将 public/images/ 下所有 PNG/JPG 转为同名 WebP，体积通常缩小到 1/5 – 1/10。
 * 幂等：已存在且比源文件更新的 .webp 会跳过；--force 可强制重新生成。
 * 用法：
 *   node scripts/optimize-images.mjs          # 增量
 *   node scripts/optimize-images.mjs --force  # 全部重新生成
 *   node scripts/optimize-images.mjs --quality=88
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'public', 'images');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const qArg = args.find((a) => a.startsWith('--quality='));
const QUALITY = qArg ? parseInt(qArg.split('=')[1], 10) : 82;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function isSource(file) {
  return /\.(png|jpe?g)$/i.test(file);
}

async function statSafe(file) {
  try { return await fs.stat(file); } catch { return null; }
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  console.log(`扫描 ${IMG_DIR} (quality=${QUALITY}, force=${FORCE})`);
  let totalIn = 0;
  let totalOut = 0;
  let converted = 0;
  let skipped = 0;

  for await (const file of walk(IMG_DIR)) {
    if (!isSource(file)) continue;
    const webp = file.replace(/\.(png|jpe?g)$/i, '.webp');
    const inStat = await statSafe(file);
    const outStat = await statSafe(webp);
    if (!FORCE && outStat && outStat.mtimeMs >= inStat.mtimeMs) {
      skipped += 1;
      continue;
    }
    try {
      await sharp(file).webp({ quality: QUALITY, effort: 5 }).toFile(webp);
      const newStat = await fs.stat(webp);
      totalIn += inStat.size;
      totalOut += newStat.size;
      converted += 1;
      const saved = ((1 - newStat.size / inStat.size) * 100).toFixed(0);
      const rel = path.relative(ROOT, file);
      console.log(`  ✓ ${rel}  ${fmt(inStat.size)} → ${fmt(newStat.size)}  (-${saved}%)`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  console.log('');
  console.log(`完成：新生成 ${converted} 张，跳过 ${skipped} 张`);
  if (converted > 0) {
    const pct = ((1 - totalOut / totalIn) * 100).toFixed(1);
    console.log(`新生成的：${fmt(totalIn)} → ${fmt(totalOut)}（节省 ${pct}%）`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
