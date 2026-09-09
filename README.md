# Taiwan Building Code Tracker（台灣建築法規查詢 MCP）

以 Model Context Protocol（MCP）提供台灣建築法規檢索的本機伺服器。目前收錄《建築技術規則》四編共 1,182 條資料，並可即時搜尋內政部國土管理署的解釋函令。

> 本專案以 stdio 模式運作，供 Claude Desktop 等支援 MCP 的 AI 客戶端呼叫；不是網站或 HTTP API。

## 目前功能

- 檢索《建築技術規則》四編：
  - 總則編（`D0070114`）
  - 建築設計施工編（`D0070115`）
  - 建築構造編（`D0070116`）
  - 建築設備編（`D0070117`）
- 依條號、章節名稱及條文內容進行關鍵字排序搜尋。
- 使用 Playwright（Chromium）即時搜尋內政部國土管理署解釋函令，回傳日期、函號、摘要與官方網址。
- 將法規保存為專案內建的 domain / skill 知識資料庫，啟動時不需先連線下載全部資料。
- 每次法規查詢前依檢查週期確認官方版本；只有條文內容雜湊改變時才重建資料庫。
- 提供案例分析及解釋函追蹤兩組 MCP prompts。

## MCP 能力

### Tools

| Tool | 用途 | 主要參數 |
| --- | --- | --- |
| `search_building_code` | 搜尋四編法規條文 | `query`：繁體中文關鍵字；`limit`：1–50，預設 10 |
| `search_building_interpretations` | 搜尋國土署解釋函令 | `query`：繁體中文關鍵字；`limit`：1–20，預設 5 |
| `refresh_data` | 立即檢查官方條文版本；有變更時更新快取與資料庫 | 無 |

### Prompts

- `analyze-building-case`：先查法規、再查函釋，整理案例適法性與引用來源。
- `track-interpretations`：針對指定議題整理解釋函及官方見解變化。

## 技術組成

- Node.js 20+
- TypeScript（ES2022 / NodeNext）
- `@modelcontextprotocol/sdk`
- Axios + Cheerio：抓取及解析全國法規資料庫
- Playwright + Chromium：查詢國土管理署動態網頁
- Zod：MCP 工具參數驗證

官方資料來源：

1. [法務部全國法規資料庫](https://law.moj.gov.tw/)
2. [內政部國土管理署](https://www.nlma.gov.tw/)

## 安裝與建置

需求：Node.js 20 或以上版本及 npm。

```bash
npm install
npx playwright install chromium
npm run build
```

可用指令：

```bash
npm start       # 以 tsx 從 src/index.ts 啟動開發版 MCP server
npm run build   # 編譯 TypeScript 至 dist/
npm run sync    # 從官方來源同步四編法規並重建 database/
npm test        # 執行專案測試腳本
```

`npm run sync` 與首次缺少本地資料時都需要連線至全國法規資料庫；解釋函搜尋另需已安裝的 Chromium。

## 設定 MCP 客戶端

以下以 Claude Desktop 為例。Windows 設定檔通常位於 `%APPDATA%\Claude\claude_desktop_config.json`。將專案路徑換成實際的絕對路徑，並保留 `cwd`，讓程式能正確找到 `database/` 與 `data/`：

```json
{
  "mcpServers": {
    "taiwan-building-code": {
      "command": "node",
      "args": [
        "C:/absolute/path/to/Taiwan_Building_Regulation_MCP/dist/index.js"
      ],
      "cwd": "C:/absolute/path/to/Taiwan_Building_Regulation_MCP"
    }
  }
}
```

完成設定後重新啟動 MCP 客戶端。若尚未執行 `npm run build`，`dist/index.js` 將不存在。

## 使用範例

- 「搜尋建築技術規則中關於避難層出入口的規定。」
- 「建築構造編對軟弱地層的基礎構造有哪些要求？」
- 「查詢採光相關的解釋函，並附上官方連結。」
- 「用 analyze-building-case 分析頂樓加蓋的適法性。」
- 「執行 refresh_data 檢查法規是否更新。」

搜尋時建議使用 1–3 個繁體中文核心名詞，例如 `活載重`、`防火區劃`、`昇降設備`；多個詞以空白分隔。

## 資料庫與更新機制

專案已內建下列資料：

- `database/domains/<法規代碼>/<條文>.json`：逐條法規原文、章節、來源網址及擷取時間。
- `database/skills/<法規代碼>/<條文>.json`：逐條查詢觸發詞、domain 關聯及回答規則。
- `database/domains.jsonl`、`database/skills.jsonl`：供 MCP 快速載入的合併索引。
- `database/manifest.json`：資料庫版本、法規代碼、內容雜湊、檢查時間及記錄數。
- `data/law_cache.json`：同步時產生的本機快取，未納入版本控制。

法規查詢會優先讀取 `database/`。預設每 6 小時向官方檢查一次四編條文，並以正規化內容的 SHA-256 雜湊判斷是否需要重建。官方網站暫時無法連線時，伺服器會保留並繼續使用現有資料庫。

可使用環境變數調整檢查間隔：

```text
LAW_UPDATE_CHECK_INTERVAL_MS=21600000
```

單位為毫秒；設為 `0` 表示每次查詢都檢查。也可呼叫 `refresh_data` 略過間隔限制並立即檢查。

## 專案結構

```text
src/
  index.ts                   MCP server、tools 與 prompts
  scraper.ts                 四編法規抓取與本機快取
  interpretation_scraper.ts  國土署解釋函搜尋
  search.ts                  法規關鍵字排序搜尋
  database.ts                domain / skill 資料庫讀寫
  updater.ts                 官方版本檢查與自動更新
  sync_database.ts           手動同步入口
  test.ts                    測試腳本
database/                    版本控制內的法規知識資料庫
data/                        本機快取目錄
dist/                        TypeScript 編譯輸出
```

## 授權與免責聲明

本專案為私人自用專案，未提供開源授權（`UNLICENSED`）。除法律另有規定或第三方資料原有授權外，未經著作權人事前書面允許，不得複製、修改、散布、公開或商業使用本專案程式碼。

本工具提供的法規及解釋函資訊僅供查詢輔助、研究與技術展示，不構成法律、設計或施工建議。法規內容、時效及法律效力均應以法務部全國法規資料庫與內政部國土管理署的官方公告為準；進行投標、設計、施工或法律救濟等決策前，請自行核實或諮詢專業人士。開發者不對使用本工具所造成的直接或間接損失負責。

使用者應遵守相關法律與官方網站使用規範，不得將本工具用於惡意大量擷取、阻斷服務或其他干擾政府系統運作的行為。政府法規及公務文書的法律地位、利用條件與來源標示要求，不因本專案授權聲明而改變。
