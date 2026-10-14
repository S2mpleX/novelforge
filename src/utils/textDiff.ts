export type DiffType = 'EQUAL' | 'REMOVED' | 'ADDED';

export interface DiffChunk {
  type: DiffType;
  text: string;
}

/**
 * 经典 Myers / 动态规划字符级 Diff 算法
 * 专门针对中文字符、词语与标点优化
 */
export function computeTextDiff(original: string, revised: string): DiffChunk[] {
  if (original === revised) {
    return [{ type: 'EQUAL', text: original }];
  }
  if (!original) {
    return [{ type: 'ADDED', text: revised }];
  }
  if (!revised) {
    return [{ type: 'REMOVED', text: original }];
  }

  // 将文本分割为字符或标点单元（中文按字切分，英文按单词切分）
  const tokenize = (text: string): string[] => {
    // 匹配单个中文字符、连贯英文单词、标点或空白
    return text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_]+|[^\u4e00-\u9fa5a-zA-Z0-9_\s]|\s+/g) || text.split('');
  };

  const aTokens = tokenize(original);
  const bTokens = tokenize(revised);
  const n = aTokens.length;
  const m = bTokens.length;

  // 使用动态规划求 LCS（对于千字以内的段落性能极佳，耗时 < 5ms）
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (aTokens[i - 1] === bTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯构建 Diff
  const rawChunks: DiffChunk[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aTokens[i - 1] === bTokens[j - 1]) {
      rawChunks.push({ type: 'EQUAL', text: aTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawChunks.push({ type: 'ADDED', text: bTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawChunks.push({ type: 'REMOVED', text: aTokens[i - 1] });
      i--;
    }
  }

  rawChunks.reverse();

  // 合并相同类型的连续文本块
  const mergedChunks: DiffChunk[] = [];
  for (const chunk of rawChunks) {
    const last = mergedChunks[mergedChunks.length - 1];
    if (last && last.type === chunk.type) {
      last.text += chunk.text;
    } else {
      mergedChunks.push({ ...chunk });
    }
  }

  return mergedChunks;
}
