import React, { useMemo, useState, useEffect } from "react";
import CTAButton from "../components/CTAButton";
import RecommendationCard from "../components/RecommendationCard";
import MetricPanel from "../components/MetricPanel";
import {
  fetchLlmMetrics,
  fetchImageMetrics,
  fetchVideoMetrics,
  fetchAudioMetrics,
  fetchEtcMetrics,
} from "../api/artificialAnalysis";
import platformsData from "../data/platforms.json";
import "./CategoryPage.css";


function getVideoPlatforms() {
  const list = platformsData?.platforms ? platformsData.platforms : [];

  const byModality = list.filter((p) => {
    const m = p?.modality;
    if (Array.isArray(m)) return m.some((x) => String(x).toLowerCase() === "video");
    if (typeof m === "string") return m.toLowerCase().includes("video");
    return false;
  });

  if (byModality.length > 0) return byModality;

  return list.filter(
    (p) => typeof p?.category === "string" && p.category.includes("영상")
  );
}

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

// CategoryPage 내부 정의
function RecommendationCards({ topPlatforms }) {
  return (
    <div className="recommendation-cards">
      <div className="recommendation-grid">
        {topPlatforms.map((platform) => (
          <RecommendationCard key={platform.id || platform.name} platform={platform} />
        ))}
      </div>
    </div>
  );
}

// fetcher 함수 (카테고리별 API 호출)
function getFetcher(category) {
  if (category === "LLM") return fetchLlmMetrics;
  if (category === "IMAGE") return fetchImageMetrics;
  if (category === "VIDEO") return fetchVideoMetrics;
  if (category === "AUDIO") return fetchAudioMetrics;
  if (category === "ETC") return fetchEtcMetrics;
  return null;
}

// props에 onGuideStart 추가
function CategoryPage({ categoryname, onGuideStart }) {
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);
  const [topPlatforms, setTopPlatforms] = useState([]);

  const getPlatformsByCategory = useMemo(() => {
    switch(categoryname) {
      case "LLM":
        return getLlmPlatforms();
      case "IMAGE":
        return getImagePlatforms();
      case "VIDEO":
        return getVideoPlatforms();
      case "AUDIO":
        return getAudioPlatforms();
      case "ETC":
        return getEtcPlatforms();
      default:
        return [];
    }
  }, [categoryname]);

  // 오버 클릭 시 설명창 닫기
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!selectedPlatformId) return;

      const clickedElement = e.target;
      const isVisitButton = clickedElement.closest('.visit-button');
      const isDescription = clickedElement.closest('.cta-description');
      const isCtaButton = clickedElement.closest('.cta');
      const isGuideButton = clickedElement.closest('.guide-button'); // 가이드 버튼도 추가

      if (!isVisitButton && !isDescription && !isCtaButton && !isGuideButton) {
        setSelectedPlatformId(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [selectedPlatformId]);

  // 추천 카드 데이터 가져오기
  useEffect(() => {
    // LLM과 ETC 카테고리 추천 제한
    if (categoryname === "LLM" || categoryname === "ETC") {
      setTopPlatforms([]);
      return;
    }

    const fetcher = getFetcher(categoryname);
    if (!fetcher) return;

    let alive = true;
    setTopPlatforms([]);

    fetcher().then((res) => {
      if (!alive) return;
      const list = Array.isArray(res) ? res : res?.data ?? [];

      // artificialAnalysis 상위 3개 플랫폼 서치
      if (list.length > 0) {
        const sortedRankings = [...list]
          .filter(x => {
            if (!x?.name) return false;
            if (categoryname === "VIDEO") {
              const name = String(x.name).toLowerCase();
              return !(name.includes("(no audio)") || name.includes("no audio"));
            }
            return true;
          })
          .sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0))
          .slice(0, 3);

        // 랭킹 데이터와 플랫폼 데이터 연결
        const matchedPlatforms = sortedRankings.map(rankItem => {
          const found = getPlatformsByCategory.find(p =>
            p.name === rankItem.name ||
            p.id === rankItem.id ||
            String(p.name).toLowerCase().includes(String(rankItem.name).toLowerCase())
          );

          if (found) {
            return { ...found, elo: rankItem.elo };
          } else {
            // JSON에 없는 경우 기본 구조 생성
            return {
              id: rankItem.name || `rank-${Math.random()}`,
              name: rankItem.name || "랭킹 AI",
              description: `이 AI는 ${categoryname} 카테고리에서 높은 순위를 기록하고 있습니다.`,
              url: null,
              image_url: null,
              elo: rankItem.elo,
              isFromRanking: true
            };
          }
        });

        setTopPlatforms(matchedPlatforms);
      }
    });

    return () => {
      alive = false;
    };
  }, [categoryname, getPlatformsByCategory]);

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
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 100);
    }
  };

  return (
    <section className="categorysection">
      <div className="wrap center">
        <div>
          <MetricPanel category={categoryname} />
        </div>
        {categoryname !== "LLM" && categoryname !== "ETC" && topPlatforms.length > 0 && (
          <RecommendationCards topPlatforms={topPlatforms} />
        )}

        <h2 className="title">{categoryname}</h2>

        <div className="ctagrid">
          {getPlatformsByCategory.map((p) => (
            <CTAButton
              key={p.id ?? p.name}
              item={p}
              fallbackLabel={`${categoryname} CTA`}
              onClick={() => handlePlatformClick(p)}
              isSelected={selectedPlatformId === (p?.id || p?.name)}
              onGuide={onGuideStart} // onGuideStart prop을 onGuide로 전달
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPage;