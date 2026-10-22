// post.json → card.html + card.jpg(1080×1350). 글이 넘치면 실패한다.
// 사용: node scripts/render.mjs [YYYY-MM-DD | YYYY-MM-DD/분야 ...]   (빼면 오늘 한국 날짜의 모든 분야)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { cardHtml } from './card-template.mjs';
import { expandTargets, loadPost, postDir, validatePost } from './validate.mjs';

// 각 글 요소가 data-lines 줄 수 안에 들어가는지, 목록 영역이 넘치지 않는지 본다.
function checkLayout() {
  const problems = [];
  for (const el of document.querySelectorAll('[data-lines]')) {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const lines = Math.round(el.getBoundingClientRect().height / lh);
    if (lines > Number(el.dataset.lines)) {
      problems.push(`${el.dataset.check} ${lines}줄 (최대 ${el.dataset.lines}줄): ${el.textContent.trim()}`);
    }
  }
  const list = document.querySelector('[data-check="list"]');
  for (const it of list.children) {
    if (it.scrollHeight > it.clientHeight + 1) problems.push(`번호 카드 높이 부족: ${it.textContent.trim().slice(0, 30)}`);
  }
  const card = document.getElementById('card');
  const inner = card.lastElementChild;
  if (inner.scrollHeight > card.clientHeight + 1) problems.push('카드 전체 높이 초과');
  return problems;
}

async function render(browser, date, field) {
  const name = `${date}/${field}`;
  const post = loadPost(date, field);
  const errors = validatePost(post, date, field);
  if (errors.length) throw new Error(`[${name}] post.json 검사 실패:\n- ${errors.join('\n- ')}`);

  const dir = postDir(date, field);
  const htmlPath = path.join(dir, 'card.html');
  writeFileSync(htmlPath, cardHtml(field, post));

  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  const fontOk = await page.evaluate(() => document.fonts.check('900 48px "Noto Sans KR"', '가'));
  if (!fontOk) throw new Error(`[${name}] Noto Sans KR 글꼴을 불러오지 못함`);

  const problems = await page.evaluate(checkLayout);
  if (problems.length) throw new Error(`[${name}] 글이 넘침:\n- ${problems.join('\n- ')}`);

  await page.locator('#card').screenshot({ path: path.join(dir, 'card.jpg'), type: 'jpeg', quality: 92 });
  await page.close();
  console.log(`[${name}] card.jpg 생성`);
}

const targets = expandTargets(process.argv.slice(2));
if (!targets.length) {
  console.error('렌더링할 post.json 이 없음');
  process.exit(1);
}

// PW_CHANNEL=chrome 이면 설치된 Chrome을 쓴다(로컬 PC 시험용). Actions에서는 내장 Chromium.
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
let failed = false;
for (const { date, field } of targets) {
  try {
    await render(browser, date, field);
  } catch (e) {
    failed = true;
    console.error(e.message);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
