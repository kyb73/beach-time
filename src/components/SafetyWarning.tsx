import React from 'react';
import type { TideExtreme } from '../services/TideService';
import './SafetyWarning.css';

interface SafetyWarningProps {
  extremes: TideExtreme[];
  isDangerous: boolean;
  currentHeight: number;
}

const SafetyWarning: React.FC<SafetyWarningProps> = ({ extremes, isDangerous, currentHeight }) => {
  // Determine the next dangerous time period if any
  const getNextDangerousPeriod = () => {
    const now = Date.now();

    // Sort extremes by time
    const sortedExtremes = [...extremes].sort((a, b) => a.time - b.time);

    // Find high tides above threshold
    const dangerousHighTides = sortedExtremes.filter(
      extreme => extreme.type === 'high' && extreme.height > 0.85 && extreme.time > now
    );

    if (dangerousHighTides.length > 0) {
      const nextDangerous = dangerousHighTides[0];
      const dangerStart = new Date(nextDangerous.time - 5400000); // 1.5 hours before high tide
      const dangerEnd = new Date(nextDangerous.time + 5400000); // 1.5 hours after high tide

      return {
        start: dangerStart,
        end: dangerEnd,
        height: nextDangerous.height
      };
    }

    return null;
  };

  const dangerousPeriod = getNextDangerousPeriod();

  return (
    <div className={`safety-warning ${isDangerous ? 'danger' : 'safe'}`}>
      <h3>
        <span className="warning-icon">⚠️</span>
        Beach Safety Status
      </h3>

      <div className="status-message">
        {isDangerous ? (
          <>
            <p className="danger-text">
              <strong>CAUTION: Dangerous tide conditions!</strong>
            </p>
            <p>
              Current tide height: <strong>{currentHeight.toFixed(2)}m</strong>. These conditions are potentially hazardous. 
              Exercise extreme caution if visiting the beach, or consider postponing your visit.
            </p>
          </>
        ) : (
          <p className="safe-text">
            <strong>Current tide conditions appear safe.</strong> Current height: <strong>{currentHeight.toFixed(2)}m</strong>. 
            Always follow local safety guidelines and be aware of changing conditions.
          </p>
        )}
      </div>

      {dangerousPeriod && (
        <div className="future-warning">
          <h4>Upcoming Dangerous Conditions</h4>
          <p>
            Potentially dangerous tide conditions expected between{' '}
            <strong>{dangerousPeriod.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> and{' '}
            <strong>{dangerousPeriod.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> on{' '}
            <strong>{dangerousPeriod.start.toLocaleDateString()}</strong>.
          </p>
          <p>
            Expected high tide: <strong>{dangerousPeriod.height.toFixed(2)}m</strong>
          </p>
        </div>
      )}

      <div className="safety-tips">
        <h4>Beach Safety Tips</h4>
        <ul>
          <li>Always check tide tables before visiting</li>
          <li>Be aware of rapidly changing tide conditions</li>
          <li>Never swim alone</li>
          <li>If caught in a rip current, swim parallel to shore</li>
          <li>Follow all posted warnings and instructions from lifeguards</li>
          <li>Bring plenty of water and sun protection</li>
        </ul>
      </div>
    </div>
  );
};

export default SafetyWarning;
