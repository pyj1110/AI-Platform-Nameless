import React, { useLayoutEffect, useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import BorderBeam from "./components/BorderBeam";
import AuthModal from "./components/AuthModal";
import "./App.css";
import LlmPage from "./pages/LlmPage";
import ImagePage from "./pages/ImagePage";
import VideoPage from "./pages/VideoPage";
import AudioPage from "./pages/AudioPage";
import CategoryPage from "./pages/CategoryPage";
import PromptNodePage from "./pages/PromptNodePage";
import GuideInstallModal from "./components/GuideInstallModal";
import Mypage from "./pages/Mypage";

/* =========================
   HEADER
   ========================= */
function Header({ user, onLoginClick, onLogout, onGoMypage, onGoHome, hidden = false }) {
  const [lang, setLang] = useState("KO");

  const changeLang = (value) => {
    setLang(value);
    console.log("선택된 언어:", value);
  };

  const displayName =
    user?.name || user?.username || user?.display_name || user?.displayName || "USER";
  const email = user?.email || user?.user_email || user?.mail || "";

  const getInitials = (name) => {
    const cleaned = String(name || "").trim();
    if (!cleaned) return "U";
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
    return (first + second).toUpperCase();
  };

  const avatarInitials = getInitials(displayName);

  return (
    <header className={`header ${hidden ? "headerHidden" : ""}`}>
      <div className="wrap headerin">
        <div className="headerleft">
          <div className="headerlogo" onClick={onGoHome} role="button" tabIndex={0}>LOGO</div>
        </div>

        <div className="headerright">
          <div className="dropdown">
            <button
              className="headertxt"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="Language selector"
            >
              <i className="bi bi-globe"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={() => changeLang("KO")}>
                  한국어
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => changeLang("EN")}>
                  English
                </button>
              </li>
            </ul>
          </div>

          {!user ? (
            <button className="headertxt" type="button" onClick={onLoginClick}>
              로그인
            </button>
          ) : (
            <div className="dropdown">
              <button
                className="headertxt"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="User menu"
                style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
              >
                {/* 프로필 사진 이니셜 아바타 */}
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                >
                  {avatarInitials}
                </span>

                {/* 로그인 사용자 이름 표시 */}
                <span style={{ fontSize: 14, letterSpacing: 0.2 }}>{displayName}</span>
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <div className="dropdown-item-text" 
                  style={{ padding: "10px 16px", 
                  opacity: 0.85,
                  color: "rgba(255,255,255,0.9)", }}>
                    {email}
                  </div>
                </li>

                <li>
                  <hr
                    className="dropdown-divider"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}/>
                </li>

                <li>
                  <button className="dropdown-item" type="button" onClick={onGoMypage}>
                    mypage
                  </button>
                </li>
                
                {/* Plan & Billing */}
                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    disabled
                    aria-disabled="true"
                    style={{ opacity: 0.55, 
                    cursor: "not-allowed",
                    color: "rgba(255,255,255,0.75)",
                    background: "transparent",}}
                  >
                    plan&amp;billing
                  </button>
                </li>

                <li><hr className="dropdown-divider" /></li>

                <li>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={onLogout}
                    style={{ color: "#ff4d4d" }}
                  >
                    로그아웃
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* =========================
   MAIN SECTION
   ========================= */

function Main({ onOpenPromptNode }) {
  return (
    <section className="main">
      <video
        className="mainVideoBg"
        src="/static/video/ai_graphic.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="mainContent">
        <div className="wrap mainin">
          <div className="mainlogo">MAIN LOGO</div>

          <div className="search">
            <BorderBeam
              duration={4}
              beamSize={16}
              borderWidth={1}
              radiusPx={18}
              color="#ffffff"
            />
            <Form.Control
              placeholder="Search..."
              aria-label="Search"
              className="searchin"
            />
          </div>

          <div className="maintext">
            <div className="text">CONTENTS TEXT</div>
            <div id="metric-anchor" className="mainbtns">
              <button className="mainbtn" type="button" onClick={onOpenPromptNode}>PROMPT NODE</button>
              <button className="mainbtn" type="button">PROMPT SET</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Menu({ menuselect, onmenuclick }) {
  return (
    <nav className="menu">
      <div className="menuline" />
      <div className="wrap menuin">
        <div className="menuitems">
          <span className={`menuitem ${menuselect === "ALL" ? "active" : ""}`} onClick={() => onmenuclick("ALL")}>
            ALL
          </span>
          <span className={`menuitem ${menuselect === "LLM" ? "active" : ""}`} onClick={() => onmenuclick("LLM")}>
            LLM
          </span>
          <span className={`menuitem ${menuselect === "IMAGE" ? "active" : ""}`} onClick={() => onmenuclick("IMAGE")}>
            IMAGE
          </span>
          <span className={`menuitem ${menuselect === "VIDEO" ? "active" : ""}`} onClick={() => onmenuclick("VIDEO")}>
            VIDEO
          </span>
          <span className={`menuitem ${menuselect === "AUDIO" ? "active" : ""}`} onClick={() => onmenuclick("AUDIO")}>
            AUDIO
          </span>
          <span className={`menuitem ${menuselect === "ETC" ? "active" : ""}`} onClick={() => onmenuclick("ETC")}>
            ETC
          </span>
        </div>
      </div>
      <div className="menuline" />
    </nav>
  );
}

/* =========================
   FOOTER
   ========================= */
function Footer() {
  return (
    <footer className="footer">
      <div className="footerin">
        <div className="wrap footerrow">
          <div className="footerleft">
            <div className="footerlogo">LOGO</div>
          </div>

          <div className="footermenu">
            <span className="footertxt">ALL</span>
            <span className="footertxt">LLM</span>
            <span className="footertxt">IMAGE</span>
            <span className="footertxt">VIDEO</span>
            <span className="footertxt">AUDIO</span>
          </div>

          <div className="footerright">
            <div className="snslogo">
              <div className="snslogo">
                <span aria-label="YouTube">
                  <i className="bi bi-youtube"></i>
                </span>

                <span aria-label="Facebook">
                  <i className="bi bi-facebook"></i>
                </span>

                <span aria-label="X">
                  <i className="bi bi-twitter-x"></i>
                </span>

                <span aria-label="instagram">
                  <i className="bi bi-instagram"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footercopy">
        <div className="wrap copy">@2025 All right reserved</div>
      </div>
    </footer>
  );
}

/* =========================
   APP
   ========================= */
export default function App() {
  const [menuselect, setmenuselect] = useState("ALL");

  // 로그인 모달/유저 상태 추가
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState(null);

  // 페이지 상태 추가 (HOME / PROMPT_NODE / MYPAGE)
  const [page, setPage] = useState("HOME");

  // 확장프로그램 설치 여부 감지 + 설치 안내 모달
  const [guideExtensionReady, setGuideExtensionReady] = useState(false);
  const [guideInstallOpen, setGuideInstallOpen] = useState(false);

  /* =========================
   최성민 START
   ========================= */
  
  // 로그인 상태 복구 & 카카오 OAuth Redirect 처리 
    useEffect(() => {
  // URL 쿼리에서 access_token 추출 (카카오 OAuth Redirect 직후)
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("access_token");

  // localStorage에 저장된 access_token (기존 로그인 유지용)
  const tokenFromStorage = localStorage.getItem("access_token");

  // URL 토큰 우선, 없으면 저장된 토큰 사용
  const token = tokenFromUrl || tokenFromStorage;
  if (!token) return; // 로그인 정보 없음 → 종료

  // 카카오 로그인으로 전달된 토큰이면 localStorage에 저장
  if (tokenFromUrl) {
    localStorage.setItem("access_token", tokenFromUrl);

    // 주소창에서 토큰 제거 (보안 및 URL 정리 목적)
    window.history.replaceState({}, "", "/");
  }

  // access_token으로 현재 로그인 사용자 정보 조회
  fetch("http://localhost:5000/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      if (data?.user) {
        // 로그인 상태 복구 → Header, Mypage 등 즉시 반영
        setUser(data.user);
      }
    });
}, []);

/* =========================
   최성민 END
   ========================= */



  function onmenuclick(categoryname) {
    setmenuselect(categoryname);
  }

    function goHome() {
    setPage("HOME");
    setmenuselect("ALL");     
    window.scrollTo(0, 0);   
  }

  /* ======== PromptNode -> Main ======= */

  // HOME 상태 시 기존 스크롤 동작
  useLayoutEffect(() => {
    if (page !== "HOME") return;
    if (menuselect === "ALL") return;
    const el = document.getElementById("metric-anchor");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [menuselect, page]);

  function openAuth() {
    setAuthOpen(true);
  }

  function logout() {
    window.localStorage.removeItem("access_token");
    window.sessionStorage.removeItem("access_token");
    setUser(null);
    setPage("HOME"); 
  }

  // PROMPT NODE 페이지 이동/복귀
  function openPromptNodePage() {
    setPage("PROMPT_NODE");
  }

  function backToHome() {
    setPage("HOME");
  }

  function goMypage() {
    if (!user) {
      openAuth();
      return;
    }
    setPage("MYPAGE");
  }

  /* ======== PromptNode  ======= */

  // 확장프로그램이 "설치됨" 신호를 보내면 ready 처리
  useEffect(() => {
    function handleExtensionReadyMessage(e) {
      if (!e?.data) return;
      if (e.data.type === "AI_GUIDE_EXTENSION_READY") {
        setGuideExtensionReady(true);
      }
    }
    window.addEventListener("message", handleExtensionReadyMessage);
    return () => window.removeEventListener("message", handleExtensionReadyMessage);
  }, []);

  // ChatGPT 가이드 시작
  function startChatGptGuide(platform) {
    const raw = String(platform?.url || "https://chatgpt.com");
    const base = raw.split("#")[0];
    const guideUrl = `${base}#aiguide=chatgpt&v=1`;

    window.open(guideUrl, "_blank", "noopener,noreferrer");

    // 확장 미설치면 안내 모달
    if (!guideExtensionReady) {
      setGuideInstallOpen(true);
    }
  }

  return (
    <div className="app">
      <Header
        user={user}
        onLoginClick={openAuth}
        onLogout={logout}
        onGoMypage={goMypage}
        onGoHome={goHome}
        hidden={page === "PROMPT_NODE"}
      />

      {page === "PROMPT_NODE" ? (
        <main className="nodeMain">
          <PromptNodePage onBack={backToHome} />
        </main>
      ) : page === "MYPAGE" ? (
        <main>
          <Mypage user={user} />
        </main>
      ) : (
        <main>
          {/* PROMPT NODE 클릭 시 openPromptNodePage */}
          <Main onOpenPromptNode={openPromptNodePage} />
          <Menu menuselect={menuselect} onmenuclick={onmenuclick} />

          {menuselect === "ALL" ? (
            <>
              {/* LLM과 IMAGE는 selectable={false}로 설정 */}
              <LlmPage onGuideStart={startChatGptGuide} selectable={false} />
              <ImagePage selectable={false} />
              {/* VIDEO와 AUDIO는 selectable={true}로 설정 */}
              <VideoPage selectable={true} />
              <AudioPage selectable={true} />
            </>
          ) : (
            <CategoryPage categoryname={menuselect} onGuideStart={startChatGptGuide} />
          )}
        </main>
      )}

      {page !== "PROMPT_NODE" && <Footer />}

      {/* 확장프로그램 설치 안내 모달 */}
      <GuideInstallModal
        show={guideInstallOpen}
        onHide={() => setGuideInstallOpen(false)}
      />

      <AuthModal
        show={authOpen}
        onHide={() => setAuthOpen(false)}
        onAuthed={(u) => setUser(u)}
      />
    </div>
  );
}
