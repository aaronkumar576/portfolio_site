import React, { useState, useEffect } from 'react';
import Quadtree from 'simple-quadtree';
import './FlockingSim.css'; // Import CSS for styling

const FlockingSim = () => {
  const [particles, setParticles] = useState([]);
  const [leaderParticle, setLeaderParticle] = useState(null); // State for the leader particle

  // Define lastLeaderAdjustmentTime state
  const [lastLeaderAdjustmentTime, setLastLeaderAdjustmentTime] = useState(0);

  useEffect(() => {
    // Initialize the leader particle
    const leaderX = window.innerWidth / 2; // Center X coordinate
    const leaderY = window.innerHeight / 2; // Center Y coordinate
    const initialLeaderParticle = {
      id: 0,
      x: leaderX,
      y: leaderY,
      speedX: (Math.random() * 4 - 2),
      speedY: (Math.random() * 4 - 2),
      type: 'leader', // Mark particle as leader
    };

    setLeaderParticle(initialLeaderParticle);

    // Create initial particles (normal particles)
    const numParticles = 1500; // Number of normal particles
    const particleRadius = 500; // Radius around the leader particle to spawn normal particles
    const initialParticles = Array.from({ length: numParticles }, (_, index) => {
      const angle = Math.random() * Math.PI * 2; // Random angle
      const distance = Math.random() * particleRadius; // Random distance within radius
      const x = leaderX + Math.cos(angle) * distance; // X coordinate based on angle and distance
      const y = leaderY + Math.sin(angle) * distance; // Y coordinate based on angle and distance
      return {
        id: index + 1, // Start IDs from 1 for normal particles
        x,
        y,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        type: 'normal', // Mark particle as normal
      };
    });

    setParticles(initialParticles);

    // Insert particles into the quadtree
    const quadtree = new Quadtree({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    initialParticles.forEach((particle) => {
      quadtree.put({
        x: particle.x,
        y: particle.y,
        width: 1, // Adjust as needed
        height: 1, // Adjust as needed
        data: particle,
      });
    });

    // Cleanup function
    return () => {
      // Perform cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (!leaderParticle || !particles.length) return; // Exit if leader particle or particles are not initialized

    const quadtree = new Quadtree({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    particles.forEach((particle) => {
      quadtree.put({
        x: particle.x,
        y: particle.y,
        width: 1, // Adjust as needed
        height: 1, // Adjust as needed
        data: particle,
      });
    });

    // Calculate influence of nearby particles on the leader particle
    const calculateInfluence = () => {                                                      //Chaos:
      const cohesionRadius = 50; // Increase cohesion radius for small particles              100
      const separationRadius = 3; // Keep separation radius small to avoid overcrowding        20
      const alignmentFactor = 10; // Moderate alignment factor for smooth movement             0.5
      const cohesionFactor = 0.25; // Increase cohesion factor for stronger attraction         0.005
      const separationFactor = 0.0005; // Increase separation factor for effective avoidance     0.001
      const particleMaxSpeed = 5; // Maximum speed for particles                                5
      const leaderMaxSpeed = 2; // Maximum speed for leader                                     3
      const edgeBuffer = 200;
      const dampingFactor = 0.05; // Adjust as needed
      const leaderAdjustmentDelay = 4000; // Adjust as needed
      const currentTime = Date.now();

      for (const particle of particles) {
        const nearbyParticles = quadtree.get({
          x: particle.x - cohesionRadius,
          y: particle.y - cohesionRadius,
          width: cohesionRadius * 2,
          height: cohesionRadius * 2,
        });

        let alignment = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let separation = { x: 0, y: 0 };

        // Iterate over nearby particles to calculate cohesion, separation, and alignment
        for (const otherParticle of nearbyParticles) {
          if (otherParticle.data !== particle) {
            const dx = otherParticle.x - particle.x;
            const dy = otherParticle.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < cohesionRadius) {
              cohesion.x += dx;
              cohesion.y += dy;
            }
            if (distance < separationRadius) {
              separation.x -= dx / distance;
              separation.y -= dy / distance;
            }
            alignment.x += otherParticle.data.speedX;
            alignment.y += otherParticle.data.speedY;
          }
        }

        const numParticles = nearbyParticles.length - 1; // Excluding self
        if (numParticles > 0) {
          alignment.x /= numParticles;
          alignment.y /= numParticles;
        }

        alignment.x += (leaderParticle.x - particle.x) * alignmentFactor;
        alignment.y += (leaderParticle.y - particle.y) * alignmentFactor;

        cohesion.x += (leaderParticle.x - particle.x) * cohesionFactor;
        cohesion.y += (leaderParticle.y - particle.y) * cohesionFactor;

        const alignmentMagnitude = Math.sqrt(alignment.x * alignment.x + alignment.y * alignment.y);
        if (alignmentMagnitude > 0) {
          alignment.x /= alignmentMagnitude;
          alignment.y /= alignmentMagnitude;
        }

        particle.speedX += (alignment.x + cohesion.x + separation.x) * separationFactor;
        particle.speedY += (alignment.y + cohesion.y + separation.y) * separationFactor;

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Limit particle speed
        const particleSpeed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
        if (particleSpeed > particleMaxSpeed) {
          particle.speedX = (particle.speedX / particleSpeed) * particleMaxSpeed;
          particle.speedY = (particle.speedY / particleSpeed) * particleMaxSpeed;
        }

        // Handle edge collisions for particles
        if (particle.x < edgeBuffer) {
          particle.speedX += dampingFactor; // Reverse particle's speed
        } else if (particle.x > window.innerWidth - edgeBuffer) {
          particle.speedX += -dampingFactor; // Reverse particle's speed
        }

        if (particle.y < edgeBuffer) {
          particle.speedY += dampingFactor; // Reverse particle's speed
        } else if (particle.y > window.innerHeight - edgeBuffer) {
          particle.speedY += -dampingFactor; // Reverse particle's speed
        }
      }

      const leaderSpeed = Math.sqrt(leaderParticle.speedX * leaderParticle.speedX + leaderParticle.speedY * leaderParticle.speedY);
      if (leaderSpeed > leaderMaxSpeed) {
        leaderParticle.speedX = (leaderParticle.speedX / leaderSpeed) * leaderMaxSpeed;
        leaderParticle.speedY = (leaderParticle.speedY / leaderSpeed) * leaderMaxSpeed;
      }

      if (currentTime - lastLeaderAdjustmentTime > leaderAdjustmentDelay) {
        leaderParticle.speedX += Math.random() * (leaderMaxSpeed * 2) - leaderMaxSpeed;
        leaderParticle.speedY += Math.random() * (leaderMaxSpeed * 2) - leaderMaxSpeed;

        // Update last adjustment time
        setLastLeaderAdjustmentTime(currentTime);
      }

      leaderParticle.x += leaderParticle.speedX;
      leaderParticle.y += leaderParticle.speedY;

      if (leaderParticle.x < edgeBuffer) {
        leaderParticle.speedX += dampingFactor; // Reverse particle's speed
      } else if (leaderParticle.x > window.innerWidth - edgeBuffer) {
        leaderParticle.speedX += -dampingFactor; // Reverse particle's speed
      }
      if (leaderParticle.y < edgeBuffer) {
        leaderParticle.speedY += dampingFactor; // Reverse particle's speed
      } else if (leaderParticle.y > window.innerHeight - edgeBuffer) {
        leaderParticle.speedY += -dampingFactor; // Reverse particle's speed
      }

      setLeaderParticle({ ...leaderParticle });
      setParticles([...particles]);
    };

    const intervalId = setInterval(calculateInfluence, 16);

    return () => {
      clearInterval(intervalId);
    };
  }, [leaderParticle, particles, lastLeaderAdjustmentTime]);

  return (
    <div className="flocking-sim">
      {leaderParticle && (
        <div
          key={leaderParticle.id}
          className="particle leader-particle"
          style={{ left: leaderParticle.x, top: leaderParticle.y }}
        ></div>
      )}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle normal-particle"
          style={{ left: particle.x, top: particle.y }}
        ></div>
      ))}
    </div>
  );
};

export default FlockingSim;
