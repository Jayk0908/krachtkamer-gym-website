import "./MainPage.css";
import "./EntranceAnimation.css"
import { useState, useEffect, useRef } from "react";

const reviews = [
  {
    name: "Indra M.",
    photo: "https://via.placeholder.com/80",
    text: "QFR is the best solution for anyone looking to take control of their finances. The analysis is detailed, features are comprehensive, and the interface is incredibly user-friendly.",
  },
  {
    name: "Rina P.", 
    photo: "https://via.placeholder.com/80",
    text: "QFR has helped me manage my business finances more efficiently. The detailed and accurate reports make financial planning much easier. Highly recommended for entrepreneurs!",
  },
  {
    name: "Maya L.",
    photo: "https://via.placeholder.com/80",
    text: "Data security and ease of access are my top priorities, and QFR delivers both. Now I can manage my personal finances with peace of mind.",
  },
  {
    name: "Jay K.",
    photo: "https://via.placeholder.com/80",
    text: "QFR is the best solution for anyone looking to take control of their finances. The analysis is detailed, features are comprehensive, and the interface is incredibly user-friendly.",
  },
];

// Sliding Banner Component
const SlidingBanner = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const imagesRef = useRef(null);
  const containerRef = useRef(null);

  const bannerImages = [
    {
      id: 1,
      src: "/videos/eerste picca.png",
      alt: "Eerste picca",
      width: "1700px"
    },
    {
      id: 2,
      src: "/videos/picca tussen 1.png",
      alt: "Picca 2",
      width: "900px"
    },
    {
      id: 3,
      src: "/videos/picca tussen 2.png",
      alt: "Workout session",
      width: "900px"
    },
    {
      id: 4,
      src: "/videos/picca tussen 3.png",
      alt: "Cardio equipment",
      width: "900px"
    },
    {
      id: 5,
      src: "/videos/last picca.png",
      alt: "Cardio equipment",
      width: "1700px"
    }
  ];

  useEffect(() => {
    const updateMaxScroll = () => {
      if (imagesRef.current && containerRef.current) {
        const imagesWidth = imagesRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setMaxScroll(Math.max(0, imagesWidth - containerWidth));
      }
    };

    updateMaxScroll();
    window.addEventListener('resize', updateMaxScroll);
    
    return () => window.removeEventListener('resize', updateMaxScroll);
  }, []);

  const handleLeftClick = () => {
    const newPosition = Math.max(0, scrollPosition - 800);
    setScrollPosition(newPosition);
  };

  const handleRightClick = () => {
    const newPosition = Math.min(maxScroll, scrollPosition + 800);
    setScrollPosition(newPosition);
  };

  const showLeftArrow = scrollPosition > 0;
  const showRightArrow = scrollPosition < maxScroll;
  const showButton = scrollPosition === 0 || scrollPosition >= maxScroll;
  const isAtStart = scrollPosition === 0;
  const isAtEnd = scrollPosition >= maxScroll;

  return (
    <section className="sliding-banner-section">
      <style jsx>{`
        .sliding-banner-section {
          width: 100%;
          height: 700px;
          position: relative;
          overflow: hidden;
          margin: 50px 0;
          background-color: #56642D;
        }

        .banner-text-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 35px;
          background-color: #FFD700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'League Spartan', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #56642D;
          text-transform: uppercase;
          overflow: hidden;
          z-index: 10;
        }

        .banner-text-line.top {
          top: 5px;
        }

        .banner-text-line.bottom {
          bottom: 5px;
        }

        .static-text {
          display: flex;
          white-space: nowrap;
          letter-spacing: -0.5px;
          font-weight: 900;
          word-spacing: 1px;
        }

        .static-text span {
          margin-right: 0px;
        }

        .images-container {
          position: relative;
          height: calc(100% - 80px);
          top: 40px;
          left: 0px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background-color: #FFD700;
        }

        .sliding-images {
          display: flex;
          gap: 40px;
          width: max-content;
          height: 100%;
          align-items: center;
          background-color: #FFD700;
          padding: 0 30px;
          transform: translateX(-${scrollPosition}px);
          transition: transform 0.5s ease-out;
        }

        .banner-image {
          height: 650px;
          object-fit: cover;
        }

        .cta-overlay {
          position: absolute;
          bottom: 100px;
          left: 75px;
          z-index: 15;
        }

        .cta-overlay.start {
          left: 75px;
        }

        .cta-overlay.end {
          right: 500px;
        }

        .banner-cta-button {
          font-family: 'League Spartan', sans-serif;
          letter-spacing: 0.1rem;
          color: #FFD700;
          background-color: #56642D;
          border: 4px solid #FFD700;
          padding: 1rem 1.5rem;
          font-weight: 700;
          font-size: 1rem;
          border-radius: 2px;
          cursor: pointer;
          transition: transform 0.2s ease;
          text-transform: uppercase;
        }

        .banner-cta-button:hover {
          transform: scale(1.05);
          background-color: #FFD700;
          color: #56642D;
        }

        .arrow-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 15;
          transition: all 0.3s ease;
        }

        .arrow-indicator:hover {
          transform: translateY(-50%) scale(1.1);
        }

        .arrow-indicator.left {
          left: 50px;
        }

        .arrow-indicator.right {
          right: 50px;
        }

        .arrow {
          width: 0;
          height: 0;
        }

        .arrow.right {
          border-left: 8px solid #56642D;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }

        .arrow.left {
          border-right: 8px solid #56642D;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }
      `}</style>

      {/* Top text */}
      <div className="banner-text-line top">
        <div className="static-text">
          <span>DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER</span>
        </div>
      </div>

      {/* Images container */}
      <div className="images-container" ref={containerRef}>
        <div className="sliding-images" ref={imagesRef}>
          {bannerImages.map((image) => (
            <img
              key={image.id}
              src={image.src}
              alt={image.alt}
              className="banner-image"
              style={{ width: image.width }}
            />
          ))}
        </div>
      </div>

      {/* CTA Button - only show at beginning or end with different positioning */}
      {showButton && (
        <div className={`cta-overlay ${isAtStart ? 'start' : 'end'}`}>
          <button className="banner-cta-button">
            Lid Worden
          </button>
        </div>
      )}


      {/* Left arrow indicator */}
      {showLeftArrow && (
        <div className="arrow-indicator left" onClick={handleLeftClick}>
          <div className="arrow left"></div>
        </div>
      )}

      {/* Right arrow indicator */}
      {showRightArrow && (
        <div className="arrow-indicator right" onClick={handleRightClick}>
          <div className="arrow right"></div>
        </div>
      )}

      {/* Bottom text */}
      <div className="banner-text-line bottom">
        <div className="static-text">
          <span>DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER DE KRACHTKAMER</span>
        </div>
      </div>
    </section>
  );
};

