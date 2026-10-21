// 쓰레드·인스타그램 장기 토큰(60일)을 새로 받아 파일로 쓴다. 워크플로가 이 파일로 GitHub Secrets를 덮어쓴다.
// 사용: node scripts/refresh-tokens.mjs <출력 폴더>
// 환경 변수: THREADS_TOKEN, IG_TOKEN
import { appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2];
if (!outDir) {
  console.error('출력 폴더를 지정하세요');
  process.exit(1);
}

const targets = [
  { name: 'THREADS_TOKEN', url: 'https://graph.threads.net/refresh_access_token', grant: 'th_refresh_token' },
  { name: 'IG_TOKEN', url: 'https://graph.instagram.com/refresh_access_token', grant: 'ig_refresh_token' },
];

let failed = false;
for (const t of targets) {
  const token = process.env[t.name];
  if (!token) {
    console.error(`${t.name}: 없음`);
    failed = true;
    continue;
  }
  const res = await fetch(`${t.url}?${new URLSearchParams({ grant_type: t.grant, access_token: token })}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    console.error(`${t.name}: 갱신 실패 ${res.status} ${JSON.stringify(body.error || body)}`);
    failed = true;
    continue;
  }
  // Actions 로그에 새 토큰이 찍히지 않게 가린다.
  if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${body.access_token}`);
  writeFileSync(path.join(outDir, t.name), body.access_token);
  const days = Math.round((body.expires_in || 0) / 86400);
  console.log(`${t.name}: 갱신 완료, 약 ${days}일 유효`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${t.name}: 갱신, 약 ${days}일 유효\n`);
}
if (failed) process.exit(1);
