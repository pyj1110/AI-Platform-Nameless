import React, { useMemo } from "react";

/* =========================
BorderBeam
========================= */
 
export default function BorderBeam({
  className,
  duration = 6,
  delay = 0,
  borderWidth = 1,
  beamSize = 16, // 0~100 하이라이트 길이
  reverse = false,
  radiusPx = 18,
  color = "#ffffff", 
  baseOpacity = 0.25, // 기본 연속선 강도
  style,
}) {
  const inset = borderWidth / 2;

  // mask id 충돌 방지
  const maskId = useMemo(
    () => `border_beam_mask_${Math.random().toString(36).slice(2)}`,
    []
  );

  return (
    <div
      className={`borderBeamWrap ${className ?? ""}`.trim()}
      style={style}
      aria-hidden="true"
    >
      <svg className="borderBeamSvg">
        <defs>
          <mask id={maskId}>
            {/* 기본: 전부 숨김 */}
            <rect x="0" y="0" width="100%" height="100%" fill="black" />

            {/* 움직이는 하이라이트 */}
            <rect
              className={`borderBeamMaskRect ${reverse ? "reverse" : ""}`}
              x={inset}
              y={inset}
              width={`calc(100% - ${borderWidth}px)`}
              height={`calc(100% - ${borderWidth}px)`}
              rx={radiusPx}
              ry={radiusPx}
              pathLength="100"
              fill="none"
              stroke="white"
              strokeWidth={borderWidth}
              strokeLinejoin="round"
              strokeLinecap="butt"
              vectorEffect="non-scaling-stroke"
              strokeDasharray={`${beamSize} ${100 - beamSize}`}
              style={{
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          </mask>
        </defs>

        {/* 연속 기본 테두리 */}
        <rect
          x={inset}
          y={inset}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx={radiusPx}
          ry={radiusPx}
          fill="none"
          stroke={color}
          strokeWidth={borderWidth}
          strokeLinejoin="round"
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
          opacity={baseOpacity}
        />

        {/* mask view */}
        <rect
          x={inset}
          y={inset}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx={radiusPx}
          ry={radiusPx}
          fill="none"
          stroke={color}
          strokeWidth={borderWidth}
          strokeLinejoin="round"
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
          mask={`url(#${maskId})`}
          opacity="1"
        />
      </svg>
    </div>
  );
}
