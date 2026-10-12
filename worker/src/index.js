// 블록 참조 품목 매핑(state.blockMapOverrides)을 모든 사용자가 공유하는 백엔드.
// KV에 JSON 하나를 통째로 저장/조회하는 아주 단순한 구조 (쓰기는 X-Write-Key 헤더로만 허용).
const ALLOWED_ORIGIN = 'https://fursys-group-hub.github.io';
const KV_KEY = 'blockMapOverrides';

function corsHeaders(origin) {
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === 'GET') {
      const raw = await env.BLOCK_OVERRIDES.get(KV_KEY);
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
      await env.BLOCK_OVERRIDES.put(KV_KEY, body);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405, headers });
  },
};
