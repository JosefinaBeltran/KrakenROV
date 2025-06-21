import React, { useEffect, useState } from "react";

const Inspection = () => {
  const [arduinoData, setArduinoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:5000/data")
        .then((res) => res.json())
        .then((data) => setArduinoData(data))
        .catch((err) => {
          console.error("Error al obtener datos:", err);
          setError("No se pudo obtener datos del Arduino");
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 1000); // actualiza cada segundo
    return () => clearInterval(interval); // limpieza
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inspección – Datos en Tiempo Real</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {arduinoData ? (
        <ul>
          <li>🌡️ Temperatura: {arduinoData.temperature} °C</li>
          <li>💧 Humedad: {arduinoData.humidity} %</li>
          <li>📏 Distancia: {arduinoData.distance} cm</li>
          <li>⚙️ Motor: {arduinoData.motor}</li>
        </ul>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
};

export default Inspection;
