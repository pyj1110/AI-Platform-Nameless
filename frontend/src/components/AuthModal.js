import React, { useMemo, useState } from "react";
import { Modal, Form } from "react-bootstrap";
import "./AuthModel.css";
import { login, register } from "../api/auth";

export default function AuthModal({ show, onHide, onAuthed }) {
  const [mode, setMode] = useState("login"); // login | signup

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [password2, setPassword2] = useState("");
  const [remember, setRemember] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 모달 닫힐 때 입력값 초기화
  function resetForm() {
  setMode("login");
  setName("");
  setEmail("");
  setPassword("");
  setPassword2("");
  setRemember(true);
  setMarketing(false);
  setLoading(false);
  setErr("");
}

  const title = useMemo(() => "로그인/회원가입", []);

  function resetError() {
    setErr("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    resetError();

    if (mode === "signup") {
      if (!name.trim()) return setErr("사용자 이름을 입력해주세요.");
    }

    if (!email.trim()) return setErr("이메일을 입력해주세요.");
    if (!password) return setErr("비밀번호를 입력해주세요.");

    if (mode === "signup") {
      if (!password2) return setErr("비밀번호 확인을 입력해주세요.");
      if (password !== password2) return setErr("비밀번호가 일치하지 않습니다.");
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await register({ name: name.trim(), email, password, marketing_opt_in: marketing });
      }

      const data = await login({ email, password });
      const token = data.access_token;

      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem("access_token", token);

      onAuthed?.(data.user, token);
      resetForm();
      onHide?.();
    } catch (e2) {
      setErr(e2?.message || "요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function onClose() {
    resetForm();
    onHide?.();
  }

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      dialogClassName="authDialog"
      contentClassName="authContent"
      backdropClassName="authBackdrop"
    >
      <Modal.Header closeButton className="authHeader">
        <div className="authHeaderInner">
          <Modal.Title className="authTitle">{title}</Modal.Title>
          <div className="authSubtitle">AI에 오신 것을 환영합니다.</div>
          <hr className="authTopDivider" />
        </div>
      </Modal.Header>

      <Modal.Body className="authBody">
        <div className="authTabRow">
          <button
            type="button"
            className={`authTab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              resetError();
            }}
          >
            로그인
          </button>

          <button
            type="button"
            className={`authTab ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              resetError();
            }}
          >
            회원가입
          </button>
        </div>

        <Form className="authForm" onSubmit={onSubmit}>
          {mode === "signup" && (
            <Form.Group className="authGroup">
              <Form.Label className="authLabel">사용자 이름</Form.Label>
              <Form.Control
                className="authInput"
                type="text"
                placeholder=""
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="nickname"
              />
            </Form.Group>
          )}

          <Form.Group className="authGroup">
            <Form.Label className="authLabel">이메일</Form.Label>
            <Form.Control
              className="authInput"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Form.Group>

          <Form.Group className="authGroup">
            <Form.Label className="authLabel">비밀번호</Form.Label>
            <Form.Control
              className="authInput"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Form.Group>

          {mode === "signup" && (
            <Form.Group className="authGroup">
              <Form.Label className="authLabel">비밀번호 확인</Form.Label>
              <Form.Control
                className="authInput"
                type="password"
                placeholder=""
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
              />
            </Form.Group>
          )}

          <div className="authOptionRow">
            <div className="authOptionLeft">
              {mode === "login" ? (
                <label className="authCheck">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>로그인 유지</span>
                </label>
              ) : (
                <label className="authCheck">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                  <span>프로모션/마케팅 정보 수신에 동의합니다.</span>
                </label>
              )}
            </div>

            <button
              className="authLink"
              type="button"
              onClick={() => alert("비밀번호 찾기 기능은 다음 단계에서 연결됩니다.")}
            >
              비밀번호 찾기
            </button>
          </div>

          <hr className="authDivider" />

          {err && <div className="authError">{err}</div>}

          <button className="authPrimaryBtn btn btn-primary" type="submit" disabled={loading}>
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
