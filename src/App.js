import React, { useState, useEffect } from 'react';
import {
  AstroTime,
  Body,
  HelioVector,
  Rotation_EQJ_ECL,
  RotateVector,
  GeoVector,
  EclipticLongitude,
  SunPosition,
  EclipticGeoMoon,
  Observer,
  SiderealTime,
  Equator,
  Ecliptic,
} from 'astronomy-engine';

import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';


import sunImage from './images/sun.png';
import moonImage from './images/moon.png';
import mercuryImage from './images/mercury.png';
import venusImage from './images/venus.png';
import marsImage from './images/mars.png';
import earthImage from './images/earth.png';
import jupiterImage from './images/jupiter.png';
import saturnImage from './images/saturn.png';
import uranusImage from './images/uranus.png';
import neptuneImage from './images/neptune.png';
import plutoImage from './images/pluto.png';

const celestialBodies = [
  {
    name: 'Sun',
    body: Body.Sun,
    image: sunImage,
    size: 100,
    color: 'yellow',
    includeInSolarSystem: false,
    includeInNatalChart: true,
  },
  {
    name: 'Moon',
    body: Body.Moon,
    image: moonImage,
    size: 30,
    color: 'silver',
    includeInSolarSystem: false,
    includeInNatalChart: true,
  },
  {
    name: 'Mercury',
    body: Body.Mercury,
    image: mercuryImage,
    size: 26,
    color: '#8c8c8c',
    orbitalPeriod: 87.97,
    semiMajorAxis: 0.3871,
    eccentricity: 0.2056,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Venus',
    body: Body.Venus,
    image: venusImage,
    size: 26,
    color: '#e39e1c',
    orbitalPeriod: 224.7,
    semiMajorAxis: 0.7233,
    eccentricity: 0.0068,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Earth',
    body: Body.Earth,
    image: earthImage,
    size: 26,
    color: '#2b82c9',
    orbitalPeriod: 365.26,
    semiMajorAxis: 1.0,
    eccentricity: 0.0167,
    includeInSolarSystem: true,
    includeInNatalChart: false, // Exclude Earth from the natal chart
  },
  {
    name: 'Mars',
    body: Body.Mars,
    image: marsImage,
    size: 26,
    color: '#c1440e',
    orbitalPeriod: 686.98,
    semiMajorAxis: 1.5273,
    eccentricity: 0.0934,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Jupiter',
    body: Body.Jupiter,
    image: jupiterImage,
    size: 55,
    color: '#e0ae6f',
    orbitalPeriod: 4332.59,
    semiMajorAxis: 5.2028,
    eccentricity: 0.0484,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Saturn',
    body: Body.Saturn,
    image: saturnImage,
    size: 110,
    color: '#f4d47a',
    orbitalPeriod: 10759.22,
    semiMajorAxis: 9.5388,
    eccentricity: 0.0542,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Uranus',
    body: Body.Uranus,
    image: uranusImage,
    size: 95,
    color: '#82b3d1',
    orbitalPeriod: 30688.5,
    semiMajorAxis: 19.1914,
    eccentricity: 0.0472,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Neptune',
    body: Body.Neptune,
    image: neptuneImage,
    size: 42,
    color: '#3f54ba',
    orbitalPeriod: 60182,
    semiMajorAxis: 30.0611,
    eccentricity: 0.0086,
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
  {
    name: 'Pluto',
    body: Body.Pluto,
    image: plutoImage,
    size: 20, // Adjust size as needed
    color: '#b3b3b3',
    orbitalPeriod: 90560, // Pluto's orbital period in days (~248 years)
    semiMajorAxis: 39.482, // Pluto's semi-major axis in AU
    eccentricity: 0.2488, // Pluto's orbital eccentricity
    includeInSolarSystem: true,
    includeInNatalChart: true,
  },
];

const planets = celestialBodies.filter(
  (body) => body.includeInSolarSystem
);

const natalChartBodies = celestialBodies.filter(
  (body) => body.includeInNatalChart
);

const timeZone = 'Pacific/Auckland'; // New Zealand Time Zone


const zodiacSigns = [
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
];

const getZodiacSign = (longitudeDeg) => {
  const index = Math.floor((longitudeDeg % 360) / 30);
  return zodiacSigns[index];
};

const SolarSystem = () => {
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [address, setAddress] = useState('');
  const [natalPositions, setNatalPositions] = useState([]);
  const [ascendantPosition, setAscendantPosition] = useState(null);
  const [mcPosition, setMcPosition] = useState(null);

  const [targetDate, setTargetDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [positions, setPositions] = useState([]);
  const [orbitPaths, setOrbitPaths] = useState([]);
  const [animating, setAnimating] = useState(false);

  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const animationDuration = 5000; // Animation duration in milliseconds

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

    const initialNatalPositions = natalChartBodies.map((bodyData) =>
      calculateNatalPosition(bodyData, currentDate)
    );
    setNatalPositions(initialNatalPositions);
  }, []);

  const formatDateTimeForInput = (date) => {
    // Convert the UTC date to New Zealand time
    const zonedDate = toZonedTime(date, timeZone);
    // Format the date in the expected input format
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
  };

  const calculateAscendant = (date, latitude, longitude) => {
    const astroTime = new AstroTime(date);
    const observer = new Observer(latitude, longitude, 0); // Altitude set to 0

    // Calculate the local apparent sidereal time
    const siderealTime = SiderealTime(astroTime);

    // Compute the ecliptic coordinates of the Ascendant
    const lstDegrees = (siderealTime * 15 + longitude) % 360; // Convert hours to degrees and adjust for longitude
    const obliquity = 23.4366; // Mean obliquity of the ecliptic

    const ascendantRad = Math.atan2(
      -Math.cos((lstDegrees * Math.PI) / 180),
      Math.tan((latitude * Math.PI) / 180) * Math.sin((obliquity * Math.PI) / 180) +
      Math.sin((lstDegrees * Math.PI) / 180) * Math.cos((obliquity * Math.PI) / 180)
    );

    const ascendantDeg = ((ascendantRad * 180) / Math.PI + 360) % 360;

    return ascendantDeg;
  };

  const calculateMC = (date, latitude, longitude) => {
    const astroTime = new AstroTime(date);
    const observer = new Observer(latitude, longitude, 0);

    // Calculate the local apparent sidereal time
    const siderealTime = SiderealTime(astroTime);
    const lstDegrees = (siderealTime * 15 + longitude) % 360; // Convert hours to degrees and adjust for longitude

    const mcDeg = lstDegrees;

    return mcDeg;
  };

  const calculateNatalPosition = (bodyData, date) => {
    const astroTime = new AstroTime(date);
    let longitudeDeg;
  
    if (bodyData.body === Body.Sun) {
      // Use SunPosition to get the Sun's ecliptic longitude
      const sunEcl = SunPosition(astroTime);
      longitudeDeg = sunEcl.elon;
    } else if (bodyData.body === Body.Moon) {
      // Use EclipticGeoMoon to get the Moon's ecliptic longitude
      const moonEcl = EclipticGeoMoon(astroTime);
      longitudeDeg = moonEcl.lon;
    } else {
      // Calculate geocentric ecliptic longitude for planets
      const geoVector = GeoVector(bodyData.body, astroTime, true);
      const rotationMatrixGeo = Rotation_EQJ_ECL();
      const eclipticVectorGeo = RotateVector(rotationMatrixGeo, geoVector);
  
      const longitudeRad = Math.atan2(eclipticVectorGeo.y, eclipticVectorGeo.x);
      longitudeDeg = (longitudeRad * 180) / Math.PI;
    }
  
    const normalizedLongitude = (longitudeDeg + 360) % 360;
  
    const natalChartRadius = 150; // Adjust as needed
    const natalX = natalChartRadius * Math.cos((normalizedLongitude * Math.PI) / 180);
    const natalY = natalChartRadius * Math.sin((normalizedLongitude * Math.PI) / 180);
  
    const zodiacSign = getZodiacSign(normalizedLongitude);
  
    if (isNaN(longitudeDeg) || isNaN(natalX) || isNaN(natalY)) {
      console.error(`Invalid calculations for ${bodyData.name}`);
      return null;
    }
  
    return {
      natalChartPosition: { angle: normalizedLongitude, x: natalX, y: natalY },
      constellation: zodiacSign,
    };
  };

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

  const isRetrograde = (planetBody, date) => {
    const astroTimeNow = new AstroTime(date);

    // Determine appropriate time interval based on planet's speed
    let daysBefore;
    switch (planetBody) {
      case Body.Mercury:
      case Body.Venus:
        daysBefore = -1; // Inner planets move faster
        break;
      case Body.Mars:
      case Body.Jupiter:
      case Body.Saturn:
      case Body.Uranus:
      case Body.Neptune:
      case Body.Pluto:
        daysBefore = -7; // Outer planets move slower
        break;
      default:
        return false; // Sun, Moon, and Earth are not retrograde
    }

    const astroTimeBefore = astroTimeNow.AddDays(daysBefore);

    // Get ecliptic longitudes
    const longitudeNow = EclipticLongitude(planetBody, astroTimeNow);
    const longitudeBefore = EclipticLongitude(planetBody, astroTimeBefore);

    // Calculate the difference in longitude
    let deltaLongitude = longitudeNow - longitudeBefore;



    // If deltaLongitude is negative, the planet is moving westward (retrograde)
    if (deltaLongitude < 0) {
      // Detailed logging
      console.log(`Planet: ${Body[planetBody]}`);
      console.log(`Date Now: ${date.toISOString()}, Longitude Now: ${longitudeNow.toFixed(4)}°`);
      console.log(`Date Before: ${astroTimeBefore.date.toISOString()}, Longitude Before: ${longitudeBefore.toFixed(4)}°`);
      console.log(`Delta Longitude: ${deltaLongitude.toFixed(4)}°`);
    }
    return deltaLongitude < 0;
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

    const zodiacSign = getZodiacSign(normalizedLongitude);

    // Determine if the planet is in retrograde
    const retrograde = isRetrograde(planet.body, date);

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
      constellation: zodiacSign,
      retrograde: retrograde,
    };
  };

  // Easing function for smooth acceleration and deceleration
  const easeInOutCubic = (t) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const handleDateChange = (e) => {
    // Parse the date string as New Zealand time and convert to UTC
    const selectedDate = fromZonedTime(e.target.value, timeZone);
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

        const newNatalPositions = natalChartBodies.map((bodyData) =>
          calculateNatalPosition(bodyData, targetDate)
        );
        setNatalPositions(newNatalPositions);

        // Calculate Ascendant and MC
        const ascendantDeg = calculateAscendant(targetDate, latitude, longitude);
        setAscendantPosition(ascendantDeg);

        const mcDeg = calculateMC(targetDate, latitude, longitude);
        setMcPosition(mcDeg);
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

        const newNatalPositions = natalChartBodies.map((bodyData) =>
          calculateNatalPosition(bodyData, interpolatedDate)
        );
        setNatalPositions(newNatalPositions);

        // Calculate Ascendant and MC
        const ascendantDeg = calculateAscendant(interpolatedDate, latitude, longitude);
        setAscendantPosition(ascendantDeg);

        const mcDeg = calculateMC(interpolatedDate, latitude, longitude);
        setMcPosition(mcDeg);

        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleMouseEnter = (e, index, chartType) => {
    setHoveredPlanet({ index, chartType });
  };

  const handleMouseLeave = () => {
    setHoveredPlanet(null);
  };

  const planetSize = 40;

  return (
    <div>
      {/* Date Picker and Button */}
      <input
        type="datetime-local"
        onChange={handleDateChange}
        value={formatDateTimeForInput(targetDate)}
      />
      <div style={{ marginBottom: '20px', color: 'white' }}>
        <label style={{ marginRight: '10px' }}>
          Latitude:
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(parseFloat(e.target.value))}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <label>
          Longitude:
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(parseFloat(e.target.value))}
            style={{ marginLeft: '5px' }}
          />
        </label>
      </div>
      <button onClick={animatePlanets} disabled={animating}>
        Animate to Position
      </button>

      {/* Side-by-Side Visualizations */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {/* Solar System Visualization */}
        <svg width="700" height="600" viewBox="-350 -350 700 700">
          <image
            href={sunImage}
            x={-35}
            y={-35}
            width={'70px'}
            height={'70px'}
          />
          {planets.map((planet, index) => (
            <g key={planet.name}
              onMouseEnter={(e) => handleMouseEnter(e, index, 'solar')}
              onMouseLeave={handleMouseLeave}
            >
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
                <>
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

                  {/* Conditionally render the tooltip */}
                  {hoveredPlanet &&
                    hoveredPlanet.chartType === 'solar' &&
                    hoveredPlanet.index === index && (
                      <text
                        x={positions[index].solarSystemPosition.x}
                        y={positions[index].solarSystemPosition.y - 20}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize="10"
                        fill="white"
                        stroke="white"
                        strokeWidth="0.5"
                      >

                        {positions[index].retrograde
                          ? `${planet.name} Retrograde`
                          : `${planet.name}`}
                      </text>
                    )}
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Natal Chart Visualization */}
        <svg width="700" height="600" viewBox="-250 -250 500 500" preserveAspectRatio="xMidYMid meet">
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
          {/* Ascendant Line */}
          {ascendantPosition !== null && (
            <g>
              <line
                x1={140 * Math.cos((ascendantPosition * Math.PI) / 180)}
                y1={140 * Math.sin((ascendantPosition * Math.PI) / 180)}
                x2={150 * Math.cos((ascendantPosition * Math.PI) / 180)}
                y2={150 * Math.sin((ascendantPosition * Math.PI) / 180)}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={160 * Math.cos((ascendantPosition * Math.PI) / 180)}
                y={160 * Math.sin((ascendantPosition * Math.PI) / 180)}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="10"
                fill="white"
              >
                
              </text>
            </g>
          )}
          {/* Midheaven Line */}
          {mcPosition !== null && (
            <g>
              <line
                x1={140 * Math.cos((mcPosition * Math.PI) / 180)}
                y1={140 * Math.sin((mcPosition * Math.PI) / 180)}
                x2={150 * Math.cos((mcPosition * Math.PI) / 180)}
                y2={150 * Math.sin((mcPosition * Math.PI) / 180)}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={160 * Math.cos((mcPosition * Math.PI) / 180)}
                y={160 * Math.sin((mcPosition * Math.PI) / 180)}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="10"
                fill="white"
              >
                
              </text>
            </g>
          )}
          {/* Zodiac Signs Labels */}
          {zodiacSigns.map((sign, index) => {
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
          {natalPositions.map(
            (pos, index) =>
              pos &&
              pos.natalChartPosition && (
                <g
                  key={natalChartBodies[index].name}
                  onMouseEnter={(e) => handleMouseEnter(e, index, 'natal')}
                  onMouseLeave={handleMouseLeave}
                >
                  <image
                    href={natalChartBodies[index].image}
                    x={
                      1.2 * pos.natalChartPosition.x -
                      (natalChartBodies[index].size || planetSize) / 2
                    }
                    y={
                      1.2 * pos.natalChartPosition.y -
                      (natalChartBodies[index].size || planetSize) / 2
                    }
                    width={natalChartBodies[index].size || planetSize}
                    height={natalChartBodies[index].size || planetSize}
                  />

                  {/* Conditionally render the tooltip */}
                  {hoveredPlanet &&
                    hoveredPlanet.chartType === 'natal' &&
                    hoveredPlanet.index === index && (
                      <text
                        x={1.2 * pos.natalChartPosition.x}
                        y={1.2 * pos.natalChartPosition.y - 20}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize="8"
                        fill="white"
                        stroke="white"
                        strokeWidth="0.5"
                      >
                        {`${natalChartBodies[index].name} in ${pos.constellation}`}
                      </text>
                    )}
                </g>
              )
          )}
        </svg>
      </div>

      <div style={{ color: "white", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6", fontSize: "16px", textAlign: "justify", fontFamily: "revert" }}>
        <p>
          I wanted to create an animation to display the movement of the planets around the sun with a comparison of how the planets flow through the constellations.
          Astronomy and astrology are one and the same.
          <br /> <br />
          Coincidences do not exist.
          <br /> <br />
          Interconnected, from the macro to the micro,
          here, the map of the cosmos aligns with the soul.
          <br />
          <br />
        </p>
        <p>
          For millennia, humanity has gazed upward, captivated by the celestial dance of the planets and stars. Each orbit is a rhythm, every conjunction a whisper, aligning with both the precise laws of physics and the unseen forces that shape our universe. This animation seeks to capture that cosmic ballet—the celestial bodies swirling around the Sun, while their movements echo within the astrological wheel of the zodiac.
          Each star is more than a distant point of light—it is a reminder that we are part of something far greater, connected by forces both seen and unseen.
        </p>

        <p>
          We are not separate from the cosmos. The same stardust that forms the planets and stars courses through our veins. Every constellation, every celestial body is a reflection of the greater whole over all of time, and as we look to the skies, we begin to understand: reality is not static. Our 3D reality is merely a projection of information—a shadow cast by the infinite. What we perceive is but a fragment of the vast, infinite consciousness that permeates everything, a glimpse of the unseen forces that shape both the cosmos and ourselves.
        </p>
        <p>
          We stand at the intersection of the tangible and the abstract. Astronomy, with its calculations and intricate models, tracks the gravitational pull of Jupiter, the fiery eruptions on Mars, and the serene cycles of Venus. Science maps the movements with mathematical precision, showing us how these planetary forces pull on our planet and affect everything from the tides to the seasons. But while science reveals these truths, there is something deeper. These celestial bodies don’t just tug on the physical world—they pull on the fabric of our inner lives, weaving connections between the cosmos and our own existence.
        </p>
        <p>
          Astrology translates this cosmic dance into a language of potential and purpose, reminding us that the universe doesn’t merely act upon us—it collaborates with us. As Saturn completes its slow, 29-year journey around the Sun, we too pass through cycles of growth, challenge, and wisdom. These cycles mirror the patterns in the skies. Just as Saturn was named for the Roman god of time and agriculture, its slow orbit symbolizes patience, discipline, and the lessons that come with time. The stories we’ve woven around these planets are not arbitrary—they carry meaning and vibrations that shape our experience of life, just as the gravitational forces of these planets shape the orbits of the celestial bodies themselves. The alignment of planets in the solar system becomes mirrored within our personal charts, creating a dialogue between the macrocosm and the microcosm.
        </p>
        <p>
          The constellations, too, are deeply embedded in our collective history. Across the world, cultures that never interacted with each other have told similar stories about the same stars, receiving the same energetic vibrations. Take **Sirius**, the Dog Star—revered by Egyptians, who associated it with Anubis, the god of the dead; by the Dogon tribe of West Africa, who believed it was tied to celestial beings; and by Polynesian navigators, who used it to guide them across vast oceanic expanses originating in Lemuria. Somehow, without contact, these different peoples shared an understanding of this star’s significance, and connected it with themes of dogs, guardianship, and otherworldly knowledge. These constellations are not random—each is a message, carrying vibrational energy that has shaped human consciousness throughout history.
        </p>
        <p>
          And as we look further, we find more than just stories. Ancient cultures speak of beings who came from distant star systems, sharing their knowledge and guiding humanity towards higher wisdom. These celestial visitors are woven into myths, religions, and sacred texts—whispers of gods descending from the stars to teach us the mysteries of life, energy, and the cosmos. They appear at crucial moments in our evolution, offering guidance from beyond our material world. Their knowledge reflects a deeper truth: that the universe itself is alive, and we are part of its grand, interconnected design.
        </p>
        <p>
          As souls, we choose the precise moment of our birth, entering this realm at a time when the planets and stars align with our soul’s mission. The exact position of the Sun, Moon, and constellations at that moment is not random—it’s a reflection of the energy we need for our journey. Each celestial alignment carries a frequency that imprints itself onto our life path, setting the tone for the challenges, gifts, and lessons we will face. In this 3D space-time reality, we may not always understand the full relevance of these cosmic alignments. But when we step back and recognize that our dimension is intertwined with many others—dimensions where space and time blur, and where energy reigns—we begin to glimpse why these celestial movements are so important.
        </p>
        <p>
          The zodiac signs are more than just symbols of personality traits or destiny. These ancient constellations, rooted in human observation, carry deep cosmic significance. Long before modern civilizations emerged, our ancestors gazed upon the same sky, recognizing patterns and weaving stories into the stars. The planets’ paths through these constellations are not random.

          When a planet moves through a particular zodiac sign, it aligns with a specific frequency, a vibration emanating from that section of the sky. The constellations, formed by stars light-years away, are not just distant clusters of burning gas—they are beacons, emitting light that carries information. The photons from these stars travel across light-years, before ending their journey by entering our atmosphere and interacting with our planet, absorbed through the portal of our pupils, and into our minds.

        </p>
        <p>
          Light waves, when passing through the gravitational fields of massive celestial bodies, can bend and distort, revealing the chaotic interaction between energy and matter across the cosmos. In this sense, the zodiac can be seen as more than an astrological framework—it may serve as a reflection of the cosmos’ energy grid, a dynamic interface where photons, light waves, and cosmic particles interact in ways that ripple through our dimensions. As planets move through different constellations, the photons they reflect and absorb undergo subtle transformations. They pass through us, entangling with our energy fields, creating shifts in our consciousness and in the very fabric of reality.

          Each constellation and planet becomes a node in this vast, interconnected system, and as these celestial bodies shift and align, the patterns of light they cast on Earth change. These patterns may affect us in ways we cannot yet quantify, resonating with the frequencies of our being and altering the course of our thoughts, actions, and even our destinies. It’s as if we are living within a symphony of light and energy, and each zodiac sign is a different movement in this cosmic performance.
        </p>
        <p>
          Consciousness is fundamental—an infinite field of awareness that permeates everything. Every part of the universe contains the whole; we are not isolated beings, but active participants in this grand design. Syntropy, the drive toward interconnectedness and love, is the hidden force guiding evolution toward greater unity and complexity. We are not just along for the ride—our thoughts, actions, and energy affect the whole, shifting the frequency of the entire system.
        </p>
        <p>
          Alchemy, the transformation of energy and consciousness, teaches us that our personal transformations are not isolated events. This reality is holographic; our own spiritual journeys contribute to the energetics of the whole. We are not tiny specks in a vast, indifferent universe — our thoughts and actions ripple outward, shifting the energy of the entire system. We carry the potential of the whole within us, unlocking these connections piece by piece throughout our journey. This discovery is not limited to this lifetime; we are beings that have experienced other lives in other dimensions, in different forms. The people around us could have even been us in past incarnations, all part of the same infinite web of existence.
        </p>
        <p>
          Humanity has not evolved in isolation. Our consciousness has grown and shifted in sync with the celestial rhythms above. For as long as we have existed, we have lived beneath these stars and planets, evolving alongside their cycles and energies. The divide between astronomy and astrology is not as vast as some believe. Where astronomy sees only the mechanical precision of planetary orbits, astrology sees the meaning behind these movements. The two are not in conflict — they are intertwined, reflecting different layers of the same truth. As we evolve, so does our understanding of this grand cosmic design.
        </p>
        <p>
          The universe operates with purpose and intent; nothing is arbitrary. Coincidence does not exist. The universe speaks in the language of synchronicity, energy, and resonance. Whether through the precise forces of gravity or the symbolic power of mythology, the planets and stars shape both our physical world and our consciousness.

          In a world governed by science and reason, the stories of these celestial gods and goddesses are still with us, influencing us as deeply as the gravity of the planets themselves. They are living symbols, embedded in the human psyche, carrying forward the wisdom of ages past into the present.

          In every photon that reaches us from the planets or even distant galaxies, in every gravitational pull from Saturn or Chiron, in every ancient myth whispered down through the ages, there is meaning. The universe speaks to us in a language both scientific and symbolic, and it is up to us to listen — not just with our minds, but with our souls.
        </p>
        <p>
          As we gaze up at the night sky, let us remember that the movements of these celestial bodies are not distant or irrelevant. They are intertwined with our lives, both individually and collectively. The stars and planets are not just physical objects—they are part of the same cosmic web that weaves through every dimension of existence. The universe does not separate science from spirit, or reason from intuition. It embraces both, reminding us that we are both stardust and story, written into the fabric of the cosmos, evolving in harmony with the stars.
        </p>
      </div>
    </div>
  );
};

export default SolarSystem;