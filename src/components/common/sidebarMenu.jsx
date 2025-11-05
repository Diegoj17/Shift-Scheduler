import { FaThLarge, FaCalendarAlt, FaClock, FaExchangeAlt, FaClipboardCheck, FaFileAlt, FaExclamationTriangle, FaCog } from 'react-icons/fa';

// Exportar referencias a los componentes de iconos (no elementos JSX) para evitar
// que archivos de configuración contengan JSX y provoquen errores de parseo
const menuItems = [
  { id: 'dashboard', label: 'Inicio', icon: FaThLarge, path: '/employee/main' },
  { id: 'mi-calendario', label: 'Mi Calendario', icon: FaCalendarAlt, path: '/employee/calendar' },
  { id: 'solicitudes', label: 'Solicitudes', icon: FaExchangeAlt, path: '/employee/requests' },
  { id: 'registrar-horas', label: 'Registrar Horas', icon: FaClipboardCheck, path: '/employee/time-tracking' },
  { id: 'incidencias', label: 'Incidencias', icon: FaExclamationTriangle, path: '/employee/incidents' },
];

export default menuItems;
