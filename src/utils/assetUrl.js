/**
 * 统一的静态资源 URL 解析器。
 *
 * - 自动拼上 Vite 的 BASE_URL（适配 GitHub Pages 子路径部署）
 * - 自动把 .png / .jpg / .jpeg 替换为同名 .webp（由 scripts/optimize-images.mjs 预先生成）
 * - characters / icons / props / scenes 这四类图片走火山 TOS CDN（国内访问快）
 *   注意 CDN 上文件位于根目录，没有 images/ 前缀：
 *     本地 images/scenes/wave_reef.png → https://<cdn>/scenes/wave_reef.webp
 * - .mp4 / .webm / .webp 等其它后缀原样返回
 * - 空值 / null / undefined 返回 ''
 * - 已经是绝对 URL（http(s):// 或 data:）原样返回，不做任何处理
 */
const IMAGE_CDN = 'https://beach-danger-question-guangzhou.tos-cn-guangzhou.volces.com';
const CDN_FOLDERS = ['characters', 'icons', 'props', 'scenes'];
const CDN_REGEX = new RegExp(`^images/(${CDN_FOLDERS.join('|')})/`);

export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:)/i.test(path)) return path;
  const clean = String(path).replace(/^\//, '');
  const webp = clean.replace(/\.(png|jpe?g)$/i, '.webp');
  if (CDN_REGEX.test(webp)) {
    return `${IMAGE_CDN}/${webp.replace(/^images\//, '')}`;
  }
  const base = import.meta.env.BASE_URL;
  return `${base}${webp}`;
}
