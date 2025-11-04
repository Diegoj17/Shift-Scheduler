import React from 'react';
import { FaExclamationCircle, FaClipboardList, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/Request.css';

class SolicitudesPendientes extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      solicitudes: [
        { id: 1, empleado: 'Ana García', tipo: 'Cambio de turno', fecha: '15 Oct', estado: 'pendiente' },
        { id: 2, empleado: 'Carlos Ruiz', tipo: 'Vacaciones', fecha: '20-25 Oct', estado: 'pendiente' },
        { id: 3, empleado: 'María López', tipo: 'Permiso', fecha: '16 Oct', estado: 'aprobado' }
      ]
    };
  }

  handleAprobar = (id) => {
    console.log('Aprobar solicitud:', id);
  }

  handleRechazar = (id) => {
    console.log('Rechazar solicitud:', id);
  }

  render() {
    const { solicitudes } = this.state;
    const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length;

    return (
      <div className="solicitudes-widget">
        <div className="widget-header" data-count={pendientesCount > 0 ? pendientesCount : null}>
          <h3 className="widget-title">
            <FaExclamationCircle className="title-icon" />
            Solicitudes Pendientes
          </h3>
        </div>

        <div className="solicitudes-list">
          {solicitudes.map(sol => (
            <div key={sol.id} className="solicitud-item">
              <div className="solicitud-header">
                <p className="solicitud-empleado">{sol.empleado}</p>
                <span className={`solicitud-estado estado-${sol.estado}`}>
                  {sol.estado === 'aprobado' && <FaCheckCircle className="estado-icon" />}
                  {sol.estado === 'rechazado' && <FaTimesCircle className="estado-icon" />}
                  {sol.estado}
                </span>
              </div>
              
              <p className="solicitud-tipo">
                <FaClipboardList className="tipo-icon" />
                {sol.tipo}
              </p>
              
              <p className="solicitud-fecha">
                <FaCalendarAlt className="fecha-icon" />
                {sol.fecha}
              </p>

              {sol.estado === 'pendiente' && (
                <div className="solicitud-actions">
                  <button 
                    className="solicitud-btn aprobar"
                    onClick={() => this.handleAprobar(sol.id)}
                  >
                    <FaCheckCircle /> Aprobar
                  </button>
                  <button 
                    className="solicitud-btn rechazar"
                    onClick={() => this.handleRechazar(sol.id)}
                  >
                    <FaTimesCircle /> Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default SolicitudesPendientes;