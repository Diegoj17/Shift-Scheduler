import { FaThLarge, FaCalendarAlt, FaClock, FaExchangeAlt, FaClipboardCheck, FaFileAlt, FaExclamationTriangle, FaCog } from 'react-icons/fa';

// Exportar referencias a los componentes de iconos (no elementos JSX) para evitar
// que archivos de configuración contengan JSX y provoquen errores de parseo
const menuItems = [
  { id: 'dashboard', label: 'Inicio', icon: FaThLarge, path: '/employee/dashboard' },
  { id: 'mi-calendario', label: 'Mi Calendario', icon: FaCalendarAlt, path: '/employee/calendar' },
  { id: 'mis-turnos', label: 'Mis Turnos', icon: FaClock, path: '/employee/shifts' },
  { id: 'solicitudes', label: 'Solicitudes', icon: FaExchangeAlt, path: '/employee/requests' },
  { id: 'registrar-horas', label: 'Registrar Horas', icon: FaClipboardCheck, path: '/employee/time-tracking' },
  { id: 'mis-documentos', label: 'Mis Documentos', icon: FaFileAlt, path: '/employee/documents' },
  { id: 'incidencias', label: 'Incidencias', icon: FaExclamationTriangle, path: '/employee/incidents' },
  { id: 'configuracion', label: 'Configuración', icon: FaCog, path: '/employee/settings' },
];

export default menuItems;
