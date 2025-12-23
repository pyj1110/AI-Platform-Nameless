import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import CTAButton from "../components/CTAButton";
import platformsData from "../data/platforms.json";
import "./VideoPage.css";

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

function VideoPage() {
  const videoPlatforms = useMemo(() => getVideoPlatforms(), []);
  const scrollContainerRef = useRef(null);
  const scrollContentRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);

  const dragStartXRef = useRef(0);
  const scrollStartXRef = useRef(0);
  const isClickRef = useRef(false);
  const clickStartXRef = useRef(0);
  const clickStartYRef = useRef(0);
  const animationFrameRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const dragDistanceRef = useRef(0);
  const DRAG_THRESHOLD = 10;

  const isDescriptionOpen = useMemo(() => {
    return selectedPlatformId !== null;
  }, [selectedPlatformId]);

  const resetDragState = useCallback(() => {
    setIsDragging(false);
    isClickRef.current = false;
    dragDistanceRef.current = 0;

    const container = scrollContainerRef.current;
    if (container) {
      container.style.cursor = 'grab';
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isDescriptionOpen) {
      resetDragState();
    }
  }, [isDescriptionOpen, resetDragState]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!selectedPlatformId) return;

      const clickedElement = e.target;
      const isVisitButton = clickedElement.closest('.video-visit-button');

      if (!isVisitButton) {
        setSelectedPlatformId(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [selectedPlatformId]);

  const handlePlatformClick = (platform) => {
    const newId = platform?.id || platform.name;

    if (isDragging) {
      return;
    }

    setSelectedPlatformId(prevId => prevId === newId ? null : newId);
  };

  const handleMouseDown = (e) => {
    if (isDescriptionOpen) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    clickStartXRef.current = e.clientX;
    clickStartYRef.current = e.clientY;
    isClickRef.current = true;
    dragDistanceRef.current = 0;
    setIsDragging(false);

    const container = scrollContainerRef.current;
    if (!container) return;

    dragStartXRef.current = e.clientX;
    scrollStartXRef.current = container.scrollLeft;
    container.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (isDescriptionOpen) return;
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    if (isClickRef.current) {
      const moveX = Math.abs(e.clientX - clickStartXRef.current);
      dragDistanceRef.current = moveX;

      if (dragDistanceRef.current > DRAG_THRESHOLD) {
        isClickRef.current = false;
        setIsDragging(true);
      }
    }

    if (isDragging) {
      const dragDistance = dragStartXRef.current - e.clientX;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        container.scrollLeft = scrollStartXRef.current + dragDistance;
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      const container = scrollContainerRef.current;
      if (container) {
        container.style.cursor = 'grab';
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      dragDistanceRef.current = 0;
      isClickRef.current = false;
    } else {
      isClickRef.current = false;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    handleMouseUp();
    startAutoScroll();
  };

  const startAutoScroll = useCallback(() => {
    if (isDescriptionOpen || !scrollContainerRef.current || !scrollContentRef.current || isHovered || isDragging) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const container = scrollContainerRef.current;
    const content = scrollContentRef.current;
    const singleSetWidth = content.scrollWidth / 3;

    const scrollAnimation = () => {
      if (isDescriptionOpen || isHovered || isDragging || !container || !content) {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
        return;
      }

      container.scrollLeft += 0.5;

      if (container.scrollLeft >= singleSetWidth * 2) {
        container.scrollLeft = container.scrollLeft - singleSetWidth;
      }
    };

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    autoScrollIntervalRef.current = setInterval(scrollAnimation, 16);
  }, [isDescriptionOpen, isHovered, isDragging]);

  useEffect(() => {
    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [startAutoScroll]);

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalMouseMove = (e) => handleMouseMove(e);

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, isDescriptionOpen]);

  const triplicatedVideoPlatforms = [...videoPlatforms, ...videoPlatforms, ...videoPlatforms];

  return (
    <section className="videosection">
      <div className="wrap center">
        <h2 className="title">VIDEO</h2>
        <div className="box videobox">VIDEO BOX</div>
      </div>

      <div className="band">
        <div className="bandin center">
          <div
            className={`video-infinite-scroll-container ${isDragging ? 'dragging' : ''}`}
            ref={scrollContainerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            role="region"
            aria-label="비디오 AI 플랫폼 무한 스크롤"
            style={{
              cursor: isDescriptionOpen ? 'default' : (isDragging ? 'grabbing' : 'grab'),
            }}
          >
            <div
              className="video-infinite-scroll-content"
              ref={scrollContentRef}
            >
              {triplicatedVideoPlatforms.map((p, index) => {
                const platformId = p?.id || p.name;
                const isSelected = selectedPlatformId === platformId;

                return (
                  <div key={`${p.id ?? p.name}-${index}`} className="video-cta-container">
                    <button
                      className={`cta ${isSelected ? 'selected' : ''}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (isSelected) {
                          setSelectedPlatformId(null);
                          return;
                        }

                        if (!isDragging && dragDistanceRef.current <= DRAG_THRESHOLD) {
                          handlePlatformClick(p);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();

                        clickStartXRef.current = e.clientX;
                        clickStartYRef.current = e.clientY;
                        isClickRef.current = true;
                        dragDistanceRef.current = 0;

                        const container = scrollContainerRef.current;
                        if (!container) return;

                        dragStartXRef.current = e.clientX;
                        scrollStartXRef.current = container.scrollLeft;
                      }}
                      style={{
                        cursor: isDescriptionOpen ? 'default' : 'pointer'
                      }}
                    >
                      <span className="ctalogo">
                        {p?.image_url ? <img src={p.image_url} alt={p.name} className="ctalogoimg" /> : "AI"}
                      </span>
                      <span className="ctaname">
                        {p.name || "VIDEO CTA"}
                      </span>
                    </button>

                    {isSelected && (
                      <div
                        className="video-description"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="video-description-header">
                          <h3>{p.name}</h3>
                        </div>

                        <div className="video-description-content">
                          {p?.description ? (
                            <div className="video-description-text">
                              {p.description.split('\n').map((line, idx) => (
                                <p key={idx}>{line}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="no-description">설명이 제공되지 않았습니다.</p>
                          )}
                        </div>

                        <div className="video-description-footer">
                          {p?.url && (
                            <button
                              className="video-visit-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(p.url, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span>사이트 방문하기</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoPage;