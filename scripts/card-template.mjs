// 확정 폼 cards/Main.dc.html(주식/코인)·Entertainment.dc.html(연예)·Insurance.dc.html(보험)의
// 구조·크기·색을 그대로 옮긴 렌더링용 템플릿. 바꾸는 것은 글 내용, 날짜 알약, 태그 개수, 푸터뿐이다.
// 스타일 값은 각 .dc.html 에서 그대로 가져왔다. 고치지 않는다.

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// 기본 크기(주식/코인·연예). 보험 폼은 글자와 카드가 조금 더 크다.
const SIZE_BASE = {
  hlPad: '28px 36px 30px', hlTitleMt: 12, hlTitle: 48, hlDescMt: 10, hlDesc: 26,
  itemGap: 20, itemPad: '0 26px', itemRadius: 26, badge: 56, badgeFont: 28, itemTitle: 32, itemDescMt: 6, itemDesc: 24,
};
const SIZE_LARGE = {
  hlPad: '30px 36px 32px', hlTitleMt: 14, hlTitle: 50, hlDescMt: 12, hlDesc: 27,
  itemGap: 22, itemPad: '0 30px', itemRadius: 28, badge: 64, badgeFont: 32, itemTitle: 36, itemDescMt: 8, itemDesc: 26,
};

export const THEMES = {
  stock: {
    title: '주식/코인', tag: 'MARKET', emoji: '📈', size: SIZE_BASE,
    bg: '#0B1220', text: '#F2F5FA',
    bigCircle: 'right: -180px; top: -180px; width: 560px; height: 560px; border-radius: 50%; background: rgba(59,108,255,0.22)',
    ring: 'rgba(255,197,61,0.45)', lowCircle: 'rgba(255,197,61,0.10)', dots: 'rgba(255,255,255,0.07)',
    accent: '#FFC53D', onAccent: '#0B1220', accentText: '#FFC53D', tagBg: 'rgba(255,197,61,0.16)',
    hlBubble: 'rgba(11,18,32,0.08)', hlTagBg: '#0B1220', hlTagText: '#FFC53D', hlDesc: '#2A3350',
    item: 'background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.13)',
    sub: '#AEB8CB', footer: '#8F9BB0',
    footerSuffix: ', 투자 책임은 본인에게', note: null,
  },
  entertainment: {
    title: '연예', tag: 'ENTERTAINMENT', emoji: '🎬', size: SIZE_BASE,
    bg: '#FFF1EC', text: '#2B1520',
    bigCircle: 'right: -170px; top: -170px; width: 540px; height: 540px; border-radius: 50%; background: rgba(255,179,138,0.55)',
    ring: 'rgba(224,36,94,0.45)', lowCircle: 'rgba(224,36,94,0.10)', dots: 'rgba(43,21,32,0.08)',
    accent: '#E0245E', onAccent: '#FFFFFF', accentText: '#C21A4E', tagBg: 'rgba(224,36,94,0.12)',
    hlBubble: 'rgba(255,255,255,0.12)', hlTagBg: '#FFFFFF', hlTagText: '#C21A4E', hlDesc: '#FFE9EF',
    item: 'background: #FFFFFF; border: 1px solid rgba(43,21,32,0.08); box-shadow: 0 6px 18px rgba(43,21,32,0.07)',
    sub: '#6E4B5A', footer: '#7A5565',
    footerSuffix: '', note: null,
  },
  insurance: {
    title: '보험', tag: 'INSURANCE', emoji: '🛡️', size: SIZE_LARGE,
    bg: '#EAF3FF', text: '#10213F',
    bigCircle: 'right: -170px; top: -170px; width: 540px; height: 540px; border-radius: 50%; background: rgba(110,170,255,0.35)',
    ring: 'rgba(31,95,255,0.45)', lowCircle: 'rgba(31,95,255,0.10)', dots: 'rgba(16,33,63,0.08)',
    accent: '#1F5FFF', onAccent: '#FFFFFF', accentText: '#1747C9', tagBg: 'rgba(31,95,255,0.12)',
    hlBubble: 'rgba(255,255,255,0.12)', hlTagBg: '#FFFFFF', hlTagText: '#1747C9', hlDesc: '#E3EEFF',
    item: 'background: #FFFFFF; border: 1px solid rgba(16,33,63,0.08); box-shadow: 0 6px 18px rgba(16,33,63,0.07)',
    sub: '#4A5F85', footer: '#5A6E92',
    footerSuffix: '', note: '가입·변경 전 약관과 설계사 설명을 꼭 확인하세요',
  },
};

export const FIELDS = Object.keys(THEMES);

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

