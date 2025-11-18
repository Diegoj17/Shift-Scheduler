import React, { useEffect, useState } from 'react';
import { 
  FaExclamationCircle, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaUsers, 
  FaExchangeAlt,
  FaClock,
  FaInfoCircle,
  FaCalendarCheck
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import shiftChangeService from '../../../services/shiftChangeService';
import shiftService from '../../../services/shiftService';
import '../../../styles/components/dashboard/admin/Request.css';

const SolicitudesPendientes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [turnos, setTurnos] = useState({});
  const [empleados, setEmpleados] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('🔄 [SolicitudesPendientes] Iniciando carga de datos...');
        
        // Obtener solicitudes primero
        const dataSolicitudes = await shiftChangeService.getChangeRequests();
        console.debug('[SolicitudesPendientes] solicitudes recibidas:', dataSolicitudes);
        
        if (!mounted) return;

        // Obtener información adicional de turnos y empleados
        const [dataTurnos, dataEmpleados] = await Promise.all([
          fetchTurnosIndividuales(dataSolicitudes),
          fetchEmpleados()
        ]);

        console.log('📊 [SolicitudesPendientes] Datos cargados:', {
          solicitudes: dataSolicitudes.length,
          turnos: Object.keys(dataTurnos).length,
          empleados: Object.keys(dataEmpleados).length
        });

        setTurnos(dataTurnos);
        setEmpleados(dataEmpleados);
        setSolicitudes(Array.isArray(dataSolicitudes) ? dataSolicitudes : []);
      } catch (err) {
        console.error('❌ [SolicitudesPendientes] Error cargando datos:', err);
        if (mounted) {
          setSolicitudes([]);
          setTurnos({});
          setEmpleados({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  // Función para obtener información de turnos individuales
  const fetchTurnosIndividuales = async (solicitudesData) => {
    try {
      console.log('🔄 [SolicitudesPendientes] Obteniendo información de turnos individuales...');
      
      const turnosIds = new Set();
      
      // Recopilar todos los IDs de turnos únicos de las solicitudes
      solicitudesData.forEach(solicitud => {
        if (solicitud.original_shift_id) turnosIds.add(solicitud.original_shift_id);
        if (solicitud.proposed_shift_id) turnosIds.add(solicitud.proposed_shift_id);
      });

      console.log('📋 [SolicitudesPendientes] IDs de turnos a buscar:', Array.from(turnosIds));

      const turnosMap = {};
      
      // Buscar información de cada turno individual usando getShifts
      try {
        const todosLosTurnos = await shiftService.getShifts();
        console.log('📦 [SolicitudesPendientes] Todos los turnos obtenidos:', todosLosTurnos);

        // Procesar la respuesta según la estructura
        const turnosData = Array.isArray(todosLosTurnos) ? todosLosTurnos : 
                          todosLosTurnos?.results || todosLosTurnos?.data || [];

        // Crear un mapa de todos los turnos por ID
        const mapaTodosTurnos = {};
        turnosData.forEach(turno => {
          if (turno.id) {
            mapaTodosTurnos[turno.id] = turno;
          }
        });

        console.log('🗺️ [SolicitudesPendientes] Mapa de todos los turnos:', mapaTodosTurnos);

        // Buscar los turnos específicos que necesitamos
        for (let turnoId of turnosIds) {
          const turno = mapaTodosTurnos[turnoId];
          if (turno) {
            turnosMap[turnoId] = {
              nombre: turno.shift_type_name || turno.shiftTypeName || `Turno ${turnoId}`,
              fecha: turno.date,
              start_time: turno.start_time || turno.startTime,
              end_time: turno.end_time || turno.endTime,
              employee_name: turno.employee_name || turno.employeeName,
              shift_type_id: turno.shift_type_id || turno.shiftTypeId
            };
            console.log(`✅ [SolicitudesPendientes] Turno ${turnoId} encontrado:`, turnosMap[turnoId]);
          } else {
            console.warn(`⚠️ [SolicitudesPendientes] Turno ${turnoId} no encontrado en la lista`);
            turnosMap[turnoId] = {
              nombre: `Turno ${turnoId}`,
              fecha: null,
              start_time: null,
              end_time: null,
              employee_name: null
            };
          }
        }

      } catch (error) {
        console.error('❌ [SolicitudesPendientes] Error obteniendo todos los turnos:', error);
        // Fallback: crear entradas básicas
        for (let turnoId of turnosIds) {
          turnosMap[turnoId] = {
            nombre: `Turno ${turnoId}`,
            fecha: null,
            start_time: null,
            end_time: null,
            employee_name: null
          };
        }
      }

      console.log('✅ [SolicitudesPendientes] Turnos individuales cargados:', turnosMap);
      return turnosMap;
    } catch (error) {
      console.error('❌ [SolicitudesPendientes] Error cargando turnos individuales:', error);
      return {};
    }
  };

  // Función para obtener información real de empleados
  const fetchEmpleados = async () => {
    try {
      console.log('🔄 [SolicitudesPendientes] Obteniendo empleados...');
      const empleadosData = await shiftService.getEmployees();
      
      const empleadosMap = {};
      empleadosData.forEach(emp => {
        // Usar employee_id como clave si está disponible, sino usar id (user_id)
        const clave = emp.employee_id || emp.id;
        empleadosMap[clave] = {
          nombre: emp.name,
          posicion: emp.position,
          departamento: emp.departamento
        };
      });

      console.log('✅ [SolicitudesPendientes] Empleados cargados:', Object.keys(empleadosMap));
      return empleadosMap;
    } catch (error) {
      console.error('❌ [SolicitudesPendientes] Error cargando empleados:', error);
      return {};
    }
  };

  // Función para determinar si está pendiente
  const isPending = (solicitud) => {
    const estado = (solicitud.estado || solicitud.status || solicitud.state || '').toString().toLowerCase();
    return estado === 'pending' || estado === 'pendiente' || estado === 'pend' || estado === 'pending_approval';
  };

  // Contar solo las pendientes
  const pendientesCount = solicitudes.filter(isPending).length;

  // Obtener nombre del turno por ID
  const getNombreTurno = (turnoId) => {
    if (!turnoId) return null;
    
    const turno = turnos[turnoId];
    if (turno) {
      return turno.nombre;
    }
    
    return `Turno ${turnoId}`;
  };

  // Obtener información del horario del turno
  const getHorarioTurno = (turnoId) => {
    if (!turnoId) return null;
    
    const turno = turnos[turnoId];
    if (turno && turno.start_time && turno.end_time) {
      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // Manejar formatos 'HH:MM', 'HH:MM:SS' o ISO
        const hhmmMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (hhmmMatch) {
          const hours = Number(hhmmMatch[1]);
          const minutes = Number(hhmmMatch[2]);
          const d = new Date();
          d.setHours(hours, minutes, 0, 0);
          // Usar en-US para obtener AM/PM y dejar en minúsculas
          return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
        }
        // Intentar parsear como fecha completa
        const parsed = new Date(timeStr);
        if (!isNaN(parsed)) {
          return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
        }
        // Fallback: devolver la cadena original
        return timeStr;
      };
      return `${formatTime(turno.start_time)} - ${formatTime(turno.end_time)}`;
    }
    
    return null;
  };

  // Obtener nombre del empleado por ID
  const getNombreEmpleado = (empleadoId) => {
    if (!empleadoId) return null;
    
    const empleado = empleados[empleadoId];
    if (empleado) {
      return empleado.nombre;
    }
    
    return `Empleado ${empleadoId}`;
  };

  // Obtener información básica usando los nombres reales
  const getInformacionBasica = (solicitud) => {
    console.log('📋 [getInformacionBasica] Procesando solicitud completa:', solicitud);

    // Buscar nombre del empleado solicitante
    let nombreEmpleado = 'Empleado no especificado';
    const empleadoSolicitanteId = solicitud.requesting_employee_id || 
                                 solicitud.requesting_employee;
    
    console.log('👤 [getInformacionBasica] ID empleado solicitante:', empleadoSolicitanteId);
    
    if (empleadoSolicitanteId) {
      const nombreEncontrado = getNombreEmpleado(empleadoSolicitanteId);
      if (nombreEncontrado && nombreEncontrado !== `Empleado ${empleadoSolicitanteId}`) {
        nombreEmpleado = nombreEncontrado;
      }
    }

    // Obtener tipo de solicitud basado en los campos disponibles
    let tipoSolicitud = 'Solicitud';
    if (solicitud.proposed_employee_id && solicitud.proposed_shift_id) {
      tipoSolicitud = 'Intercambio de Turno';
    } else if (solicitud.proposed_shift_id) {
      tipoSolicitud = 'Cambio de Turno';
    } else {
      tipoSolicitud = 'Día Libre';
    }

    // Obtener clase CSS para el tipo
    const tipoLower = tipoSolicitud.toLowerCase();
    let claseTipo = 'tipo-modificacion';
    if (tipoLower.includes('cambio') || tipoLower.includes('intercambio')) {
      claseTipo = 'tipo-cambio';
    } else if (tipoLower.includes('libre')) {
      claseTipo = 'tipo-dia-libre';
    }

    // Obtener descripción
    const descripcion = solicitud.razón || solicitud.reason || solicitud.description || solicitud.motivo || 'Sin descripción proporcionada';

    // Información de turnos con nombres reales
    const infoTurnos = {
      turnoOriginal: solicitud.original_shift_id ? {
        id: solicitud.original_shift_id,
        nombre: getNombreTurno(solicitud.original_shift_id),
        horario: getHorarioTurno(solicitud.original_shift_id)
      } : null,
      turnoSolicitado: solicitud.proposed_shift_id ? {
        id: solicitud.proposed_shift_id,
        nombre: getNombreTurno(solicitud.proposed_shift_id),
        horario: getHorarioTurno(solicitud.proposed_shift_id)
      } : null
    };

    console.log('🔄 [getInformacionBasica] Información de turnos procesada:', infoTurnos);

    // Información del compañero con nombre real
    const compañero = solicitud.proposed_employee_id ? {
      id: solicitud.proposed_employee_id,
      nombre: getNombreEmpleado(solicitud.proposed_employee_id)
    } : null;

    // Información adicional
    const infoAdicional = {
      fecha: solicitud.created_at || solicitud.fecha_creacion || solicitud.date
    };

    return {
      nombreEmpleado,
      tipoSolicitud,
      claseTipo,
      descripcion,
      infoTurnos,
      compañero,
      ...infoAdicional
    };
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    
    try {
      const date = new Date(fecha);
      if (isNaN(date)) return null;
      
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  // Navegar a la revisión
  const handleClickSolicitud = (solicitudId) => {
    navigate('/admin/shift-change-review', { state: { solicitudId } });
  };

  return (
    <div className="solicitudes-widget">
      <div className="widget-header">
        <h3 className="widget-title">
          <FaExclamationCircle className="title-icon" />
          Solicitudes Pendientes
        </h3>
        {pendientesCount > 0 && (
          <span className="pendientes-badge">
            {pendientesCount}
          </span>
        )}
      </div>

      <div className="solicitudes-list">
        {loading ? (
          <div className="solicitudes-vacio">
            <p>Cargando solicitudes...</p>
          </div>
        ) : pendientesCount === 0 ? (
          <div className="solicitudes-vacio">
            <FaCalendarCheck className="solicitudes-vacio-icono" />
            <p className="solicitudes-vacio-texto">No hay solicitudes pendientes</p>
          </div>
        ) : (
          solicitudes.filter(isPending).map((solicitud, index) => {
            const info = getInformacionBasica(solicitud);
            const fechaFormateada = formatearFecha(info.fecha);

            console.log(`📄 [Render] Solicitud ${index} procesada:`, info);

            return (
              <div
                key={solicitud.id || solicitud._id || index}
                className="solicitud-item"
                onClick={() => handleClickSolicitud(solicitud.id || solicitud._id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClickSolicitud(solicitud.id || solicitud._id);
                  }
                }}
              >
                <div className="solicitud-header">
                  <div className="solicitud-info">
                    <h4 className="solicitud-empleado">{info.nombreEmpleado}</h4>
                  </div>
                  <span className="solicitud-estado estado-pendiente">
                    Pendiente
                  </span>
                </div>

                <div className="solicitud-detalles">
                  {/* TURNOS - Información de turnos con nombres reales */}
                  {(info.infoTurnos.turnoOriginal || info.infoTurnos.turnoSolicitado) && (
                    <div className="detalle-fila">
                      <FaExchangeAlt className="detalle-icono" />
                      <div className="detalle-contenido">
                        <span className="detalle-etiqueta">Turnos</span>
                        <div className="turnos-container">
                          {info.infoTurnos.turnoOriginal && (
                            <div className="turno-info">
                              <div className="turno-etiqueta">Original:</div>
                              <div className="turno-detalle">
                                <span className="turno-original">
                                  {info.infoTurnos.turnoOriginal.nombre}
                                </span>
                                {info.infoTurnos.turnoOriginal.horario && (
                                  <span className="turno-horario">
                                    ({info.infoTurnos.turnoOriginal.horario})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {info.infoTurnos.turnoSolicitado && (
                            <div className="turno-info">
                              <div className="turno-etiqueta">Solicitado:</div>
                              <div className="turno-detalle">
                                <span className="turno-solicitado">
                                  {info.infoTurnos.turnoSolicitado.nombre}
                                </span>
                                {info.infoTurnos.turnoSolicitado.horario && (
                                  <span className="turno-horario">
                                    ({info.infoTurnos.turnoSolicitado.horario})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TIPO DE SOLICITUD */}
                  <div className="detalle-fila">
                    <FaClipboardList className="detalle-icono" />
                    <div className="detalle-contenido">
                      <span className="detalle-etiqueta">Tipo de Solicitud</span>
                      <div>
                        <span className={info.claseTipo}>
                          {info.tipoSolicitud}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* FECHA DE SOLICITUD */}
                  {fechaFormateada && (
                    <div className="detalle-fila">
                      <FaCalendarAlt className="detalle-icono" />
                      <div className="detalle-contenido">
                        <span className="detalle-etiqueta">Fecha de Solicitud</span>
                        <div className="info-horario">
                          <span className="horario-item">
                            <FaCalendarAlt className="horario-icono" />
                            {fechaFormateada}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DESCRIPCIÓN */}
                  <div className="detalle-fila">
                    <FaInfoCircle className="detalle-icono" />
                    <div className="detalle-contenido">
                      <span className="detalle-etiqueta">Descripción</span>
                      <div className="descripcion-texto">
                        {info.descripcion}
                      </div>
                    </div>
                  </div>

                  {/* COMPAÑERO - después de la descripción con nombre real */}
                  {info.compañero && (
                    <div className="detalle-fila">
                      <FaUsers className="detalle-icono" />
                      <div className="detalle-contenido">
                        <span className="detalle-etiqueta">Compañero</span>
                        <span className="detalle-valor">{info.compañero.nombre}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SolicitudesPendientes;