// 미리보기 서버: 열 때마다 build.js로 시연 화면을 새로 만들어 보여 준다.
// 실행: Claude Code의 preview_start("demo-preview") 또는 `node .claude/preview-server.js`
// 주소: http://localhost:8124
const http = require("http");
const path = require("path");

const buildPath = path.join(__dirname, "..", "build.js");

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/") {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      delete require.cache[require.resolve(buildPath)];
      const html = require(buildPath).build();
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(html);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(String(e && e.message));
    }
  })
  .listen(8124, () => console.log("demo preview on http://localhost:8124"));
