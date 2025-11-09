import React from 'react';
import '../../../styles/components/time/user/TimeNotification.css';

const TimeNotification = ({ type, message, onClose }) => {
  return (
    <div className={`time-notification time-notification-${type}`}>
      <div className="time-notification-icon">
        {type === 'success' ? '✓' : '✕'}
      </div>
      <div className="time-notification-content">
        <div className="time-notification-title">
          {type === 'success' ? 'Éxito' : 'Error'}
        </div>
        <div className="time-notification-message">{message}</div>
      </div>
      <button className="time-notification-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

export default TimeNotification;