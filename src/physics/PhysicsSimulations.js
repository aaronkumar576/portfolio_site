// PhysicsSimulations.js
import React, { useState } from 'react';
import ParticleSim1 from './ParticleSim1';
import ParticleSim2 from './ParticleSim2';
import './PhysicsSimulations.css';

const PhysicsSimulations = () => {
  const [activeSimulation, setActiveSimulation] = useState('particle1');

  const renderActiveSimulation = () => {
    if (activeSimulation === 'particle2') {
      return <ParticleSim2 />;
    }
    // Default to ParticleSim1
    return <ParticleSim1 />;
  };

  return (
    <div className="physics-simulations">
      {renderActiveSimulation()}
      <div className="simulation-buttons">
        <button onClick={() => setActiveSimulation('particle1')}>Particle Sim 1</button>
        <button onClick={() => setActiveSimulation('particle2')}>Particle Sim 2</button>
      </div>
    </div>
  );
};

export default PhysicsSimulations;
