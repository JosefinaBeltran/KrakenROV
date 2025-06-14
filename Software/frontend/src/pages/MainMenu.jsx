import React from "react";
import Logo from "../components/Logo";
import MainMenuButtons from "../components/MainMenuButtons";

const MainMenu = () => (
  <div style={{ background: "#122830", minHeight: "100vh", position: "relative" }}>
    <Logo />
    <MainMenuButtons />
  </div>
);

export default MainMenu; 