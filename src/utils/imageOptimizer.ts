/**
 * NovelForge AI — 图像本地存储与内存优化工具 (imageOptimizer)
 * 解决问题：
 * 创作者常直接上传数 MB 乃至数十 MB 的 4K 原画或相机照片作为角色头像/立绘/封面。
 * 若未经压缩直接存储为 Base64，会导致 SQLite 数据库单个字段暴涨数 MB，
 * 在列表查询（如 list_characters, list_novels）时引起巨大 IPC 传输与内存占用。
 * 
 * 本模块在浏览器本地端使用 Canvas 进行智能等比缩放与高保真压缩（默认最大 1024px，画质 0.88），
 * 将图片体积从数 MB 骤降至 100~200 KB，彻底消除内存与性能边界瓶颈，并保留透明显色能力。
 */

export interface OptimizeImageOptions {
  maxDimension?: number;
  quality?: number;
  maxFileSizeBytes?: number;
}

const DEFAULT_MAX_DIMENSION = 1024;
const DEFAULT_QUALITY = 0.88;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB 物理上限防御

export async function optimizeImageFileToDataUrl(
  file: File,
  options?: OptimizeImageOptions
): Promise<string> {
  const maxDim = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options?.quality ?? DEFAULT_QUALITY;
  const maxBytes = options?.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;

  if (file.size > maxBytes) {
    throw new Error(`图片文件过大 (${(file.size / (1024 * 1024)).toFixed(1)}MB)，请选择 ${Math.round(maxBytes / (1024 * 1024))}MB 以内的图片`);
  }

  // 若非图片类型，直接拒绝
  if (!file.type.startsWith('image/')) {
    throw new Error('所选文件不是有效的图片格式');
  }

  // SVG 矢量图直接作为 text/data-url 处理，无须经过 canvas 像素化
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('读取 SVG 图像失败'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const { width, height } = img;

        // 若尺寸已在上限内且体积较小 (< 250KB)，直接转为 DataURL
        if (width <= maxDim && height <= maxDim && file.size < 250 * 1024) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(canvasToDataUrl(img, width, height, file.type, quality));
          reader.readAsDataURL(file);
          return;
        }

        // 计算等比缩放新尺寸
        let targetWidth = width;
        let targetHeight = height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            targetWidth = maxDim;
            targetHeight = Math.round((height * maxDim) / width);
          } else {
            targetHeight = maxDim;
            targetWidth = Math.round((width * maxDim) / height);
          }
        }

        const resultUrl = canvasToDataUrl(img, targetWidth, targetHeight, file.type, quality);
        resolve(resultUrl);
      } catch (err) {
        // 降级回退
        const fallbackReader = new FileReader();
        fallbackReader.onload = () => resolve(fallbackReader.result as string);
        fallbackReader.onerror = () => reject(err);
        fallbackReader.readAsDataURL(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片解析失败，可能文件已损坏'));
    };

    img.src = objectUrl;
  });
}

function canvasToDataUrl(
  img: HTMLImageElement,
  width: number,
  height: number,
  originalMime: string,
  quality: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('创建 Canvas 2D 绘图上下文失败');
  }

  // 保证高质量图片平滑抗锯齿
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);

  // 若原图是 PNG 且可能包含透明通道，优先保留 PNG，或以 0.88 导出 WebP/JPEG
  const exportMime = originalMime === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(exportMime, quality);
}
