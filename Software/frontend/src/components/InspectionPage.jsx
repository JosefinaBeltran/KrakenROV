import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const InspectionPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#122830", width: "100vw", overflowX: "hidden" }}>
      {/* Video y overlays */}
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <img src="/public/logoKranken.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: "50%" }} />
      </div>
      <div style={{ width: "100%", maxWidth: 1400, height: "clamp(220px, 70vh, 800px)", margin: "80px auto 0 auto", background: "#222", borderRadius: 24, overflow: "hidden", position: "relative", maxWidth: "100vw" }}>
        {/* Simulación de video */}
        <div style={{ width: "100%", height: "100%", background: "#444", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: "clamp(18px, 2vw, 32px)" }}>Video aquí</span>
        </div>
        <div style={{ position: "absolute", top: 20, left: 60, color: "#fff", fontFamily: 'Fira Mono, monospace', fontSize: "clamp(18px, 2vw, 32px)", zIndex: 2 }}>
        16/05/2025  19:50:00<br />└ 10°
        </div>
        {/* Gráfico simulado */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "clamp(40px, 12vh, 100px)", background: "linear-gradient(to top, #FFD60088 60%, transparent)", zIndex: 2 }}>
          <svg width="100%" height="100%" viewBox="0 0 800 100">
            <polyline fill="#FFD60088" stroke="#FFD600" strokeWidth="2" points="0,80 40,60 80,90 120,50 160,80 200,40 240,90 280,60 320,80 360,50 400,80 440,60 480,90 520,50 560,80 600,40 640,90 680,60 720,80 760,50 800,80" />
          </svg>
          <span style={{ position: "absolute", left: 10, bottom: 10, color: "#fff", fontFamily: 'Fira Mono, monospace', fontSize: "clamp(10px, 1.2vw, 18px)" }}>Perfil de inmersión</span>
        </div>
      </div>
      {/* Botones */}
      <div style={{ position: "absolute", left: 80, bottom: 40, display: "flex", gap: "clamp(8px, 2vw, 32px)", flexWrap: "wrap" }}>
        <button style={buttonStyle}>Iniciar</button>
        <button style={buttonStyle} onClick={() => navigate("/menu")}>Finalizar</button>
        <button style={buttonStyle}>Capturar</button>
      </div>
      {/* Botón menú */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
        <button onClick={() => setMenuOpen((v) => !v)} style={menuBtnStyle}>
          <img
            src="/public/flechaDesplegableAzulAbrir.png"
            alt={menuOpen ? "Cerrar menú" : "Abrir menú"}
            style={{ width: 32, height: 32, transform: 'rotate(180deg)' }}
          />
        </button>
      </div>
      {/* Menú lateral */}
      {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} />}
      <style>{`
        @media (max-width: 900px) {
          .side-menu {
            width: 80vw !important;
            min-width: 180px !important;
            font-size: 16px !important;
          }
        }
        @media (max-width: 700px) {
          .inspection-video {
            margin: 32px auto 0 auto !important;
            height: 40vh !important;
          }
          .side-menu {
            width: 100vw !important;
            min-width: 120px !important;
            font-size: 14px !important;
            padding: 12px !important;
          }
          .inspection-btns {
            left: 8px !important;
            bottom: 8px !important;
            flex-direction: column !important;
            gap: 8px !important;
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
  padding: "10px 24px",
  fontFamily: "Fira Mono, monospace",
  fontSize: 18,
  cursor: "pointer",
  minWidth: 90,
  minHeight: 36,
  boxSizing: "border-box",
};

const menuBtnStyle = {
  background: "#e0e0e0",
  border: "none",
  borderRadius: 16,
  fontSize: 32,
  width: 44,
  height: 44,
  cursor: "pointer",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const SideMenu = ({ onClose }) => (
  <div className="side-menu" style={{ position: "absolute", top: 0, right: 0, width: "clamp(180px, 22vw, 400px)", height: "100vh", background: "#cfd8dcdd", zIndex: 20, padding: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", padding: 0 }}>
        <img src="/public/flechaDesplegableAzul.png" alt="Cerrar menú" style={{ width: 32, height: 32 }} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/public/diverHelmetAzul.png" alt="icon" style={{ width: 36, height: 36 }} />
        <span style={{ fontFamily: 'Fira Mono, monospace', fontSize: 22 }}>John Snow</span>
      </div>
    </div>
    <hr style={{ margin: "12px 0", border: 0, borderTop: "2px solid #888" }} />
    <div style={{ fontFamily: 'Fira Mono, monospace', fontSize: 16, color: "#222" }}>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/public/tiempo.png" alt="Tiempo" style={{ width: 22, height: 22 }} />
        Tiempo: 45:39:10
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/public/temperatura.png" alt="Temperatura" style={{ width: 22, height: 22 }} />
        Temperatura: 20°C | 68°F
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/public/depth.png" alt="Prof. Media" style={{ width: 22, height: 22 }} />
        Prof. Media: 3.6 m
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/public/depth.png" alt="Prof. Máx." style={{ width: 22, height: 22 }} />
        Prof. Máx.: 7.3 m
      </div>
    </div>
  </div>
);

export default InspectionPage; 