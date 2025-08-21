import "./MainPage.css";
import "./EntranceAnimation.css"
import { useState, useEffect } from "react";

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

      <section className="gym-intro-section">
        <div className="gym-intro-content">
          <div className="gym-intro-text">
            <h5>
              Toekomst
            </h5>
            
            <h2>
              Ontdek de voordelen van onze sportschool
            </h2>
            
            <div className="features">
              <p>
                Bij onze futuristische sportschool bieden we de nieuwste technologieën en
                gepersonaliseerde trainingservaringen. Sluit je aan en ervaar de toekomst van fitness.
              </p>
              
              <div className="feature">
                <span className="icon">🏋️</span>
                <div>
                  <strong>
                    Geavanceerde Apparatuur
                  </strong>
                  <p>
                    Train met de nieuwste fitnessapparatuur voor optimale resultaten en efficiëntie.
                  </p>
                </div>
              </div>
              
              <div className="feature">
                <span className="icon">🤝</span>
                <div>
                  <strong>
                    Persoonlijke Training
                  </strong>
                  <p>
                    Krijg een op maat gemaakt trainingsprogramma dat is afgestemd op jouw doelen.
                  </p>
                </div>
              </div>
              
              <div className="buttons">
                <button>
                  Aanmelden
                </button>
                <button className="link-button">
                  Meer →
                </button>
              </div>
            </div>
          </div>
          <div className="gym-intro-image">
            <div className="image-placeholder">[Afbeelding]</div>
          </div>
        </div>
      </section>

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