// Listado centralizado de departamentos y puestos para reutilizar en la app
export const departments = [
  'Administración',
  'Recursos Humanos',
  'Operaciones',
  'Atención al Cliente',
  'IT',
  'Logística',
  'Limpieza',
  'Seguridad',
  'Mantenimiento',
  'Gerencia',
  'Ventas',
  'Tecnología'
];

export const positionsByDepartment = {
  'Administración': ['Contable', 'Asistente Administrativo', 'Analista'],
  'Recursos Humanos': ['Reclutador', 'Coordinador de RRHH', 'Generalista'],
  'Operaciones': ['Supervisor de Turnos', 'Encargado de Área', 'Operario'],
  'Atención al Cliente': ['Recepcionista', 'Agente de Call Center', 'Atención en Mostrador'],
  'IT': ['Desarrollador', 'Soporte Técnico', 'Administrador de Sistemas'],
  'Logística': ['Chofer', 'Encargado de Logística', 'Almacenista'],
  'Limpieza': ['Operario de Limpieza', 'Coordinador de Limpieza'],
  'Seguridad': ['Guardia', 'Supervisor de Seguridad'],
  'Mantenimiento': ['Técnico de Mantenimiento', 'Electricista', 'Plomero'],
  'Gerencia': ['Gerente General', 'Asistente de Gerencia'],
  'Ventas': ['Ejecutivo de Ventas', 'Representante Comercial'],
  'Tecnología': ['DevOps', 'Ingeniero de QA']
};

export const jobPositions = [
  'Mesero',
  'Cocinero',
  'Bartender',
  'Barista',
  'Cajero',
  'Auxiliar de Cocina',
  'Host/Hostess',
  'Portero',
  'Técnico',
  'Operario'
];

export default {
  departments,
  positionsByDepartment,
  jobPositions
};
