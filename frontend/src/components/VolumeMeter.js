import React from 'react';
import { FiVolume2 } from 'react-icons/fi';

const VolumeMeter = ({ volume }) => {
  // Create an array of 5 bars for visualization
  const bars = 5;
  const threshold = 100 / bars;
  
  return (
    <div className="volume-meter">
      <div className="meter-bars">
        {Array.from({ length: bars }).map((_, i) => {
          const barHeight = Math.min(100, Math.max(0, volume - (i * threshold))) / threshold * 100;
          return (
            <div 
              key={i} 
              className="meter-bar" 
              style={{ 
                height: '100%',
                opacity: barHeight / 100 
              }}
            />
          );
        })}
      </div>
      <FiVolume2 className="volume-icon" />
    </div>
  );
};

export default VolumeMeter; 