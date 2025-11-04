import { useState, useEffect } from "react";
import EntranceAnimation from "./EntranceAnimation";
import MainContent from "./MainContent";
import CancelBookingPage from "./components/CancelBookingPage";
import "./MainPage.css";

const SITE_ID = 'krachtkamer-gym';

export default function App() {
  const [animationDone, setAnimationDone] = useState(false);
  const [cancellationToken, setCancellationToken] = useState(null);

  useEffect(() => {
    // Check if URL matches /cancel-booking/:token pattern
    const path = window.location.pathname;
    const match = path.match(/^\/cancel-booking\/([a-f0-9]+)$/);
    if (match) {
      setCancellationToken(match[1]);
    }
  }, []);

  // Show cancellation page if token is in URL
  if (cancellationToken) {
    return <CancelBookingPage token={cancellationToken} />;
  }

  return (
    <>
      <MainContent visible={animationDone} />
      <EntranceAnimation onComplete={() => setAnimationDone(true)} />
    </>
  );
}