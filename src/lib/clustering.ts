import prisma from "@/lib/prisma";

/**
 * 제목 기반 Jaccard 유사도로 기사 클러스터링
 * 같은 뉴스를 여러 매체가 보도한 경우 그룹핑
 */

function tokenize(text: string): Set<string> {
  // 한글 2글자 이상, 영문 3글자 이상 토큰
  const tokens = text
    .toLowerCase()
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((t) => (t.match(/[가-힣]/) ? t.length >= 2 : t.length >= 3));
  return new Set(tokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function clusterArticles(
  options: { sectorId?: string; hoursBack?: number; threshold?: number } = {}
): Promise<{ clustersFormed: number; articlesUpdated: number }> {
  const { sectorId, hoursBack = 12, threshold = 0.4 } = options;

  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      collectedAt: { gt: since },
      clusterId: null,
      ...(sectorId && { sectorId }),
    },
    select: { id: true, title: true, sectorId: true },
    orderBy: { collectedAt: "desc" },
    take: 200,
  });

  if (articles.length < 2) {
    return { clustersFormed: 0, articlesUpdated: 0 };
  }

  // 토큰화
  const tokenized = articles.map((a) => ({
    ...a,
    tokens: tokenize(a.title),
  }));

  // Union-Find로 클러스터링
  const parent = new Map<string, string>();
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  }
  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // 같은 섹터 내에서만 비교
  for (let i = 0; i < tokenized.length; i++) {
    for (let j = i + 1; j < tokenized.length; j++) {
      if (tokenized[i].sectorId !== tokenized[j].sectorId) continue;
      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= threshold) {
        union(tokenized[i].id, tokenized[j].id);
      }
    }
  }

  // 클러스터별 그룹핑
  const clusters = new Map<string, string[]>();
  for (const a of articles) {
    const root = find(a.id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(a.id);
  }

  // 2개 이상 그룹만 저장
  let clustersFormed = 0;
  let articlesUpdated = 0;

  const entries = Array.from(clusters.entries());
  for (const [root, ids] of entries) {
    if (ids.length < 2) continue;
    const clusterId = `cl_${root.slice(0, 12)}`;

    for (const id of ids) {
      await prisma.article.update({
        where: { id },
        data: { clusterId },
      });
      articlesUpdated++;
    }
    clustersFormed++;
  }

  console.log(
    `[Cluster] ${clustersFormed}개 클러스터, ${articlesUpdated}건 업데이트`
  );
  return { clustersFormed, articlesUpdated };
}
