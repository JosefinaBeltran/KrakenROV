import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';

const InspectionPage = ({ arduinoData, error }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [lightsOn, setLightsOn] = useState(false);
  const videoContainerRef = useRef(null);
  const navigate = useNavigate();

  // Simular video independientemente del Arduino
  const [videoTime, setVideoTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setVideoTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleStart = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleLights = () => {
    setLightsOn(prev => !prev);
  };

  const handleCapture = async () => {
    if (videoContainerRef.current) {
      try {
        const canvas = await html2canvas(videoContainerRef.current, {
          backgroundColor: null,
          scale: 2, // Mejor calidad
          useCORS: true,
          allowTaint: true,
          logging: false
        });
        
        // Convertir el canvas a blob y descargar
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `captura_${timestamp}.png`;
          
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setCaptureCount(prev => prev + 1);
          
          // Mostrar notificación de éxito
          alert(`Captura guardada como: ${filename}`);
        }, 'image/png');
      } catch (err) {
        console.error('Error al capturar:', err);
        // Fallback: crear una captura simple
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `captura_${timestamp}.txt`;
        const content = `Captura de pantalla - ${new Date().toLocaleString()}\nEstado: ${isPlaying ? 'Reproduciendo' : 'Detenido'}\nTiempo de video: ${Math.floor(videoTime / 60)}:${(videoTime % 60).toString().padStart(2, '0')}\nLuces: ${lightsOn ? 'ON' : 'OFF'}\nDatos del Arduino: ${arduinoData ? JSON.stringify(arduinoData, null, 2) : 'No disponible'}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setCaptureCount(prev => prev + 1);
        alert(`Captura guardada como: ${filename}`);
      }
    }
  };

  // Generar datos simulados para el video
  const getSimulatedData = () => {
    if (arduinoData) {
      return arduinoData;
    }
    // Datos simulados cuando Arduino no está conectado
    return {
      temperature: 20 + Math.sin(videoTime / 10) * 5,
      humidity: 60 + Math.cos(videoTime / 15) * 10,
      distance: 50 + Math.sin(videoTime / 8) * 20,
      motor: isPlaying ? "ON" : "OFF"
    };
  };

  const simulatedData = getSimulatedData();

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
          16/05/2025  19:50:00<br />└ {Math.floor(videoTime / 60)}:{(videoTime % 60).toString().padStart(2, '0')}
        </div>
        {/* Estado de las luces en la esquina superior izquierda */}
        <div style={{ 
          position: "absolute", 
          top: 24, 
          left: 24, 
          zIndex: 2,
          marginTop: "80px"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            color: "#fff", 
            fontFamily: 'Fira Mono, monospace', 
            fontSize: "clamp(14px, 1.5vw, 18px)",
            background: "rgba(0,0,0,0.5)",
            padding: "4px 8px",
            borderRadius: "8px"
          }}>
            <div style={{ 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              background: lightsOn ? "#FFD600" : "#666",
              boxShadow: lightsOn ? "0 0 8px #FFD600" : "none"
            }}></div>
            Luces: {lightsOn ? "ON" : "OFF"}
          </div>
        </div>
        {/* Video simulado con imagen animada */}
        <div 
          ref={videoContainerRef}
          style={{ 
            width: "100%", 
            height: "100%", 
            position: "relative", 
            overflow: "hidden" 
          }}
        >
          <div 
            style={{ 
              width: "100%", 
              height: "100%", 
              background: isPlaying 
                ? "linear-gradient(45deg, #1a1a1a, #2a2a2a, #1a1a1a)" 
                : "linear-gradient(45deg, #0a0a0a, #1a1a1a, #0a0a0a)",
              backgroundSize: "400% 400%",
              animation: isPlaying ? "gradientShift 2s ease infinite" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "clamp(18px, 2vw, 32px)",
              fontFamily: 'Fira Mono, monospace',
              borderRadius: "24px",
              filter: lightsOn ? "brightness(1.2)" : "brightness(0.8)"
            }}
          >
            {isPlaying ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: "20px", fontSize: "clamp(24px, 3vw, 36px)" }}>🎥 Cámara ROV en Vivo</div>
                <div style={{ fontSize: "clamp(14px, 1.5vw, 18px)", opacity: 0.8, marginBottom: "10px" }}>
                  Simulación de video en tiempo real
                </div>
                <div style={{ fontSize: "clamp(12px, 1.2vw, 16px)", opacity: 0.6 }}>
                  {arduinoData ? `Temp: ${simulatedData.temperature.toFixed(1)}°C | Dist: ${simulatedData.distance.toFixed(1)}cm` : `Temp: ${simulatedData.temperature.toFixed(1)}°C | Dist: ${simulatedData.distance.toFixed(1)}cm (Simulado)`}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: "20px", fontSize: "clamp(24px, 3vw, 36px)" }}>📹 Cámara ROV</div>
                <div style={{ fontSize: "clamp(14px, 1.5vw, 18px)", opacity: 0.8, marginBottom: "10px" }}>
                  Presiona "Iniciar" para comenzar
                </div>
                <div style={{ fontSize: "clamp(12px, 1.2vw, 16px)", opacity: 0.6 }}>
                  Sistema listo para inspección
                </div>
              </div>
            )}
          </div>
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
        <button 
          style={{...buttonStyle, background: isPlaying ? "#666" : "#FFD600"}}
          onClick={isPlaying ? handleStop : handleStart}
        >
          {isPlaying ? "Detener" : "Iniciar"}
        </button>
        <button 
          style={buttonStyle}
          onClick={() => navigate("/menu")}
        >
          Finalizar
        </button>
        <button 
          style={{...buttonStyle, background: lightsOn ? "#FFD600" : "#666"}}
          onClick={handleLights}
        >
          Luces {lightsOn ? "ON" : "OFF"}
        </button>
        <button 
          style={{...buttonStyle, background: "#FF6B6B"}}
          onClick={handleCapture}
          disabled={!isPlaying}
        >
          Capturar ({captureCount})
        </button>
      </div>
      {/* Menú lateral */}
      {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} arduinoData={arduinoData} error={error} />}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
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

const SideMenu = ({ onClose, arduinoData, error }) => (
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
      {error ? (
        <div style={{ color: "red", marginBottom: 8 }}>
          Error: {error}
        </div>
      ) : arduinoData ? (
        <>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/tiempo.png" alt="Tiempo" style={{ width: 22, height: 22 }} />
            Tiempo: {new Date().toLocaleTimeString()}
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/temperatura.png" alt="Temperatura" style={{ width: 22, height: 22 }} />
            Temperatura: {arduinoData.temperature}°C | {(arduinoData.temperature * 9/5 + 32).toFixed(1)}°F
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/depth.png" alt="Humedad" style={{ width: 22, height: 22 }} />
            Humedad: {arduinoData.humidity}%
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/depth.png" alt="Distancia" style={{ width: 22, height: 22 }} />
            Distancia: {arduinoData.distance} cm
          </div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/depth.png" alt="Motor" style={{ width: 22, height: 22 }} />
            Motor: {arduinoData.motor}
          </div>
        </>
      ) : (
        <div style={{ marginBottom: 8 }}>
          Cargando datos del Arduino...
        </div>
      )}
    </div>
  </div>
);

export default InspectionPage; 