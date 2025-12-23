/* ChatGPT Guide Overlay */

(function () {
  const GUIDE_HASH_KEY = "aiguide";
  const GUIDE_ID = "chatgpt";
  const STORAGE_KEY = "AI_GUIDE_CHATGPT_DONE_v1";

  // hash에 aiguide=chatgpt 일 때만 실행
  function parseHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(raw);
    return {
      aiguide: params.get(GUIDE_HASH_KEY),
      v: params.get("v"),
    };
  }

  function shouldStart() {
    const p = parseHash();
    if (p.aiguide !== GUIDE_ID) return false;
    return true;
  }

  function hasDone() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setDone() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

// =========================
// UI helpers
// =========================
  const ui = {
    root: null,
    highlight: null,
    tooltip: null,
    title: null,
    body: null,
    step: null,
    next: null,
    back: null,
    skip: null,
  };

  function createUI() {
    if (ui.root) return;

    const root = document.createElement("div");
    root.id = "__ai_guide_root";
    root.innerHTML = `
      <div class="ai-guide-dim"></div>
      <div class="ai-guide-highlight" aria-hidden="true"></div>
      <div class="ai-guide-tooltip" role="dialog" aria-modal="true">
        <div class="ai-guide-badge">GUIDE</div>
        <div class="ai-guide-title"></div>
        <div class="ai-guide-body"></div>
        <div class="ai-guide-actions">
          <button class="ai-guide-btn secondary" data-act="back">이전</button>
          <button class="ai-guide-btn secondary" data-act="skip">건너뛰기</button>
          <div class="ai-guide-spacer"></div>
          <div class="ai-guide-step"></div>
          <button class="ai-guide-btn primary" data-act="next">다음</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(root);

    ui.root = root;
    ui.highlight = root.querySelector(".ai-guide-highlight");
    ui.tooltip = root.querySelector(".ai-guide-tooltip");
    ui.title = root.querySelector(".ai-guide-title");
    ui.body = root.querySelector(".ai-guide-body");
    ui.step = root.querySelector(".ai-guide-step");
    ui.next = root.querySelector('[data-act="next"]');
    ui.back = root.querySelector('[data-act="back"]');
    ui.skip = root.querySelector('[data-act="skip"]');

    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const act = t.getAttribute("data-act");
      if (!act) return;
      e.preventDefault();
      e.stopPropagation();
      controller.onAction(act);
    });

    // ESC로 종료
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") controller.finish(true);
      },
      { capture: true }
    );
  }

  function destroyUI() {
    if (!ui.root) return;
    ui.root.remove();
    ui.root = null;
  }

  function setText({ title, body, stepText, nextText }) {
    ui.title.textContent = title || "";
    ui.body.textContent = body || "";
    ui.step.textContent = stepText || "";
    ui.next.textContent = nextText || "다음";
  }

  // 화면 위치 및 크기 계산
  function rectFor(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return r;
  }

  function positionHighlight(r) {
    if (!ui.highlight || !ui.tooltip) return;

    if (!r) {
      ui.highlight.style.opacity = "0";
      return;
    }
    // 오버레이 하이라이트 박스 생성
    ui.highlight.style.opacity = "1";
    ui.highlight.style.left = `${Math.max(r.left - 6, 0)}px`;
    ui.highlight.style.top = `${Math.max(r.top - 6, 0)}px`;
    ui.highlight.style.width = `${Math.max(r.width + 12, 12)}px`;
    ui.highlight.style.height = `${Math.max(r.height + 12, 12)}px`;

    // 툴팁은 타겟 아래 우선, 공간 없으면 위
    const margin = 12;
    const tip = ui.tooltip.getBoundingClientRect();
    const belowY = r.bottom + margin;
    const aboveY = r.top - margin - tip.height;
    const canBelow = belowY + tip.height < window.innerHeight;
    const top = canBelow ? belowY : Math.max(aboveY, margin);
    const left = Math.min(
      Math.max(r.left, margin),
      Math.max(window.innerWidth - tip.width - margin, margin)
    );

    ui.tooltip.style.left = `${left}px`;
    ui.tooltip.style.top = `${top}px`;
  }

  // ----------------------------
  // Target finders (best-effort) - 타겟 추적
  // ----------------------------
  function findMessageBox() {
    // 1) 안정적인 id 기반(#prompt-textarea)
    const byId = document.querySelector("#prompt-textarea");
    if (byId) return byId;

    // 2) aria/role 기반(접근성) 후보
    const byRole =
      document.querySelector('[role="textbox"][contenteditable="true"]') ||
      document.querySelector('[contenteditable="true"][aria-label*="Message" i]') ||
      document.querySelector('[contenteditable="true"][aria-label*="메시지" i]') ||
      null;
    if (byRole) return byRole;

    // 3) placeholder 기반 textarea 후보
    const byPlaceholder =
      document.querySelector('textarea[placeholder*="Message" i]') ||
      document.querySelector('textarea[placeholder*="메시지" i]') ||
      null;
    if (byPlaceholder) return byPlaceholder;

    // 4) 버튼 기준으로 form 안에서 입력창 서치
    const send = findSendButton();
    const form = send ? send.closest("form") : null;
    if (form) {
      return (
        form.querySelector("#prompt-textarea") ||
        form.querySelector('textarea[placeholder*="Message" i]') ||
        form.querySelector('textarea[placeholder*="메시지" i]') ||
        form.querySelector("textarea") ||
        form.querySelector('[role="textbox"][contenteditable="true"]') ||
        form.querySelector('[contenteditable="true"]') ||
        null
      );
    }

    // finish fallback
    return (
      document.querySelector("textarea") ||
      document.querySelector('[contenteditable="true"]') ||
      null
    );
  }

  function findSendButton() {

    // composer 범위 함축
    const prompt =
      document.querySelector("#prompt-textarea") ||
      document.querySelector('textarea[placeholder*="Message" i]') ||
      document.querySelector('textarea[placeholder*="메시지" i]') ||
      document.querySelector('[role="textbox"][contenteditable="true"]') ||
      document.querySelector("textarea") ||
      null;

    const scope = prompt ? prompt.closest("form") || prompt.parentElement : null;

    const q = (selector) =>
      (scope ? scope.querySelector(selector) : null) ||
      document.querySelector(selector) ||
      null;

    // 1) 전송 버튼 (입력값 있을 때 생성)
    const byTestId = q('button[data-testid="send-button"]');
    if (byTestId) return byTestId;

    const byAria =
      q('button[aria-label*="Send prompt" i]') ||
      q('button[aria-label*="Send message" i]') ||
      q('button[aria-label*="Send" i]') ||
      q('button[aria-label*="전송" i]');
    if (byAria) return byAria;

    // 2) "전송 버튼으로 변환되는 위치 추적
    const voiceCandidates = [];
    const selectors = [
      'button[data-testid="composer-speech-button"]',
      'button[data-testid*="speech" i]',
      'button[data-testid*="voice" i]',
      'button[aria-label*="Voice" i]',
      'button[aria-label*="voice mode" i]',
      'button[aria-label*="Start voice" i]',
      'button[aria-label*="Conversation" i]',
      'button[aria-label*="음성" i]',
      'button[aria-label*="말하기" i]',
      'button[aria-label*="대화" i]',
      'button[aria-label*="모드" i]',
    ];

    // scope 우선 수집 부족할 시 document에서 수집
    for (const sel of selectors) {
      const elInScope = scope ? Array.from(scope.querySelectorAll(sel)) : [];
      for (const el of elInScope) voiceCandidates.push(el);
    }
    if (voiceCandidates.length === 0) {
      for (const sel of selectors) {
        const els = Array.from(document.querySelectorAll(sel));
        for (const el of els) voiceCandidates.push(el);
      }
    }

    // 보이는 버튼만 + rect 있는 버튼만 필터링
    const unique = Array.from(new Set(voiceCandidates)).filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const r = rectFor(el);
      return !!r && el.offsetParent !== null;
    });

    if (unique.length > 0) {
      // "음성 모드" / "대화" / "모드" 라벨이 있으면 우선 선택 - chatgpt (전용)
      const prefer = unique.find((el) => {
        const label = (el.getAttribute("aria-label") || "").toLowerCase();
        return (
          label.includes("voice mode") ||
          label.includes("conversation") ||
          label.includes("mode") ||
          label.includes("음성 모드") ||
          label.includes("음성대화") ||
          label.includes("대화") ||
          label.includes("모드")
        );
      });
      if (prefer) return prefer;

      let rightMost = unique[0];
      let rightMostRect = rectFor(rightMost);

      for (let i = 1; i < unique.length; i++) {
        const r = rectFor(unique[i]);
        if (r && rightMostRect && r.left > rightMostRect.left) {
          rightMost = unique[i];
          rightMostRect = r;
        }
      }
      return rightMost;
    }

    // 3) form submit 버튼 fallback
    return (
      q('form button[type="submit"]') ||
      q('button[type="submit"]') ||
      null
    );
  }

  function findNewChat() {
    return (
      document.querySelector('a[href="/"]') ||
      document.querySelector('button[aria-label*="New chat"]') ||
      document.querySelector('button[aria-label*="새 채팅"]') ||
      null
    );
  }

  function findHistory() {
    return (
      document.querySelector("nav") ||
      document.querySelector('[aria-label*="Chat history"]') ||
      document.querySelector('[aria-label*="채팅 기록"]') ||
      null
    );
  }

  // =========================
  // Controller
  // =========================
  const steps = [
    {
      key: "welcome",
      title: "ChatGPT 화면에 오버레이 가이드가 시작됐어요",
      body:
        "이 가이드는 사이트를 바꾸거나 자동으로 입력하지 않고, 화면 위에 안내만 띄웁니다. ESC로 언제든 종료할 수 있어요.",
      target: () => null,
      nextText: "시작",
    },
    {
      key: "newchat",
      title: "새 대화 시작",
      body:
        "왼쪽 상단의 'New chat(새 채팅)'을 눌러 대화를 새로 시작할 수 있어요.",
      target: findNewChat,
    },
    {
      key: "message",
      title: "질문 입력 박스",
      body:
        "여기에 질문을 입력합니다. 좋은 질문은 '목표/조건/예시/원하는 결과물'이 포함돼요.",
      target: findMessageBox,
    },
    {
      key: "send",
      title: "전송 버튼",
      body:
        "입력이 끝나면 전송을 누릅니다. 답이 길면 '요약', '표로 정리', '단계별로'처럼 후속 지시를 붙여보세요.",
      target: findSendButton,
    },
    {
      key: "history",
      title: "대화 기록",
      body:
        "왼쪽(또는 메뉴)에서 이전 대화를 다시 열 수 있어요. 중요한 대화는 제목을 바꾸거나 별도로 저장해두면 편합니다.",
      target: findHistory,
    },
    {
      key: "done",
      title: "이제 자유롭게 사용해보세요!",
      body:
        "가이드는 여기서 종료됩니다. 필요하면 다시 'ChatGPT 가이드 시작'을 눌러 실행할 수 있어요.",
      target: () => null,
      nextText: "종료",
    },
  ];

  const controller = {
    idx: 0,
    obs: null,
    running: false,

    // 위치 업데이트 타이머
    tickTimer: null,

    // observer render 디바운스
    renderTimer: null,

    start() {
      // hash 조건 아니면 실행 안 함
      if (!shouldStart()) return;
      if (this.running) return;

      // 시작 스텝 리셋
      this.idx = 0;

      this.running = true;
      window.__AI_GUIDE_CHATGPT_RUNNING__ = true;

      createUI();

      // 무거운 attributes 감시 제거
      this.obs = new MutationObserver(() => this.scheduleRender());
      this.obs.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      this.render();
      // 업데이트 시작 (200ms)
      this.startTick();
    },

    startTick() {
      if (this.tickTimer) return;

      this.tickTimer = window.setInterval(() => {
        if (!this.running) return;

        try {
          const step = steps[this.idx];
          const t = step?.target ? step.target() : null;
          const r = rectFor(t);
          positionHighlight(r);
        } catch {}
      }, 200);
    },

    stopTick() {
      if (!this.tickTimer) return;
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    },

    scheduleRender() {
      if (!this.running) return;
      if (this.renderTimer) return;

      this.renderTimer = window.setTimeout(() => {
        this.renderTimer = null;
        this.render();
      }, 120);
    },

    render() {
      if (!this.running) return;

      const step = steps[this.idx] || steps[0];

      setText({
        title: step.title,
        body: step.body,
        stepText: `${this.idx + 1} / ${steps.length}`,
        nextText: step.nextText,
      });

      ui.back.disabled = this.idx === 0;

      const t = step.target ? step.target() : null;

      if (step.key !== "welcome" && step.key !== "done" && !t) {
        ui.body.textContent =
          step.body +
          " (현재 화면에서 요소를 찾지 못했습니다. UI가 업데이트됐을 수 있어요. 그래도 '다음'으로 진행 가능합니다.)";
      }

      const r = rectFor(t);
      positionHighlight(r);
    },

    onAction(act) {
      if (!this.running) return;
      if (act === "back") this.prev();
      if (act === "next") this.next();
      if (act === "skip") this.finish(true);
    },

    next() {
      if (this.idx < steps.length - 1) {
        this.idx += 1;
        this.render();
      } else {
        this.finish(false);
      }
    },

    prev() {
      if (this.idx > 0) {
        this.idx -= 1;
        this.render();
      }
    },

    finish(bySkip) {
      // 완료 처리
      setDone();

      this.running = false;
      window.__AI_GUIDE_CHATGPT_RUNNING__ = false;

      try {
        if (this.obs) this.obs.disconnect();
      } catch {}
      this.obs = null;

      this.stopTick();

      destroyUI();

      // hash 제거(가이드 재실행 제어)
      try {
        if (location.hash) {
          history.replaceState(null, "", location.pathname + location.search);
        }
      } catch {}
    },
  };

  // 버튼 참조 
  Object.defineProperty(ui, "back", {
    get() {
      return ui.root ? ui.root.querySelector('[data-act="back"]') : null;
    },
  });

  // hash 변화 감지
  window.addEventListener("hashchange", () => {
    if (!shouldStart()) return;

    // 이미 스크립트가 올라가 있고, controller가 동작할 수 있으면 재실행
    // (이미 running이면 start()가 막아줌)
    controller.start();
  });

  // 최초 진입 시 자동 시작
  if (shouldStart()) {
    controller.start();
  }
})();
