// 확정 폼 cards/Main.dc.html 의 구조·크기·색을 그대로 옮긴 렌더링용 템플릿.
// 바꾸는 것은 글 내용, 날짜 알약, 태그 개수, 푸터뿐이다. 스타일은 고치지 않는다.

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function datePill(date) {
  const [y, m, d] = date.split('-').map(Number);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${day}`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function item(n, { title, desc }) {
  return `
      <div data-check="item" style="flex: 1; display: flex; align-items: center; gap: 20px; padding: 0 26px; border-radius: 26px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.13)">
        <div style="flex: none; width: 56px; height: 56px; border-radius: 50%; background: #FFC53D; color: #0B1220; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900">${n}</div>
        <div style="min-width: 0">
          <div data-check="title" data-lines="1" style="font-size: 32px; font-weight: 700; line-height: 1.3">${esc(title)}</div>
          <div data-check="desc" data-lines="2" style="margin-top: 6px; font-size: 24px; line-height: 1.4; color: #AEB8CB">${esc(desc)}</div>
        </div>
      </div>`;
}

// fontUrl: 저장소에 넣어 둔 Noto Sans KR 가변 글꼴 경로(렌더링 시 file:// 또는 상대 경로)
export function cardHtml(post, fontUrl = '../../fonts/NotoSansKR-wght.ttf') {
  const total = 1 + post.items.length;
  const footer = `출처 ${post.sources.join('·')} | ${post.basis}, 투자 책임은 본인에게`;
  const check = post.check
    ? `\n      <div data-check="check" data-lines="1" style="font-size: 24px; font-weight: 700; line-height: 1.4; color: #FFC53D">${esc(post.check)}</div>`
    : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>WOO News 주식/코인 ${esc(post.date)}</title>
<style>
@font-face{font-family:'Noto Sans KR';src:url('${fontUrl}') format('truetype');font-weight:100 900;font-display:block}
body{margin:0}
</style>
</head>
<body>
<div id="card" style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background: #0B1220; color: #F2F5FA; font-family: 'Noto Sans KR', sans-serif">
  <div style="position: absolute; right: -180px; top: -180px; width: 560px; height: 560px; border-radius: 50%; background: rgba(59,108,255,0.22)"></div>
  <div style="position: absolute; right: 70px; top: 36px; width: 190px; height: 190px; border-radius: 50%; border: 3px solid rgba(255,197,61,0.45)"></div>
  <div style="position: absolute; left: -240px; bottom: -240px; width: 640px; height: 640px; border-radius: 50%; background: rgba(255,197,61,0.10)"></div>
  <div style="position: absolute; left: 0; top: 0; width: 1080px; height: 1350px; background-image: radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px); background-size: 36px 36px"></div>
  <div style="position: relative; height: 100%; box-sizing: border-box; padding: 52px 56px 44px; display: flex; flex-direction: column">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <div style="display: flex; align-items: center; gap: 14px">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #FFC53D; color: #0B1220; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900">W</div>
        <div style="font-size: 42px; font-weight: 900; letter-spacing: -0.02em">WOO <span style="font-weight: 500">News</span></div>
      </div>
      <div style="padding: 8px 22px; border-radius: 999px; border: 2px solid #FFC53D; color: #FFC53D; font-size: 26px; font-weight: 700; letter-spacing: 0.05em">${datePill(post.date)}</div>
    </div>
    <div style="margin-top: 30px; display: flex; align-items: flex-end; justify-content: space-between">
      <div style="font-size: 104px; font-weight: 900; line-height: 1.05; letter-spacing: -0.03em">주식/코인</div>
      <div style="margin-bottom: 14px; padding: 8px 20px; border-radius: 12px; background: rgba(255,197,61,0.16); color: #FFC53D; font-size: 24px; font-weight: 900; letter-spacing: 0.08em">MARKET TOP ${total}</div>
    </div>
    <div style="margin-top: 24px; position: relative; overflow: hidden; border-radius: 32px; background: #FFC53D; color: #0B1220; padding: 28px 36px 30px">
      <div style="position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: rgba(11,18,32,0.08)"></div>
      <div style="position: relative; display: inline-block; padding: 4px 14px; border-radius: 999px; background: #0B1220; color: #FFC53D; font-size: 22px; font-weight: 900; letter-spacing: 0.08em">HEADLINE</div>
      <div data-check="title" data-lines="1" style="position: relative; margin-top: 12px; font-size: 48px; font-weight: 900; line-height: 1.25; letter-spacing: -0.02em">${esc(post.headline.title)}</div>
      <div data-check="desc" data-lines="2" style="position: relative; margin-top: 10px; font-size: 26px; font-weight: 500; line-height: 1.4; color: #2A3350">${esc(post.headline.desc)}</div>
    </div>
    <div data-check="list" style="margin-top: 16px; flex: 1; display: flex; flex-direction: column; gap: 14px">${post.items.map((it, i) => item(i + 2, it)).join('')}
    </div>
    <div style="margin-top: 16px">${check}
      <div data-check="footer" data-lines="1" style="margin-top: 4px; font-size: 21px; line-height: 1.4; color: #8F9BB0">${esc(footer)}</div>
    </div>
  </div>
</div>
</body>
</html>
`;
}
