import { computeContentHash, markDatabaseChecked, readManifest, writeKnowledgeDatabase } from './database.js';
import { fetchLawData } from './scraper.js';
import { LawData } from './types.js';

const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let activeCheck: Promise<UpdateResult> | null = null;

export interface UpdateResult {
  checked: boolean;
  updated: boolean;
  data?: LawData;
}

export async function ensureDatabaseCurrent(force = false): Promise<UpdateResult> {
  if (activeCheck) return activeCheck;
  activeCheck = checkForUpdates(force).finally(() => {
    activeCheck = null;
  });
  return activeCheck;
}

async function checkForUpdates(force: boolean): Promise<UpdateResult> {
  let manifest;
  try {
    manifest = await readManifest();
  } catch {
    manifest = null;
  }

  if (!force && manifest?.lastCheckedAt) {
    const elapsed = Date.now() - Date.parse(manifest.lastCheckedAt);
    if (Number.isFinite(elapsed) && elapsed < getCheckIntervalMs()) {
      return { checked: false, updated: false };
    }
  }

  let remoteData: LawData;
  try {
    remoteData = await fetchLawData(true);
  } catch (error) {
    if (!manifest) throw error;
    console.error(`[law-update] 無法連線檢查更新，繼續使用現有資料庫：${error instanceof Error ? error.message : String(error)}`);
    return { checked: false, updated: false };
  }
  const remoteHash = computeContentHash(remoteData);
  const updated = !manifest || manifest.contentHash !== remoteHash;

  if (updated) {
    await writeKnowledgeDatabase(remoteData);
    console.error(`[law-update] 偵測到法規版本變更，已更新 ${remoteData.articles.length} 條 domain/skill。`);
    return { checked: true, updated: true, data: remoteData };
  }

  await markDatabaseChecked(remoteData.lastUpdated);
  console.error('[law-update] 已檢查法務部資料，版本無變更。');
  return { checked: true, updated: false, data: remoteData };
}

function getCheckIntervalMs(): number {
  const configured = Number(process.env.LAW_UPDATE_CHECK_INTERVAL_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_CHECK_INTERVAL_MS;
}
