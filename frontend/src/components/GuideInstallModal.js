import React from "react";
import "./GuideInstallModal.css";

export default function GuideInstallModal({ show, onHide }) {
  if (!show) return null;

  return (
    <div className="guide-modal-backdrop" role="dialog" aria-modal="true">
      <div className="guide-modal">
        <div className="guide-modal-header">
          <h3>ChatGPT 가이드 실행을 위해 확장 프로그램이 필요합니다</h3>
          <button className="guide-modal-close" onClick={onHide} aria-label="close">
            ×
          </button>
        </div>

        <div className="guide-modal-body">
          <p>
            현재 목표는 <b>ChatGPT 실제 사이트(chatgpt.com) 안에서</b> 가이드 UI를 띄우는 것입니다.
            브라우저 보안 정책상, 우리 웹앱(다른 도메인)에서 ChatGPT DOM을 직접 조작할 수 없기 때문에
            <b>Chrome 확장 프로그램(Content Script)이 필수</b>입니다.
          </p>

          <ol className="guide-steps">
            <li>프로젝트 루트에 <code>chrome-extension/</code> 폴더를 추가합니다.</li>
            <li>
              Chrome 주소창에 <code>chrome://extensions</code> 입력 → <b>개발자 모드</b> ON
            </li>
            <li>
              <b>압축해제된 확장 프로그램을 로드</b> → <code>chrome-extension/</code> 폴더 선택
            </li>
            <li>
              이후 우리 서비스에서 <b>ChatGPT 가이드 시작</b> 버튼을 누르면, 새 탭으로 열린 ChatGPT에서
              가이드가 자동 실행됩니다.
            </li>
          </ol>

          <p className="guide-note">
            ⚠️ 가이드는 사용자의 클릭/입력을 “대신” 하지 않고, 화면 위에 안내 UI만 올립니다.
            (무단 로그인/자동 조작/차단 우회 목적이 아니어야 합니다.)
          </p>
        </div>

        <div className="guide-modal-footer">
          <button className="guide-modal-ok" onClick={onHide}>확인</button>
        </div>
      </div>
    </div>
  );
}
