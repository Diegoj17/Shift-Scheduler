import React from 'react';
import { FaClipboardList, FaMoneyBillWave, FaBullhorn } from 'react-icons/fa';
import '../../../styles/components/dashboard/user/RemindersCard.css';

const RemindersCard = ({ reminders = [] }) => {
  
  const defaultIcons = [<FaClipboardList />, <FaMoneyBillWave />, <FaBullhorn />];

  return (
    <div className="reminders-notification-panel">
      <h3 className="reminders-panel-title">Recordatorios</h3>

      <div className="reminders-items-list">
        {reminders.map((reminder, index) => (
          <div key={index} className="reminder-list-item">
            <div className="reminder-item-icon-box" aria-hidden>
              <span className="reminder-icon">
                {reminder.icon ? reminder.icon : defaultIcons[index % defaultIcons.length]}
              </span>
            </div>
            <div className="reminder-item-content">
              <p className="reminder-message-text">{reminder.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersCard;