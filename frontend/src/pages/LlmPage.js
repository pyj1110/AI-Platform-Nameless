import React, { useMemo } from "react";
import CTAButton from "../components/CTAButton";
import platformsData from "../data/platforms.json";
import "./LlmPage.css";

/* =========================
   LLM SECTION
   ========================= */

// LLM 필터링 함수
function getLlmPlatforms() {
  const list = platformsData?.platforms ? platformsData.platforms : [];

  const byModality = list.filter((p) => {
    const m = p?.modality;
    if (Array.isArray(m)) return m.some((x) => String(x).toLowerCase() === "text");
    if (typeof m === "string") return m.toLowerCase().includes("text");
    return false;
  });

  if (byModality.length > 0) return byModality;

  return list.filter(
    (p) => String(p?.category || "").toLowerCase() === "llm"
  );
}

function LlmPage() {
  const llmPlatforms = useMemo(() => getLlmPlatforms(), []);
  const rowItems = llmPlatforms.slice(0, 3);
  const scrollItems = llmPlatforms.slice(0, 6);

  return (
    <section className="llmsection">
      <div className="wrap center">
        <h2 className="title">LLM</h2>

        <div className="ctarow">
          {rowItems.map((p) => (
            <CTAButton key={p.id ?? p.name} item={p} fallbackLabel="LLM CTA" />
          ))}
        </div>
      </div>

      {/*====================================================*/}
      {/* =================== 박유진 START =================== */}
      {/*================================================== */}
      <div className="band">
        <div className="bandin center">
          <div className="llm-formula-box">
            {/* 윗줄 (오른쪽으로 이동) */}
            <div className="llm-line">
              <div className="llm-track right">
                <span className="llm-seq">
                  Σ(Q·Kᵀ/√dₖ) <i>→</i> Softmax <i>→</i> Attention <i>→</i> TokenMix
                  <i>→</i> Context <i>→</i> Projection <i>→</i> MultiHeadSplit <i>→</i> Scaling
                </span>
                <span className="llm-seq">
                  Σ(Q·Kᵀ/√dₖ) <i>→</i> Softmax <i>→</i> Attention <i>→</i> TokenMix
                  <i>→</i> Context <i>→</i> Projection <i>→</i> MultiHeadSplit <i>→</i> Scaling
                </span>
                <span className="llm-seq">
                  Σ(Q·Kᵀ/√dₖ) <i>→</i> Softmax <i>→</i> Attention <i>→</i> TokenMix
                  <i>→</i> Context <i>→</i> Projection <i>→</i> MultiHeadSplit <i>→</i> Scaling
                </span>
              </div>
            </div>

            {/* 아랫줄 (왼쪽으로 이동) */}
            <div className="llm-line">
              <div className="llm-track left">
                <span className="llm-seq">
                  FN(xW₁+b₁) <i>→</i> GELU <i>→</i> Dropout <i>→</i> W₂
                  <i>→</i> ResidualAdd <i>→</i> LayerNorm <i>→</i> OutputEmbedding
                </span>
                <span className="llm-seq">
                  FN(xW₁+b₁) <i>→</i> GELU <i>→</i> Dropout <i>→</i> W₂
                  <i>→</i> ResidualAdd <i>→</i> LayerNorm <i>→</i> OutputEmbedding
                </span>
                <span className="llm-seq">
                  FN(xW₁+b₁) <i>→</i> GELU <i>→</i> Dropout <i>→</i> W₂
                  <i>→</i> ResidualAdd <i>→</i> LayerNorm <i>→</i> OutputEmbedding
                </span>
                <span className="llm-seq">
                  FN(xW₁+b₁) <i>→</i> GELU <i>→</i> Dropout <i>→</i> W₂
                  <i>→</i> ResidualAdd <i>→</i> LayerNorm <i>→</i> OutputEmbedding
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*====================================================*/}
      {/* ===================   박유진 END   =================== */}
      {/*================================================== */}

      <div className="band">
        <div className="bandin center">
          <div className="ctascroll" role="region" aria-label="LLM CTA">
            {scrollItems.map((p) => (
              <CTAButton key={p.id ?? p.name} item={p} fallbackLabel="LLM CTA" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LlmPage;