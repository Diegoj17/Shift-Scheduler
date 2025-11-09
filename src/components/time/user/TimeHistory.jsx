import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import timeEntryService from '../../../services/timeEntryService';
import '../../../styles/components/time/user/TimeHistory.css';

/**
 * Helper para convertir timestamp a hora local de Colombia
 */
const convertToLocalTime = (timestamp) => {
  try {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
    
    // Forzar conversión a hora local del navegador (Colombia)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error convirtiendo a hora local:', error);
    return '-';
  }
};

/**
 * Helper para formatear hora - PRIORIZA timestamp sobre time
 */
const formatTime = (entry) => {
  try {
    console.log('🔍 Formateando entry:', entry);
    
    // ✅ SIEMPRE usar el timestamp (es más confiable)
    if (entry.timestamp) {
      const formatted = convertToLocalTime(entry.timestamp);
      console.log(`✅ Timestamp convertido: ${entry.timestamp} → ${formatted}`);
      return formatted;
    }
    
    // Fallback: usar el campo 'time' si existe
    if (entry.time && typeof entry.time === 'string') {
      if (entry.time.includes(':')) {
        const parts = entry.time.split(':');
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, '0');
          const minutes = parts[1].padStart(2, '0');
          const seconds = parts[2] ? parts[2].split('.')[0].padStart(2, '0') : '00';
          const formatted = `${hours}:${minutes}:${seconds}`;
          console.log(`⚠️ Usando campo time: ${entry.time} → ${formatted}`);
          return formatted;
        }
      }
    }
    
    console.warn('❌ No se pudo formatear la hora:', entry);
    return '-';
  } catch (error) {
    console.error('❌ Error formateando hora:', error);
    return '-';
  }
};

const TimeHistory = forwardRef((props, ref) => {
  const [filter, setFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useImperativeHandle(ref, () => ({
    refreshHistory: () => {
      console.log('🔄 [TimeHistory] Refresh solicitado');
      loadHistory();
    }
  }));

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      console.log('🔄 [TimeHistory] Cargando historial con filtro:', filter);

      let filters = {};

      if (filter === 'week') {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        
        const getLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        filters.start_date = getLocalDate(lastWeek);
        filters.end_date = getLocalDate(today);
      } else if (filter === 'month') {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        
        const getLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        filters.start_date = getLocalDate(lastMonth);
        filters.end_date = getLocalDate(today);
      }

      const entries = await timeEntryService.getMyTimeEntries(filters);
      console.log('✅ [TimeHistory] Registros obtenidos:', entries);

      // Agrupar por fecha
      const groupedByDate = {};
      
      entries.forEach(entry => {
        const date = entry.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            check_in: null,
            check_out: null,
            check_in_timestamp: null,
            check_out_timestamp: null
          };
        }
        
        if (entry.entry_type === 'check_in') {
          groupedByDate[date].check_in = formatTime(entry);
          groupedByDate[date].check_in_timestamp = entry.timestamp;
        } else if (entry.entry_type === 'check_out') {
          groupedByDate[date].check_out = formatTime(entry);
          groupedByDate[date].check_out_timestamp = entry.timestamp;
        }
      });

      // Convertir a array y calcular horas
      const history = Object.values(groupedByDate).map(day => {
        let hours = '-';
        let status = 'Pendiente';

        if (day.check_in_timestamp && day.check_out_timestamp) {
          hours = timeEntryService.calculateHours(
            day.check_in_timestamp,
            day.check_out_timestamp
          );
          status = 'Completado';
        } else if (day.check_in) {
          status = 'En curso';
        }

        return {
          id: day.date,
          date: day.date,
          entry: day.check_in || '-',
          exit: day.check_out || '-',
          hours,
          status
        };
      });

      // Ordenar por fecha descendente
      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('📊 Historial formateado:', history);
      setHistoryData(history);

    } catch (error) {
      console.error('❌ [TimeHistory] Error cargando historial:', error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completado':
        return 'time-status-completed';
      case 'En curso':
        return 'time-status-active';
      case 'Pendiente':
        return 'time-status-pending';
      default:
        return '';
    }
  };

  return (
    <div className="time-history-section">
      <div className="time-history-header">
        <h2 className="time-history-title">Historial de Registros</h2>
        <div className="time-history-filter">
          <button 
            className={`time-filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`time-filter-button ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            Esta semana
          </button>
          <button 
            className={`time-filter-button ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            Este mes
          </button>
        </div>
      </div>

      <div className="time-history-table-wrapper">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando historial...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No hay registros para mostrar</p>
          </div>
        ) : (
          <table className="time-history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map(record => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.entry}</td>
                  <td>{record.exit}</td>
                  <td>{record.hours}</td>
                  <td>
                    <span className={`time-status-badge ${getStatusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

TimeHistory.displayName = 'TimeHistory';

export default TimeHistory;