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

## 第一次安裝：Windows + Claude Desktop

MCP 可以理解成「讓 Claude 使用外部工具的連接方式」。安裝完成後，Claude 便能呼叫本專案搜尋建築法規。以下步驟不需要 TypeScript 或 MCP 開發經驗。

### 步驟 1：安裝必要軟體

請先安裝：

1. [Node.js](https://nodejs.org/) 20 或更新版本。建議下載官網標示為 **LTS** 的版本，安裝時使用預設選項即可。
2. [Claude Desktop](https://claude.ai/download) Windows 版。
3. 將本專案下載或解壓縮到一個固定位置。設定完成後不要任意移動資料夾，否則 Claude 會找不到它。

Node.js 安裝完成後，開啟新的 PowerShell 視窗：

- 在專案資料夾的空白處按住 `Shift` 並按滑鼠右鍵，選擇「在終端機中開啟」；或
- 在 Windows 開始功能表搜尋並開啟「PowerShell」，再用 `cd` 進入專案資料夾。

輸入以下指令確認安裝成功：

```powershell
node --version
npm --version
```

第一行應顯示 `v20` 或更高版本，第二行應顯示 npm 版本號。如果出現「無法辨識」之類的訊息，請重新安裝 Node.js，並關閉後重新開啟 PowerShell。

### 步驟 2：進入專案資料夾

如果 PowerShell 尚未位於本專案資料夾，請輸入 `cd` 加上專案的完整路徑。路徑外加雙引號可以避免中文或空格造成錯誤：

```powershell
cd "C:\您的路徑\Taiwan_Building_Regulation_MCP"
```

輸入以下指令可以確認目前位置：

```powershell
Get-Location
```

接下來的安裝指令都必須在這個資料夾內執行。資料夾中應該看得到 `package.json` 與 `README.md`。

### 步驟 3：安裝套件並編譯

依序執行以下三行。每一行完成後再執行下一行：

```powershell
npm install
npx playwright install chromium
npm run build
```

這三個指令分別會：

1. 安裝本專案需要的程式套件。
2. 安裝查詢解釋函所需的 Chromium 瀏覽器。
3. 將程式編譯到 `dist` 資料夾。

看到警告訊息不一定代表失敗；若最後出現紅色錯誤或指令中止，請先確認網路連線及 Node.js 版本。成功後，專案內應出現 `dist/index.js`。

### 步驟 4：取得專案的完整路徑

在同一個 PowerShell 視窗輸入：

```powershell
(Get-Location).Path
```

複製顯示的結果，稍後需要貼到 Claude 的設定檔。例如：

```text
C:\Users\YourName\Documents\Taiwan_Building_Regulation_MCP
```

### 步驟 5：開啟 Claude Desktop 設定檔

1. 完全關閉 Claude Desktop。
2. 按 `Win + R` 開啟「執行」。
3. 貼上 `%APPDATA%\Claude`，再按 Enter。
4. 找到 `claude_desktop_config.json`，用記事本或程式碼編輯器開啟。
5. 如果沒有這個檔案，請在該資料夾建立同名文字檔，並確認副檔名是 `.json`，不是 `.json.txt`。

將以下內容貼入設定檔，並把兩處 `C:/您的路徑/Taiwan_Building_Regulation_MCP` 都換成步驟 4 取得的路徑。JSON 中建議使用 `/`，例如 `C:/Users/YourName/Documents/...`：

```json
{
  "mcpServers": {
    "taiwan-building-code": {
      "command": "node",
      "args": [
        "C:/您的路徑/Taiwan_Building_Regulation_MCP/dist/index.js"
      ],
      "cwd": "C:/您的路徑/Taiwan_Building_Regulation_MCP"
    }
  }
}
```

請注意：

- `args` 指向編譯完成的 `dist/index.js`。
- `cwd` 指向專案資料夾本身，讓程式能找到 `database` 與 `data`。
- 路徑必須是自己電腦上的實際路徑，不可直接保留「您的路徑」。
- JSON 最後一個項目後面不能多加逗號。
- 如果設定檔原本已有其他 MCP，請保留原有內容，只在既有的 `mcpServers` 裡加入 `taiwan-building-code`，不要建立第二個 `mcpServers`。

### 步驟 6：重新啟動並測試

儲存設定檔後重新開啟 Claude Desktop，建立新對話並輸入：

> 請搜尋建築技術規則中關於「活載重」的規定。

如果 Claude 顯示或要求使用 `search_building_code` 工具，即代表安裝成功。第一次查詢可能會因檢查法規版本而稍久。

### 常見安裝問題

- **找不到 `dist/index.js`**：回到專案資料夾執行 `npm install`，再執行 `npm run build`。
- **`node` 或 `npm` 無法辨識**：重新安裝 Node.js，然後重開 PowerShell 與 Claude Desktop。
- **解釋函搜尋無法啟動瀏覽器**：在專案資料夾重新執行 `npx playwright install chromium`。
- **Claude 沒有出現工具**：確認設定檔是合法 JSON、兩個路徑都正確，再完全結束並重開 Claude Desktop。
- **移動過專案資料夾**：重新修改設定檔中的 `args` 與 `cwd` 路徑。

## 開發與維護指令

一般使用者不需要執行以下指令；這些指令主要供開發或更新資料使用：

```powershell
npm start       # 直接從 src/index.ts 啟動開發版 MCP server
npm run build   # 重新編譯 TypeScript 至 dist/
npm run sync    # 從官方來源同步四編法規並重建 database/
npm test        # 執行專案測試腳本
```

`npm run sync` 與首次缺少本地資料時需要連線至全國法規資料庫；解釋函搜尋需要已安裝的 Chromium。

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
