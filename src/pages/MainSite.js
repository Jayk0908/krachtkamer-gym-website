import React, { useState } from 'react';
import AdminHeader from '../Components/cms/AdminHeader';  // Note: capital C in Components
import EntranceAnimation from '../Components/EntranceAnimation';
import MainContent from '../Components/MainContent';
import '../MainPage.css';

const MainSite = () => {
  const [animationDone, setAnimationDone] = useState(false);

  return (
    <>
      <AdminHeader />
      <div className="app-container">
        <MainContent visible={animationDone} />
        <EntranceAnimation onComplete={() => setAnimationDone(true)} />
      </div>
    </>
  );
};

export default MainSite;