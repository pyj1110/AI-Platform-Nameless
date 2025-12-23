import React from "react";

function RecommendationCard({ platform }) {
  const title = platform?.name || "AI";
  const imgSrc = platform?.image_url || null;

  return (
    <div className="recommendation-card">
      <div className="recommendation-card-logo">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="recommendation-card-logo-img"
          />
        ) : (
          "AI"
        )}
      </div>
      <div className="recommendation-card-name">
        {title}
      </div>
    </div>
  );
}

export default RecommendationCard;