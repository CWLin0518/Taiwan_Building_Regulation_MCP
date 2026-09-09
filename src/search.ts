import { Article, SearchResult } from './types.js';

export function searchLaw(articles: Article[], query: string, limit: number = 10): SearchResult[] {
  // Normalize query: split by spaces and remove empty strings
  const keywords = query.trim().split(/\s+/).filter(k => k.length > 0);
  
  if (keywords.length === 0) return [];

  const results: SearchResult[] = articles.map(article => {
    let score = 0;
    let matchesAllKeywords = true;

    for (const kw of keywords) {
      let kwScore = 0;
      const lowerKw = kw.toLowerCase();

      // Check article number (High weight)
      if (article.articleNum.includes(kw)) {
        kwScore += 20;
      }

      // Check chapter title (Medium weight)
      if (article.chapter.includes(kw)) {
        kwScore += 10;
      }

      // Check article content (Base weight: 1 per occurrence)
      // Count occurrences of kw in article.content
      const content = article.content;
      let pos = content.indexOf(kw);
      let count = 0;
      while (pos !== -1) {
        count++;
        pos = content.indexOf(kw, pos + 1);
      }
      kwScore += count;

      if (kwScore === 0) {
        matchesAllKeywords = false;
      }
      
      score += kwScore;
    }

    // Bonus for matching all keywords
    if (matchesAllKeywords && keywords.length > 1) {
      score *= 1.5;
    }

    return { ...article, score };
  });

  // Filter out zero-score results, sort by score desc, and limit
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
