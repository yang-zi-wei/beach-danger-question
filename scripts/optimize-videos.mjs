#!/usr/bin/env node
/**
 * 把 public/images/video/ 下所有 MP4 优化为「移动端 web-friendly」格式：
 *
 *   1. 把 moov 原子搬到文件开头（+faststart）—— 浏览器无需下完整个文件即可起播
 *   2. 用 H.264 + CRF 25 重新编码 —— 同等画质下码率降到原来的 1/3 左右
 *   3. yuv420p 像素格式 —— 兼容 iOS Safari 和老安卓
 *
 * 幂等：原始文件会移动到 public/images/video/_originals/。
 * 如果 _originals/ 里已存在同名文件，认为该视频已优化，直接跳过。
 * 用 --force 可强制重新处理。
 *
 * 用法：
 *   node scripts/optimize-videos.mjs
 *   node scripts/optimize-videos.mjs --force
 *   node scripts/optimize-videos.mjs --crf=28   # 更激进的压缩
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VIDEO_DIR = path.join(ROOT, 'public', 'images', 'video');
const BACKUP_DIR = path.join(VIDEO_DIR, '_originals');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const crfArg = args.find((a) => a.startsWith('--crf='));
const CRF = crfArg ? parseInt(crfArg.split('=')[1], 10) : 25;

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function statSafe(file) {
  try { return await fs.stat(file); } catch { return null; }
}

async function checkFfmpeg() {
  try {
    await exec('ffmpeg', ['-version']);
  } catch {
    console.error('未找到 ffmpeg，请先安装：brew install ffmpeg');
    process.exit(1);
  }
}

// 探测文件前 4KB 内是否已经有 moov 原子（表示已经 faststart 化）。
// 这样在新克隆仓库、_originals 缺失时也能正确跳过已优化的视频。
async function hasFaststart(file) {
  try {
    const fh = await fs.open(file, 'r');
    try {
      const buf = Buffer.alloc(4096);
      const { bytesRead } = await fh.read(buf, 0, 4096, 0);
      return buf.subarray(0, bytesRead).includes(Buffer.from('moov'));
    } finally {
      await fh.close();
    }
  } catch {
    return false;
  }
}

async function processOne(name) {
  const src = path.join(VIDEO_DIR, name);
  const backup = path.join(BACKUP_DIR, name);
  const backupExists = await statSafe(backup);

  if (!FORCE && (backupExists || await hasFaststart(src))) {
    console.log(`  ⏭  ${name}（已优化，跳过）`);
    return null;
  }

  // 1) 备份原文件（首次处理）；FORCE 模式直接从 _originals 重新生成
  let sourceForEncode = src;
  if (!backupExists) {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.copyFile(src, backup);
  } else {
    sourceForEncode = backup; // 重新跑时以原始文件为输入，避免反复有损压缩
  }

  const inStat = await fs.stat(sourceForEncode);
  const tmpOut = `${src}.tmp.mp4`;

  // ffmpeg 参数：
  //   -y                覆盖输出
  //   -i <input>
  //   -c:v libx264 H.264，浏览器全平台支持
  //   -crf 25           质量恒定模式，25 对插画动画基本无可见损失
  //   -preset medium    编码速度/压缩率折中
  //   -pix_fmt yuv420p  iOS Safari / 老安卓兼容
  //   -c:a aac -b:a 96k 音频转 AAC 96k
  //   -movflags +faststart  把 moov 搬到文件开头
  await exec('ffmpeg', [
    '-y',
    '-i', sourceForEncode,
    '-c:v', 'libx264',
    '-crf', String(CRF),
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-movflags', '+faststart',
    tmpOut,
  ]);

  await fs.rename(tmpOut, src);
  const outStat = await fs.stat(src);
  const saved = ((1 - outStat.size / inStat.size) * 100).toFixed(0);
  console.log(`  ✓ ${name}  ${fmt(inStat.size)} → ${fmt(outStat.size)}  (-${saved}%)`);
  return { in: inStat.size, out: outStat.size };
}

async function main() {
  await checkFfmpeg();
  console.log(`扫描 ${VIDEO_DIR}（CRF=${CRF}, force=${FORCE}）`);

  const entries = await fs.readdir(VIDEO_DIR);
  const mp4s = entries.filter((f) => /\.mp4$/i.test(f));
  if (!mp4s.length) {
    console.log('没有找到 .mp4 文件');
    return;
  }

  let totalIn = 0;
  let totalOut = 0;
  let processed = 0;

  for (const name of mp4s) {
    const res = await processOne(name);
    if (res) {
      totalIn += res.in;
      totalOut += res.out;
      processed += 1;
    }
  }

  console.log('');
  if (processed > 0) {
    const pct = ((1 - totalOut / totalIn) * 100).toFixed(1);
    console.log(`处理 ${processed} 个：${fmt(totalIn)} → ${fmt(totalOut)}（节省 ${pct}%）`);
    console.log(`原始文件已备份到 ${path.relative(ROOT, BACKUP_DIR)}/`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
