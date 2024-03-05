// Simulations.js
import React, { useState } from 'react';
import FlockingSim from './FlockingSim';
import BlackHoleSim from './BlackHoleSim';
import './Simulations.css';

const Simulations = () => {
  const [activeSimulation, setActiveSimulation] = useState('flockingsim');

  const renderActiveSimulation = () => {
    if (activeSimulation === 'blackholeSim') {
      return <BlackHoleSim />;
    }
    // Default to ParticleSim1
    return <FlockingSim />;
  };

  return (
    <div className="simulations">
      {renderActiveSimulation()}
      <div className="simulation-buttons">
        <button onClick={() => setActiveSimulation('flockingsim')}>Flocking Simulation</button>
        <button onClick={() => setActiveSimulation('blackholeSim')}>Black Hole Simulation</button>
      </div>
    </div>
  );
};

export default Simulations;
