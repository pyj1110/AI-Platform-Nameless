import React, { useMemo } from "react";
import "./Mypage.css";

export default function Mypage({ user }) {
  const displayName =
    user?.name || user?.username || user?.display_name || user?.displayName || "USER";
  const email = user?.email || user?.user_email || user?.mail || "";

  const initials = useMemo(() => {
    const cleaned = String(displayName || "").trim();
    if (!cleaned) return "U";
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "U";
    const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
    return (first + second).toUpperCase();
  }, [displayName]);

  return (
    <div className="mypagePage">
      <div className="mypageBody">
        <div className="mypageAvatar" aria-hidden="true">
          {initials}
        </div>

        <h2 className="mypageUsername">{displayName}</h2>
        <p className="mypageEmail">{email}</p>

        {/* 수정하기 미구현 */}
        <button className="mypageEditBtn" type="button" >
          수정하기
        </button>

        <div className="mypageDivider" />
        <p className="mypageSectionTitle">PROMPTS</p>
        <div className="mypageDivider" />

        <div className="mypageEmptyBox">
          <p className="mypageEmptyText">생성된 프롬프트가 아직 없습니다.</p>

          {/* 프롬프트 생성 미구현 */}
          <button className="mypageCreateBtn" type="button" >
            프롬프트 생성
          </button>
        </div>
      </div>
    </div>
  );
}
