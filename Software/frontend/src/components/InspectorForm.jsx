import React from "react";

const InspectorForm = () => (
  <div style={{ marginBottom: 32, width: '100%', maxWidth: 340 }}>
    <h2 style={{ fontFamily: 'Fira Mono, monospace', color: '#fff', fontSize: 32 }}>Datos del inspector</h2>
    <input type="text" placeholder="Nombre" style={inputStyle} />
    <input type="text" placeholder="Apellido" style={inputStyle} />
  </div>
);

const inputStyle = {
  width: '100%',
  maxWidth: 320,
  padding: 14,
  margin: "10px 0",
  borderRadius: 16,
  border: "none",
  fontFamily: "Fira Mono, monospace",
  fontSize: 20,
  boxSizing: 'border-box',
};

export default InspectorForm; 