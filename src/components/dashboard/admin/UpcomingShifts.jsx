import React from 'react';
import { FaClock, FaEye, FaEdit } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/UpcomingShifts.css';

const UpcomingShifts = () => {
  const upcomingShifts = [
    { 
      id: 1,
      name: "María González", 
      time: "09:00 - 17:00", 
      role: "Supervisor", 
      status: "active",
      statusLabel: "Activo"
    },
    { 
      id: 2,
      name: "Carlos Rodríguez", 
      time: "10:00 - 18:00", 
      role: "Técnico", 
      status: "pending",
      statusLabel: "Pendiente"
    },
    { 
      id: 3,
      name: "Ana Martínez", 
      time: "14:00 - 22:00", 
      role: "Operador", 
      status: "active",
      statusLabel: "Activo"
    },
    { 
      id: 4,
      name: "Luis Fernández", 
      time: "22:00 - 06:00", 
      role: "Nocturno", 
      status: "active",
      statusLabel: "Activo"
    },
    { 
      id: 5,
      name: "Patricia Silva", 
      time: "08:00 - 16:00", 
      role: "Asistente", 
      status: "pending",
      statusLabel: "Pendiente"
    }
  ];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="upcoming-shifts">
      <div className="widget-header">
        <h3 className="widget-title">
          <FaClock className="title-icon" />
          Próximos Turnos
        </h3>
      </div>
      
      <div className="shifts-list">
        {upcomingShifts.map((shift) => (
          <div key={shift.id} className="shift-item">
            <div className="shift-avatar">
              {getInitials(shift.name)}
            </div>
            
            <div className="shift-details">
              <h4>{shift.name}</h4>
              <p>
                <span className="shift-time">{shift.time}</span>
                <span className="shift-role">{shift.role}</span>
              </p>
            </div>
            
            <div className="shift-controls">
              <div className="shift-actions">
                <button className="shift-action-btn" title="Ver detalles">
                  <FaEye />
                </button>
                <button className="shift-action-btn" title="Editar turno">
                  <FaEdit />
                </button>
              </div>

              <div 
                className={`shift-status ${shift.status}`} 
                data-status={shift.statusLabel}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingShifts;