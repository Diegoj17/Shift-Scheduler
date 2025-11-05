import React, { useEffect, useState } from 'react';
import { FaChartPie } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/ShiftDistribution.css';
import { shiftService } from '../../../services/shiftService';

const DistribucionTurnos = () => {
  const [distribucion, setDistribucion] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const shifts = await shiftService.getShiftsForCalendar();
        if (!mounted) return;
        // Clasificar por franjas horarias: Mañana (06-14), Tarde (14-22), Noche (22-06)
        const counts = { Mañana: 0, Tarde: 0, Noche: 0 };
        (shifts || []).forEach(s => {
          try {
            const start = s.start ? new Date(s.start) : null;
            if (!start) return;
            const hour = start.getHours();
            if (hour >= 6 && hour < 14) counts['Mañana']++;
            else if (hour >= 14 && hour < 22) counts['Tarde']++;
            else counts['Noche']++;
          } catch {
            // ignore
          }
        });

        const total = counts['Mañana'] + counts['Tarde'] + counts['Noche'];
        const dist = [
          { nombre: 'Mañana', porcentaje: total ? Math.round((counts['Mañana']/total)*100) : 0, color: '#3b82f6', count: counts['Mañana'] },
          { nombre: 'Tarde', porcentaje: total ? Math.round((counts['Tarde']/total)*100) : 0, color: '#8b5cf6', count: counts['Tarde'] },
          { nombre: 'Noche', porcentaje: total ? Math.round((counts['Noche']/total)*100) : 0, color: '#f59e0b', count: counts['Noche'] }
        ];

        setDistribucion(dist);
      } catch (err) {
        console.error('Error calculando distribución de turnos:', err);
        setDistribucion([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, []);

  const totalPercent = distribucion.reduce((sum, it) => sum + (it.porcentaje || 0), 0) || 0;

  return (
    <div className="distribucion-turnos">
      <div className="widget-header">
        <h3 className="widget-title">
          <FaChartPie className="title-icon" />
          Distribución de Turnos
        </h3>
      </div>

      <div className="distribucion-content">
        {loading && <div style={{padding:12}}>Calculando distribución...</div>}
        {!loading && distribucion.length === 0 && <div style={{padding:12, color:'#777'}}>No hay datos para mostrar</div>}

        {!loading && distribucion.length > 0 && (
          <>
            <div className="chart-container">
              {distribucion.map((item, index) => (
                <div 
                  key={index}
                  className="chart-segment"
                  data-tooltip={`${item.nombre}: ${item.porcentaje}%`}
                  style={{
                    width: `${(item.porcentaje / (totalPercent || 100)) * 100}%`,
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
                  <span className="legend-value">{item.porcentaje}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DistribucionTurnos;