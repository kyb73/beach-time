import React from 'react';
import type { TideExtreme } from '../services/TideService';
import { TideService } from '../services/TideService';
import './FridayRecommendations.css';

interface FridayRecommendationsProps {
  extremes: TideExtreme[];
}

const FridayRecommendations: React.FC<FridayRecommendationsProps> = ({ extremes }) => {
  // Get recommendations for Fridays
  const recommendations = TideService.getBestFridayVisitTimes(extremes);

  // Group recommendations by date
  const groupedByDate = recommendations.reduce((acc: Record<string, any[]>, rec) => {
    const dateString = rec.time.toLocaleDateString();

    if (!acc[dateString]) {
      acc[dateString] = [];
    }

    acc[dateString].push({
      ...rec,
      timeString: rec.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    return acc;
  }, {});

  // Check if we have any upcoming Fridays in the data
  const hasFridays = Object.keys(groupedByDate).length > 0;

  if (!hasFridays) {
    return (
      <div className="friday-recommendations">
        <h3>Friday Beach Recommendations</h3>
        <p>No upcoming Fridays in the current data range. Please check back later or extend the date range.</p>
      </div>
    );
  }

  return (
    <div className="friday-recommendations">
      <h3>Best Times to Visit the Beach on Fridays</h3>

      {Object.entries(groupedByDate).map(([dateString, recs]) => (
        <div key={dateString} className="friday-card">
          <h4>{dateString}</h4>

          <div className="recommendations-list">
            {recs.map((rec, idx) => (
              <div key={idx} className="recommendation-item">
                <div className="recommendation-time">
                  <span className="time-icon">🕒</span>
                  <span>{rec.timeString}</span>
                </div>

                <div className="recommendation-reason">
                  {rec.reason}
                </div>
              </div>
            ))}
          </div>

          <div className="additional-info">
            <h5>What to bring to the beach:</h5>
            <ul>
              <li>Sunscreen and hat (especially for daytime visits)</li>
              <li>Water and snacks</li>
              <li>Beach towel and umbrella</li>
              <li>Modest swimwear (recommended for cultural sensitivity)</li>
              <li>Camera for beautiful Indian Ocean views</li>
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FridayRecommendations;
