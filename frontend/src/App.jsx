import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import MainMenu from "./pages/MainMenu";
import InspectionFormPage from "./pages/InspectionFormPage";
import Inspection from "./pages/Inspection";
import './App.css'

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/menu" element={<MainMenu />} />
      <Route path="/nueva-inspeccion" element={<InspectionFormPage />} />
      <Route path="/inspeccion" element={<Inspection />} />
    </Routes>
  </Router>
);

export default App;
