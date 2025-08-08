import React from 'react';
import type { TideExtreme } from '../services/TideService';
import './TideTable.css';

interface TideTableProps {
  extremes: TideExtreme[];
  highlightFridays?: boolean;
}

const TideTable: React.FC<TideTableProps> = ({ extremes, highlightFridays = true }) => {
  if (!extremes || extremes.length === 0) {
    return <div className="tide-table-container">Loading tide data...</div>;
  }

  // Group extremes by day
  const groupedByDay = extremes.reduce((acc: Record<string, any[]>, extreme) => {
    const date = new Date(extreme.time);
    const dateString = date.toLocaleDateString();

    if (!acc[dateString]) {
      acc[dateString] = [];
    }

    acc[dateString].push({
      ...extreme,
      timeString: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date,
    });

    return acc;
  }, {});

  return (
    <div className="tide-table-container">
      <h3>Tide Schedule</h3>

      {Object.entries(groupedByDay).map(([dateString, dayExtremes]) => {
        const date = new Date(dayExtremes[0].date);
        const isFriday = date.getDay() === 5;

        return (
          <div 
            key={dateString} 
            className={`day-group ${isFriday && highlightFridays ? 'friday-highlight' : ''}`}
          >
            <h4>
              {dateString}
              {isFriday && highlightFridays && <span className="friday-label"> (Friday)</span>}
            </h4>

            <table className="tide-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Height (m)</th>
                </tr>
              </thead>
              <tbody>
                {dayExtremes.map((extreme, idx) => (
                  <tr key={idx} className={extreme.type === 'high' ? 'high-tide' : 'low-tide'}>
                    <td>{extreme.timeString}</td>
                    <td>{extreme.type.charAt(0).toUpperCase() + extreme.type.slice(1)}</td>
                    <td>{extreme.height.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default TideTable;
