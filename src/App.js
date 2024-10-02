import React, { useState, useEffect } from 'react';
import {
  AstroTime,
  Body,
  HelioVector,
  Rotation_EQJ_ECL,
  RotateVector,
  GeoVector,
} from 'astronomy-engine';

import sunImage from './images/sun.png';
import mercuryImage from './images/mercury.png';
import venusImage from './images/venus.png';
import marsImage from './images/mars.png';
import earthImage from './images/earth.png';
import jupiterImage from './images/jupiter.png';
import saturnImage from './images/saturn.png';
import uranusImage from './images/uranus.png';
import neptuneImage from './images/neptune.png';


const planets = [
  {
    name: 'Mercury',
    body: Body.Mercury,
    image: mercuryImage,
    size: 30,
    color: '#8c8c8c',
    orbitalPeriod: 87.97, // days
    semiMajorAxis: 0.3871, // AU
    eccentricity: 0.2056,
  },
  {
    name: 'Venus',
    body: Body.Venus,
    size: 25,
    image: venusImage,
    color: '#e39e1c',
    orbitalPeriod: 224.7,
    semiMajorAxis: 0.7233,
    eccentricity: 0.0068,
  },
  {
    name: 'Earth',
    body: Body.Earth,
    size: 30,
    image: earthImage,
    color: '#2b82c9',
    orbitalPeriod: 365.26,
    semiMajorAxis: 1.0,
    eccentricity: 0.0167,
  },
  {
    name: 'Mars',
    body: Body.Mars,
    size: 30,
    image: marsImage,
    color: '#c1440e',
    orbitalPeriod: 686.98,
    semiMajorAxis: 1.5273,
    eccentricity: 0.0934,
  },
  {
    name: 'Jupiter',
    body: Body.Jupiter,
    size:55,
    image: jupiterImage,
    color: '#e0ae6f',
    orbitalPeriod: 4332.59,
    semiMajorAxis: 5.2028,
    eccentricity: 0.0484,
  },
  {
    name: 'Saturn',
    body: Body.Saturn,
    size:90,
    image: saturnImage,
    color: '#f4d47a',
    orbitalPeriod: 10759.22,
    semiMajorAxis: 9.5388,
    eccentricity: 0.0542,
  },
  {
    name: 'Uranus',
    body: Body.Uranus,
    image: uranusImage,
    size:95,
    color: '#82b3d1',
    orbitalPeriod: 30688.5,
    semiMajorAxis: 19.1914,
    eccentricity: 0.0472,
  },
  {
    name: 'Neptune',
    body: Body.Neptune,
    size:45,
    image: neptuneImage,
    color: '#3f54ba',
    orbitalPeriod: 60182,
    semiMajorAxis: 30.0611,
    eccentricity: 0.0086,
  },
];

