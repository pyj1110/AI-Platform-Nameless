import React from "react";
import "./CTAButton.css";

/* =================송정민================ */
/* =========================
   CTA BUTTON (기본 + 상세 설명 확장 통합)
   ========================= */
function CTAButton({
  item,
  fallbackLabel,
  onClick,
  isSelected = false,
  onGuide, // 가이드 시작 핸들러
}) {
  const title = item?.name || fallbackLabel;
  const imgSrc = item?.image_url || null;

   // ChatGPT 가이드 테스트
  const isChatGptByName = String(item?.name || "").toLowerCase() === "chatgpt";
  const isChatGptByUrl = String(item?.url || "").toLowerCase().includes("chatgpt.com");
  const isChatGpt = isChatGptByName || isChatGptByUrl || item?.guide_key === "chatgpt";
  const canGuide = Boolean(onGuide) && isChatGpt;

  // CTA STYLE 
  const ctaStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingLeft: "35px",
  };

  const logoStyle = {
    flex: "0 0 44px",
    width: "44px",
    height: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const titleStyle = {
    flex: "1 1 auto",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const logoImgStyle = {
    width: "70%",
    height: "70%",
    objectFit: "contain",
    display: "block",
  };

  return (
    <div className={`cta-container ${isSelected ? "selected" : ""}`}>
      <button
        className="cta"
        type="button"
        style={ctaStyle}
        onClick={onClick}
      >
        <span className="ctalogo" style={logoStyle}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={title}
              className="ctalogoimg"
              style={logoImgStyle}
            />
          ) : (
            "AI"
          )}
        </span>

        <span className="ctaname" style={titleStyle}>
          {title}
        </span>
      </button>

      {/* =================
          선택 시 설명 영역
         ================= */}
      {isSelected && (
        <div className="cta-description">
          <div className="description-header">
            <h3>{title}</h3>
          </div>

          <div className="description-content">
            {item?.description ? (
              <div className="description-text">
                {item.description.split("\n").map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="no-description">
                설명이 제공되지 않았습니다.
              </p>
            )}
          </div>
          {/* "사이트 방문하기*/}
          <div className="description-footer">
            {item?.url && (
              <button
                className="visit-button"
                onClick={() =>
                  window.open(item.url, "_blank", "noopener,noreferrer")
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 3H21V9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 14L21 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>사이트 방문하기</span>
              </button>
            )}

            {/* "ChatGPT 가이드 시작"*/}
            {canGuide && (
              <button
                className="guide-button"
                type="button"
                onClick={() => onGuide(item)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{item?.guide_label || "ChatGPT 가이드 시작"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/* =================송정민================ */

export default CTAButton;