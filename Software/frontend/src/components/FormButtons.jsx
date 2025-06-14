import React from "react";
import { useNavigate } from "react-router-dom";

const FormButtons = () => {
  const navigate = useNavigate();
  return (
    <div style={containerStyle}>
      <button style={buttonStyle} onClick={() => navigate("/menu")}>Volver</button>
      <button style={buttonStyle} onClick={() => window.location.reload()}>Limpiar</button>
      <button style={buttonStyle} onClick={() => navigate("/inspeccion")}>Iniciar</button>
    </div>
  );
};

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "clamp(12px, 4vw, 32px)",
  marginTop: 32,
  flexWrap: "wrap",
  width: "100vw",
  padding: 8,
  maxWidth: '100vw',
  boxSizing: 'border-box',
};

const buttonStyle = {
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

export default FormButtons; 