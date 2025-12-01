import React, { useState, useEffect } from 'react';
import { FaDownload, FaSearch, FaCalendarAlt, FaUser, FaClock, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { MdInbox } from 'react-icons/md';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import shiftService from '../../services/shiftService';
import timeEntryService from '../../services/timeEntryService';
import { formatTime } from '../../utils/dateUtils';
import '../../styles/components/reports/EmployeeHoursReport.css';

const EmployeeHoursReport = () => {
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: ''
  });
  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [shiftTypeMap, setShiftTypeMap] = useState({});

  useEffect(() => {
    loadEmployees();
    loadShiftTypes();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await shiftService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const loadShiftTypes = async () => {
    try {
      const types = await shiftService.getShiftTypes();
      const mappedTypes = {};

      (types || []).forEach(type => {
        if (!type) return;
        const id = type.id ?? type.pk ?? type.shift_type_id ?? type.shiftTypeId;
        const name = (type.name || type.title || type.shift_type_name || type.label || type.display_name || type.nombre || '').toString().trim();
        if (id != null && name) {
          mappedTypes[id] = name;
          mappedTypes[String(id)] = name;
        }
        if (name) {
          mappedTypes[name] = name;
          mappedTypes[name.toLowerCase()] = name;
        }
      });

      setShiftTypeMap(mappedTypes);
    } catch (error) {
      console.error('Error al cargar tipos de turno:', error);
    }
  };

  const fetchAndCacheShiftType = async (id) => {
    if (id === undefined || id === null) return null;
    try {
      const asNumber = Number(id);
      const key = !Number.isNaN(asNumber) ? asNumber : String(id);
      if (shiftTypeMap[key]) return shiftTypeMap[key];
      const res = await shiftService.getShiftType(id);
      const name = (res?.name || res?.title || res?.shift_type_name || res?.label || res?.display_name || '').toString().trim();
      if (name) {
        setShiftTypeMap(prev => ({ ...prev, [key]: name, [String(key)]: name, [name]: name, [name.toLowerCase()]: name }));
        return name;
      }
    } catch (err) {
      console.warn('No se pudo obtener tipo de turno por id', id, err);
    }
    return null;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const parseTimeTo24h = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    
    // Limpiar espacios
    timeStr = timeStr.trim();
    
    // Si ya está en formato 24h (HH:MM)
    if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
      const [hh, mm] = timeStr.split(':').map(num => parseInt(num));
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
    }
    
    // Si tiene formato AM/PM
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    if (match) {
      let [_, hour, minute = '00', ampm] = match;
      hour = parseInt(hour);
      minute = minute || '00';
      
      if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
      
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    
    return '';
  };

  const parseHoursToDecimal = (hoursStr) => {
    if (!hoursStr) return 0;
    
    if (typeof hoursStr === 'number') return hoursStr;
    
    const str = hoursStr.toString().toLowerCase().trim();
    
    // Si es "0m" u "om"
    if (str === '0m' || str === 'om') return 0;
    
    // Formatos posibles: "1h 30m", "1h", "30m", "1.5h", "1.5"
    const hmMatch = str.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/);
    if (hmMatch && (hmMatch[1] || hmMatch[2])) {
      const h = parseInt(hmMatch[1] || 0, 10);
      const m = parseInt(hmMatch[2] || 0, 10);
      return Math.round(((h + m / 60) * 100)) / 100;
    }

    // Si es en horas decimal "1.5h" o "1.5"
    const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*h?/);
    if (hoursMatch) {
      return parseFloat(hoursMatch[1]);
    }
    
    return 0;
  };

  const calculateHoursFromTimes = (startTime, endTime) => {
    const start = parseTimeTo24h(startTime);
    const end = parseTimeTo24h(endTime);
    
    if (!start || !end) return 0;
    
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    let startTotal = startHour + startMinute / 60;
    let endTotal = endHour + endMinute / 60;
    
    // Si la hora de fin es menor que la de inicio, asumir que pasa a la medianoche
    if (endTotal < startTotal) {
      endTotal += 24;
    }
    
    const hours = endTotal - startTotal;
    return Math.round(hours * 100) / 100; // Redondear a 2 decimales
  };

  const parseDateSafe = (value) => {
    if (!value && value !== 0) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      return new Date(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const plainDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (plainDateMatch) {
        const [, year, month, day] = plainDateMatch.map(Number);
        return new Date(year, (month || 1) - 1, day || 1);
      }

      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed);
      }
    }

    return null;
  };

  const formatDate = (dateStr) => {
    const date = parseDateSafe(dateStr);
    if (!date || Number.isNaN(date.getTime())) {
      return dateStr || '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const decimalHoursToLabel = (value) => {
    if (value === undefined || value === null) return '-';
    const totalMinutes = Math.round(Number(value) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.abs(totalMinutes % 60);
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) return '0m';
    return parts.join(' ');
  };

  const getHoursLabel = (rawLabel, decimalValue) => {
    if (rawLabel && rawLabel !== '-') return rawLabel;
    return decimalHoursToLabel(decimalValue);
  };

  const extractShiftDate = (shift) => {
    if (!shift) return null;
    const candidates = [
      shift.date,
      shift.shift_date,
      shift.start_date,
      shift.FECHA,
      shift.start,
      shift.startDate,
      shift.start_time && shift.date ? `${shift.date} ${shift.start_time}` : null,
      shift.startTime && shift.date ? `${shift.date} ${shift.startTime}` : null
    ];

    for (const value of candidates) {
      const parsed = parseDateSafe(value);
      if (parsed && !Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  };

  const buildShiftsByDate = (shifts = []) => {
    const map = {};
    shifts.forEach(shift => {
      const dateObj = extractShiftDate(shift);
      if (!dateObj) return;
      const key = formatDate(dateObj);
      if (!key) return;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(shift);
    });
    return map;
  };

  const getShiftTypeName = (shift) => {
    if (!shift) return null;
    return shift.shift_type_name || shift.shift_type || shift.shiftTypeName || shift.ESTADO || shift.status || null;
  };

  const sanitizeShiftTypeName = (value) => {
    if (!value && value !== 0) return null;
    const label = String(value).trim();
    if (!label) return null;
    const lower = label.toLowerCase();
    if (['registrado', 'turno', 'shift'].includes(lower)) return null;
    return label;
  };

  const lookupShiftTypeById = (candidate) => {
    if (candidate === undefined || candidate === null) return null;

    if (typeof candidate === 'object') {
      if ('id' in candidate) {
        candidate = candidate.id;
      } else if ('shift_type_id' in candidate) {
        candidate = candidate.shift_type_id;
      }
    }

    const asNumber = Number(candidate);
    if (!Number.isNaN(asNumber) && shiftTypeMap[asNumber]) {
      return shiftTypeMap[asNumber];
    }

    const key = String(candidate).trim();
    if (!key) return null;
    if (shiftTypeMap[key]) return shiftTypeMap[key];

    return sanitizeShiftTypeName(key);
  };

  const resolveShiftTypeName = (shift) => {
    const direct = sanitizeShiftTypeName(getShiftTypeName(shift));
    if (direct) return direct;

    if (!shift) return null;
    const candidates = [
      shift?.shift_type_id,
      shift?.shiftTypeId,
      shift?.shift_type,
      shift?.shiftType,
      shift?.shift_type?.id,
      shift?.shiftType?.id
    ];

    for (const candidate of candidates) {
      const resolved = lookupShiftTypeById(candidate);
      if (resolved) return resolved;
    }

    return null;
  };

  const generateReport = async () => {
    if (!filters.employeeId || !filters.startDate || !filters.endDate) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      alert('La fecha de inicio no puede ser mayor a la fecha de fin');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const employee = employees.find(e => String(e.id) === String(filters.employeeId));
      if (!employee) {
        alert('Empleado no encontrado');
        setReportData(null);
        return;
      }

      const employeeDbId = employee?.employee_id || employee?.employeeId || employee?.id;
      
      // Obtener turnos del servicio
      const shiftsRaw = await shiftService.getEmployeeShifts(employeeDbId);
      console.log('Datos crudos de turnos:', shiftsRaw);
      let scheduledShifts = [];
      if (!Array.isArray(shiftsRaw) || shiftsRaw.length === 0) {
        try {
          // intentar obtener turnos usando el endpoint general con filtros
          const params = { employee: employeeDbId, start_date: filters.startDate, end_date: filters.endDate };
          const resp = await shiftService.getShifts(params);
          scheduledShifts = Array.isArray(resp) ? resp : (resp?.results || resp?.data || []);
          console.log('Programados obtenidos vía getShifts:', scheduledShifts.length);
        } catch (err) {
          console.warn('No se pudieron obtener turnos programados por getShifts:', err);
        }
      }
      
      // Filtrar por rango de fechas
      const start = parseDateSafe(filters.startDate);
      const end = parseDateSafe(filters.endDate);
      if (!start || !end) {
        alert('Rango de fechas inválido');
        setReportData(null);
        return;
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const filtered = (shiftsRaw || []).filter(s => {
        const d = extractShiftDate(s);
        if (!d) return false;
        return d >= start && d <= end;
      });

      console.log('Turnos filtrados:', filtered);

      // Primero: intentar obtener registros de tiempo (check_in/check_out) del empleado
      const timeFilters = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        // backend puede aceptar employee_id para obtener registros de ese empleado (si está disponible)
        employee_id: employeeDbId
      };

      let finalShifts = [];
      try {
        const entries = await timeEntryService.getMyTimeEntries(timeFilters);
        console.log('Registros de tiempo del empleado:', entries.length);

        // Agrupar por fecha usando la fecha del registro o el timestamp
        const grouped = {};
        entries.forEach(e => {
          let dateKey = e.date;
          if (!dateKey && e.timestamp) {
            try {
              dateKey = new Date(e.timestamp).toISOString().split('T')[0];
            } catch { /* ignore */ }
          }
          if (!dateKey) return;

          if (!grouped[dateKey]) {
            grouped[dateKey] = {
              date: dateKey,
              check_in_ts: null,
              check_out_ts: null
              , shiftIds: []
            };
          }

          if (e.entry_type === 'check_in') {
            // guardar el check_in más temprano
            if (!grouped[dateKey].check_in_ts || new Date(e.timestamp) < new Date(grouped[dateKey].check_in_ts)) {
              grouped[dateKey].check_in_ts = e.timestamp;
            }
          } else if (e.entry_type === 'check_out') {
            // guardar el check_out más tardío
            if (!grouped[dateKey].check_out_ts || new Date(e.timestamp) > new Date(grouped[dateKey].check_out_ts)) {
              grouped[dateKey].check_out_ts = e.timestamp;
            }
          }
          // registrar shift_id si viene en el registro de tiempo
          if (e.shift_id) {
            try {
              const sid = Number(e.shift_id);
              if (!Number.isNaN(sid) && !grouped[dateKey].shiftIds.includes(sid)) grouped[dateKey].shiftIds.push(sid);
            } catch { /* ignore */ }
          }
        });

        const sessions = Object.values(grouped).map(item => {
          let hoursDecimal = 0;
          let hoursLabel = '-';
          if (item.check_in_ts && item.check_out_ts) {
            hoursLabel = timeEntryService.calculateHours(item.check_in_ts, item.check_out_ts);
            hoursDecimal = parseHoursToDecimal(hoursLabel);
          }
          const resolvedLabel = getHoursLabel(hoursLabel, hoursDecimal);
          return {
            date: item.date,
            startTimeTs: item.check_in_ts || null,
            endTimeTs: item.check_out_ts || null,
            hours: hoursDecimal,
            rawHoursLabel: resolvedLabel
          };
        }).filter(s => s.date);

        // Preferir shiftsRaw si vienen, sino usar scheduledShifts
        const baseShifts = (Array.isArray(shiftsRaw) && shiftsRaw.length > 0) ? shiftsRaw : scheduledShifts;
        const filteredMap = buildShiftsByDate(filtered);
        const rawMap = buildShiftsByDate(baseShifts || []);

        finalShifts = [];
        for (const s of sessions) {
          const key = formatDate(s.date);
          const candidates = (filteredMap[key] && filteredMap[key].length > 0)
            ? filteredMap[key]
            : (rawMap[key] || []);
          const candidate = candidates[0] || null;
          let shiftType = resolveShiftTypeName(candidate);
          // si no hubo turno asociado (candidate), intentar resolver por shift_id guardado en registros de tiempo
          if ((!shiftType || shiftType === 'Turno' || shiftType === 'Registrado') && (s && s.startTimeTs)) {
            // buscar shift_id en el grupo correspondiente (sessions built from grouped)
            const groupKey = formatDate(s.date);
            const groupObj = Object.values(grouped || []).find(g => formatDate(g.date) === groupKey) || null;
            const shiftIdFromEntry = groupObj && groupObj.shiftIds && groupObj.shiftIds[0];
            if (shiftIdFromEntry) {
              try {
                const full = await shiftService.getShift(shiftIdFromEntry);
                if (full) {
                  shiftType = resolveShiftTypeName(full) || shiftType;
                }
              } catch { /* ignore */ }
            }

            // si aún no hay shiftType, intentar emparejar con scheduledShifts por fecha/hora
            if ((!shiftType || shiftType === 'Turno' || shiftType === 'Registrado') && Array.isArray(scheduledShifts) && scheduledShifts.length > 0) {
              const match = scheduledShifts.find(sh => {
                const shDate = extractShiftDate(sh);
                if (!shDate) return false;
                const shKey = formatDate(shDate);
                if (shKey !== formatDate(s.date)) return false;
                // intentar comparar horas si están disponibles
                const shStart = sh.start_time || sh.startTime || (sh.start && typeof sh.start === 'string' ? sh.start.split('T')[1]?.slice(0,5) : null);
                const shEnd = sh.end_time || sh.endTime || (sh.end && typeof sh.end === 'string' ? sh.end.split('T')[1]?.slice(0,5) : null);
                if (shStart && shEnd && s.startTimeTs && s.endTimeTs) {
                  // convertir timestamps a HH:MM para comparar
                  try {
                    const sStart = new Date(s.startTimeTs).toISOString().split('T')[1].slice(0,5);
                    // consider overlap
                    return (sStart >= shStart && sStart <= shEnd) || (shStart >= sStart && shStart <= (s.endTimeTs ? new Date(s.endTimeTs).toISOString().split('T')[1].slice(0,5) : shEnd));
                  } catch { /* ignore */ }
                }
                return true; // si no hay horas, fallback por fecha
              });
              if (match) shiftType = resolveShiftTypeName(match) || shiftType;
            }
          }
          finalShifts.push({
            date: key,
            startTime: s.startTimeTs,
            endTime: s.endTimeTs,
            hours: s.hours,
            rawHoursLabel: s.rawHoursLabel,
            shiftType: shiftType || 'Sin tipo'
          });
        }
      } catch {
        console.warn('No se pudieron obtener registros de tiempo o no existen, usando datos de turnos programados');
        finalShifts = [];
      }

      // Si no hay sesiones registradas, caer en la lógica previa basada en turnos programados
      if (!finalShifts || finalShifts.length === 0) {
        const fallbackSource = filtered.length > 0 ? filtered : (shiftsRaw || []);

        // Resolver nombres de tipo de turno por id si no vienen en el objeto del turno.
        const mappedShiftsArray = await Promise.all(fallbackSource.map(async (s) => {
          const dateObj = extractShiftDate(s);
          if (!dateObj) return null;
          if (dateObj < start || dateObj > end) return null;
          const date = formatDate(dateObj);

          // Extraer hora inicio
          let startTime = s.start_time || s.startTime || s.ENTRADA;
          if (!startTime && s.start) {
            const startStr = typeof s.start === 'string' ? s.start : '';
            const timePart = startStr.split('T')[1];
            if (timePart) startTime = timePart.slice(0, 5);
          }

          // Extraer hora fin
          let endTime = s.end_time || s.endTime || s.SALIDA;
          if (!endTime && s.end) {
            const endStr = typeof s.end === 'string' ? s.end : '';
            const timePart = endStr.split('T')[1];
            if (timePart) endTime = timePart.slice(0, 5);
          }

          // Calcular horas
          let hours = 0;
          const hoursStr = s.hours || s.total_hours || s.duration_hours || s.HORAS;
          if (hoursStr !== undefined && hoursStr !== null && hoursStr !== '') {
            hours = parseHoursToDecimal(hoursStr);
          }
          if (hours === 0 && startTime && endTime) {
            hours = calculateHoursFromTimes(startTime, endTime);
          }

          // Intentar obtener el nombre del tipo de turno desde el propio objeto
          let shiftType = resolveShiftTypeName(s) || null;

          // Si no existe nombre, intentar resolverlo buscando el turno por id
          if ((!shiftType || shiftType === 'Turno' || shiftType === 'Registrado') && (s.id || s.shift_id || s.pk)) {
            const shiftId = s.id || s.shift_id || s.pk;
            try {
              const full = await shiftService.getShift(shiftId);
              if (full) {
                shiftType = resolveShiftTypeName(full) || shiftType;
              }
            } catch {
              // ignore resolution error
            }
          }

          // Si aún no existe, intentar obtener el tipo por id directamente y cachearlo
          if ((!shiftType || shiftType === 'Turno' || shiftType === 'Registrado') && (s.shift_type_id || s.shift_type || s.shiftType)) {
            const typeIdCandidate = s.shift_type_id ?? s.shift_type ?? s.shiftType;
            try {
              const fetched = await fetchAndCacheShiftType(typeIdCandidate);
              if (fetched) shiftType = fetched;
            } catch { /* ignore */ }
          }

          const rawHoursLabel = decimalHoursToLabel(hours);

          return {
            date,
            startTime: startTime || '',
            endTime: endTime || '',
            hours,
            rawHoursLabel,
            shiftType: shiftType || 'Sin tipo'
          };
        }));

        const mappedShifts = (mappedShiftsArray || []).filter(Boolean);
        finalShifts = mappedShifts.filter(s => s.date && (s.startTime || s.endTime || s.hours > 0));
      }

      const totalHours = finalShifts.reduce((sum, sh) => sum + (Number(sh.hours) || 0), 0);

      const final = {
        employee: employee,
        startDate: filters.startDate,
        endDate: filters.endDate,
        shifts: finalShifts,
        totalHours: Math.round(totalHours * 100) / 100
      };

      console.log('Reporte final:', final);
      setReportData(final.shifts.length > 0 ? final : null);
      
    } catch (error) {
      console.error('Error al generar reporte:', error);
      alert('Error al generar el reporte. Verifique la consola para más detalles.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Colores del tema
    const primaryColor = [79, 140, 255];
    const darkColor = [34, 43, 69];
    const lightGray = [248, 250, 252];
    
    // Header
    const headerHeight = 45;
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Intentar cargar el logo desde public/img/calendario.png y dibujarlo (fallback silencioso)
    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    let titleX = 15;
    try {
      const img = await loadImage('/img/calendario.png');
      const imgWidth = 28;
      const aspect = img.height / img.width;
      const imgHeight = imgWidth * aspect;
      const imgX = 15;
      const imgY = (headerHeight - imgHeight) / 2;
      doc.addImage(img, 'PNG', imgX, imgY, imgWidth, imgHeight);
      titleX = imgX + imgWidth + 10;
    } catch (err) {
      console.warn('No se pudo cargar el logo para el PDF:', err);
    }

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Shift Scheduler', titleX, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Horas Trabajadas', titleX, 32);
    
    // Información del empleado
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, 55, pageWidth - 30, 35, 3, 3, 'F');
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Empleado:', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.employee?.name || 'N/A', 45, 65);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Período:', 20, 73);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportData.startDate} - ${reportData.endDate}`, 45, 73);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total de Horas:', 20, 81);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(13);
    doc.text(decimalHoursToLabel(reportData.totalHours), 60, 81);
    
    // Tabla
    autoTable(doc, {
      startY: 100,
      head: [['Fecha', 'Hora Inicio', 'Hora Fin', 'Horas', 'Tipo de Turno']],
      body: reportData.shifts.map(shift => [
        shift.date,
        formatTime(shift.startTime),
        formatTime(shift.endTime),
        getHoursLabel(shift.rawHoursLabel, shift.hours),
        shift.shiftType
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: darkColor,
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 'auto' }
      },
      margin: { left: 15, right: 15 }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...primaryColor);
      doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      const date = new Date().toLocaleDateString('es-ES');
      doc.text(`Generado el ${date}`, 15, doc.internal.pageSize.getHeight() - 7);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 35, doc.internal.pageSize.getHeight() - 7);
    }
    
    doc.save(`reporte_horas_${reportData.employee?.name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheetData = [
      ['Reporte de Horas Trabajadas'],
      [],
      ['Empleado:', reportData.employee?.name || 'N/A'],
      ['Período:', `${reportData.startDate} - ${reportData.endDate}`],
      ['Total de Horas:', decimalHoursToLabel(reportData.totalHours)],
      [],
      ['Fecha', 'Hora Inicio', 'Hora Fin', 'Horas', 'Tipo de Turno'],
      ...reportData.shifts.map(shift => [
        shift.date,
        formatTime(shift.startTime),
        formatTime(shift.endTime),
        getHoursLabel(shift.rawHoursLabel, shift.hours),
        shift.shiftType
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Establecer anchos de columna
    const wscols = [
      { wch: 12 }, // Fecha
      { wch: 12 }, // Hora Inicio
      { wch: 12 }, // Hora Fin
      { wch: 10 }, // Horas
      { wch: 20 }  // Tipo de Turno
    ];
    ws['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_horas_${reportData.employee?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="reports-time-employee-container">
      {/* Filtros */}
      <div className="reports-time-filters-card">
        <div className="reports-time-filters-header">
          <FaSearch className="reports-time-filters-icon" />
          <h3>Generar Reporte</h3>
        </div>
        
        <div className="reports-time-filters-grid">
          <div className="reports-time-filter-group">
            <label className="reports-time-filter-label">
              <FaUser className="reports-time-label-icon" />
              Empleado
            </label>
            <select
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              className="reports-time-filter-input"
              disabled={isLoading}
            >
              <option value="">Seleccionar empleado</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="reports-time-filter-group">
            <label className="reports-time-filter-label">
              <FaCalendarAlt className="reports-time-label-icon" />
              Fecha Inicio
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="reports-time-filter-input"
              disabled={isLoading}
              max={filters.endDate || undefined}
            />
          </div>

          <div className="reports-time-filter-group">
            <label className="reports-time-filter-label">
              <FaCalendarAlt className="reports-time-label-icon" />
              Fecha Fin
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="reports-time-filter-input"
              disabled={isLoading}
              min={filters.startDate || undefined}
            />
          </div>
        </div>

        <button 
          className="reports-time-generate-btn"
          onClick={generateReport}
          disabled={isLoading || !filters.employeeId || !filters.startDate || !filters.endDate}
        >
          <FaSearch />
          {isLoading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

      {/* Resultados */}
      {hasSearched && (
        <>
          {reportData ? (
            <>
              {/* Resumen */}
              <div className="reports-time-summary-card">
                <div className="reports-time-summary-item">
                  <FaUser className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Empleado</p>
                    <p className="reports-time-summary-value">{reportData.employee?.name}</p>
                  </div>
                </div>
                <div className="reports-time-summary-item">
                  <FaCalendarAlt className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Período</p>
                    <p className="reports-time-summary-value">
                      {reportData.startDate} - {reportData.endDate}
                    </p>
                  </div>
                </div>
                <div className="reports-time-summary-item highlight">
                  <FaClock className="reports-time-summary-icon" />
                  <div>
                    <p className="reports-time-summary-label">Total de Horas</p>
                    <p className="reports-time-summary-value">{decimalHoursToLabel(reportData.totalHours)}</p>
                  </div>
                </div>
              </div>

              {/* Botones de exportación */}
              <div className="reports-time-export-section">
                <h4 className="reports-time-export-title">
                  <FaDownload />
                  Exportar Reporte
                </h4>
                <div className="reports-time-export-buttons">
                  <button 
                    onClick={exportToPDF} 
                    className="reports-time-export-btn pdf"
                    disabled={!reportData || reportData.shifts.length === 0}
                  >
                    <FaFilePdf />
                    PDF
                  </button>
                  <button 
                    onClick={exportToExcel} 
                    className="reports-time-export-btn excel"
                    disabled={!reportData || reportData.shifts.length === 0}
                  >
                    <FaFileExcel />
                    Excel
                  </button>
                </div>
              </div>

              {/* Tabla de detalles */}
              <div className="reports-time-table-card">
                <h4 className="reports-time-table-title">Detalle de Turnos ({reportData.shifts.length} turnos)</h4>
                <div className="reports-time-table-wrapper">
                  <table className="reports-time-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora Inicio</th>
                        <th>Hora Fin</th>
                        <th>Horas</th>
                        <th>Tipo de Turno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.shifts.map((shift, index) => (
                        <tr key={index}>
                          <td>{shift.date}</td>
                          <td>{formatTime(shift.startTime)}</td>
                          <td>{formatTime(shift.endTime)}</td>
                          <td className="reports-time-hours-cell">{getHoursLabel(shift.rawHoursLabel, shift.hours)}</td>
                          <td>{shift.shiftType}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                          <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            Total:
                          </td>
                          <td className="reports-time-hours-cell total" style={{ fontWeight: 'bold', paddingLeft: '12px' }}>
                            <span style={{ display: 'inline-block', minWidth: '6ch', textAlign: 'left' }}>{decimalHoursToLabel(reportData.totalHours)}</span>
                          </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="reports-time-empty-state">
              <MdInbox className="reports-time-empty-icon" />
              <h3 className="reports-time-empty-title">No existen datos para el rango seleccionado</h3>
              <p className="reports-time-empty-description">
                Intenta ajustar los filtros o seleccionar otro período de tiempo.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeHoursReport;