// Overlay.js
import React from 'react';
import Title from './Title';
import ButtonList from './ButtonList';
import AboutComponent from './AboutComponent';
import ContactComponent from './ContactComponent';
import { Routes, Route } from 'react-router-dom';
import './Overlay.css';

const Overlay = () => {
  console.log("Overlay component rendered");

  return (
    <div className="overlay">
      <Routes>
        <Route path="/" element={<Title />} />
        <Route path="/about" element={<AboutComponent />} />
        <Route path="/contact" element={<ContactComponent />} />
      </Routes>
      <ButtonList />
    </div>
  );
};

export default Overlay;
