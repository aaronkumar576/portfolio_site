import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, extend } from 'react-three-fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

extend({ OrbitControls });

const ParticleSystem = ({ count, blackHolePosition, blackHoleMass }) => {
  const mesh = useRef();
  const [particles, setParticles] = useState([]);

  const spawnParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 5; i++) {
      const position = new THREE.Vector3(50, 50, -50); // Set position to your desired single location
      const velocity = new THREE.Vector3(Math.random() * 5, Math.random() * 5, -1000);
      const mass = 10; // Random mass for each particle

      newParticles.push({ position, velocity, mass });
    }
    setParticles(prevParticles => [...prevParticles, ...newParticles]);
  }, [setParticles]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (particles.length < count) {
        spawnParticles();
      } else {
        clearInterval(interval); // Stop interval when desired particle count is reached
      }
    }, 100); // Interval in milliseconds to spawn new particles
  
    return () => clearInterval(interval); // Cleanup function to clear the interval on unmount
  }, [spawnParticles, particles.length, count]);
  
  useFrame(() => {
    particles.forEach((particle, index) => {
      // Calculate SPH forces (pressure, viscosity)
      const sphForces = calculateSPHForces(particle, particles);
  
      // Calculate gravitational force from the black hole
      const blackHoleForce = calculateBlackHoleForce(particle, blackHolePosition, blackHoleMass);
  
      // Combine forces
      const totalForce = sphForces.add(blackHoleForce);
  
      // Calculate acceleration
      const acceleration = totalForce.divideScalar(particle.mass);
  
      // Update velocity
      particle.velocity.addScaledVector(acceleration, 0.01);
  
      // Update position based on velocity
      particle.position.addScaledVector(particle.velocity, 0.01);
  
      // Update particle matrix
      const matrix = new THREE.Matrix4();
      matrix.setPosition(particle.position.x, particle.position.y, particle.position.z);
      mesh.current.setMatrixAt(index, matrix);
    });
  
    mesh.current.instanceMatrix.needsUpdate = true;

    // Spawn new particles gradually
    if (particles.length < count) {
      spawnParticles();
    }
  });

  return (
    <instancedMesh ref={mesh} args={[new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: "red" }), particles.length]}>
    </instancedMesh>
  );
};

