import React, { useMemo, useState, useEffect } from "react";
import CTAButton from "../components/CTAButton";
import platformsData from "../data/platforms.json";
import "./AudioPage.css";

/* =========================
   AUDIO SECTION
   ========================= */

// AUDIO 필터링 함수
function getAudioPlatforms() {
  const list = platformsData?.platforms ? platformsData.platforms : [];

  const byModality = list.filter((p) => {
    const m = p?.modality;
    if (Array.isArray(m)) return m.some((x) => String(x).toLowerCase() === "audio");
    if (typeof m === "string") return m.toLowerCase().includes("audio");
    return false;
  });

  if (byModality.length > 0) return byModality;

  return list.filter(
    (p) => String(p?.category || "").toLowerCase().includes("audio")
  );
}

function AudioPage() {
  const audioPlatforms = useMemo(() => getAudioPlatforms(), []);
  const items = audioPlatforms.slice(0, 6);
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);

  // 오버 클릭 시 설명창 닫기
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!selectedPlatformId) return;

      const clickedElement = e.target;
      const isVisitButton = clickedElement.closest('.visit-button');
      const isDescription = clickedElement.closest('.cta-description');
      const isCtaButton = clickedElement.closest('.cta');

      if (!isVisitButton && !isDescription && !isCtaButton) {
        setSelectedPlatformId(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [selectedPlatformId]);

  const handlePlatformClick = (platform) => {
    const newId = platform?.id || platform.name;
    if (selectedPlatformId === newId) {
      setSelectedPlatformId(null);
    } else {
      setSelectedPlatformId(newId);
    }
  };

  return (
    <section className="audiosection">
      <div className="wrap center">
        <h2 className="title">AUDIO</h2>

        <div className="audio">
          <div className="audiobox">
            <audio controls controlsList="nodownload noplaybackrate" className="audioplayer">
              <source src="/sample.mp3" type="audio/mpeg" />
              브라우저가 오디오 태그를 지원하지 않습니다.
            </audio>
          </div>
        </div>
      </div>

      <div className="band">
        <div className="bandin center">
          <div className="ctascroll" role="region" aria-label="AUDIO CTA">
            {items.map((p) => (
              <CTAButton
                key={p.id ?? p.name}
                item={p}
                fallbackLabel="AUDIO CTA"
                onClick={() => handlePlatformClick(p)}
                isSelected={selectedPlatformId === (p?.id || p?.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AudioPage;