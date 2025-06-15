import React from "react";
import { useNavigate } from "react-router-dom";

const MainMenuButtons = () => {
  const navigate = useNavigate();
  return (
    <>
      <div style={containerStyle}>
        <button style={buttonStyle} onClick={() => navigate("/nueva-inspeccion")}>Iniciar inspección</button>
        <button style={buttonStyle}>Inspecciones</button>
      </div>
      <div style={bottomContainerStyle}>
        <button style={formButtonStyle} onClick={() => navigate("/")}>Volver</button>
      </div>
    </>
  );
};

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  gap: "clamp(24px, 6vw, 80px)",
  flexWrap: "wrap",
  width: "100vw",
  padding: 8,
  maxWidth: '100vw',
  boxSizing: 'border-box',
};

const buttonStyle = {
  background: "#e0e0e0",
  color: "#222",
  border: "none",
  borderRadius: 28,
  padding: "clamp(12px, 4vw, 32px) clamp(18px, 8vw, 48px)",
  fontFamily: "Fira Mono, monospace",
  fontSize: "clamp(18px, 3vw, 36px)",
  cursor: "pointer",
  minWidth: 100,
  minHeight: 40,
  boxSizing: "border-box",
};

const bottomContainerStyle = {
  display: "flex",
  justifyContent: "center",
  width: "100vw",
  marginTop: 0,
  position: "fixed",
  left: 0,
  bottom: 32,
  zIndex: 20,
};

const formButtonStyle = {
  background: "#FFD600",
  color: "#222",
  border: "none",
  borderRadius: 16,
  padding: "10px 24px",
  fontFamily: "Fira Mono, monospace",
  fontSize: 20,
  cursor: "pointer",
  minWidth: 100,
  minHeight: 40,
  boxSizing: "border-box",
};

export default MainMenuButtons; 