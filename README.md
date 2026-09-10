# 台灣建築法規查詢工具

- [開始使用](#開始使用)
- [安裝教學](#快速安裝)
- [開發維護](#開發與維護)
- [授權](#授權)

可直接用中文查詢《建築技術規則》及國土管理署解釋函令的 AI 工具，協助尋找條文、函號、摘要與官方來源。

> 本工具適合快速找資料、確認檢索方向及整理初步依據，不能取代建築師、專業技師或法律專業人員的判斷。

## 可以查什麼？

- 《建築技術規則》總則編、設計施工編、構造編及設備編
- 國土管理署解釋函令
- 個案可能涉及的條文與函釋資料

## 開始使用

完成安裝後，即可在 AI 軟體中直接詢問，例如「請搜尋建築技術規則中關於活載重的規定，列出條號及條文重點」、「請查詢採光相關的解釋函，列出發文日期、函號、摘要及官方連結」，或「請分析頂樓加蓋可能涉及的條文與函釋，分成法規依據、函釋資料及待確認事項」。提問時請使用 1～3 個核心名詞並交代希望的整理方式；找不到結果時，可改用法規正式用語或近義詞分項搜尋。正式工作建議要求 AI 列出條號、函號及官方來源連結，無法確認時不要自行推測。查詢結果僅是初步檢索資料，仍須核對條文版本、適用範圍、函釋背景及其他相關法規，重要決策應由負責建築師或相關專業人員複核。AI 若使用 `search_building_code` 並回傳結果，即代表工具已正常啟動。

## 資料來源

1. [法務部全國法規資料庫](https://law.moj.gov.tw/)
2. [內政部國土管理署](https://www.nlma.gov.tw/)

工具內建《建築技術規則》四編資料，並可連線搜尋國土管理署的解釋函令。若官方網站暫時無法連線，既有法規資料仍可使用，但即時函釋搜尋或版本檢查可能受到影響。

## 一般使用問題

### AI 沒有使用法規工具

開啟新對話並明確輸入：「請使用台灣建築法規查詢工具，搜尋防火區劃相關條文。」若仍未出現工具，請檢查 MCP 設定。

### 搜尋不到想要的條文

縮短問題，只保留核心名詞；也可以改用法規正式用語或近義詞分別搜尋。

### 解釋函搜尋失敗

可能是官方網站、網路連線或工具使用的瀏覽器元件暫時異常。法規條文搜尋通常仍可使用，可依錯誤訊息進行排除。

### 結果不完整或不合理

要求 AI 顯示完整條文、條號、函號及官方連結後自行複查，不要直接依摘要做重要決策。

## 使用限制與免責聲明

本工具提供的法規及解釋函資訊僅供查詢輔助、研究與技術展示，不構成法律、設計、簽證或施工建議。法規內容、時效及法律效力均應以官方最新公告為準。

進行投標、設計、請照、簽證、施工或法律救濟等決策前，應由負責建築師、專業技師、主管機關或法律專業人員確認。開發者不對使用本工具所造成的直接或間接損失負責。

使用時應遵守相關法律及官方網站規範，不得以本工具惡意大量擷取或干擾政府系統運作。

---

# 安裝與技術說明

## 快速安裝

需求：Windows 10／11、[Node.js 20+](https://nodejs.org/)、[Git](https://git-scm.com/download/win)，以及支援本機 stdio MCP 的 AI 客戶端。

在 PowerShell 執行：

```powershell
git clone https://github.com/CWLin0518/Taiwan_Building_Regulation_MCP.git
cd "Taiwan_Building_Regulation_MCP"
npm install
npx playwright install chromium
npm run build
```

完成後，在 AI 客戶端加入以下設定，並將路徑換成實際的 `dist/index.js` 完整路徑：

```json
{
  "mcpServers": {
    "taiwan-building-code": {
      "command": "node",
      "args": [
        "C:/您的路徑/Taiwan_Building_Regulation_MCP/dist/index.js"
      ]
    }
  }
}
```

Claude Desktop 的設定檔位於 `%APPDATA%\Claude\claude_desktop_config.json`；Cursor 可在 Settings 的 MCP 頁面新增。部分 VS Code 客戶端使用 `servers` 取代 `mcpServers`，並需加上 `"type": "stdio"`。

儲存後重啟 AI 客戶端，輸入以下內容測試：

> 請搜尋建築技術規則中關於活載重的規定。

AI 若呼叫 `search_building_code` 並回傳結果，即安裝完成。

## MCP 功能

| Tool | 用途 | 主要參數 |
| --- | --- | --- |
| `search_building_code` | 搜尋四編法規條文 | `query`：繁中關鍵字；`limit`：1～50，預設 10 |
| `search_building_interpretations` | 搜尋國土署解釋函令 | `query`：繁中關鍵字；`limit`：1～20，預設 5 |
| `refresh_data` | 立即檢查官方條文，有變更時更新資料庫 | 無 |

另提供 `analyze-building-case`（案例分析）及 `track-interpretations`（函釋追蹤）兩組 prompts。

## 更新專案

先關閉使用本 MCP 的 AI 客戶端，再於專案資料夾執行：

```powershell
git pull
npm install
npm run build
```

若 Playwright 版本有變動，或解釋函搜尋無法啟動瀏覽器，再執行 `npx playwright install chromium`。若 `git pull` 提示本機有未提交修改，請先提交或備份，不要直接覆蓋。

## 技術疑難排解

- **找不到 `dist/index.js`**：執行 `npm install` 及 `npm run build`。
- **`node` 或 `npm` 無法辨識**：重新安裝 Node.js，並重新開啟 PowerShell 及 AI 客戶端。
- **解釋函搜尋無法啟動瀏覽器**：執行 `npx playwright install chromium`。
- **AI 沒有顯示工具**：確認客戶端支援 stdio MCP、JSON 正確、`args` 路徑正確，然後完全重啟。
- **專案資料夾曾移動**：修改 MCP 設定中的 `args` 路徑。

## 開發與維護

```powershell
npm start       # 啟動開發版 MCP server
npm run build   # 將 TypeScript 編譯至 dist/
npm run sync    # 同步四編法規並重建 database/
npm test        # 執行測試腳本
```

技術組成為 Node.js 20+、TypeScript、`@modelcontextprotocol/sdk`、Axios、Cheerio、Playwright、Chromium 與 Zod。

法規查詢優先讀取 `database/`。預設每 6 小時向官方檢查一次條文，並以 SHA-256 雜湊判斷是否重建。官方網站無法連線時會繼續使用既有資料。可用下列環境變數調整檢查間隔（毫秒）；設為 `0` 代表每次查詢都檢查：

```text
LAW_UPDATE_CHECK_INTERVAL_MS=21600000
```

主要目錄：

```text
src/       MCP server、搜尋、擷取、更新與測試原始碼
database/  版本控制內的法規知識資料庫
data/      本機快取
dist/      TypeScript 編譯輸出
```

## 授權

本專案為私人自用專案，未提供開源授權（`UNLICENSED`）。除法律另有規定或第三方資料原有授權外，未經著作權人事前書面允許，不得複製、修改、散布、公開或商業使用本專案程式碼。

政府法規及公務文書的法律地位、利用條件與來源標示要求，不因本專案授權聲明而改變。
