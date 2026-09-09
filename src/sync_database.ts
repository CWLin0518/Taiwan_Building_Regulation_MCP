import { writeKnowledgeDatabase } from './database.js';
import { fetchLawData } from './scraper.js';

async function main(): Promise<void> {
  const data = await fetchLawData(true);
  await writeKnowledgeDatabase(data);
  console.log(`已同步 ${data.articles.length} 條法規至專案 database/domains 與 database/skills。`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
