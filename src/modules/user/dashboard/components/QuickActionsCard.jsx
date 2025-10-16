import React from 'react';
import { FaBolt } from 'react-icons/fa';
import '/src/styles/components/dashboard/user/QuickActionsCard.css';

const QuickActionsCard = ({ actions, onActionClick }) => {
  return (
    <div className="quick-actions-panel">
      <h3 className="quick-actions-title">
        <span className="quick-actions-title-icon-wrapper">
          <FaBolt className="quick-actions-title-icon" />
        </span>
        <span className="quick-actions-title-text">Acciones Rápidas</span>
      </h3>

      <div className="quick-actions-grid-layout">
        {actions.map(action => (
          <button
            key={action.id}
            className="quick-action-item"
            style={{ '--action-accent': action.color, '--accent': action.color }}
            onClick={() => onActionClick(action.id)}
            aria-label={action.title}
          >
            <div className="action-item-icon-wrapper">
              {React.isValidElement(action.icon)
                ? React.cloneElement(action.icon, { className: 'action-item-icon-svg' })
                : <span className="action-item-icon">{action.icon}</span>
              }
            </div>
            <span className="action-item-text">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsCard;