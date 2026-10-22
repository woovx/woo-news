// posts/YYYY-MM-DD/<분야>/post.json 이 규칙에 맞는지 검사한다. 외부 패키지 없이 돈다.
// 분야: stock(주식/코인), entertainment(연예), insurance(보험)
// 사용: node scripts/validate.mjs [YYYY-MM-DD | YYYY-MM-DD/분야 ...]   (빼면 오늘 한국 날짜의 모든 분야)
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FIELDS, THEMES } from './card-template.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function todayKst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function dayDir(date) {
  return path.join(ROOT, 'posts', date);
}

export function postDir(date, field) {
  return path.join(dayDir(date), field);
}

export function loadPost(date, field) {
  const text = readFileSync(path.join(postDir(date, field), 'post.json'), 'utf8').replace(/^﻿/, '');
  return JSON.parse(text);
}

// "2026-10-22" → 그날 post.json 이 있는 모든 분야, "2026-10-22/stock" → 그 분야만
export function expandTargets(args) {
  if (!args.length) args = [todayKst()];
  const out = [];
  for (const a of args) {
    const [date, field] = a.split('/');
    if (field) out.push({ date, field });
    else for (const f of FIELDS) if (existsSync(path.join(postDir(date, f), 'post.json'))) out.push({ date, field: f });
  }
  return out;
}

const HASHTAG = /#[^\s#]+/g;
// 보험 본문에서 가입 권유·판촉처럼 읽히는 표현
const INSURANCE_PROMO = /(가입하세요|가입을 추천|지금 가입|가입 추천|무조건|보장됩니다|수익 보장|꼭 가입)/;

export function validatePost(post, date, field) {
  const errors = [];
  const t = THEMES[field];
  if (!t) return [`모르는 분야: ${field}`];
  const str = (v) => typeof v === 'string' && v.trim().length > 0;

  if (post.date !== date) errors.push(`date가 폴더 날짜(${date})와 다름: ${post.date}`);
  if (!str(post.basis)) errors.push('basis(기준 시점) 없음');
  if (!post.headline || !str(post.headline.title) || !str(post.headline.desc)) errors.push('headline.title/desc 없음');
  if (!Array.isArray(post.items) || post.items.length < 2 || post.items.length > 4) {
    errors.push('items는 2~4개여야 함 (HEADLINE 포함 3~5개)');
  } else {
    post.items.forEach((it, i) => {
      if (!str(it.title) || !str(it.desc)) errors.push(`items[${i}] title/desc 없음`);
    });
  }
  if (post.check !== undefined && !str(post.check)) errors.push('check는 빼거나 글이 있어야 함');
  if (!Array.isArray(post.sources) || post.sources.length === 0) errors.push('sources(언론사명) 없음');
  if (!Array.isArray(post.articles) || post.articles.length < 3) errors.push('articles(근거 기사)는 3개 이상');

  const th = post.threads;
  if (!str(th)) errors.push('threads 본문 없음');
  else {
    if ([...th].length > 500) errors.push(`threads 본문이 500자 초과: ${[...th].length}자`);
    if ((th.match(HASHTAG) || []).length) errors.push('threads 본문에 해시태그가 있음');
  }

  const ig = post.instagram;
  if (!str(ig)) errors.push('instagram 본문 없음');
  else {
    if ([...ig].length > 2200) errors.push(`instagram 본문이 2,200자 초과: ${[...ig].length}자`);
    const tags = ig.match(HASHTAG) || [];
    if (tags.length > 5) errors.push(`instagram 해시태그 ${tags.length}개 (5개 이내)`);
    if (tags[tags.length - 1] !== '#WOONews') errors.push('instagram 마지막 해시태그가 #WOONews가 아님');
    // 첫 줄은 "📈 WOO News | 10.22 주식/코인" 형식. 분야마다 달라야 중복 게시 확인이 맞게 동작한다.
    const first = ig.split('\n')[0];
    if (!first.includes('WOO News') || !first.includes(t.title)) errors.push(`instagram 첫 줄에 "WOO News"와 "${t.title}"가 있어야 함`);
  }

  if (field === 'stock') {
    if (str(th) && !th.includes('투자 책임')) errors.push('threads 본문에 투자 책임 문구 없음');
    if (str(ig) && !ig.includes('투자')) errors.push('instagram 본문에 투자 책임 문구 없음');
  }
  if (field === 'insurance') {
    if (str(th) && !th.includes('약관')) errors.push('threads 본문에 "약관…확인" 안내 문구 없음');
    if (str(ig) && !ig.includes('약관')) errors.push('instagram 본문에 "약관…확인" 안내 문구 없음');
    const all = [th, ig, post.headline?.title, post.headline?.desc, ...(post.items || []).flatMap((i) => [i.title, i.desc])].join('\n');
    const m = all.match(INSURANCE_PROMO);
    if (m) errors.push(`보험 글에 가입 권유·단정 표현: "${m[0]}"`);
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const targets = expandTargets(process.argv.slice(2));
  if (!targets.length) {
    console.error('검사할 post.json 이 없음');
    process.exit(1);
  }
  let failed = false;
  for (const { date, field } of targets) {
    const errors = validatePost(loadPost(date, field), date, field);
    if (errors.length) {
      failed = true;
      console.error(`[${date}/${field}] post.json 검사 실패:\n- ${errors.join('\n- ')}`);
    } else console.log(`[${date}/${field}] post.json 검사 통과`);
  }
  process.exit(failed ? 1 : 0);
}
