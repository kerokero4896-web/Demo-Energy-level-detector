// 시연용 가짜 저장소. claude.ai의 db를 흉내 내고, 예시 기록 12일치를 넣어 둔다.
// - 기록은 이 창의 메모리에만 있다. 새로고침하면 처음 예시 기록으로 돌아가고, 어디로도 보내지 않는다.
// - 진짜 claude.ai 앱 안에서는 켜지지 않는다 (window.claude가 이미 있으면 아무것도 하지 않음).
// - 예시 기록은 지어낸 값이다. 점수(score)는 앱의 점수 기준(MODEL_V 7)으로 계산한 값과 같아야 한다.
//   앱 점수 기준을 바꿔 맞춰 올 때는 미리보기에서 window.__demo.verify()로 확인한다.
(() => {
  if (window.claude) return;

  const DAY_START_HOUR = 5; // 앱과 같은 기준: 하루는 새벽 5시에 바뀐다
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const today = new Date(Date.now() - DAY_START_HOUR * 3600e3);
  const dayOf = (ago) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - ago);
  const at = (ago, h, m) => { const d = dayOf(ago); d.setHours(h, m, 0, 0); return d.toISOString(); };

  const RH = ["wake", "wash", "meal", "memo", "pray", "wind", "phone"];
  // [며칠 전, 시, 분, 느낌, 잔 시간, 일어났을 때, 어제 움직임, 지난 3일 무리한 날, 오늘 잡힌 큰 일, 지킨 리듬 수, 오늘 쓴 에너지, 고른 항목, 신호 점수]
  const CHECKS = [
    [12, 7, 40, 8, "6-7", "plain", "light", 0, 1, 6, null, [], 9],
    [11, 7, 20, 8, "6-7", "plain", "hard", 0, 2, 5, null, ["social"], 7],
    [10, 8, 10, 8, "5-6", "groggy", "none", 1, 1, 4, null, ["late", "caffeine"], 4],
    [9, 9, 30, 5, "7-8", "groggy", "none", 2, 0, 3, null, ["heavy"], 4.5],
    [8, 7, 50, 6, "7-8", "plain", "light", 1, 1, 5, null, [], 9],
    [7, 7, 10, 9, "6-7", "plain", "light", 0, 2, 6, null, ["idea", "cando"], 9],
    [6, 8, 0, 8, "5-6", "plain", "none", 1, 1, 5, null, ["late", "travel", "grit"], 3.5],
    [5, 9, 40, 4, "8p", "groggy", "none", 2, 0, 3, null, ["prev2", "heavy"], 4],
    [4, 7, 30, 6, "7-8", "plain", "light", 1, 1, 5, null, [], 9],
    [3, 7, 20, 7, "6-7", "plain", "light", 0, 1, 6, null, ["tense"], 8.5],
    [2, 7, 0, 8, "6-7", "plain", "hard", 0, 2, 6, null, ["social", "caffeine"], 7],
    [2, 14, 30, 6, "6-7", "plain", "hard", 0, 2, 6, "much", ["social", "caffeine"], 6],
    [1, 7, 50, 8, "5-6", "plain", "none", 1, 1, 4, null, ["late", "prev2", "focus"], 4],
  ];
  // 다음 날 남긴 결과. 어제는 비워 두어서 "어제는 어땠어요?"가 보이게 한다.
  const OUTCOME = { 12: "fit", 11: "pushed", 10: "crashed", 9: "fit", 8: "easy", 7: "pushed", 6: "crashed", 5: "fit", 4: "easy", 3: "fit", 2: "pushed" };

  const server = new Map();
  for (const [ago, h, m, gut, sleepH, wake, move, pushed, planned, kept, used, flags, score] of CHECKS) {
    const k = keyOf(dayOf(ago));
    const day = server.get(k) || { date: k, checks: [], outcome: OUTCOME[ago] || null, outcomeAt: OUTCOME[ago] ? at(ago - 1, 8, 0) : null, updatedAt: null };
    const c = { at: at(ago, h, m), gut, score, sleepH, wake, move, pushed, planned, rhythm: RH.slice(0, kept), rhythmOf: RH.length, used, flags, v: 7 };
    day.checks.push(c);
    day.updatedAt = c.at;
    server.set(k, day);
  }

  const copy = (o) => JSON.parse(JSON.stringify(o));
  const deep = (o) => { Object.freeze(o); for (const v of Object.values(o)) if (v && typeof v === "object") deep(v); return o; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const listeners = [];
  let served = false;
  const docSnap = (id, v) => Object.freeze({ id, exists: v !== undefined, data: () => (v === undefined ? undefined : deep(copy(v))), metadata: { fromCache: false, hasPendingWrites: false } });
  const snapOf = () => {
    const docs = [...server.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([id, v]) => docSnap(id, v));
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: () => [] };
  };
  const emit = () => { if (served) for (const l of listeners) l(snapOf()); };
  const db = {
    collection() {
      const ref = {
        orderBy() { return ref; },
        limit() { return ref; },
        onSnapshot(next) {
          listeners.push(next);
          setTimeout(() => { served = true; next(snapOf()); }, 30);
          return () => {};
        },
        doc(id) {
          return {
            async get() { await wait(20); return docSnap(id, server.get(id)); },
            async set(body) { await wait(30); server.set(id, copy(body)); setTimeout(emit, 10); },
          };
        },
      };
      return ref;
    },
  };
  const user = { isOwner: async () => true };
  window.claude = { use: async (n) => (n === "db" ? db : n === "user" ? user : null) };

  // 확인용: 예시 기록의 점수가 앱 점수 기준과 맞는지 본다 (미리보기 콘솔에서 window.__demo.verify())
  window.__demo = {
    server,
    verify() {
      const calc = window.__energy && window.__energy.computeResult;
      if (!calc) return "앱의 window.__energy.computeResult를 찾지 못했어요";
      const wrong = [];
      for (const d of server.values()) for (const c of d.checks) {
        const r = calc(Object.assign({}, c, { score: undefined }));
        if (r.score !== c.score) wrong.push(d.date + " " + c.at + ": 적은 점수 " + c.score + ", 앱 계산 " + r.score);
      }
      return wrong.length ? wrong : "모두 맞아요";
    },
  };
})();
