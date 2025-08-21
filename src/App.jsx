import { useState } from "react";
import EntranceAnimation from "./EntranceAnimation";
import MainContent from "./MainContent";
import "./MainPage.css";

const SITE_ID = 'krachtkamer-gym';

export default function App() {
  const [animationDone, setAnimationDone] = useState(false);

  return (
          <>
            <MainContent visible={animationDone} />
            <EntranceAnimation onComplete={() => setAnimationDone(true)} />
          </>
        )}