const SolarSystem = () => {
  const [targetDate, setTargetDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [positions, setPositions] = useState([]);
  const [orbitPaths, setOrbitPaths] = useState([]);
  const [animating, setAnimating] = useState(false);

  const animationDuration = 10000; // Animation duration in milliseconds

  // Define normalized orbit radii for even visual spacing
  const minRadius = 50;
  const maxRadius = 300;
  const radiusStep = (maxRadius - minRadius) / (planets.length - 1);

  const normalizedOrbitRadii = planets.map(
    (_, index) => minRadius + radiusStep * index
  );

  // **Calculate scale factors for each planet**
  const scaleFactors = planets.map((planet, index) => {
    return normalizedOrbitRadii[index] / planet.semiMajorAxis;
  });

  useEffect(() => {
    // **Calculate orbit paths when the component mounts**
    const paths = planets.map((planet, index) => {
      const rawPath = calculateOrbitPath(planet);
      const scaleFactor = scaleFactors[index];
      const scaledPath = rawPath.map((pos) => ({
        x: pos.x * scaleFactor,
        y: pos.y * scaleFactor,
      }));
      return scaledPath;
    });
    setOrbitPaths(paths);

    // Initialize positions
    const initialPositions = planets.map((planet, index) =>
      calculatePosition(planet, currentDate, index)
    );
    setPositions(initialPositions);
  }, []);

  const calculateOrbitPath = (planet, numPoints = 360) => {
    const positions = [];
    const currentDate = new Date();
    const astroTime = new AstroTime(currentDate);
    const timeStep = planet.orbitalPeriod / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const t = astroTime.AddDays(i * timeStep);
      const helioVector = HelioVector(planet.body, t);
      const rotationMatrix = Rotation_EQJ_ECL();
      const eclipticVector = RotateVector(rotationMatrix, helioVector);
      positions.push({ x: eclipticVector.x, y: eclipticVector.y });
    }

    return positions;
  };

  const calculatePosition = (planet, date, index) => {
    const astroTime = new AstroTime(date);
  
    // Solar System Positions (heliocentric coordinates)
    const helioVector = HelioVector(planet.body, astroTime);
    const rotationMatrixHelio = Rotation_EQJ_ECL();
    const eclipticVectorHelio = RotateVector(rotationMatrixHelio, helioVector);
  
    // Apply scale factor for solar system visualization
    const x = eclipticVectorHelio.x;
    const y = eclipticVectorHelio.y;
    const scaleFactor = scaleFactors[index];
    const scaledX = x * scaleFactor;
    const scaledY = y * scaleFactor;
  
    // Natal Chart Positions (geocentric coordinates)
    const geoVector = GeoVector(planet.body, astroTime, true);
    const rotationMatrixGeo = Rotation_EQJ_ECL();
    const eclipticVectorGeo = RotateVector(rotationMatrixGeo, geoVector);
  
    // Ecliptic longitude for natal chart (in degrees)
    const longitudeRad = Math.atan2(eclipticVectorGeo.y, eclipticVectorGeo.x);
    const longitudeDeg = (longitudeRad * 180) / Math.PI;
    const normalizedLongitude = (longitudeDeg + 360) % 360; // Ensure angle between 0-360 degrees
  
    const natalChartRadius = 150; // Adjust as needed
    const natalX =
      natalChartRadius * Math.cos((normalizedLongitude * Math.PI) / 180);
    const natalY =
      natalChartRadius * Math.sin((normalizedLongitude * Math.PI) / 180);
  
    // Check for NaN values
    if (
      isNaN(scaledX) ||
      isNaN(scaledY) ||
      isNaN(normalizedLongitude) ||
      isNaN(natalX) ||
      isNaN(natalY)
    ) {
      console.error(`Invalid calculations for ${planet.name}`);
      return null;
    }
  
    return {
      solarSystemPosition: { x: scaledX, y: scaledY },
      natalChartPosition: { angle: normalizedLongitude, x: natalX, y: natalY },
    };
  };

  // Easing function for smooth acceleration and deceleration
  const easeInOutCubic = (t) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    if (!isNaN(selectedDate)) {
      setTargetDate(selectedDate);
    } else {
      console.error('Invalid date selected:', e.target.value);
    }
  };

  const animatePlanets = () => {
    setAnimating(true);
    const startDateTime = currentDate.getTime();
    const targetDateTime = targetDate.getTime();
    const animationStartTime = performance.now();

    const animate = () => {
      const elapsedTime = performance.now() - animationStartTime;
      let progress = elapsedTime / animationDuration;

      if (progress >= 1) {
        progress = 1;
        setAnimating(false);
        setCurrentDate(targetDate);
        const newPositions = planets.map((planet, index) =>
          calculatePosition(planet, targetDate, index)
        );
        setPositions(newPositions);
      } else {
        // Apply easing function to progress
        const easedProgress = easeInOutCubic(progress);

        const interpolatedTime =
          startDateTime + easedProgress * (targetDateTime - startDateTime);
        const interpolatedDate = new Date(interpolatedTime);
        const newPositions = planets.map((planet, index) =>
          calculatePosition(planet, interpolatedDate, index)
        );
        setPositions(newPositions);
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const planetSize = 40;

  return (
    <div>
      {/* Date Picker and Button */}
      <input
        type="datetime-local"
        onChange={handleDateChange}
        value={targetDate.toISOString().slice(0, 16)}
      />
      <button onClick={animatePlanets} disabled={animating}>
        Animate to Position
      </button>

      {/* Side-by-Side Visualizations */}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {/* Solar System Visualization */}
        <svg width="700" height="700" viewBox="-350 -350 700 700">
          <image
          href={sunImage}
          x={-25}
          y={-25}
          width={'50px'}
          height={'50px'}
        />
          {planets.map((planet, index) => (
            <g key={planet.name}>
              {/* Orbit Path */}
              {orbitPaths[index] && (
                <path
                  d={
                    'M ' +
                    orbitPaths[index]
                      .map((pos) => `${pos.x},${pos.y}`)
                      .join(' L ') +
                    ' Z'
                  }
                  fill="none"
                  stroke="#ccc"
                  strokeWidth="0.5"
                />
              )}
              {/* Planet */}
              {positions[index] && positions[index].solarSystemPosition && (
                 <image
                 href={planet.image}
                 x={
                   positions[index].solarSystemPosition.x -
                   (planet.size || planetSize) / 2
                 }
                 y={
                   positions[index].solarSystemPosition.y -
                   (planet.size || planetSize) / 2
                 }
                 width={planet.size || planetSize}
                 height={planet.size || planetSize}
               />
              )}
            </g>
          ))}
        </svg>

        {/* Natal Chart Visualization */}
        <svg width="400" height="400" viewBox="-200 -200 400 400">
          {/* Natal Chart Circle */}
          <circle cx="0" cy="0" r="150" fill="none" stroke="#ccc" strokeWidth="1" />
          {/* Zodiac Signs Division */}
          {[...Array(12)].map((_, index) => {
            const angle = (index * 30 * Math.PI) / 180;
            return (
              <line
                key={index}
                x1="0"
                y1="0"
                x2={150 * Math.cos(angle)}
                y2={150 * Math.sin(angle)}
                stroke="#ccc"
                strokeWidth="1"
              />
            );
          })}
          {/* Zodiac Signs Labels */}
          {[
            'Aries',
            'Taurus',
            'Gemini',
            'Cancer',
            'Leo',
            'Virgo',
            'Libra',
            'Scorpio',
            'Sagittarius',
            'Capricorn',
            'Aquarius',
            'Pisces',
          ].map((sign, index) => {
            const angle = ((index * 30 + 15) * Math.PI) / 180; // Middle of each sign
            return (
              <text
                key={sign}
                x={120 * Math.cos(angle)}
                y={120 * Math.sin(angle)}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="10"
                stroke="#ccc"
              >
                {sign}
              </text>
            );
          })}
          {/* Planets */}
          {positions.map(
            (pos, index) =>
              pos &&
              pos.natalChartPosition && (
                <g key={planets[index].name}>
                  <circle
                    cx={pos.natalChartPosition.x}
                    cy={pos.natalChartPosition.y}
                    r="5"
                    fill={planets[index].color}
                  />
                  <text
                    x={pos.natalChartPosition.x}
                    y={pos.natalChartPosition.y - 10}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="12"
                    fill={planets[index].color}
                  >
                    {planets[index].name}
                  </text>
                </g>
              )
          )}
        </svg>
      </div>
    </div>
  );
};

export default SolarSystem;