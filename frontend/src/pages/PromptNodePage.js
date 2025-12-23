import React, { useEffect, useMemo, useRef, useState } from "react";
import "./PromptNodePage.css";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function PromptNodePage({ onBack }) {
  const [activeMod, setActiveMod] = useState("LLM");

  // BASIC 빈 캔버스
  const [nodes, setNodes] = useState([]);
  const edges = useMemo(() => [], []);

  // zoom/pan
  const [zoom, setZoom] = useState(1.5);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 토글 메뉴 위치/고정
  const NODE_TOPBAR_HEIGHT = 62;
  
  const [sidePos, setSidePos] = useState({x: 24,y: NODE_TOPBAR_HEIGHT + 16, });
  const [sidePinned, setSidePinned] = useState(true);

  const canvasRef = useRef(null);

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });

  const dragRef = useRef({
    dragging: false,
    id: null,
    startClient: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
  });

  const sideDragRef = useRef({
    dragging: false,
    startClient: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
  });

  const findNode = (id) => nodes.find((n) => n.id === id);

  // Node UI 진입 시 페이지 스크롤 고정
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  // Ctrl + +/- / 0 로 확대/축소
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.ctrlKey) return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => clamp(Number((z + 0.1).toFixed(2)), 0.5, 2.5));
      }

      if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), 0.5, 2.5));
      }

      if (e.key === "0") {
        e.preventDefault();
        setZoom(1.5);
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 브라우저 자체 Pinch/Zoom 차단
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const wheelBlocker = (e) => {
      // Node UI 캔버스 영역에서만 막기
      if (!el.contains(e.target)) return;

      // 트랙패드 pinch/ctrl+wheel 중 브라우저 줌 방지
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const gestureBlocker = (e) => {
      if (!el.contains(e.target)) return;
      e.preventDefault();
    };

    window.addEventListener("wheel", wheelBlocker, { passive: false });
    window.addEventListener("gesturestart", gestureBlocker, { passive: false });
    window.addEventListener("gesturechange", gestureBlocker, { passive: false });
    window.addEventListener("gestureend", gestureBlocker, { passive: false });

    return () => {
      window.removeEventListener("wheel", wheelBlocker);
      window.removeEventListener("gesturestart", gestureBlocker);
      window.removeEventListener("gesturechange", gestureBlocker);
      window.removeEventListener("gestureend", gestureBlocker);
    };
  }, []);

  // ---------- NODE DRAG ----------
  const onNodePointerDown = (e, id) => {
    e.stopPropagation();
    const n = findNode(id);
    if (!n) return;

    dragRef.current.dragging = true;
    dragRef.current.id = id;
    dragRef.current.startClient = { x: e.clientX, y: e.clientY };
    dragRef.current.startPos = { x: n.x, y: n.y };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  // ---------- 마우스 드래그 패닝 ----------
  const onCanvasPointerDown = (e) => {
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOriginRef.current = { x: pan.x, y: pan.y };
  };

  const onCanvasPointerMove = (e) => {
    // 노드 드래그
    if (dragRef.current.dragging && dragRef.current.id) {
      const dx = (e.clientX - dragRef.current.startClient.x) / zoom;
      const dy = (e.clientY - dragRef.current.startClient.y) / zoom;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragRef.current.id
            ? { ...n, x: dragRef.current.startPos.x + dx, y: dragRef.current.startPos.y + dy }
            : n
        )
      );
      return;
    }

    // 캔버스 패닝
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
    }

    // 토글 메뉴 드래그
    if (sideDragRef.current.dragging && !sidePinned) {
      const dx = e.clientX - sideDragRef.current.startClient.x;
      const dy = e.clientY - sideDragRef.current.startClient.y;
      setSidePos({
        x: sideDragRef.current.startPos.x + dx,
        y: sideDragRef.current.startPos.y + dy,
      });
    }
  };

  const onCanvasPointerUp = () => {
    dragRef.current.dragging = false;
    dragRef.current.id = null;
    isPanningRef.current = false;
    sideDragRef.current.dragging = false;
  };

  // 트랙패드 pan / pinch zoom (wheel 기반)
  const onCanvasWheel = (e) => {
    e.preventDefault();

    // pinch zoom (ctrl + wheel)
    if (e.ctrlKey) {
      const direction = e.deltaY > 0 ? -1 : 1;
      setZoom((z) => clamp(Number((z + direction * 0.08).toFixed(2)), 0.5, 2.5));
      return;
    }

    // two-finger pan
    setPan((p) => ({
      x: p.x - e.deltaX,
      y: p.y - e.deltaY,
    }));
  };

  const zoomIn = () => setZoom((z) => clamp(Number((z + 0.1).toFixed(2)), 0.5, 2.5));
  const zoomOut = () => setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), 0.5, 2.5));
  const zoomReset = () => setZoom(1.5);

  // 토글 메뉴 드래그
  const onSidePointerDown = (e) => {
    if (sidePinned) return;
    e.stopPropagation();

    sideDragRef.current.dragging = true;
    sideDragRef.current.startClient = { x: e.clientX, y: e.clientY };
    sideDragRef.current.startPos = { x: sidePos.x, y: sidePos.y };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  // PIN ↔ FREE 반복 토글 
  const toggleSidePin = (e) => {
    e.stopPropagation();
    setSidePinned((v) => !v);
  };

  return (
    <div className="nodePage">
      <div className="nodeTopbar">
        <div className="nodeTopbarLeft">
          <button className="nodeBackBtn" type="button" onClick={onBack} aria-label="Back to Home">
            ←
          </button>
          <span className="nodeTitle">Prompt node</span>
        </div>

        <div className="nodeZoom">
          <button type="button" className="nodeZoomBtn" onClick={zoomOut} aria-label="Zoom out">
            −
          </button>
          <div className="nodeZoomValue" aria-label="Zoom percentage">
            {Math.round(zoom * 100)}%
          </div>
          <button type="button" className="nodeZoomBtn" onClick={zoomIn} aria-label="Zoom in">
            +
          </button>
          <button type="button" className="nodeZoomBtn" onClick={zoomReset} aria-label="Reset zoom">
            ⟳
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="nodeCanvas"
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
        onWheel={onCanvasWheel}
        role="application"
        aria-label="Node canvas"
      >
        {/* 좌측 토글 메뉴 */}
        <div
          className={`nodeSide ${sidePinned ? "pinned" : "free"}`}
          style={{ left: sidePos.x, top: sidePos.y }}
        >
          <div className="nodeSideHeader" onPointerDown={onSidePointerDown} role="button" aria-label="Move toggle menu">
            <span className="nodeSideHandle" aria-hidden="true">⋮⋮</span>

            {/* PIN/FREE 반복 토글 */}
            <button
              type="button"
              className={`nodeSidePinBtn ${sidePinned ? "on" : "off"}`}
              onClick={toggleSidePin}
              aria-label={sidePinned ? "Unpin menu" : "Pin menu"}
              title={sidePinned ? "고정 해제" : "고정"}
            >
              {sidePinned ? "PIN" : "FREE"}
            </button>
          </div>

          <div className="nodeSideBody">
            {["LLM", "IMAGE", "VIDEO", "AUDIO", "ETC"].map((k) => (
              <button
                key={k}
                type="button"
                className={`nodeSideBtn ${activeMod === k ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMod(k);
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* pan/zoom 레이어 */}
        <div className="nodeViewport" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          <svg className="nodeEdges" width="5000" height="3000" aria-hidden="true">
            {edges.map((ed) => (
              <path key={ed.id} d="" className="nodeEdgePath" />
            ))}
          </svg>

          {/* 빈 캔버스 */}
          {nodes.length === 0 ? (
            <div className="nodeEmpty" aria-label="Empty canvas hint">
              <div className="nodeEmptyTitle">빈 Node 캔버스</div>
              <div className="nodeEmptyDesc">
                (LLM/IMAGE/VIDEO/AUDIO/ETC)에서 데이터를 끌어오거나,
                <br />
                워크플로우 파일을 불러올 때만 노드가 생성됩니다.
              </div>
              <div className="nodeEmptyTip">두 손가락 이동 = Pan / Pinch(Ctrl+휠) = Zoom</div>
            </div>
          ) : (
            <>
              {nodes.map((n) => (
                <div
                  key={n.id}
                  className="nodeCard"
                  style={{ left: n.x, top: n.y }}
                  onPointerDown={(e) => onNodePointerDown(e, n.id)}
                  role="group"
                  aria-label={`Node ${n.title}`}
                >
                  <div className="nodeCardHead">
                    <div className="nodeBrand">
                      <span className="nodeBrandDot">{n.badge}</span>
                      <span className="nodeBrandName">{n.title}</span>
                    </div>

                    <button
                      type="button"
                      className="nodeCardIcon"
                      aria-label="Node options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⧉
                    </button>
                  </div>

                  <div className="nodeCardBody">
                    <div className="nodeSliderRow">
                      <div className="nodeSliderTrack">
                        <div className="nodeSliderKnob" />
                      </div>
                    </div>

                    <div className="nodeLines">
                      {Array.isArray(n.lines) &&
                        n.lines.map((t, i) => (
                          <div key={i} className="nodeLine">
                            <span className="nodeLineText">{t}</span>
                            <span className="nodeLineGhost" />
                          </div>
                        ))}
                    </div>

                    <div className="nodeTextArea" />
                  </div>

                  <div className="nodePort" aria-hidden="true" />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="nodeHint">기본 화면은 빈 캔버스입니다. (노드는 데이터/워크플로우 로드 시에만 생성)</div>
    </div>
  );
}
