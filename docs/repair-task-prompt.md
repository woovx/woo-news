# 매일 07:35(KST, 월~토) 점검·복구 예약 작업 프롬프트

(클라우드 예약 작업 "WOO News 점검·복구"의 절차. 07:00 생성이 실패했거나 카드가 안 만들어졌을 때 08:00 게시 전에 고친다. 규칙은 `CLAUDE.md`와 `docs/daily-task-prompt.md`를 따른다.)

---

1. `TZ=Asia/Seoul date +%F`로 오늘 한국 날짜 DATE를 확인하고 `git checkout main && git pull --rebase` 한다.
2. 아래 순서로 오늘 상태를 본다. 해당하는 첫 경우만 처리한다.
   - **`posts/DATE/published.json`이 있거나 `card.jpg`가 있다** → 정상. 아무것도 하지 않고 "정상"이라고 답하고 끝낸다.
   - **`posts/DATE/skip`이 있고 `[자동]`으로 시작하지 않는다** → 사용자가 막은 날이다. 아무것도 하지 않고 끝낸다.
   - **`skip`이 `[자동]`으로 시작한다(기사 부족)** → `docs/daily-task-prompt.md` 2~4단계로 당일 기사를 한 번 더 찾는다. 확인된 당일 기사가 3개 이상이면 `post.json`을 쓰고 skip을 지운다. 그래도 부족하면 그대로 두고 끝낸다. 오래된 소식으로 채우지 않는다.
   - **`post.json`이 없다** → 07:00 생성이 실패한 것이다. `docs/daily-task-prompt.md` 절차를 처음부터 그대로 해서 만든다.
   - **`post.json`은 있는데 `card.jpg`가 없다** → 렌더링 실패로 본다.
     1. `node scripts/validate.mjs DATE`가 실패하면 그 내용을 고친다.
     2. 가능하면 `npm ci && npx playwright install chromium && node scripts/render.mjs DATE`로 어느 글이 넘치는지 확인하고 그 글을 줄인다.
     3. 브라우저 설치가 안 되면 글이 넘친 것으로 보고, 모든 `title`을 18자 이내, `desc`를 34자 이내로 줄인다. 숫자·사실은 바꾸지 않고 표현만 줄인다.
     4. 렌더링 워크플로가 아예 안 돌았을 수도 있으므로 내용이 맞으면 그대로 다시 커밋해도 된다(게시 단계가 직접 렌더링한다).
3. 바꾼 파일(`posts/DATE/post.json`, `skip`)만 커밋해 `git push origin HEAD:main`으로 main에 바로 푸시한다. 커밋 메시지: "카드 복구: DATE". card.html·card.jpg는 커밋하지 않는다.
4. 최종 답변은 한국어로 짧게: 발견한 상태, 고친 내용, 푸시 결과.
