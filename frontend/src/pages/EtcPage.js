import React, { useMemo, useState } from "react";
import CTAButton from "../components/CTAButton";
import platformsData from "../data/platforms.json";
import "./EtcPage.css";

function getEtcPlatforms() {
  const list = platformsData?.platforms ? platformsData.platforms : [];

  const byModality = list.filter((p) => {
    const m = p?.modality;
    if (Array.isArray(m)) {
      return m.some((x) => String(x).toLowerCase() === "etc");
    }
    if (typeof m === "string") {
      return m.toLowerCase() === "etc" || m.toLowerCase().includes("etc");
    }
    return false;
  });
  if (byModality.length > 0) return byModality;
  return list.filter((p) => String(p?.category || "").toLowerCase().includes("etc"));
}

function EtcPage() {
  const etcPlatforms = useMemo(() => getEtcPlatforms(), []);
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);

  const handlePlatformClick = (platform) => {
    const newId = platform?.id || platform.name;
    if (selectedPlatformId === newId) {
      setSelectedPlatformId(null);
    } else {
      setSelectedPlatformId(newId);

      setTimeout(() => {
        const element = document.getElementById(`platform-${newId}`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }, 100);
    }
  };

  return (
    <section className="etcsection">
      <div className="wrap center">
        {/* MetricPanel 제거됨 */}
        <h2 className="title">ETC</h2>

        <div className="ctagrid">
          {etcPlatforms.map((p) => (
            <CTAButton
              key={p.id ?? p.name}
              item={p}
              fallbackLabel="ETC CTA"
              onClick={() => handlePlatformClick(p)}
              isSelected={selectedPlatformId === (p?.id || p?.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default EtcPage;
