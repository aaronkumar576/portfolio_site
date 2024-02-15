// ParticleSim1.js
import React, { useEffect, useState } from 'react';
import './ParticleSim1.css'; // Import CSS for styling

const ParticleSim1 = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const affectRadius = 100; // Adjust the radius of effect as needed
    
      setParticles((prevParticles) =>
        prevParticles.map((particle) => {
          const distanceX = mouseX - particle.x;
          const distanceY = mouseY - particle.y;
          const distanceToMouse = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    
          // Apply effect only to particles within the specified radius
          if (distanceToMouse < affectRadius) {
            // Adjust particle speed based on distance to mouse
            const speedFactor = 0.001; // Adjust this factor to control the follow strength
            const speedX = (particle.speedX + distanceX * speedFactor) * 0.95; // Damping factor
            const speedY = (particle.speedY + distanceY * speedFactor) * 0.95; // Damping factor
    
            return {
              ...particle,
              speedX,
              speedY,
            };
          }
    
          return particle;
        })
      );
    };    

    // Create initial particles
    const initialParticles = Array.from({ length: 800 }, (_, index) => ({
      id: index,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speedX: Math.random() * 2 - 1, // Random horizontal speed between -1 and 1
      speedY: Math.random() * 2 - 1, // Random vertical speed between -1 and 1
    }));

    setParticles(initialParticles);

    // Attach mouse move event listener
    document.addEventListener('mousemove', handleMouseMove);

    // Update particle positions periodically
    const intervalId = setInterval(() => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => {
          const newX = (particle.x + particle.speedX + window.innerWidth) % window.innerWidth;
          const newY = (particle.y + particle.speedY + window.innerHeight) % window.innerHeight;

          return {
            ...particle,
            x: newX,
            y: newY,
          };
        })
      );
    }, 16); // Update every 16 milliseconds (approximately 60 frames per second)

    // Cleanup interval and event listener on component unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="particle-sim">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{ left: particle.x, top: particle.y }}
        ></div>
      ))}
    </div>
  );
};

export default ParticleSim1;
