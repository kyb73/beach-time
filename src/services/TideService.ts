// Tide Point interface
export interface TidePoint {
  time: number;
  height: number;
}

// Tide Extreme interface  
export interface TideExtreme {
  time: number;
  height: number;
  type: 'high' | 'low';
}

export interface LocationConfig {
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  region?: string;
}

// Harmonic constituent interface (internal use)
interface HarmonicConstituent {
  name: string;
  speed: number;
  amplitude: number;
  phase: number;
}

export class TideService {
  private static REFERENCE_TIME = new Date(2025, 0, 1).getTime();

  private static getDefaultConstituents(): HarmonicConstituent[] {
    return [
      { name: 'M2', speed: 28.984, amplitude: 0.28, phase: 220 },
      { name: 'S2', speed: 30.000, amplitude: 0.12, phase: 250 },
      { name: 'N2', speed: 28.440, amplitude: 0.06, phase: 200 },
      { name: 'K1', speed: 15.041, amplitude: 0.08, phase: 150 },
      { name: 'O1', speed: 13.943, amplitude: 0.05, phase: 130 },
      { name: 'Z0', speed: 0.000, amplitude: 0.50, phase: 0 }
    ];
  }

  public static getTideData(
    location: LocationConfig, 
    days: number = 3,
    constituents?: HarmonicConstituent[]
  ): { points: TidePoint[], extremes: TideExtreme[] } {
    const now = new Date();
    const startTime = now.getTime();
    const endTime = startTime + (days * 86400000);

    const points: TidePoint[] = [];
    const samplingInterval = 30 * 60 * 1000;
    const activeConstituents = constituents || this.getDefaultConstituents();

    for (let time = startTime; time <= endTime; time += samplingInterval) {
      const height = this.calculateTideHeight(time, activeConstituents);
      points.push({ time, height });
    }

    const extremes = this.findExtremes(points);
    return { points, extremes };
  }

  private static calculateTideHeight(time: number, constituents: HarmonicConstituent[]): number {
    const hoursElapsed = (time - this.REFERENCE_TIME) / (60 * 60 * 1000);
    let height = 0;

    for (const constituent of constituents) {
      if (constituent.name === 'Z0') {
        height += constituent.amplitude;
        continue;
      }

      const angle = (constituent.speed * hoursElapsed + constituent.phase) * (Math.PI / 180);
      height += constituent.amplitude * Math.cos(angle);
    }

    const randomVariation = (Math.random() * 0.1) - 0.05;
    height += randomVariation;

    return height;
  }

  private static findExtremes(points: TidePoint[]): TideExtreme[] {
    const extremes: TideExtreme[] = [];

    if (points.length < 10) return extremes;

    // Smooth the data first to remove noise
    const smoothedPoints = this.smoothData(points, 3);

    // Find candidate extremes with a wider window
    const candidates: TideExtreme[] = [];
    const windowSize = 6; // Look at 6 points (3 hours) around each point

    for (let i = windowSize; i < smoothedPoints.length - windowSize; i++) {
      const current = smoothedPoints[i];
      let isHigh = true;
      let isLow = true;

      // Check if current point is highest/lowest in the window
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i) {
          if (smoothedPoints[j].height >= current.height) {
            isHigh = false;
          }
          if (smoothedPoints[j].height <= current.height) {
            isLow = false;
          }
        }
      }

      if (isHigh && !isLow) {
        candidates.push({
          time: current.time,
          height: current.height,
          type: 'high'
        });
      } else if (isLow && !isHigh) {
        candidates.push({
          time: current.time,
          height: current.height,
          type: 'low'
        });
      }
    }

    // Filter candidates to ensure proper tidal cycle
    const minTimeBetweenExtremes = 4 * 60 * 60 * 1000; // 4 hours minimum
    const minHeightDifference = 0.1; // 10cm minimum difference

    let lastExtreme: TideExtreme | null = null;

    for (const candidate of candidates) {
      if (!lastExtreme) {
        extremes.push(candidate);
        lastExtreme = candidate;
        continue;
      }

      const timeDiff = candidate.time - lastExtreme.time;
      const heightDiff = Math.abs(candidate.height - lastExtreme.height);

      // Ensure minimum time separation and height difference
      if (timeDiff >= minTimeBetweenExtremes && heightDiff >= minHeightDifference) {
        // Ensure alternating high/low pattern
        if (candidate.type !== lastExtreme.type) {
          extremes.push(candidate);
          lastExtreme = candidate;
        } else {
          // If same type, keep the more extreme one
          const isMoreExtreme = (candidate.type === 'high' && candidate.height > lastExtreme.height) ||
                               (candidate.type === 'low' && candidate.height < lastExtreme.height);

          if (isMoreExtreme) {
            extremes[extremes.length - 1] = candidate;
            lastExtreme = candidate;
          }
        }
      }
    }

    return extremes;
  }

  /**
   * Smooth data using a simple moving average to reduce noise
   */
  private static smoothData(points: TidePoint[], windowSize: number): TidePoint[] {
    const smoothed: TidePoint[] = [];

    for (let i = 0; i < points.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(points.length - 1, i + Math.floor(windowSize / 2));

      let sum = 0;
      let count = 0;

      for (let j = start; j <= end; j++) {
        sum += points[j].height;
        count++;
      }

      smoothed.push({
        time: points[i].time,
        height: sum / count
      });
    }

    return smoothed;
  }

  public static isDangerousTide(height: number, extremes: TideExtreme[]): boolean {
    const highTideThreshold = 0.85;

    if (height > highTideThreshold) {
      return true;
    }

    if (extremes.length >= 2) {
      const sortedExtremes = [...extremes].sort((a, b) => a.time - b.time);

      for (let i = 1; i < sortedExtremes.length; i++) {
        const timeDiff = sortedExtremes[i].time - sortedExtremes[i-1].time;
        const heightDiff = Math.abs(sortedExtremes[i].height - sortedExtremes[i-1].height);

        if (heightDiff > 0.4 && timeDiff < 14400000) {
          return true;
        }
      }
    }

    return false;
  }

  public static getBestFridayVisitTimes(extremes: TideExtreme[]): { time: Date, reason: string }[] {
    const fridayExtremes = extremes.filter(extreme => {
      const date = new Date(extreme.time);
      return date.getDay() === 5;
    });

    const recommendations: { time: Date, reason: string }[] = [];
    const sortedExtremes = [...fridayExtremes].sort((a, b) => a.time - b.time);

    for (let i = 0; i < sortedExtremes.length; i++) {
      const extreme = sortedExtremes[i];
      const time = new Date(extreme.time);

      if (extreme.type === 'low' && time.getHours() >= 6 && time.getHours() <= 18) {
        recommendations.push({
          time,
          reason: 'Low tide during daylight hours - ideal for beach activities'
        });
      }

      if (extreme.type === 'low') {
        const swimmingTime = new Date(extreme.time + 3600000);
        if (swimmingTime.getHours() >= 7 && swimmingTime.getHours() <= 17) {
          recommendations.push({
            time: swimmingTime,
            reason: 'Gradually rising tide - good for swimming'
          });
        }
      }
    }

    return recommendations;
  }
}
