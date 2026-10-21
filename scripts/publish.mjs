// 오늘(한국 날짜) 카드를 쓰레드·인스타그램에 올린다. 외부 패키지 없이 돈다.
// 사용: node scripts/publish.mjs [YYYY-MM-DD]
//
// 환경 변수
//   POST_MODE      live 일 때만 실제로 올린다. 그 밖에는 시험(dry-run): 이미지 주소와 토큰만 확인한다.
//   THREADS_TOKEN  쓰레드 장기 토큰 (GitHub Secrets)
//   IG_TOKEN       인스타그램 장기 토큰 (GitHub Secrets)
//   PLATFORMS      올릴 곳. 기본 "threads,instagram"
//   IMAGE_BASE_URL 이미지 공개 주소 앞부분. 기본 https://raw.githubusercontent.com/<저장소>/main
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadPost, postDir, todayKst, validatePost } from './validate.mjs';

const THREADS_API = 'https://graph.threads.net/v1.0';
const IG_API = 'https://graph.instagram.com/v23.0';

const date = process.argv[2] || todayKst();
const live = process.env.POST_MODE === 'live';
const platforms = (process.env.PLATFORMS || 'threads,instagram').split(',').map((s) => s.trim()).filter(Boolean);
const dir = postDir(date);
const resultPath = path.join(dir, 'published.json');

