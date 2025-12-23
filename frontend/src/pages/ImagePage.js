import React, { useMemo, useState, useEffect } from "react";
import CTAButton from "../components/CTAButton";
import platformsData from "../data/platforms.json";
import "./ImagePage.css";

/* =========================
   IMAGE SECTION
   ========================= */

// IMAGE 필터링 함수
function getImagePlatforms() {
  const list = platformsData?.platforms ? platformsData.platforms : [];

  const byModality = list.filter((p) => {
    const m = p?.modality;
    if (Array.isArray(m)) return m.some((x) => String(x).toLowerCase() === "image");
    if (typeof m === "string") return m.toLowerCase().includes("image");
    return false;
  });

  if (byModality.length > 0) return byModality;

  return list.filter(
    (p) => String(p?.category || "").toLowerCase().includes("image")
  );
}

function ImagePage({ selectable = true }) { // selectable prop 추가, 기본값 true
  const imagePlatforms = useMemo(() => getImagePlatforms(), []);
  const leftItems = imagePlatforms.slice(0, 3);
  const rightItems = imagePlatforms.slice(3, 6);
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);

  // 오버 클릭 시 설명창 닫기 - selectable -> true
  useEffect(() => {
    if (!selectable) return; 

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
  }, [selectedPlatformId, selectable]);

  const handlePlatformClick = (platform) => {
    if (!selectable) return; 

    const newId = platform?.id || platform.name;
    if (selectedPlatformId === newId) {
      setSelectedPlatformId(null);
    } else {
      setSelectedPlatformId(newId);
    }
  };

  return (
    <section className="imagesection">
      <div className="wrap center">
        <h2 className="title">IMAGE</h2>
      </div>

      <div className="image">
        <div className="imagein imagegrid">
          <div className="imageleft">
            <div className="box imagebox">IMAGE BOX</div>

            <div className="ctalayout">
              {leftItems.map((p) => (
                <CTAButton
                  key={p.id ?? p.name}
                  item={p}
                  fallbackLabel="IMAGE CTA"
                  onClick={() => handlePlatformClick(p)}
                  isSelected={selectable && selectedPlatformId === (p?.id || p?.name)} // selectable이 false면 항상 false
                />
              ))}
            </div>
          </div>

          <div className="imageright">
            <div className="ctalayout">
              {rightItems.map((p) => (
                <CTAButton
                  key={p.id ?? p.name}
                  item={p}
                  fallbackLabel="IMAGE CTA"
                  onClick={() => handlePlatformClick(p)}
                  isSelected={selectable && selectedPlatformId === (p?.id || p?.name)} // selectable이 false면 항상 false
                />
              ))}
            </div>

            <div className="box imagebox imageboxbottom">IMAGE BOX</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ImagePage;