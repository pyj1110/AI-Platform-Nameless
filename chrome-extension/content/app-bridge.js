// 확장 프로그램 설치 여부를 감지

(function () {
  try {
    // 중복 실행 방지
    if (window.__AI_GUIDE_EXTENSION__) return;

    window.__AI_GUIDE_EXTENSION__ = true;
    window.postMessage({ type: "AI_GUIDE_EXTENSION_READY" }, "*");
  } catch (e) {
  }
})();
