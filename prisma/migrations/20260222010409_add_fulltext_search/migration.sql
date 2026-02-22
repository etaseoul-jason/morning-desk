-- 전문검색용 tsvector 칼럼 (title + summary 결합)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS
    search_vec TSVECTOR GENERATED ALWAYS AS (
        TO_TSVECTOR('simple', COALESCE(title, '') || ' ' || COALESCE(summary, ''))
    ) STORED;

-- GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_vec);

-- 브리핑 전문검색용
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS
    search_vec TSVECTOR GENERATED ALWAYS AS (
        TO_TSVECTOR('simple', COALESCE(headline, '') || ' ' || COALESCE(summary, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_briefings_search ON briefings USING GIN(search_vec);
