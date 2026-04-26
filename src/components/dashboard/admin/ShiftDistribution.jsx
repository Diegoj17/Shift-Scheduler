import React, { useEffect, useState } from 'react';
import { FaChartPie } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/ShiftDistribution.css';
import { shiftService } from '../../../services/shiftService';

const DistribucionTurnos = () => {
  const [distribucion, setDistribucion] = useState([]);
  const [loading, setLoading] = useState(true);

  const getShiftCategory = (startDate) => {
    if (!startDate) return 'Noche';

    const hour = new Date(startDate).getHours();

    // Franjas más realistas para el panel:
    // Mañana: 06:00 - 11:59
    // Tarde:   12:00 - 17:59
    // Noche:   18:00 - 05:59
    if (hour >= 6 && hour < 12) return 'Mañana';
    if (hour >= 12 && hour < 18) return 'Tarde';
    return 'Noche';
  };

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const shifts = await shiftService.getShiftsForCalendar();
        if (!mounted) return;
        // Clasificar por franjas horarias reales
        const counts = { Mañana: 0, Tarde: 0, Noche: 0 };
        (shifts || []).forEach(s => {
          try {
            const start = s.start ? new Date(s.start) : null;
            if (!start) return;
            const category = getShiftCategory(start);
            counts[category]++;
          } catch {
            // ignore
          }
        });

        const total = counts['Mañana'] + counts['Tarde'] + counts['Noche'];
        const maxCount = Math.max(counts['Mañana'], counts['Tarde'], counts['Noche']);
        const dist = [
          { nombre: 'Mañana', porcentaje: total ? Math.round((counts['Mañana']/total)*100) : 0, color: '#22c55e', count: counts['Mañana'] },
          { nombre: 'Tarde', porcentaje: total ? Math.round((counts['Tarde']/total)*100) : 0, color: '#3b82f6', count: counts['Tarde'] },
          { nombre: 'Noche', porcentaje: total ? Math.round((counts['Noche']/total)*100) : 0, color: '#ef4444', count: counts['Noche'] }
        ];

        setDistribucion(dist.map((item) => ({ ...item, isDominant: item.count === maxCount && maxCount > 0 })));
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

  const totalCount = distribucion.reduce((sum, it) => sum + (it.count || 0), 0) || 0;

  return (
    <div className="distribucion-turnos">
      <div className="widget-header">
        <h3 className="widget-title">
          <span className="title-accent" aria-hidden="true"></span>
          <FaChartPie className="title-icon" />
          Distribución de Turnos
        </h3>
      </div>

      <div className="distribucion-content">
        {loading && <div style={{padding:12}}>Calculando distribución...</div>}
        {!loading && distribucion.length === 0 && <div style={{padding:12, color:'#777'}}>No hay datos para mostrar</div>}

        {!loading && distribucion.length > 0 && (
          <>
            <div className="distribucion-summary">
              <span className="distribucion-summary-label">Total de turnos</span>
              <span className="distribucion-summary-value">{totalCount}</span>
            </div>

            <div className={`chart-container ${totalCount === 0 ? 'is-empty' : ''}`}>
              {distribucion.map((item, index) => (
                <div 
                  key={index}
                  className={`chart-segment ${item.isDominant ? 'dominant' : ''} ${totalCount === 0 ? 'is-empty' : ''}`}
                  data-tooltip={`${item.nombre}: ${item.porcentaje}%`}
                  style={{
                    width: `${(item.count / (totalCount || 1)) * 100}%`,
                    backgroundColor: item.color
                  }}
                >
                  <span className="segment-label">{item.porcentaje}%</span>
                </div>
              ))}
            </div>

            <div className="distribucion-legend">
              {distribucion.map((item, index) => (
                <div
                  key={index}
                  className="legend-row"
                  style={{ '--legend-color': item.color }}
                >
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
