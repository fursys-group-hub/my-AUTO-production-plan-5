# block-overrides-api

"블록 소요량" 화면의 참조 품목 추가/수정/삭제(`state.blockMapOverrides`)를 모든 사용자·기기에
공유하기 위한 아주 작은 Cloudflare Worker입니다. KV에 JSON 하나를 통째로 저장/조회만 합니다.

- 배포 주소: https://block-overrides-api.fursys-production-plan.workers.dev/
- `GET /` — 현재 저장된 JSON 반환 (인증 불필요, 공개 읽기)
- `POST /` — 전체 JSON을 덮어씀. `X-Write-Key` 헤더가 Worker Secret(`WRITE_KEY`)과 일치해야 함
- `index.html`의 `BLOCK_OVERRIDES_API`/`BLOCK_OVERRIDES_WRITE_KEY` 상수가 이 값들과 일치해야 함

## 배포 / 재배포

```
cd worker
CLOUDFLARE_API_TOKEN=<Workers 편집 권한 토큰> npx wrangler deploy
```

## WRITE_KEY 교체(유출 의심 시)

```
cd worker
CLOUDFLARE_API_TOKEN=<토큰> npx wrangler secret put WRITE_KEY
```
새 값을 설정한 뒤 `index.html`의 `BLOCK_OVERRIDES_WRITE_KEY` 상수도 같은 값으로 바꿔서 재배포해야 합니다.

## 참고

- `X-Write-Key`는 `index.html` 소스에 그대로 들어있어 누구나 볼 수 있습니다. 이 값이 노출되면
  이 KV 저장소(블록 참조 품목 데이터)만 바뀔 수 있고, 그 외 Cloudflare 계정이나 GitHub 저장소에는
  접근할 수 없습니다 — GitHub 쓰기 토큰을 노출하는 것보다 훨씬 위험도가 낮은 구조로 일부러 이렇게 설계했습니다.
