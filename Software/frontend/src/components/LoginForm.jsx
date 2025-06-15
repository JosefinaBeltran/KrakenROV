import React from "react";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();
  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 32 }}>
        <img src="/public/diverHelmetBlanco.png" alt="Icon" style={iconStyle} />
      </div>
      <input type="text" placeholder="Usuario" style={inputStyle} />
      <input type="password" placeholder="Contraseña" style={inputStyle} />
      <button style={buttonStyle} onClick={() => navigate("/menu")}>Ingresar</button>
    </div>
  );
};

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  width: "100vw",
  minHeight: 0,
  minWidth: 0,
  padding: 8,
  boxSizing: 'border-box',
  maxWidth: '100vw',
};

const iconStyle = {
  width: "clamp(80px, 16vw, 180px)",
  height: "clamp(80px, 16vw, 160px)",
};

const inputStyle = {
  width: "100%",
  maxWidth: 340,
  padding: 16,
  margin: "8px 0",
  borderRadius: 16,
  border: "none",
  fontFamily: "Fira Mono, monospace",
  fontSize: 20,
  boxSizing: "border-box",
};

const buttonStyle = {
  background: "#FFD600",
  color: "#222",
  border: "none",
  borderRadius: 16,
  padding: "10px 32px",
  fontFamily: "Fira Mono, monospace",
  fontSize: 22,
  marginTop: 24,
  cursor: "pointer",
  width: "clamp(120px, 20vw, 220px)",
};

export default LoginForm; 