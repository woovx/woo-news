# 매일 07:35(KST, 월~토) 점검·복구 예약 작업 프롬프트

(클라우드 예약 작업 "WOO News 점검·복구"의 절차. 07:00 생성이 실패했거나 카드가 안 만들어졌을 때 08:00 게시 전에 고친다. 2026-10-22부터 3분야: stock(주식/코인), entertainment(연예), insurance(보험). 규칙은 `CLAUDE.md`와 `docs/daily-task-prompt.md`를 따른다.)

---

1. `TZ=Asia/Seoul date +%F`로 오늘 한국 날짜 DATE를 확인하고 `git checkout main && git pull --rebase` 한다.
2. `posts/DATE/skip`(날짜 전체 skip)이 있고 `[자동]`으로 시작하지 않으면 사용자가 막은 날이다. 아무것도 하지 않고 끝낸다.
3. 분야마다(`posts/DATE/<분야>/`) 아래 순서로 상태를 보고, 해당하는 첫 경우만 처리한다.
   - **`published.json`이나 `card.jpg`가 있다** → 정상. 건드리지 않는다.
   - **`skip`이 있고 `[자동]`으로 시작하지 않는다** → 사용자가 막은 분야. 건드리지 않는다.
   - **`skip`이 `[자동]`으로 시작한다(기사 부족)** → `docs/daily-task-prompt.md` 규칙대로 그 분야의 당일 기사를 한 번 더 **꼼꼼히** 찾는다. 확인된 당일 기사가 3개 이상이면 `post.json`을 쓰고 skip을 지운다. 그래도 부족하면 그대로 둔다. 오래된 소식으로 채우지 않는다.
     - 검색어를 바꿔 가며 최소 6번 찾는다. 그중 절반은 `extended` 모드로 한다. 예: 연예는 "오늘 시청률", "박스오피스 1위", "컴백", "음원 차트", "OTT 순위"; 보험은 "금감원 보험", "금융위 보험", "실손보험", "자동차보험", "보험사 실적", "보험료".
     - 후보 기사는 WebFetch로 본문을 열어 날짜와 숫자를 확인한다. WebFetch가 `ENOTFOUND` 같은 접속 오류로 안 열리면 skip 이유와 최종 답변에 "클라우드 환경 네트워크 차단"이라고 분명히 적는다.
   - **`post.json`이 없다** → 생성이 실패한 것이다. `docs/daily-task-prompt.md` 절차대로 그 분야를 새로 만든다.
   - **`post.json`은 있는데 `card.jpg`가 없다** → 렌더링 실패로 본다.
     1. `node scripts/validate.mjs DATE/<분야>`가 실패하면 그 내용을 고친다.
     2. 가능하면 `npm ci && npx playwright install chromium && node scripts/render.mjs DATE/<분야>`로 어느 글이 넘치는지 확인하고 그 글을 줄인다.
     3. 브라우저 설치가 안 되면 글이 넘친 것으로 보고, 그 분야의 모든 `title`을 18자 이내, `desc`를 34자 이내로 줄인다(보험은 글자가 커서 `title` 16자, `desc` 30자 이내). 숫자·사실은 바꾸지 않고 표현만 줄인다.
     4. 렌더링 워크플로가 아예 안 돌았을 수도 있으므로 내용이 맞으면 그대로 다시 커밋해도 된다(게시 단계가 직접 렌더링한다).
4. 바꾼 파일(`posts/DATE/<분야>/post.json`, `skip`)만 커밋해 `git push origin HEAD:main`으로 main에 바로 푸시한다. 커밋 메시지: "카드 복구: DATE". card.html·card.jpg는 커밋하지 않는다. 고칠 것이 없으면 커밋하지 않는다.
5. 최종 답변은 한국어로 짧게: 분야별 상태, 고친 내용, 푸시 결과.
