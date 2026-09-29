# 林玄棣｜五款個人網站提案

這是一個獨立製作的靜態網站，沒有使用參考網站的程式碼、圖片或文字。五款版型共用同一份個人資料，使用原生 HTML、CSS、JavaScript，沒有建置套件需求。

## 預覽

直接開啟 `index.html` 可瀏覽五款方案。若瀏覽器限制本機 iframe，請在本資料夾執行：

```bash
python -m http.server 8765
```

再開啟 `http://localhost:8765/`。點選「放大預覽」可切換桌機與手機畫面；點選「開啟完整頁面」可瀏覽完整網站。網址 `site.html?theme=minimal`、`lab`、`editorial`、`dashboard`、`timeline` 分別對應五款。

## 修改內容

- `content.js`：姓名、簡介、經歷、工具與聯絡連結。五款會同步更新。
- `styles.css`：配色、字型與版面。
- `site.js`：五款頁面結構。
- `index.html`：模板比較首頁。

目前的工作經歷文字根據已提供的資訊撰寫，未加入未經確認的成果數字。英文姓名、聯絡方式及履歷檔尚未提供，因此沒有擅自填入。若要加入履歷下載，將 PDF 放在網站資料夾，並在 `content.js` 的 `links.resume` 填入相對路徑，例如 `./resume.pdf`。

若選定一款作正式首頁，可以將該款的 `site.html?theme=...` 作為網站入口，或再將它整理成單獨的 `index.html`。在此之前，這份成品僅是供選擇與修改的預覽，未發布到任何人的網站。
