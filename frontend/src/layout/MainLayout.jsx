import Header from "./Header";
import BottomNav from "./BottomNav";
import SideCategory from "./SideCategory";
import Footer from "./Footer";
import { useState } from "react";
import { Outlet } from "react-router-dom";

function MainLayout() {
  const [showCategory, setShowCategory] = useState(false);

  return (
    <div className="main-wrapper-layout">
      <Header openCategory={() => setShowCategory(true)} />

      <SideCategory
        visible={showCategory}
        close={() => setShowCategory(false)}
      />

      <main className="main-content">
        <Outlet />
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
}

export default MainLayout;
