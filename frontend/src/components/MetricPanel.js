import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLlmMetrics,
  fetchImageMetrics,
  fetchVideoMetrics,
  fetchAudioMetrics,
  fetchEtcMetrics,
} from "../api/artificialAnalysis";
import "./MetricPanel.css";

/* ------------------ fetcher ------------------ */
function getFetcher(category) {
  if (category === "LLM") return fetchLlmMetrics;
  if (category === "IMAGE") return fetchImageMetrics;
  if (category === "VIDEO") return fetchVideoMetrics;
  if (category === "AUDIO") return fetchAudioMetrics;
  if (category === "ETC") return fetchEtcMetrics;
  return null;
}

/* ------------------ title ------------------ */
function getTitle(category) {
  if (category === "LLM") return "LLM 인공지능 분석 지수";
  if (category === "IMAGE") return "IMAGE 품질 분석 ELO";
  if (category === "VIDEO") return "VIDEO 품질 분석 ELO";
  if (category === "AUDIO") return "AUDIO 품질 분석 ELO";
  return "";
}
/* =================송정민================ */
/* ------------------ utils ------------------ */
function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

// LLM 스케일 범위
function buildLlmScale(values) {
  return { min: 0, max: 100 };
}

// IMAGE) 스케일 범위
function buildImageScale(values) {
  return { min: 0, max: 1400 };
}

// VIDEO) 스케일 범위
function buildVideoScale(values) {
  return { min: 0, max: 1400 };
}

// AUDIO 스케일 범위
function buildAudioScale(values) {
  return { min: 0, max: 1400 };
}

function normalize(v, scale) {
  if (!isNumber(v)) return 0;
  const normalized = (v - scale.min) / (scale.max - scale.min || 1);
  // 0~1 범위로 제한
  return Math.max(0, Math.min(1, normalized));
}
/* =================송정민================ */
/* ------------------ drag paging ------------------ */
function useDragPaging(totalPages, pageIndex, setPageIndex) {
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    decided: false,
  });

  const onPointerDown = (e) => {
    if (totalPages <= 1) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.decided = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    if (dragRef.current.decided) return;

    const dx = e.clientX - dragRef.current.startX;

    if (Math.abs(dx) < 42) return;

    dragRef.current.decided = true;

    if (dx < 0) {
      setPageIndex((p) => Math.min(totalPages - 1, p + 1));
    } else {
      setPageIndex((p) => Math.max(0, p - 1));
    }
  };

  const onPointerUp = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    dragRef.current.decided = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}

/* =========================================================
   공통 API
========================================================= */
function PagedRankList({ pages, getValue, category }) {
  const [pageIndex, setPageIndex] = useState(0);

  // 각 페이지별 스케일 계산
  const pageScales = useMemo(() => {
    return pages.map(page => {
      const values = page.items.map(item => getValue(item));

      // 카테고리 스케일 함수
      if (category === "LLM") return buildLlmScale(values);
      if (category === "IMAGE") return buildImageScale(values);
      if (category === "VIDEO") return buildVideoScale(values);
      if (category === "AUDIO") return buildAudioScale(values);

      return { min: 0, max: 1 };
    });
  }, [pages, getValue, category]);

  useEffect(() => {
    setPageIndex(0);
  }, [pages]);

  const totalPages = pages.length;
  const dragHandlers = useDragPaging(totalPages, pageIndex, setPageIndex);

  const translatePct = totalPages > 0 ? (pageIndex * 100) / totalPages : 0;

  return (
    <>
      <div className="eloSlider" {...dragHandlers}>
        <div
          className="eloSliderTrack"
          style={{ transform: `translateX(-${translatePct}%)` }}
        >
          {pages.map((page, p) => {
            const scale = pageScales[p];

            return (
              <div key={p} className="eloSlide">
                <div className="eloPageTitle">{page.title}</div>

                {page.items.map((item, i) => {
                  const v = getValue(item);
                  const ratio = normalize(v, scale) * 100;

                  return (
                    <div key={i} className="eloRow">
                      <div className="eloName">{item.name}</div>
                      <div className="eloBar">
                        <div className="eloBarFill" style={{ width: `${ratio}%` }} />
                      </div>
                      <div className="eloValue">{isNumber(v) ? v : "N/A"}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="eloIndicators">
        {pages.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`eloDot ${pageIndex === i ? "active" : ""}`}
            onClick={() => setPageIndex(i)}
            aria-label={`page-${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}

/* =========================================================
   IMAGE / VIDEO / AUDIO
========================================================= */
function PagedEloList({ items, category }) {
  const top9 = useMemo(() => items.slice(0, 9), [items]);

  const pages = useMemo(() => {
    return [0, 1, 2].map((p) => ({
      title: `RANKING ${p + 1}`,
      items: top9.slice(p * 3, p * 3 + 3),
    }));
  }, [top9]);

  return <PagedRankList
    pages={pages}
    getValue={(x) => x.elo}
    category={category}
  />;
}

/* =========================================================
   LLM
========================================================= */
function PagedLlmList({ items }) {
  const pages = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];

    const top3By = (key) =>
      [...safe]
        .sort((a, b) => (b?.[key] ?? 0) - (a?.[key] ?? 0))
        .slice(0, 3)
        .map((x) => ({ name: x?.name ?? "LLM", value: x?.[key] }));

    return [
      { title: "지능 지수", items: top3By("intelligence_index") },
      { title: "코딩 지수", items: top3By("coding_index") },
      { title: "수학 지수", items: top3By("math_index") },
    ];
  }, [items]);

  return <PagedRankList pages={pages} getValue={(x) => x.value} category="LLM" />;
}

/* ========================================================= */

export default function MetricPanel({ category }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetcher = getFetcher(category);
    if (!fetcher) return;

    let alive = true;
    setData(null);

    fetcher().then((res) => {
      if (!alive) return;
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setData(list);
    });

    return () => {
      alive = false;
    };
  }, [category]);

  const isEtcHidden = category === "ETC";
  if (isEtcHidden) return null;

  return (
    <div className="metricPanel">
      <h2 className="metricTitle">{getTitle(category)}</h2>

      {!data && <div className="loading">Loading…</div>}

      {data && category !== "LLM" && (
        <PagedEloList
          items={
            [...data]
              .filter((x) => {
                if (category !== "VIDEO") return true;
                const name = String(x?.name ?? "").toLowerCase();
                return !(name.includes("(no audio)") || name.includes("no audio"));
              })
              .sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0))
              .slice(0, 9)
          }
          category={category}
        />
      )}

      {data && category === "LLM" && <PagedLlmList items={data} />}
    </div>
  );
}