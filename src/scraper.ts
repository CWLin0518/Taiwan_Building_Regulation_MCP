import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { LawData, Article } from './types.js';

export const BUILDING_REGULATIONS = [
  { lawCode: 'D0070114', expectedName: '建築技術規則總則編' },
  { lawCode: 'D0070115', expectedName: '建築技術規則建築設計施工編' },
  { lawCode: 'D0070116', expectedName: '建築技術規則建築構造編' },
  { lawCode: 'D0070117', expectedName: '建築技術規則建築設備編' },
] as const;
const CACHE_FILE = path.join(process.cwd(), 'data', 'law_cache.json');

export async function fetchLawData(forceRefresh = false): Promise<LawData> {
  if (!forceRefresh) {
    try {
      const cacheExists = await fs.access(CACHE_FILE).then(() => true).catch(() => false);
      if (cacheExists) {
        const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(cacheContent);
      }
    } catch (error) {
      // If error or no cache, proceed to fetch
    }
  }

  const articles: Article[] = [];
  const lawNames: string[] = [];

  for (const regulation of BUILDING_REGULATIONS) {
    const sourceUrl = `https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${regulation.lawCode}`;
    const law = await fetchSingleLaw(regulation.lawCode, sourceUrl);
    lawNames.push(law.lawName);
    articles.push(...law.articles);
  }

  if (articles.length === 0) {
    throw new Error('法務部頁面未解析出任何建築技術規則條文');
  }

  const lawData: LawData = {
    lawName: lawNames.join('、'),
    lastUpdated: new Date().toISOString(),
    articles,
  };

  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(lawData, null, 2), 'utf-8');
  return lawData;
}

async function fetchSingleLaw(lawCode: string, sourceUrl: string): Promise<LawData> {
  const { data } = await axios.get(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    responseType: 'text'
  });

  const $ = cheerio.load(data);
  
  // Try to get law name from multiple possible locations
  const lawName = $('#ctl00_cpHolder_lblLawName').text().trim() || 
                 $('.text-con h1').text().trim() || 
                 $('title').text().split('-')[0].trim();

  const articles: Article[] = [];
  let currentChapter = '';

  const container = $('.law-reg-content');
  const children = container.children();

  children.each((_, el) => {
    const $el = $(el);
    if ($el.hasClass('row')) {
      // Exclude sr-only text from col-no
      const $colNo = $el.find('.col-no');
      $colNo.find('.sr-only').remove();
      const colNo = $colNo.text().trim();
      
      const colData = $el.find('.col-data').text().trim().replace(/\s+/g, ' ');

      if (colNo) {
        // Clean up article number
        const cleanArticleNum = colNo.replace(/\s+/g, '').trim();
        articles.push({
          lawCode,
          lawName,
          sourceUrl,
          chapter: currentChapter,
          articleNum: cleanArticleNum,
          articleId: normalizeArticleId(cleanArticleNum),
          content: colData
        });
      } else if (colData && (colData.includes('第') && (colData.includes('章') || colData.includes('編') || colData.includes('節')))) {
        currentChapter = colData;
      }
    } else {
      // Non-row children might be chapter titles
      const text = $el.text().trim().replace(/\s+/g, ' ');
      if (text && text.length < 100 && (text.includes('第') && (text.includes('章') || text.includes('編') || text.includes('節')))) {
        currentChapter = text;
      }
    }
  });

  return {
    lawName,
    lastUpdated: new Date().toISOString(),
    articles
  };
}

function normalizeArticleId(articleNum: string): string {
  const match = articleNum.match(/第\s*(\d+)(?:\s*之\s*(\d+))?\s*條/);
  return match ? `article-${match[1]}${match[2] ? `-${match[2]}` : ''}` : articleNum.replace(/\s+/g, '-');
}
