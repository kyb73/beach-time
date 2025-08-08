import React, { useState } from 'react';
import type { TidePoint, TideExtreme } from '../services/TideService';
import './TideChart.css';

interface TideChartProps {
  points: TidePoint[];
  extremes: TideExtreme[];
}

const TideChart: React.FC<TideChartProps> = ({ points, extremes }) => {
  const [zoom, setZoom] = useState(1);

  if (!points || points.length === 0) {
    return <div className="tide-chart-container">Loading tide data...</div>;
  }

  const heights = points.map(point => point.height);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  const range = maxHeight - minHeight || 1;

  const startDate = new Date(points[0].time);
  const endDate = new Date(points[points.length - 1].time);

  return (
    <div className="tide-chart-container">
      <div className="chart-header">
        <h3>Tide Chart</h3>
        <div className="zoom-controls">
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.2))}>+</button>
          <button onClick={() => setZoom(1)}>Reset</button>
        </div>
      </div>

      <div className="chart-content">
        <div className="chart-dates">
          <span>{startDate.toLocaleDateString()}</span>
          <span>{endDate.toLocaleDateString()}</span>
        </div>

        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <svg width="800" height="300" style={{ border: '1px solid #ddd', background: 'white' }}>
            {/* Grid */}
            <defs>
              <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Time markers */}
            {Array.from({ length: 5 }, (_, i) => {
              const x = (i / 4) * 750 + 25;
              const time = startDate.getTime() + (i / 4) * (endDate.getTime() - startDate.getTime());
              const date = new Date(time);

              return (
                <g key={i}>
                  <line x1={x} y1="20" x2={x} y2="260" stroke="#ddd" strokeDasharray="2,2" />
                  <text x={x} y="280" textAnchor="middle" fontSize="12" fill="#666">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </text>
                  <text x={x} y="295" textAnchor="middle" fontSize="10" fill="#999">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              );
            })}

            {/* Tide curve */}
            <polyline
              points={points.map((point, index) => {
                const x = (index / (points.length - 1)) * 750 + 25;
                const y = 260 - ((point.height - minHeight) / range) * 220;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#0066cc"
              strokeWidth="2"
            />

            {/* Extreme markers */}
            {extremes.map((extreme, index) => {
              const pointIndex = points.findIndex(p => Math.abs(p.time - extreme.time) < 1800000);
              if (pointIndex === -1) return null;

              const x = (pointIndex / (points.length - 1)) * 750 + 25;
              const y = 260 - ((extreme.height - minHeight) / range) * 220;

              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill={extreme.type === 'high' ? '#dc3545' : '#28a745'}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={extreme.type === 'high' ? y - 12 : y + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fill={extreme.type === 'high' ? '#dc3545' : '#28a745'}
                    fontWeight="bold"
                  >
                    {extreme.type.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Y-axis */}
            <text x="10" y="40" fontSize="12" fill="#666">{maxHeight.toFixed(1)}m</text>
            <text x="10" y="150" fontSize="12" fill="#666">{((maxHeight + minHeight) / 2).toFixed(1)}m</text>
            <text x="10" y="255" fontSize="12" fill="#666">{minHeight.toFixed(1)}m</text>
          </svg>
        </div>

        <div className="legend">
          <span><span style={{color: '#dc3545'}}>●</span> High Tide</span>
          <span><span style={{color: '#28a745'}}>●</span> Low Tide</span>
          <span><span style={{color: '#0066cc'}}>─</span> Water Level</span>
        </div>
      </div>
    </div>
  );
};

export default TideChart;
