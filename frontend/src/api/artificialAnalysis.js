async function readErrorText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function isAbsoluteUrl(u) {
  return /^https?:\/\/?/i.test(u);
}

function devFallbackBases() {
  // python app.py = 5001, flask run = 5000 
  return ["http://localhost:5001", "http://localhost:5000"];
}

async function tryFetchJsonOnce(url) {
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const text = await readErrorText(res);
    throw new Error(`HTTP ${res.status} ${text}`.trim());
  }

  return res.json();
}

async function fetchJson(url) {
  // 1) 상대경로 시 CRA 프록시
  try {
    return await tryFetchJsonOnce(url);
  } catch (err) {
    const msg = String(err?.message ?? err);

    const isApiPath = typeof url === "string" && url.startsWith("/api/");
    const isDev =
      typeof window !== "undefined" &&
      window.location &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // api 실패 시 재시도
    if (isDev && isApiPath && !isAbsoluteUrl(url)) {
      const tried = [url];

      for (const base of devFallbackBases()) {
        const alt = `${base}${url}`;
        tried.push(alt);

        try {
          return await tryFetchJsonOnce(alt);
        } catch {
        }
      }

      throw new Error(
        `API 호출 실패. 아래 URL들을 순서대로 시도했지만 모두 실패했습니다.\n` +
          tried.map((t) => `- ${t}`).join("\n") +
          `\n\n마지막 오류: ${msg}`
      );
    }
    throw err;
  }
}

/* =========================
   ArtificialAnalysis API
   ========================= */
   
export function fetchPing() {
  return fetchJson("/api/aa/ping");
}

export function fetchLlmMetrics() {
  return fetchJson("/api/aa/llm");
}
export function fetchImageMetrics() {
  return fetchJson("/api/aa/image");
}
export function fetchVideoMetrics() {
  return fetchJson("/api/aa/video");
}
export function fetchAudioMetrics() {
  return fetchJson("/api/aa/audio");
}
export function fetchEtcMetrics() {
  return fetchJson("/api/aa/etc");
}
