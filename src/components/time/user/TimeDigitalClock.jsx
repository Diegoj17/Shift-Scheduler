import React, { useState, useEffect } from 'react';
import '../../../styles/components/time/user/TimeDigitalClock.css';

const TimeDigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toBogotaDate = (date) => {
    try {
      // crea una cadena con la hora en la zona objetivo y la parsea a Date
      const s = date.toLocaleString('en-US', { timeZone: 'America/Bogota' });
      return new Date(s);
    } catch (e) {
      // fallback: usar la fecha local si falla
      return date;
    }
  };

  const bogotaDate = toBogotaDate(currentTime);

  // Formato 12h manual con am/pm en minúscula (ej: 6:18 pm)
  const formatMainTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    let hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatSeconds = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      second: '2-digit'
    });
  };

  return (
    <div className="time-digital-clock">
      <div className="time-current-time">{formatMainTime(bogotaDate)}</div>
      <div className="time-current-seconds">{formatSeconds(currentTime)} seg</div>
    </div>
  );
};

export default TimeDigitalClock;