import { useState } from "react";
import EntranceAnimation from "./Components/EntranceAnimation";
import MainContent from "./Components/MainContent";
import "./MainPage.css";

export default function App() {
  const [animationDone, setAnimationDone] = useState(false);

  return (
    <div className="app-container">
      <MainContent visible={animationDone} />
      <EntranceAnimation onComplete={() => setAnimationDone(true)} />
    </div>
  );
}