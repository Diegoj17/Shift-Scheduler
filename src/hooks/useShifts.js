import { useState } from 'react';

// Datos de ejemplo
const mockShifts = [
  {
    id: 1,
    title: 'Turno Mañana - Cajero',
    start: '2024-01-15T08:00:00',
    end: '2024-01-15T16:00:00',
    role: 'Cajero',
    type: 'morning',
    location: 'Sucursal Centro'
  },
  {
    id: 2,
    title: 'Turno Tarde - Supervisor',
    start: '2024-01-16T14:00:00',
    end: '2024-01-16T22:00:00',
    role: 'Supervisor',
    type: 'afternoon',
    location: 'Sucursal Norte'
  },
  {
    id: 3,
    title: 'Turno Noche - Seguridad',
    start: '2024-01-17T22:00:00',
    end: '2024-01-18T06:00:00',
    role: 'Seguridad',
    type: 'night',
    location: 'Sucursal Principal'
  }
];

export const useShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShifts = async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filtrar turnos por rango de fechas
      const filteredShifts = mockShifts.filter(shift => {
        const shiftDate = new Date(shift.start);
        return shiftDate >= startDate && shiftDate <= endDate;
      });
      
      setShifts(filteredShifts);
    } catch  {
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  return {
    shifts,
    loading,
    error,
    fetchShifts
  };
};

// Exportar por defecto también para compatibilidad con imports default
export default useShifts;