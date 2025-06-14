import React from "react";

const InspectionForm = () => (
  <div style={{ width: '100%', maxWidth: 600 }}>
    <h2 style={{ fontFamily: 'Fira Mono, monospace', color: '#fff', fontSize: 32 }}>Datos de la inspección</h2>
    <input type="text" placeholder="Nombre de la inspección" style={inputStyle} />
    <input type="text" placeholder="Lugar de la inspección" style={inputStyle} />
    <input type="text" placeholder="Fecha de la inspección" style={inputStyle} />
    <textarea placeholder="Descripción" style={textareaStyle} />
  </div>
);

const inputStyle = {
  width: "100%",
  padding: 14,
  margin: "10px 0",
  borderRadius: 16,
  border: "none",
  fontFamily: "Fira Mono, monospace",
  fontSize: 20,
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  minHeight: 120,
  height: 180,
  padding: 14,
  margin: "10px 0",
  borderRadius: 16,
  border: "none",
  fontFamily: "Fira Mono, monospace",
  fontSize: 20,
  resize: "none",
  boxSizing: "border-box",
};

export default InspectionForm; 