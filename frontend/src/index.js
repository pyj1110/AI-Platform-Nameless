import React from 'react';
import ReactDOM from 'react-dom/client';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

  /* =========================
          최성민 START
   ========================= */

// Kakao OAuth Redirect 처리 
// URL 쿼리에서 access_token 추출
// localStorage 저장 후 쿼리 제거
const params = new URLSearchParams(window.location.search);              
const accessToken = params.get("access_token");

if (accessToken) {
  // JWT 저장 (로그인 상태 유지용)
  localStorage.setItem("access_token", accessToken);

  // URL 정리 (쿼리 제거)
  window.history.replaceState({}, document.title, "/");
}        
/* =========================
          최성민 END
   ========================= */           

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
