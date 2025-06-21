import React, { useEffect, useState } from "react";
import InspectionPage from "../components/InspectionPage";

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

  return <InspectionPage arduinoData={arduinoData} error={error} />;
};

export default Inspection;
