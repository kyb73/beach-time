import React, { useEffect, useState } from 'react';
import type { TidePoint, TideExtreme, LocationConfig } from './services/TideService';
import { TideService } from './services/TideService';
import TideChart from './components/TideChart';
import TideTable from './components/TideTable';
import SafetyWarning from './components/SafetyWarning';
import FridayRecommendations from './components/FridayRecommendations';
import Tabs from './components/Tabs';
import './App.css';

function App() {
  // Default location (can be made configurable via props or environment variables)
  const [currentLocation] = useState<LocationConfig>({
    name: "Beach",
    latitude: 2.0469,
    longitude: 45.3182,
    country: "Somalia",
    region: "East Africa"
  });

  const [tidePoints, setTidePoints] = useState<TidePoint[]>([]);
  const [tideExtremes, setTideExtremes] = useState<TideExtreme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDangerous, setIsDangerous] = useState<boolean>(false);
  const [currentHeight, setCurrentHeight] = useState<number>(0);
  const [daysToShow, setDaysToShow] = useState<number>(7);

  useEffect(() => {
    // Use our calculation service instead of API
    setLoading(true);

    try {
      const { points, extremes } = TideService.getTideData(currentLocation, daysToShow);
      setTidePoints(points);
      setTideExtremes(extremes);

      // Get current tide height (first point)
      if (points.length > 0) {
        const current = points[0];
        setCurrentHeight(current.height);
        setIsDangerous(TideService.isDangerousTide(current.height, extremes));
      }
    } catch (err: any) {
      console.error('Error calculating tide data:', err);
    } finally {
      setLoading(false);
    }
  }, [daysToShow, currentLocation]);

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDaysToShow(Number(e.target.value));
  };

  // Create tabs data
  const tabs = [
    {
      id: 'chart',
      label: '📈 Tide Chart',
      content: <TideChart points={tidePoints} extremes={tideExtremes} />
    },
    {
      id: 'schedule',
      label: '📅 Tide Schedule',
      content: <TideTable extremes={tideExtremes} highlightFridays={true} />
    },
    {
      id: 'friday',
      label: '🏖️ Friday Tips',
      content: <FridayRecommendations extremes={tideExtremes} />
    },
    {
      id: 'safety',
      label: '⚠️ Safety Info',
      content: (
        <div>
          <SafetyWarning 
            extremes={tideExtremes} 
            isDangerous={isDangerous} 
            currentHeight={currentHeight} 
          />
        </div>
      )
    }
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1>{currentLocation.name} Tide Tracker</h1>
        <p className="subtitle">Plan your perfect beach day with accurate tide information</p>
        {currentLocation.country && (
          <p className="location-info">{currentLocation.country}{currentLocation.region && `, ${currentLocation.region}`}</p>
        )}
      </header>

      <div className="controls">
        <div className="date-range">
          <label htmlFor="daysToShow">Date Range:</label>
          <select 
            id="daysToShow" 
            value={daysToShow} 
            onChange={handleDaysChange}
          >
            <option value="1">1 Day</option>
            <option value="2">2 Days</option>
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading">Calculating tide data...</div>}

      {tidePoints.length > 0 && tideExtremes.length > 0 && !loading && (
        <div className="content">
          {/* Quick safety status banner */}
          <div className={`safety-banner ${isDangerous ? 'danger' : 'safe'}`}>
            <span className="status-icon">{isDangerous ? '⚠️' : '✅'}</span>
            <span className="status-text">
              {isDangerous ? 
                `CAUTION: Dangerous conditions (${currentHeight.toFixed(2)}m)` : 
                `Safe conditions (${currentHeight.toFixed(2)}m)`
              }
            </span>
            <span className="view-details">Click "Safety Info" tab for details</span>
          </div>

          <Tabs tabs={tabs} defaultTab="chart" />

          <div className="data-source">
            <p>
              Data calculated using harmonic analysis based on typical tidal patterns for Mogadishu
            </p>
            <p className="disclaimer">
              This application is for informational purposes only. Always check local weather and tide conditions before visiting the beach.
            </p>
            <p className="attribution">
              Tide predictions for {currentLocation.name} - Latitude: {currentLocation.latitude.toFixed(4)}, Longitude: {currentLocation.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
