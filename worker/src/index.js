// 이 앱의 여러 "공유 상태"(블록 참조 품목 매핑, CAPA 매핑, 관리 품목 코드 파일들)를
// 모든 사용자가 공유하는 백엔드. 경로(pathname)가 곧 KV 키가 되는 아주 단순한 구조.
// KV에 JSON 하나를 통째로 저장/조회만 함 (쓰기는 X-Write-Key 헤더로만 허용).
const ALLOWED_ORIGIN = 'https://fursys-group-hub.github.io';
// 허용된 키만 읽기/쓰기 가능 (임의의 키로 KV를 채우는 것을 방지)
const ALLOWED_KEYS = new Set(['blockMapOverrides', 'capaOverrides', 'managedCodeFiles', 'managedCodeFileEnabled']);
const DEFAULT_KEY = 'blockMapOverrides'; // 루트 경로("/")는 기존 블록 매핑 API와 호환 유지

function corsHeaders(origin) {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key',
    'Vary': 'Origin',
  };
}

function keyFromPath(pathname) {
  const seg = pathname.replace(/^\/+/, '').trim();
  return seg || DEFAULT_KEY;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = keyFromPath(url.pathname);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (!ALLOWED_KEYS.has(key)) {
      return new Response(JSON.stringify({ error: 'unknown key' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'GET') {
      const raw = await env.BLOCK_OVERRIDES.get(key);
      return new Response(raw || '{}', {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const writeKey = request.headers.get('X-Write-Key') || '';
      if (writeKey !== env.WRITE_KEY) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      let body;
      try {
        body = await request.text();
        JSON.parse(body); // 유효한 JSON인지만 확인
      } catch {
        return new Response(JSON.stringify({ error: 'invalid json' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      await env.BLOCK_OVERRIDES.put(key, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405, headers });
  },
};