// 결과를 로그와 Actions 실행 요약(Summary) 화면에 같이 남긴다.
function report(line, isError = false) {
  (isError ? console.error : console.log)(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${line}\n`);
}

function fail(msg) {
  report(`[${date}] 게시 실패: ${msg}`, true);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Meta가 일시적 오류라고 알려 주는 코드(서버 오류·호출 한도 등)
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613]);

// retry: 네트워크·일시 오류면 최대 3번 다시 시도한다. 게시(publish) 호출은 중복 게시를 피하려고 다시 시도하지 않는다.
async function call(method, url, params, retry = true) {
  const tries = retry ? 3 : 1;
  for (let i = 1; ; i++) {
    const opts = { method };
    const full = method === 'GET' ? `${url}?${new URLSearchParams(params)}` : url;
    if (method !== 'GET') opts.body = new URLSearchParams(params);
    let res, body;
    try {
      res = await fetch(full, opts);
      body = await res.json().catch(() => ({}));
    } catch (e) {
      if (i < tries) { await sleep(20000 * i); continue; }
      throw new Error(`${method} ${new URL(url).pathname} → 네트워크 오류 ${e.message}`);
    }
    if (res.ok && !body.error) return body;
    const transient = res.status >= 500 || res.status === 429 || body.error?.is_transient || TRANSIENT_CODES.has(body.error?.code);
    if (transient && i < tries) { await sleep(20000 * i); continue; }
    // 토큰이 들어간 주소는 찍지 않고 응답만 남긴다.
    throw new Error(`${method} ${new URL(url).pathname} → ${res.status} ${JSON.stringify(body.error || body)}`);
  }
}

// 최근 20시간 안에 같은 첫 줄로 올라간 게시물이 있으면 그 id를 돌려준다(중복 게시 방지).
function findSame(items, field, text) {
  const head = text.split('\n')[0].trim();
  const since = Date.now() - 20 * 3600 * 1000;
  const hit = (items || []).find((m) => {
    const t = Date.parse(String(m.timestamp).replace(/\+0000$/, 'Z'));
    return t >= since && String(m[field] || '').split('\n')[0].trim() === head;
  });
  return hit?.id;
}

// 컨테이너가 FINISHED 가 될 때까지 기다린다(최대 약 5분).
async function waitReady(url, token, field) {
  for (let i = 0; i < 30; i++) {
    const s = await call('GET', url, { fields: field, access_token: token });
    if (s[field] === 'FINISHED') return;
    if (s[field] === 'ERROR' || s[field] === 'EXPIRED') throw new Error(`컨테이너 상태 ${s[field]} ${JSON.stringify(s)}`);
    await sleep(10000);
  }
  throw new Error('컨테이너 준비 시간 초과');
}

const platformsApi = {
  threads: {
    token: () => process.env.THREADS_TOKEN,
    async whoami(token) {
      const me = await call('GET', `${THREADS_API}/me`, { fields: 'id,username', access_token: token });
      return me.username;
    },
    async findPosted(token, text) {
      const r = await call('GET', `${THREADS_API}/me/threads`, { fields: 'id,text,timestamp', limit: 10, access_token: token });
      return findSame(r.data, 'text', text);
    },
    async post(token, imageUrl, text) {
      const c = await call('POST', `${THREADS_API}/me/threads`, { media_type: 'IMAGE', image_url: imageUrl, text, access_token: token });
      await waitReady(`${THREADS_API}/${c.id}`, token, 'status');
      const p = await call('POST', `${THREADS_API}/me/threads_publish`, { creation_id: c.id, access_token: token }, false);
      return p.id;
    },
  },
  instagram: {
    token: () => process.env.IG_TOKEN,
    async whoami(token) {
      const me = await call('GET', `${IG_API}/me`, { fields: 'user_id,username', access_token: token });
      return me.username;
    },
    async findPosted(token, caption) {
      const me = await call('GET', `${IG_API}/me`, { fields: 'user_id', access_token: token });
      const r = await call('GET', `${IG_API}/${me.user_id}/media`, { fields: 'id,caption,timestamp', limit: 10, access_token: token });
      return findSame(r.data, 'caption', caption);
    },
    async post(token, imageUrl, caption) {
      const me = await call('GET', `${IG_API}/me`, { fields: 'user_id', access_token: token });
      const c = await call('POST', `${IG_API}/${me.user_id}/media`, { image_url: imageUrl, caption, access_token: token });
      await waitReady(`${IG_API}/${c.id}`, token, 'status_code');
      const p = await call('POST', `${IG_API}/${me.user_id}/media_publish`, { creation_id: c.id, access_token: token }, false);
      return p.id;
    },
  },
};

// ---- 게시 전 확인 ----
if (existsSync(path.join(dir, 'skip'))) {
  report(`[${date}] skip 파일이 있어 게시하지 않음: ${readFileSync(path.join(dir, 'skip'), 'utf8').trim()}`);
  // 시험 모드에서는 skip 날짜로도 토큰·이미지 주소 확인은 해 본다.
  if (live) process.exit(0);
  console.log('[시험] 토큰과 이미지 주소 확인은 계속 진행');
}
if (!existsSync(path.join(dir, 'post.json'))) fail('post.json 없음 (07시 생성 작업이 안 돌았거나 실패)');
if (!existsSync(path.join(dir, 'card.jpg'))) fail('card.jpg 없음 (렌더링 워크플로 실패)');

const post = loadPost(date);
const errors = validatePost(post, date);
if (errors.length) fail(`post.json 검사 실패\n- ${errors.join('\n- ')}`);

const base = process.env.IMAGE_BASE_URL || `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/main`;
const imageUrl = `${base}/posts/${date}/card.jpg`;
// 방금 푸시한 이미지는 공개 주소에 늦게 보일 수 있어 최대 약 5분 다시 확인한다.
let img;
for (let i = 1; i <= 10; i++) {
  img = await fetch(imageUrl, { method: 'HEAD' }).catch(() => ({ ok: false, status: '네트워크 오류' }));
  if (img.ok) break;
  await sleep(30000);
}
if (!img.ok) fail(`이미지 공개 주소에 접근 불가 ${img.status}: ${imageUrl}`);
console.log(`이미지: ${imageUrl} (${img.headers.get('content-type')})`);

const done = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath, 'utf8')) : {};
const texts = { threads: post.threads, instagram: post.instagram };

let failed = false;
for (const name of platforms) {
  const api = platformsApi[name];
  if (!api) fail(`모르는 플랫폼: ${name}`);
  const token = api.token();
  try {
    if (!token) throw new Error('토큰이 없음 (GitHub Secrets 확인)');
    const user = await api.whoami(token);
    if (done[name]) {
      report(`${name}: 이미 게시됨 (${done[name].id}), 건너뜀`);
      continue;
    }
    // 기록이 없어도 이미 올라가 있으면(이전 실행이 게시 후 기록 전에 끊긴 경우) 다시 올리지 않는다.
    let id = await api.findPosted(token, texts[name]);
    if (!live) {
      report(`${name}: [시험] @${user} 계정 토큰 확인${id ? ', 오늘 같은 글이 이미 있음' : ''}. 실제 게시는 하지 않음`);
      continue;
    }
    if (id) {
      report(`${name}: 같은 글이 이미 올라가 있어 기록만 남김 (${id})`);
    } else {
      // 실패하면 1분 뒤 실제로 올라갔는지 확인하고, 없으면 새 컨테이너로 한 번 더 시도한다.
      try {
        id = await api.post(token, imageUrl, texts[name]);
      } catch (e) {
        report(`${name}: 첫 시도 실패, 1분 뒤 다시 시도 - ${e.message}`);
        await sleep(60000);
        id = (await api.findPosted(token, texts[name])) || (await api.post(token, imageUrl, texts[name]));
      }
    }
    done[name] = { id, user, at: new Date().toISOString() };
    writeFileSync(resultPath, JSON.stringify(done, null, 2) + '\n');
    report(`${name}: @${user} 게시 완료 (${id})`);
  } catch (e) {
    failed = true;
    report(`${name}: 실패 - ${e.message}`, true);
  }
}
if (failed) process.exit(1);