export default function MainContent({ visible }) {
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [index]);

  const handleNext = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setIndex((prevIndex) => (prevIndex + 1) % reviews.length);
      setTransitioning(false);
    }, 2500);
  };

  const handlePrev = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setIndex((prevIndex) =>
        prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
      );
      setTransitioning(false);
    }, 2500);
  };

  const getClass = (i) => {
    const center = index;
    const left = (index - 1 + reviews.length) % reviews.length;
    const right = (index + 1) % reviews.length;

    if (i === center) return "carousel-card center";
    if (i === left) return "carousel-card right";
    if (i === right) return "carousel-card left";
    return "carousel-card hidden";
  };

  return (
    <div className={`main-content ${visible ? "visible" : ""}`}>
      <header className="site-header">
        <div className="logo"></div>
        <nav className="nav-links">
          <a href="#abonnementen">
            ABONNEMENTEN
          </a>
          <a href="#locatie">
            LOCATIE
          </a>
          <button className="cta-button">
            WORD LID
          </button>
        </nav>
      </header>

      <div className="keyhole-wrapper">
        <video
          src="/videos/MainVid.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="keyhole-video"
        />
      </div>

      <div className="bottom-text-wrapper">
        <div
          className="bottom-text"
          style={{ "--text-offset-x": "-500px" }}
        >
          DE KRACHTKAMER
        </div>
      </div>

      {/* Replaced gym-intro-section with SlidingBanner */}
      <SlidingBanner />

      <section className="review-carousel-section">
        <div className="carousel-heading-group">
          <span className="carousel-subheading">
            WAT ONZE GASTEN ZEGGEN
          </span>
          
          <h2 className="carousel-heading">
            EERLIJKE FEEDBACK VAN ONZE FANTASTISCHE SPORTERS
          </h2>
          
          <p className="carousel-description">
            Sociale bewijskracht vergroot vertrouwen. <br/> Lees wat anderen écht zeggen over onze sportschool.
          </p>
        </div>
        
        <div className="carousel-container">
          <div className="carousel">
            {reviews.map((review, i) => (
              <div key={i} className={getClass(i)}>
                <div className="review-header">
                  {review.photo && <img src={review.photo} alt={review.name} className="review-photo" />}
                  <div className="review-info">
                    <p>
                      <strong>{review.name}</strong>
                    </p>
                  </div>
                </div>
                <p className="review-rating">★★★★★ <span className="review-score">5.0</span></p>
                <p className="review-context">
                  {review.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="carousel-indicators">
          {reviews.map((_, i) => (
            <span
              key={i}
              className={`indicator-dot ${i === index ? "active" : ""}`}
            ></span>
          ))}
        </div>
      </section>
    </div>
  );
}