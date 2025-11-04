import React from 'react';
import { FaChartPie } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/ShiftDistribution.css';

class DistribucionTurnos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      distribucion: [
        { nombre: 'Mañana', porcentaje: 40, color: '#3b82f6' },
        { nombre: 'Tarde', porcentaje: 35, color: '#8b5cf6' },
        { nombre: 'Noche', porcentaje: 25, color: '#f59e0b' }
      ]
    };
  }

  render() {
    const { distribucion } = this.state;
    const total = distribucion.reduce((sum, item) => sum + item.porcentaje, 0);

    return (
      <div className="distribucion-turnos">
        <div className="widget-header">
          <h3 className="widget-title">
            <FaChartPie className="title-icon" />
            Distribución de Turnos
          </h3>
        </div>

        <div className="distribucion-content">
          <div className="chart-container">
            {distribucion.map((item, index) => (
              <div 
                key={index}
                className="chart-segment"
                data-tooltip={`${item.nombre}: ${item.porcentaje}%`}
                style={{
                  width: `${(item.porcentaje / total) * 100}%`,
                  backgroundColor: item.color
                }}
              >
                <span className="segment-label">{item.porcentaje}%</span>
              </div>
            ))}
          </div>

          <div className="distribucion-legend">
            {distribucion.map((item, index) => (
              <div key={index} className="legend-row">
                <div className="legend-info">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="legend-name">{item.nombre}</span>
                </div>
                <span className="legend-value">{item.porcentaje}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default DistribucionTurnos;