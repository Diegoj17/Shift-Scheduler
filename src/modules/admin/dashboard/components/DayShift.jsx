import React from 'react';
import { FaClock, FaMapMarkerAlt, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';
import '../../../../styles/components/dashboard/DayShift.css';

class TurnosDelDia extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      turnos: [
        { id: 1, empleado: 'Ana García', turno: 'Mañana', horario: '08:00 - 14:00', estado: 'activo', area: 'Ventas', telefono: '+1234567890' },
        { id: 2, empleado: 'Carlos Ruiz', turno: 'Tarde', horario: '14:00 - 20:00', estado: 'activo', area: 'Soporte', telefono: '+1234567891' },
        { id: 3, empleado: 'María López', turno: 'Mañana', horario: '08:00 - 14:00', estado: 'ausente', area: 'Admin', telefono: '+1234567892' },
        { id: 4, empleado: 'Juan Pérez', turno: 'Noche', horario: '20:00 - 02:00', estado: 'pendiente', area: 'Seguridad', telefono: '+1234567893' },
        { id: 5, empleado: 'Laura Martín', turno: 'Tarde', horario: '14:00 - 20:00', estado: 'activo', area: 'Ventas', telefono: '+1234567894' },
        { id: 6, empleado: 'Pedro Sánchez', turno: 'Mañana', horario: '08:00 - 14:00', estado: 'activo', area: 'Soporte', telefono: '+1234567895' }
      ]
    };
  }

  getInitials = (nombre) => {
    return nombre.split(' ').map(n => n[0]).join('');
  };

  render() {
    const { filtroArea, searchTerm = '' } = this.props;

    const search = (searchTerm || '').toLowerCase();

    const turnosFiltrados = this.state.turnos.filter(turno => {
      const matchArea = filtroArea === 'todas' || turno.area === filtroArea;
      const empleado = (turno.empleado || '').toLowerCase();
      const matchSearch = empleado.includes(search);
      return matchArea && matchSearch;
    });

    return (
      <div className="turnos-del-dia">
        <div className="card-header">
          <h2 className="card-title">
            <FaClock className="title-icon" />
            Turnos del Día ({turnosFiltrados.length})
          </h2>
          <div className="status-legend">
            <span className="legend-item activo">Activo</span>
            <span className="legend-item pendiente">Pendiente</span>
            <span className="legend-item ausente">Ausente</span>
          </div>
        </div>

        <div className="turnos-list">
          {turnosFiltrados.map(turno => (
            <div key={turno.id} className="turno-card">
              <div className="turno-content">
                <div className="empleado-info">
                  <div className="avatar-large">
                    {this.getInitials(turno.empleado)}
                  </div>
                  <div className="empleado-details">
                    <h3 className="empleado-nombre">{turno.empleado}</h3>
                    <div className="empleado-meta">
                      <span className="meta-item">
                        <FaMapMarkerAlt /> {turno.area}
                      </span>
                      <span className="meta-item">
                        <FaPhone /> {turno.telefono}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="turno-info">
                  <div className="horario-info">
                    <p className="turno-tipo">{turno.turno}</p>
                    <p className="turno-horario">{turno.horario}</p>
                  </div>
                  <div className={`status-indicator ${turno.estado}`}></div>
                  <div className="turno-actions">
                    <button className="action-btn edit-btn">
                      <FaEdit />
                    </button>
                    <button className="action-btn delete-btn">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default TurnosDelDia;