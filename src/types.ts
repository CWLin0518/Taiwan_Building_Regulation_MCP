export interface Article {
  lawCode: string;
  lawName: string;
  sourceUrl: string;
  chapter: string;
  articleNum: string;
  articleId: string;
  content: string;
}

export interface LawData {
  lawName: string;
  lastUpdated: string;
  articles: Article[];
}

export interface DomainRecord extends Article {
  id: string;
  type: 'domain';
  jurisdiction: 'TW';
  authority: '法務部全國法規資料庫';
  retrievedAt: string;
}

export interface SkillRecord {
  id: string;
  type: 'skill';
  name: string;
  description: string;
  domainIds: string[];
  triggers: string[];
  responsePolicy: {
    quoteExactText: true;
    citeSourceUrl: true;
    warnNotLegalAdvice: true;
  };
}

export interface SearchResult extends Article {
  score: number;
}
