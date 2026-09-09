import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { DomainRecord, LawData, SkillRecord } from './types.js';

export const DATABASE_ROOT = path.join(process.cwd(), 'database');

export interface DatabaseManifest {
  schemaVersion: number;
  source: string;
  generatedAt: string;
  lastCheckedAt: string;
  contentHash: string;
  lawCodes: string[];
  domainCount: number;
  skillCount: number;
}

export async function writeKnowledgeDatabase(data: LawData): Promise<void> {
  const domainsRoot = path.join(DATABASE_ROOT, 'domains');
  const skillsRoot = path.join(DATABASE_ROOT, 'skills');
  await fs.rm(domainsRoot, { recursive: true, force: true });
  await fs.rm(skillsRoot, { recursive: true, force: true });

  const domainRecords: DomainRecord[] = [];
  const skillRecords: SkillRecord[] = [];

  for (const article of data.articles) {
    const id = `${article.lawCode}:${article.articleId}`;
    const domain: DomainRecord = {
      ...article,
      id,
      type: 'domain',
      jurisdiction: 'TW',
      authority: '法務部全國法規資料庫',
      retrievedAt: data.lastUpdated,
    };
    const skill: SkillRecord = {
      id: `skill:${id}`,
      type: 'skill',
      name: `${article.lawName}${article.articleNum}`,
      description: `回答與${article.lawName}${article.articleNum}相關問題時，檢索並引用對應 domain 原文。`,
      domainIds: [id],
      triggers: [article.lawName, article.articleNum, article.chapter].filter(Boolean),
      responsePolicy: {
        quoteExactText: true,
        citeSourceUrl: true,
        warnNotLegalAdvice: true,
      },
    };
    domainRecords.push(domain);
    skillRecords.push(skill);

    const relative = path.join(article.lawCode, `${article.articleId}.json`);
    await writeJson(path.join(domainsRoot, relative), domain);
    await writeJson(path.join(skillsRoot, relative), skill);
  }

  await writeJson(path.join(DATABASE_ROOT, 'manifest.json'), {
    schemaVersion: 1,
    source: '法務部全國法規資料庫',
    generatedAt: data.lastUpdated,
    lastCheckedAt: data.lastUpdated,
    contentHash: computeContentHash(data),
    lawCodes: [...new Set(data.articles.map((article) => article.lawCode))],
    domainCount: domainRecords.length,
    skillCount: skillRecords.length,
  });
  await fs.writeFile(path.join(DATABASE_ROOT, 'domains.jsonl'), toJsonLines(domainRecords), 'utf8');
  await fs.writeFile(path.join(DATABASE_ROOT, 'skills.jsonl'), toJsonLines(skillRecords), 'utf8');
}

export function computeContentHash(data: LawData): string {
  const canonical = data.articles
    .map(({ lawCode, articleId, chapter, articleNum, content }) => ({
      lawCode,
      articleId,
      chapter,
      articleNum,
      content,
    }))
    .sort((a, b) => `${a.lawCode}:${a.articleId}`.localeCompare(`${b.lawCode}:${b.articleId}`));
  return createHash('sha256').update(JSON.stringify(canonical), 'utf8').digest('hex');
}

export async function readManifest(): Promise<DatabaseManifest> {
  return JSON.parse(await fs.readFile(path.join(DATABASE_ROOT, 'manifest.json'), 'utf8')) as DatabaseManifest;
}

export async function markDatabaseChecked(checkedAt: string): Promise<void> {
  const manifest = await readManifest();
  manifest.lastCheckedAt = checkedAt;
  await writeJson(path.join(DATABASE_ROOT, 'manifest.json'), manifest);
}

export async function readDomainDatabase(): Promise<DomainRecord[]> {
  const content = await fs.readFile(path.join(DATABASE_ROOT, 'domains.jsonl'), 'utf8');
  return content.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as DomainRecord);
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function toJsonLines(values: unknown[]): string {
  return `${values.map((value) => JSON.stringify(value)).join('\n')}\n`;
}
