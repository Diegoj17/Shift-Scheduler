import React from 'react';
import '../../../../styles/components/time/user/availability/TimeAvailabilityNotification.css';

const TimeAvailabilityNotification = ({ type, message, onClose }) => {
  return (
    <div className={`time-availability-notification time-availability-notification-${type}`}>
      <div className="time-availability-notification-icon">
        {type === 'success' ? '✓' : '✕'}
      </div>
      <div className="time-availability-notification-content">
        <div className="time-availability-notification-title">
          {type === 'success' ? 'Éxito' : 'Error'}
        </div>
        <div className="time-availability-notification-message">{message}</div>
      </div>
      <button className="time-availability-notification-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

export default TimeAvailabilityNotification;