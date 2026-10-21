// posts/YYYY-MM-DD/post.json 이 규칙에 맞는지 검사한다. 외부 패키지 없이 돈다.
// 사용: node scripts/validate.mjs [YYYY-MM-DD]   (날짜를 빼면 오늘 한국 날짜)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function todayKst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function postDir(date) {
  return path.join(ROOT, 'posts', date);
}

export function loadPost(date) {
  const text = readFileSync(path.join(postDir(date), 'post.json'), 'utf8').replace(/^﻿/, '');
  return JSON.parse(text);
}

const HASHTAG = /#[^\s#]+/g;

export function validatePost(post, date) {
  const errors = [];
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
    if ((th.match(HASHTAG) || []).length)errors.push('threads 본문에 해시태그가 있음');
    if (!th.includes('투자 책임')) errors.push('threads 본문에 투자 책임 문구 없음');
  }

  const ig = post.instagram;
  if (!str(ig)) errors.push('instagram 본문 없음');
  else {
    if ([...ig].length > 2200) errors.push(`instagram 본문이 2,200자 초과: ${[...ig].length}자`);
    const tags = ig.match(HASHTAG) || [];
    if (tags.length > 5) errors.push(`instagram 해시태그 ${tags.length}개 (5개 이내)`);
    if (tags[tags.length - 1] !== '#WOONews') errors.push('instagram 마지막 해시태그가 #WOONews가 아님');
    if (!ig.includes('투자')) errors.push('instagram 본문에 투자 책임 문구 없음');
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const date = process.argv[2] || todayKst();
  const errors = validatePost(loadPost(date), date);
  if (errors.length) {
    console.error(`[${date}] post.json 검사 실패:\n- ${errors.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`[${date}] post.json 검사 통과`);
}