function item(t, n, { title, desc }) {
  const z = t.size;
  return `
      <div data-check="item" style="flex: 1; display: flex; align-items: center; gap: ${z.itemGap}px; padding: ${z.itemPad}; border-radius: ${z.itemRadius}px; ${t.item}">
        <div style="flex: none; width: ${z.badge}px; height: ${z.badge}px; border-radius: 50%; background: ${t.accent}; color: ${t.onAccent}; display: flex; align-items: center; justify-content: center; font-size: ${z.badgeFont}px; font-weight: 900">${n}</div>
        <div style="min-width: 0">
          <div data-check="title" data-lines="1" style="font-size: ${z.itemTitle}px; font-weight: 700; line-height: 1.3">${esc(title)}</div>
          <div data-check="desc" data-lines="2" style="margin-top: ${z.itemDescMt}px; font-size: ${z.itemDesc}px; line-height: 1.4; color: ${t.sub}">${esc(desc)}</div>
        </div>
      </div>`;
}

// fontUrl: 저장소에 넣어 둔 Noto Sans KR 가변 글꼴 경로(카드 파일 posts/날짜/분야/ 기준 상대 경로)
export function cardHtml(field, post, fontUrl = '../../../fonts/NotoSansKR-wght.ttf') {
  const t = THEMES[field];
  if (!t) throw new Error(`모르는 분야: ${field}`);
  const z = t.size;
  const total = 1 + post.items.length;
  const footer = `출처 ${post.sources.join('·')} | ${post.basis}${t.footerSuffix}`;
  const lines = [post.check, t.note]
    .filter(Boolean)
    .map((s) => `\n      <div data-check="check" data-lines="1" style="font-size: 24px; font-weight: 700; line-height: 1.4; color: ${t.accentText}">${esc(s)}</div>`)
    .join('');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>WOO News ${esc(t.title)} ${esc(post.date)}</title>
<style>
@font-face{font-family:'Noto Sans KR';src:url('${fontUrl}') format('truetype');font-weight:100 900;font-display:block}
body{margin:0}
</style>
</head>
<body>
<div id="card" style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background: ${t.bg}; color: ${t.text}; font-family: 'Noto Sans KR', sans-serif">
  <div style="position: absolute; ${t.bigCircle}"></div>
  <div style="position: absolute; right: 70px; top: 36px; width: 190px; height: 190px; border-radius: 50%; border: 3px solid ${t.ring}"></div>
  <div style="position: absolute; left: -240px; bottom: -240px; width: 640px; height: 640px; border-radius: 50%; background: ${t.lowCircle}"></div>
  <div style="position: absolute; left: 0; top: 0; width: 1080px; height: 1350px; background-image: radial-gradient(${t.dots} 1.5px, transparent 1.5px); background-size: 36px 36px"></div>
  <div style="position: relative; height: 100%; box-sizing: border-box; padding: 52px 56px 44px; display: flex; flex-direction: column">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <div style="display: flex; align-items: center; gap: 14px">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: ${t.accent}; color: ${t.onAccent}; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900">W</div>
        <div style="font-size: 42px; font-weight: 900; letter-spacing: -0.02em">WOO <span style="font-weight: 500">News</span></div>
      </div>
      <div style="padding: 8px 22px; border-radius: 999px; border: 2px solid ${t.accent}; color: ${t.accentText}; font-size: 26px; font-weight: 700; letter-spacing: 0.05em">${datePill(post.date)}</div>
    </div>
    <div style="margin-top: 30px; display: flex; align-items: flex-end; justify-content: space-between">
      <div style="font-size: 104px; font-weight: 900; line-height: 1.05; letter-spacing: -0.03em">${esc(t.title)}</div>
      <div style="margin-bottom: 14px; padding: 8px 20px; border-radius: 12px; background: ${t.tagBg}; color: ${t.accentText}; font-size: 24px; font-weight: 900; letter-spacing: 0.08em">${t.tag} TOP ${total}</div>
    </div>
    <div style="margin-top: 24px; position: relative; overflow: hidden; border-radius: 32px; background: ${t.accent}; color: ${t.onAccent}; padding: ${z.hlPad}">
      <div style="position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: ${t.hlBubble}"></div>
      <div style="position: relative; display: inline-block; padding: 4px 14px; border-radius: 999px; background: ${t.hlTagBg}; color: ${t.hlTagText}; font-size: 22px; font-weight: 900; letter-spacing: 0.08em">HEADLINE</div>
      <div data-check="title" data-lines="1" style="position: relative; margin-top: ${z.hlTitleMt}px; font-size: ${z.hlTitle}px; font-weight: 900; line-height: 1.25; letter-spacing: -0.02em">${esc(post.headline.title)}</div>
      <div data-check="desc" data-lines="2" style="position: relative; margin-top: ${z.hlDescMt}px; font-size: ${z.hlDesc}px; font-weight: 500; line-height: 1.4; color: ${t.hlDesc}">${esc(post.headline.desc)}</div>
    </div>
    <div data-check="list" style="margin-top: 16px; flex: 1; display: flex; flex-direction: column; gap: 14px">${post.items.map((it, i) => item(t, i + 2, it)).join('')}
    </div>
    <div style="margin-top: 16px">${lines}
      <div data-check="footer" data-lines="1" style="margin-top: ${lines ? 4 : 0}px; font-size: 21px; line-height: 1.4; color: ${t.footer}">${esc(footer)}</div>
    </div>
  </div>
</div>
</body>
</html>
`;
}
