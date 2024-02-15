// AppRoutes.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Overlay from './components/Overlay';
import PhysicsSimulations from './physics/PhysicsSimulations';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div><Overlay /><PhysicsSimulations /></div>} />
        <Route path="/about" element={<Overlay section="about" />} />
        <Route path="/contact" element={<Overlay section="contact" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