const BlackHoleSim = () => {
  const controlsRef = useRef();
  const blackHolePosition = new THREE.Vector3(0, 0, 0);
  const blackHoleMass = 1.989e18; // Mass of the black hole in kilograms (example value)

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 30], near: 0.1, far: 10000 }}
        style={{ background: '#000000' }}
        onCreated={({ gl, camera }) => {
          controlsRef.current = new OrbitControls(camera, gl.domElement);
          controlsRef.current.enableDamping = true;
          controlsRef.current.dampingFactor = 0.25;
          controlsRef.current.mouseButtons = { LEFT: THREE.MOUSE.LEFT, RIGHT: null };
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <mesh>
          <sphereGeometry args={[4, 32, 32]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <ParticleSystem count={1000} blackHolePosition={blackHolePosition} blackHoleMass={blackHoleMass} />
        <Stars />
      </Canvas>
    </>
  );
};

const Stars = () => {
  const points = useRef();

  useEffect(() => {
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
  
    const blackHolePosition = new THREE.Vector3(0, 0, 0); // Assuming black hole is at origin
    const minDistance = 1000; // Minimum distance from black hole
  
    for (let i = 0; i < starCount; i++) {
      let position = new THREE.Vector3();
      
      // Generate random positions until we find one outside the spherical buffer
      do {
        position.x = (Math.random() - 0.5) * 2500; // Random x-coordinate within -1000 to 1000
        position.y = (Math.random() - 0.5) * 2500; // Random y-coordinate within -1000 to 1000
        position.z = (Math.random() - 0.5) * 2500; // Random z-coordinate within -1000 to 1000
      } while (position.distanceTo(blackHolePosition) < minDistance); // Repeat until outside the buffer
  
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
    }
  
    if (points.current && points.current.geometry) {
      points.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, []);  

  return (
    <points ref={points}>
      <bufferGeometry attach="geometry" />
      <pointsMaterial attach="material" size={1} sizeAttenuation color="white" />
    </points>
  );
};

// Function to calculate SPH forces
const calculateSPHForces = (particle, particles) => {
  const smoothingLength = 5; // Smoothing length for SPH interactions
  const stiffness = 0.1; // Stiffness coefficient for pressure
  const viscosityCoefficient = 0.5; // Viscosity coefficient

  let pressureForce = new THREE.Vector3(0, 0, 0);
  let viscosityForce = new THREE.Vector3(0, 0, 0);

  particles.forEach(otherParticle => {
    if (otherParticle !== particle) {
      const distance = particle.position.distanceTo(otherParticle.position);
      if (distance < smoothingLength) {
        // Calculate pressure force
        const pressure = stiffness * (1 - distance / smoothingLength);
        const direction = new THREE.Vector3().subVectors(particle.position, otherParticle.position).normalize();
        pressureForce.addScaledVector(direction, pressure);

        // Calculate viscosity force
        const relativeVelocity = new THREE.Vector3().subVectors(otherParticle.velocity, particle.velocity);
        const viscosity = viscosityCoefficient * (1 - distance / smoothingLength);
        viscosityForce.addScaledVector(relativeVelocity, viscosity);
      }
    }
  });

  // Combine pressure and viscosity forces
  const totalSPHForce = pressureForce.add(viscosityForce);
  return totalSPHForce;
};

// Function to calculate gravitational force from the black hole
const calculateBlackHoleForce = (particle, blackHolePosition, blackHoleMass) => {
  const G = 6.67430e-11; // Gravitational constant

  const direction = new THREE.Vector3().subVectors(blackHolePosition, particle.position).normalize();
  const distance = blackHolePosition.distanceTo(particle.position);

  // Calculate gravitational force using Newton's law of universal gravitation
  const magnitude = (G * blackHoleMass * particle.mass) / (distance * distance);
  const gravitationalForce = direction.multiplyScalar(magnitude);

  return gravitationalForce;
};

export default BlackHoleSim;



























/*import React, { useEffect, useRef } from 'react';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import './BlackHoleSim.css';

  class ParticleSystem {
    constructor(scene, blackHole) {
      this.scene = scene;
      this.blackHole = blackHole;
      this.particles = [];
      this.particleGeometry = new THREE.BufferGeometry();
      this.initialPositions = [];
      this.createParticles();
      this.createParticleSystem();
    }

    createParticles() {
      const numParticles = 100;
      const particleRadius = 30;
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * particleRadius;
        const x = Math.sin(angle) * distance;
        const y = (Math.random() - 0.5) * particleRadius * 2;
        const z = Math.cos(angle) * distance;
        const position = new THREE.Vector3(x, y, z).add(this.blackHole.position);
        
        // Generate random initial velocities
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 10, // Random x velocity between -0.5 and 0.5
          (Math.random() - 0.5) * 10, // Random y velocity between -0.5 and 0.5
          (Math.random() - 0.5) * 10 // Random z velocity between -0.5 and 0.5
        );
    
        this.particles.push({ position, velocity });
        this.initialPositions.push(position.x, position.y, position.z);
      }
      this.particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(this.initialPositions, 3));
      this.particleGeometry.setAttribute('initialPosition', new THREE.Float32BufferAttribute(this.initialPositions, 3));
    }  

    createParticleSystem() {
      const particleMaterial = new THREE.PointsMaterial({ color: 0xd93d09, size: 0.2 });
      const particleSystem = new THREE.Points(this.particleGeometry, particleMaterial);
      this.scene.add(particleSystem);
    }

    update() {
      const positions = this.particleGeometry.getAttribute('position').array;
      
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.position.add(particle.velocity); // Update particle position based on velocity
    
        // Update positions array
        const index = i * 3;
        positions[index] = particle.position.x;
        positions[index + 1] = particle.position.y;
        positions[index + 2] = particle.position.z;
      }

      this.particleGeometry.getAttribute('position').needsUpdate = true; // Update geometry
    }
  }

  const BlackHoleSim = () => {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const particleSystemRef = useRef(null); // Define particleSystemRef

    useEffect(() => {
      // Create a scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create a camera
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 15;
      cameraRef.current = camera;

      // Create a renderer
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current = renderer;
      containerRef.current.appendChild(renderer.domElement);

      // Create OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;

      // Create a star field
      const starCount = 1000;
      const starsGeometry = new THREE.BufferGeometry();
      const positions = [];

      for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);

        positions.push(x, y, z);
      }

      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
      const starField = new THREE.Points(starsGeometry, starMaterial);
      scene.add(starField);

      // Create a black hole (simple sphere)
      const blackHoleGeometry = new THREE.SphereGeometry(1, 32, 32);
      const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
      scene.add(blackHole);

      // Create particle system
      particleSystemRef.current = new ParticleSystem(scene, blackHole);

      // Set up animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        particleSystemRef.current.update(); // Access particle system through useRef
        renderer.render(scene, camera);
      };

      animate();

      // Handle window resizing
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      // Clean up event listeners and renderer
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    }, []);

    return <div ref={containerRef} className="black-hole-sim"></div>;
  };

  export default BlackHoleSim; */
