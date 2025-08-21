import { useEffect, useState } from "react";
import "./EntranceAnimation.css";

const COLORS = ["#FFD700", "#56642D", "#F5E0C8", "#D4AC0D"];

export default function EntranceAnimation({ onComplete }) {
  const [unlocking, setUnlocking] = useState(false);
  const [activeIndexes, setActiveIndexes] = useState([]);
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    const startDelay = 2500;
    const stepDelay = 300;

    const timer = setTimeout(() => {
      setUnlocking(true);

      // Trigger animation from center outward
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          setActiveIndexes((prev) => [...prev, i]);
        }, i * stepDelay);
      }

      setTimeout(() => {setAnimationFinished(true);onComplete();}, startDelay + 6 * stepDelay + 1000);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const renderStrips = (side) => {
  const indexes = [0, 1, 2, 3, 4, 5]; // center to edge (animation order)

  const rendered = indexes.map((i) => {
    const isActive = activeIndexes.includes(i);
    const color = COLORS[i % COLORS.length];
    const style = isActive ? { backgroundColor: color, zIndex: 100 - i} : {};

    return (
      <div
        key={`${side}-${i}`}
        className={`panel-strip ${unlocking && isActive ? "slide" : ""}`}
        style={style}
      />
    );
  });

  // Only reverse render order for LEFT panel so center strips appear on top
  return side === "left" ? rendered.reverse() : rendered;
};

  return (
    <div className={`overlay ${unlocking ? "unlocking" : ""} ${animationFinished ? "hidden" : ""}`}>
      <div className={`panel left ${animationFinished ? "hidden" : ""}`}>{renderStrips("left")}</div>
      <div className={`panel right ${animationFinished ? "hidden" : ""}`}>{renderStrips("right")}</div>

      <div className="key-container">
        <img
          src="/videos/KRACHTKAMER (2).gif"
          className="logo-video"
          alt="krachtkamer-logo"
        />
        <div className="typewriter-container">
          <div className="vertical-de">DE</div>
          <div className="typewriter-text">KRACHTKAMER</div>
        </div>
      </div>
    </div>
  );
}
