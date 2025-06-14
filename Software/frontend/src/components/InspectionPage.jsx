import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const InspectionPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ 
      position: "relative", 
      minHeight: "100vh", 
      background: "#122830", 
      width: "100%", 
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Logo fijo arriba a la izquierda */}
      <div style={{ 
        position: "fixed", 
        top: 24, 
        left: 24, 
        zIndex: 20 
      }}>
        <img src="/logoKranken.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: "50%" }} />
      </div>
      {/* Botón menú */}
      {!menuOpen && (
        <div style={{ 
          position: "fixed", 
          top: 24, 
          right: 24, 
          zIndex: 20 
        }}>
          <button onClick={() => setMenuOpen((v) => !v)} style={menuBtnStyle}>
            <img
              src="/flechaDesplegableAzul.png"
              alt=""
              style={{ width: 32, height: 32, transform: 'rotate(180deg)' }}
            />
          </button>
        </div>
      )}
      {/* Contenedor principal de video y overlays */}
      <div style={{ 
        width: "min(100% - 40px, 1400px)", 
        maxWidth: "100vw",
        height: "clamp(300px, 80vh, 800px)", 
        margin: "clamp(60px, 8vh, 80px) auto 0 auto", 
        background: "#222", 
        borderRadius: 24, 
        overflow: "hidden", 
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end"
      }}>
        {/* Overlays dentro del área de video */}
        <div style={{ position: "absolute", top: 24, left: 24, color: "#fff", fontFamily: 'Fira Mono, monospace', fontSize: "clamp(18px, 2vw, 32px)", zIndex: 2 }}>
          16/05/2025  19:50:00<br />└ 10°
        </div>
        {/* Simulación de video */}
        <div style={{ width: "100%", height: "100%", background: "#444", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: "clamp(18px, 2vw, 32px)" }}>Video aquí</span>
        </div>
        {/* Gráfico simulado */}
        <div style={{ width: "100%", height: "clamp(40px, 12vh, 100px)", background: "linear-gradient(to top, #FFD60088 60%, transparent)", zIndex: 2, position: "relative", display: "flex", alignItems: "flex-end" }}>
          <svg width="100%" height="100%" viewBox="0 0 800 100">
            <polyline fill="#FFD60088" stroke="#FFD600" strokeWidth="2" points="0,80 40,60 80,90 120,50 160,80 200,40 240,90 280,60 320,80 360,50 400,80 440,60 480,90 520,50 560,80 600,40 640,90 680,60 720,80 760,50 800,80" />
          </svg>
          <span style={{ position: "absolute", left: 10, bottom: 10, color: "#fff", fontFamily: 'Fira Mono, monospace', fontSize: "clamp(10px, 1.2vw, 18px)" }}>Perfil de inmersión</span>
        </div>
      </div>
      {/* Botones debajo del área de video */}
      <div style={{ 
        width: "min(100% - 40px, 1400px)",
        maxWidth: "100vw",
        margin: "24px auto 0 auto",
        display: "flex", 
        gap: "clamp(8px, 2vw, 32px)", 
        flexWrap: "wrap",
        justifyContent: "center",
        zIndex: 10
      }}>
        <button style={buttonStyle}>Iniciar</button>
        <button style={buttonStyle} onClick={() => navigate("/menu")}>Finalizar</button>
        <button style={buttonStyle}>Capturar</button>
      </div>
      {/* Menú lateral */}
      {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} />}
      <style>{`
        @media (max-width: 900px) {
          .side-menu {
            width: 90vw !important;
            min-width: 280px !important;
            font-size: 16px !important;
          }
        }
        @media (max-width: 700px) {
          .inspection-video {
            margin: 32px auto 0 auto !important;
            height: 50vh !important;
          }
          .side-menu {
            width: 100vw !important;
            min-width: 280px !important;
            font-size: 14px !important;
            padding: 16px !important;
          }
          .inspection-btns {
            left: 16px !important;
            bottom: 16px !important;
            flex-direction: row !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }
        }
      `}</style>
    </div>
  );
};

const buttonStyle = {
  background: "#FFD600",
  color: "#222",
  border: "none",
  borderRadius: 16,
  padding: "clamp(8px, 1.5vw, 10px) clamp(16px, 2vw, 24px)",
  fontFamily: "Fira Mono, monospace",
  fontSize: "clamp(14px, 1.5vw, 18px)",
  cursor: "pointer",
  minWidth: "clamp(80px, 10vw, 90px)",
  minHeight: "clamp(32px, 4vh, 36px)",
  boxSizing: "border-box",
};

const menuBtnStyle = {
  background: "#e0e0e0",
  border: "none",
  borderRadius: 16,
  fontSize: "clamp(24px, 3vw, 32px)",
  width: "clamp(36px, 4vw, 44px)",
  height: "clamp(36px, 4vw, 44px)",
  cursor: "pointer",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const SideMenu = ({ onClose }) => (
  <div className="side-menu" style={{ 
    position: "fixed", 
    top: 0, 
    right: 0, 
    width: "clamp(280px, 30vw, 400px)", 
    height: "100vh", 
    background: "#cfd8dcdd", 
    zIndex: 20, 
    padding: "clamp(16px, 2vw, 24px)",
    boxSizing: "border-box",
    overflowY: "auto"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", padding: 0 }}>
        <img src="/flechaDesplegableAzul.png" alt="Cerrar menú" style={{ width: 32, height: 32 }} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/diverHelmetAzul.png" alt="icon" style={{ width: 36, height: 36 }} />
        <span style={{ fontFamily: 'Fira Mono, monospace', fontSize: 22 }}>John Snow</span>
      </div>
    </div>
    <hr style={{ margin: "12px 0", border: 0, borderTop: "2px solid #888" }} />
    <div style={{ fontFamily: 'Fira Mono, monospace', fontSize: 16, color: "#222" }}>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/tiempo.png" alt="Tiempo" style={{ width: 22, height: 22 }} />
        Tiempo: 45:39:10
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/temperatura.png" alt="Temperatura" style={{ width: 22, height: 22 }} />
        Temperatura: 20°C | 68°F
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/depth.png" alt="Prof. Media" style={{ width: 22, height: 22 }} />
        Prof. Media: 3.6 m
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/depth.png" alt="Prof. Máx." style={{ width: 22, height: 22 }} />
        Prof. Máx.: 7.3 m
      </div>
    </div>
  </div>
);

export default InspectionPage; 