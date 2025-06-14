import React from "react";
import Logo from "../components/Logo";
import InspectorForm from "../components/InspectorForm";
import InspectionForm from "../components/InspectionForm";
import FormButtons from "../components/FormButtons";

const InspectionFormPage = () => (
  <div style={{ background: "#122830", minHeight: "100vh", position: "relative", width: "100vw", padding: 0, overflowX: 'hidden' }}>
    <Logo />
    <div style={{
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: "clamp(24px, 6vw, 80px)",
      marginTop: 100,
      flexWrap: "wrap",
      width: "100vw",
      boxSizing: "border-box",
      padding: 8,
      maxWidth: '100vw',
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 180, maxWidth: 340, width: "clamp(160px, 32vw, 340px)" }}>
        <img src="/public/diverHelmetBlanco.png" alt="icon" style={{ width: "clamp(80px, 18vw, 220px)", height: "clamp(80px, 18vw, 220px)", marginBottom: 32 }} />
        <InspectorForm />
      </div>
      <div style={{ minWidth: 180, maxWidth: 600, width: "clamp(180px, 60vw, 600px)" }}>
        <InspectionForm />
      </div>
    </div>
    <FormButtons />
    <style>{`
      @media (max-width: 700px) {
        .inspection-flex {
          flex-direction: column !important;
          align-items: stretch !important;
          margin-top: 32px !important;
        }
      }
    `}</style>
  </div>
);

export default InspectionFormPage; 