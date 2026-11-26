// 시연용 화면 만들기: index.html(앱 원본과 같은 파일)에 겉틀과 시연용 손질을 씌워 dist/index.html을 만든다.
// 실행: node build.js  (Vercel도 올릴 때 이것을 돌린다. vercel.json 참고)
// index.html은 고치지 않는다. 시연용으로 바꿀 곳은 아래 REPLACE에만 둔다.
// 바꿀 곳을 찾지 못하면 멈춘다. 앱 원본에서 맞춰 온 뒤 문구가 바뀌었으면 여기를 같이 고친다.
const fs = require("fs");
const path = require("path");

const DEMO_REPO = "https://github.com/kerokero4896-web/Demo-Energy-level-detector";

const REPLACE = [
  {
    what: "창 제목에 (시연) 붙이기",
    from: "<title>에너지 레벨 감지기</title>",
    to: "<title>에너지 레벨 감지기 (시연)</title>",
  },
  {
    what: "맨 위에 시연용 안내",
    from: '<div id="banner" hidden></div>',
    to: '<p class="banner demo-banner"><b>시연용 화면</b> · 예시 기록이 들어 있어요. 여기서 한 체크는 이 창에만 잠깐 남고, 새로고침하면 처음으로 돌아가요.</p>\n  <div id="banner" hidden></div>',
  },
  {
    what: "아래쪽 기록 안내",
    from: "<p>기록은 claude.ai의 이 앱 안, 내 계정에만 저장돼요. 링크를 공유해도 다른 사람에게는 기록이 보이지 않아요.</p>",
    to: "<p>시연용이라 기록은 어디에도 저장되지 않아요. 예시 기록은 지어낸 값이에요.</p>",
  },
  {
    what: "앱 코드 링크를 시연 저장소로",
    from: '<a href="https://github.com/kerokero4896-web/Energy-level-detector" target="_blank" rel="noopener">GitHub Energy-level-detector</a>',
    to: '<a href="' + DEMO_REPO + '" target="_blank" rel="noopener">GitHub Demo-Energy-level-detector</a>',
  },
];

// claude.ai가 앱에 씌워 주는 겉틀과 같은 모양 (휴대폰 화면 설정 포함)
const HEAD =
  '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  "<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}" +
  "body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}" +
  ".demo-banner{margin:0}</style>\n";

function build() {
  let app = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  for (const r of REPLACE) {
    const n = app.split(r.from).length - 1;
    if (n !== 1) throw new Error("시연용 손질 '" + r.what + "': index.html에서 바꿀 곳을 " + n + "군데 찾았어요 (1군데여야 해요). build.js의 REPLACE를 고쳐 주세요.");
    app = app.replace(r.from, () => r.to);
  }
  const sample = fs.readFileSync(path.join(__dirname, "demo", "sample-db.js"), "utf8");
  return HEAD + "<script>\n" + sample + "</script>\n</head><body>\n" + app + "\n</body></html>\n";
}

if (require.main === module) {
  const out = path.join(__dirname, "dist");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), build());
  console.log("dist/index.html 만듦");
}

module.exports = { build };
