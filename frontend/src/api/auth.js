async function readErrorPayload(res) {
  try {
    const data = await res.json();
    return { json: data, text: "" };
  } catch {
    try {
      const txt = await res.text();
      return { json: null, text: txt || "" };
    } catch {
      return { json: null, text: "" };
    }
  }
}

function devFallbackBases() {
  return ["http://localhost:5001", "http://localhost:5000"];
}

async function tryFetchJsonOnce(url, options) {
  const res = await fetch(url, options);

  if (!res.ok) {
    const { json, text } = await readErrorPayload(res);

    // json_error 형식 우선
    if (json && typeof json === "object" && json.error) {
      throw new Error(String(json.error));
    }

    // HTML 500 = ko
    if (res.status >= 500) {
      throw new Error("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    throw new Error(text ? `요청 처리에 실패했습니다. (${res.status})` : `요청 처리에 실패했습니다. (${res.status})`);
  }

  return await res.json();
}

async function fetchJsonWithFallback(path, options = {}) {
  try {
    return await tryFetchJsonOnce(path, options);
  } catch (e) {
    const bases = devFallbackBases();
    let lastErr = e;
    for (const b of bases) {
      try {
        return await tryFetchJsonOnce(`${b}${path}`, options);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }
}

export async function register({ name, email, password, marketing_opt_in }) {
  return await fetchJsonWithFallback("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: (name || "").trim(),
      email,
      password,
      marketing_opt_in: !!marketing_opt_in,
    }),
  });
}

export async function login({ email, password }) {
  return await fetchJsonWithFallback("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function me(token) {
  return await fetchJsonWithFallback("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}
