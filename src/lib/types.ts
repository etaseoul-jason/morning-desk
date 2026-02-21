export type SectorWithCounts = {
  id: string;
  label: string;
  summary: string | null;
  since: string;
  deptTags: string[];
  searchQueriesKR: string[];
  searchQueriesUS: string[];
  classifyKeywords: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    articles: number;
    briefings: number;
  };
};
