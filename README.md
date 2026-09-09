# Taiwan Building Code Tracker (台灣建築法規查詢 MCP)

![Version](https://img.shields.io/badge/version-v1.1.0-blue.svg)

基於 MCP 協定的台灣建築法規自動化查詢工具，整合「法規條文」與「解釋函令」，提供最即時、精確且高品質的建築法規情報（目前以《建築技術規則建築構造編》為主）。

---

## 核心特色 (Key Features)
- **法規與函釋雙軌檢索**: 同時支援「全國法規資料庫」條文查詢與「內政部國土管理署」解釋函搜尋。
- **動態網頁自動化技術 (Playwright)**: 
  - 採用 Headless Browser 技術繞過進階 WAF 防護與 Next.js 動態渲染，確保能即時獲取官網最新搜尋結果。
  - **智慧標頭模擬**：自動處理 JavaScript Challenge 與 Cookies，提供穩定的爬取效能。
- **條文結構化解析**: 自動解析條文中的「編」、「章」、「節」與「條號」，並維持條文內容的完整性。
- **高效本地快取機制**: 法規條文內建快取功能，大幅提升查詢速度並減少網路負擔。
- **AI 整合**: 作為 Model Context Protocol (MCP) 伺服器，讓 AI (如 Claude) 能直接理解、分析並引用最新的台灣建築技術規範與實務解釋。

## 技術架構 (Technical Architecture)
- **Runtime**: Node.js (v20+)
- **Protocol**: Model Context Protocol (MCP)
- **Browser Engine**: Playwright (Chromium) - 用於處理動態解釋函網頁。
- **Data Source**: 
  1. **法規條文**：[全國法規資料庫 (law.moj.gov.tw)](https://law.moj.gov.tw/)
  2. **解釋函令**：[內政部國土管理署 (www.nlma.gov.tw)](https://www.nlma.gov.tw/)
- **功能模組**:
  1. **Building Scraper**: 解析條文結構與本地 JSON 快取。
  2. **Interpretation Scraper**: 動態搜尋國土署解釋函清單。
  3. **Detail Crawler**: 深入抓取解釋函內文，供 AI 分析與引用。

## 部署與安裝 (Deployment & Setup)

### 1. 環境準備
- 安裝 [Node.js](https://nodejs.org/) (v20 或以上版本)。
- 確認已安裝 `npm`。

### 2. 下載與編譯 (Build)
```bash
# 進入專案目錄
npm install
npx playwright install chromium
npm run build
```

### 3. 設定 AI 客戶端 (Configure Client)
本服務為本機運行的 MCP Server，請將其加入 AI 客戶端（以 Claude Desktop 為例）。

找到 Claude Desktop 的設定檔 `claude_desktop_config.json`：
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

將以下內容加入 `mcpServers` 區塊（請將路徑修改為您本機的**絕對路徑**）：

```json
{
  "mcpServers": {
    "taiwan-building-code": {
      "command": "node",
      "args": [
        "C:/Users/[您的使用者名稱]/.../Taiwam_building_code_tracker/dist/index.js"
      ]
    }
  }
}
```

## 使用範例 (Usage Examples)
您可以對 AI 說：
- 「搜尋建築技術規則中關於『活載重』的規定。」
- 「幫我查一下『採光』相關的解釋令。」
- 「基礎構造在軟弱地層有什麼特別要求？是否有相關函釋？」
- 「重新更新法規資料 (refresh_data)。」

## 授權與聲明 (License & Disclaimer)

### 免責聲明 (Disclaimer)
1. **僅供參考**：本工具提供之資訊（包含法規條文與解釋函）僅供個人查詢輔助、學術研究或技術展示使用。所有資料內容均應以「全國法規資料庫」及「內政部國土管理署」官方公告為準。
2. **無法律建議**：本工具輸出之內容不構成任何形式的法律、設計或施工建議。使用者在根據本工具提供之資訊做出任何決策（如投標、設計、施工或法律救濟）前，**務必自行核實資料的準確性、時效性與法律效力**，或諮詢專業人士。
3. **無責任擔保**：開發者不對因使用本工具資料而產生的任何直接、間接、附帶或衍生性損失負責。
4. **合法使用義務**：使用者應確保使用本工具之行為符合相關法律規範。本工具模擬瀏覽器查詢行為以落實「政府資訊公開」，嚴禁將其用於任何形式的惡意爬取、拒絕服務攻擊 (DDoS) 或其他干擾政府系統正常運作之行為。

### 資料來源與著作權說明
- **資料來源**：全國法規資料庫、內政部國土管理署。
- **著作權聲明**：依據中華民國《著作權法》第 9 條，法律、命令、公務員於職務上製作之文書（如解釋函）不適用著作權保護，任何人均得自由利用。本工具在引用時將自動標註原始來源與網址。

### 授權條款
- 本專案為私人自用專案，未提供任何開源授權（`UNLICENSED`）。
- 除法律另有規定或第三方資料原有授權外，未經著作權人事前書面允許，不得複製、修改、散布、公開或商業使用本專案程式碼。
- 專案引用的政府法規與政府資料不因本聲明改變其原有法律地位、使用條款或來源標示要求。

## 專案內建 domain / skill 資料庫

執行 `npm run sync` 會從法務部全國法規資料庫重新抓取建築技術規則四編，並重建專案內的資料庫：

- `database/domains/<法規代碼>/<條號>.json`：逐條法規原文、章節、來源網址及抓取時間。
- `database/skills/<法規代碼>/<條號>.json`：逐條查詢能力、觸發詞、domain 關聯及回答規則。
- `database/domains.jsonl`、`database/skills.jsonl`：供 MCP 快速載入的合併索引。
- `database/manifest.json`：資料庫版本、法規代碼及記錄總數。

MCP 查詢會優先讀取專案內建 domain 資料庫；若資料庫尚未建立，才會從官方來源抓取並自動建立。`refresh_data` 會同步更新快取及 domain / skill 資料庫。

每次法規查詢都會先判斷是否已超過檢查期限，預設每 6 小時向官方檢查一次。系統以四編全部正規化條文的 SHA-256 指紋判斷版本；指紋改變時才自動執行資料庫重建。可用環境變數 `LAW_UPDATE_CHECK_INTERVAL_MS` 調整間隔（毫秒），設為 `0` 表示每次查詢皆檢查。官方網站暫時無法連線時，MCP 會保留並繼續使用現有資料庫。
