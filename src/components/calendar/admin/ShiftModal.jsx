import { useState, useEffect, useCallback, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { FaTimes, FaCheck, FaExclamationTriangle, FaUser, FaClock, FaSave, FaLock,FaBriefcase, FaTrash, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import { es } from 'date-fns/locale';
import { detectShiftConflicts, calculateShiftDuration } from '../../../utils/shiftValidation';
import { formatDateForInput, formatTimeForInput, combineDateAndTime, timeStringToMinutes, minutesToTimeString, formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/calendar/admin/ShiftModal.css';
import '../../../styles/components/calendar/admin/DeleteMultipleShiftsModal.css';
import 'react-datepicker/dist/react-datepicker.css';

const TIMEZONE_OFFSET = -5 * 60; // UTC-05:00 (Bogotá, Lima, Quito)
const TIMEZONE_ISO_SUFFIX = getTimezoneIsoSuffix(TIMEZONE_OFFSET);

function getTimezoneIsoSuffix(offsetMinutes) {
  const sign = offsetMinutes <= 0 ? '-' : '+';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(Math.abs(absolute % 60)).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

function normalizeTimeInput(timeStr = '00:00') {
  if (!timeStr) return '00:00:00';
  const parts = String(timeStr).split(':');
  const hours = parts[0] ? parts[0].padStart(2, '0') : '00';
  const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
  const seconds = parts[2] ? parts[2].padStart(2, '0') : '00';
  return `${hours}:${minutes}:${seconds}`;
}

function normalizeDateInput(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    return dateInput.slice(0, 10);
  }
  return formatDateForInput(dateInput);
}

function createDateAtTimezone(dateInput, timeInput = '00:00') {
  const normalizedDate = normalizeDateInput(dateInput);
  if (!normalizedDate) return null;
  const normalizedTime = normalizeTimeInput(timeInput);
  const date = new Date(`${normalizedDate}T${normalizedTime}${TIMEZONE_ISO_SUFFIX}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTimeInPast(dateInput, timeInput) {
  if (!dateInput || !timeInput) return false;
  const targetDate = createDateAtTimezone(dateInput, timeInput);
  if (!targetDate) return false;
  return targetDate.getTime() < Date.now();
}

function isShiftTypeInPast(type, selectedDate) {
  if (!type || !selectedDate) return false;
  const typeStartTime = type.startTime || type.start_time || type.start || '00:00';
  return isTimeInPast(selectedDate, typeStartTime);
}

function parseManualDateInput(value) {
  if (!value) return null;
  const raw = String(value).trim();

  // Formato dd/MM/yyyy
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
  }

  // Formato yyyy-MM-dd
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
  }

  return null;
}

const ShiftModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  openDeleteConfirmOnOpen = false,
  shift = null,
  employees,
  shiftTypes,
  existingShifts,
  unavailabilities = []
}) => {
  // Zona horaria fija manejada vía utilidades (UTC-05:00 Bogotá/Lima/Quito)

  const formatDisplayTime = (timeValue) => {
    if (!timeValue) return '--';

    const raw = String(timeValue).trim();
    const match = raw.match(/(\d{1,2}):(\d{2})/);

    if (match) {
      const hours = Number(match[1]);
      const minutes = match[2];
      if (!Number.isNaN(hours)) {
        const hour12 = ((hours + 11) % 12) + 1;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      }
    }

    return formatTime(timeValue);
  };
  const getTypeTimeWindow = (type) => {
    if (!type) return '-- - --';
    const startRaw = type.startTime || type.start_time || type.start || '';
    const endRaw = type.endTime || type.end_time || type.end || '';

    const fmt = (val) => {
      if (val === null || val === undefined || val === '') return '--';
      // Si el valor es numérico corto, tratarlo como minutos y convertir a HH:MM
      if (typeof val === 'number' && !Number.isNaN(val)) {
        const hhmm = minutesToTimeString(val);
        return formatTime(hhmm);
      }
      // Si viene como string con solo minutos (ej. '480') intentar parsear a número
      if (/^\d+$/.test(String(val))) {
        const n = Number(val);
        if (!Number.isNaN(n)) {
          const hhmm = minutesToTimeString(n);
          return formatTime(hhmm);
        }
      }
      return formatTime(val);
    };

    return `${fmt(startRaw)} - ${fmt(endRaw)}`;
  };

  const formatDateDisplay = (dateInput) => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, d] = dateInput.split('-');
      return `${d}/${m}/${y}`;
    }
    try {
      const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
      return d.toLocaleDateString('es-ES');
    } catch {
      return String(dateInput);
    }
  };

  const [formData, setFormData] = useState({
    employeeId: '',
    shiftTypeId: '',
    date: formatDateForInput(new Date()),
    startTime: '',
    endTime: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [duration, setDuration] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoDetectedType, setAutoDetectedType] = useState(false);
  const [typeAvailabilityMap, setTypeAvailabilityMap] = useState({});
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [generalAlert, setGeneralAlert] = useState(null); 
  const [pastShiftTypes, setPastShiftTypes] = useState([]); // Tipos de turno que ya pasaron
  const isLocked = shift?.is_locked || shift?.isLocked || false;
  const lockReason = shift?.lock_reason || shift?.lockReason || '';
  const selectedDateObject = formData.date ? createDateAtTimezone(formData.date, '00:00') : null;
  const modalBackdropMouseDownRef = useRef(false);
  const deleteBackdropMouseDownRef = useRef(false);

  const handleModalBackdropMouseDown = (event) => {
    modalBackdropMouseDownRef.current = event.target === event.currentTarget;
  };

  const handleModalBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    if (!modalBackdropMouseDownRef.current) return;
    onClose?.();
  };

  const handleDeleteBackdropMouseDown = (event) => {
    deleteBackdropMouseDownRef.current = event.target === event.currentTarget;
  };

  const handleDeleteBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    if (!deleteBackdropMouseDownRef.current) return;
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscClose = (event) => {
      if (event.key !== 'Escape') return;
      if (showDeleteConfirm) {
        setShowDeleteConfirm(false);
        return;
      }
      onClose?.();
    };

    window.addEventListener('keydown', handleEscClose);
    return () => window.removeEventListener('keydown', handleEscClose);
  }, [isOpen, showDeleteConfirm, onClose]);

  // ✅ MEJORA: useEffect para cargar datos del shift
  useEffect(() => {
    if (shift) {
      
      const employeeNameFromShift = shift.employeeName || shift.extendedProps?.employeeName;
      
      let employeeUserIdToUse = '';
      
      if (employeeNameFromShift && Array.isArray(employees)) {
        const matchingEmployee = employees.find(emp => 
          emp.name === employeeNameFromShift || 
          emp.name?.includes(employeeNameFromShift) ||
          employeeNameFromShift?.includes(emp.name)
        );
        
        if (matchingEmployee) {
          employeeUserIdToUse = String(matchingEmployee.id);
          setSelectedEmployee(matchingEmployee);
        }
      }
      
      if (!employeeUserIdToUse) {
        employeeUserIdToUse = shift.employeeUserId || 
                             shift.extendedProps?.employeeUserId || 
                             shift.employee_user_id;
      }
      
      if (!employeeUserIdToUse && employees && employees.length > 0) {
        employeeUserIdToUse = String(employees[0].id);
        setSelectedEmployee(employees[0]);
      }
      
      const startDate = shift.start ? new Date(shift.start) : new Date();
      const endDate = shift.end ? new Date(shift.end) : new Date();
      
      const newFormData = {
        employeeId: employeeUserIdToUse,
        shiftTypeId: shift.extendedProps?.shiftTypeId ? 
                    String(shift.extendedProps.shiftTypeId) : 
                    shift.shiftTypeId ? 
                    String(shift.shiftTypeId) : '',
        date: shift.extendedProps?.date || shift.date || formatDateForInput(startDate),
        startTime: shift.extendedProps?.start_time || shift.startTime || formatTimeForInput(startDate),
        endTime: shift.extendedProps?.end_time || shift.endTime || formatTimeForInput(endDate),
        notes: shift.extendedProps?.notes || shift.notes || ''
      };
      
      setFormData(newFormData);
    } else if (isOpen) {
      setFormData({
        employeeId: '',
        shiftTypeId: '',
        date: formatDateForInput(new Date()),
        startTime: '',
        endTime: '',
        notes: ''
      });
      setSelectedEmployee(null);
    }
    
    setErrors({});
    setConflicts([]);
    setShowDeleteConfirm(Boolean(shift?.id && openDeleteConfirmOnOpen));
    setAutoDetectedType(false);
    setPastShiftTypes([]);
  }, [shift, isOpen, employees, openDeleteConfirmOnOpen]);

  // ✅ NUEVO: useEffect para calcular tipos de turno que ya pasaron
  useEffect(() => {
    if (formData.date && Array.isArray(shiftTypes)) {
      const pastTypes = shiftTypes.filter(type => 
        isShiftTypeInPast(type, formData.date)
      ).map(type => String(type.id));
      
      setPastShiftTypes(pastTypes);
      
      // Si el tipo de turno actual ya pasó, limpiarlo
      if (pastTypes.includes(formData.shiftTypeId)) {
        setFormData(prev => ({ ...prev, shiftTypeId: '' }));
        setAutoDetectedType(false);
      }
    }
  }, [formData.date, formData.shiftTypeId, shiftTypes]);

  // ✅ MEJORA: Calcular disponibilidad con razones detalladas
  useEffect(() => {
    try {
      const map = {};
      const reasonsMap = {}; // Razones de no disponibilidad

      if (!formData.employeeId || !formData.date || !Array.isArray(shiftTypes) || shiftTypes.length === 0) {
        shiftTypes.forEach(t => { 
          // Verificar si el tipo ya pasó
          const isPast = isShiftTypeInPast(t, formData.date);
          map[String(t.id)] = !isPast; // No disponible si ya pasó
          reasonsMap[String(t.id)] = isPast ? 'Este horario ya pasó' : '';
        });
        setTypeAvailabilityMap({ ...map, _reasons: reasonsMap });
        return;
      }

      const selEmp = Array.isArray(employees) ? 
        employees.find(e => String(e.id) === String(formData.employeeId)) : null;
      
      if (!selEmp) {
        console.warn('⚠️ [ShiftModal] No se encontró empleado con ID:', formData.employeeId);
        shiftTypes.forEach(t => { 
          const isPast = isShiftTypeInPast(t, formData.date);
          map[String(t.id)] = !isPast;
          reasonsMap[String(t.id)] = isPast ? 'Este horario ya pasó' : '';
        });
        setTypeAvailabilityMap({ ...map, _reasons: reasonsMap });
        return;
      }

      setSelectedEmployee(selEmp);

      const empDbId = selEmp?.employee_id ?? selEmp?.employeeId ?? selEmp?.employee;
      const selUserId = selEmp?.id ?? formData.employeeId;
      const empName = selEmp?.name || `${selEmp?.first_name || ''} ${selEmp?.last_name || ''}`.trim();


      const sameDay = (aDate, bDateStr) => {
        if (!aDate) return false;
        try {
          const d = aDate instanceof Date ? aDate : new Date(aDate);
          return d.toISOString().slice(0,10) === String(bDateStr);
        } catch { return false; }
      };

      const empAvails = Array.isArray(unavailabilities) ? unavailabilities.filter(a => {
        const aEmpCandidates = [
          a.employee_id, 
          a.employeeId, 
          a.employee, 
          a.user_id, 
          a.userId, 
          a.employee_user_id, 
          a.user
        ];
        const aEmpMatches = aEmpCandidates.map(x => x === undefined || x === null ? '' : String(x));
        const matchesEmp = aEmpMatches.includes(String(empDbId)) || 
                          aEmpMatches.includes(String(selUserId));
        
        const aDate = a.date || a.day || a.start_date || a.startDate || a.date_string;
        const same = sameDay(aDate, formData.date);
        
        return matchesEmp && same;
      }) : [];


      const ensureSeconds = (t) => {
        if (!t) return null;
        if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
        if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
        const m = String(t).match(/(\d{2}:\d{2})/);
        return m ? `${m[1]}:00` : null;
      };

      const parseAvailRange = (a) => {
        const aDate = a.date || a.day || a.start_date || a.startDate || formData.date;
        const s = ensureSeconds(a.start_time || a.startTime || a.start || a.startAt || '00:00');
        const e = ensureSeconds(a.end_time || a.endTime || a.end || a.endAt || '00:00');
        if (!s || !e) return null;
        let start = new Date(`${aDate}T${s}`);
        let end = new Date(`${aDate}T${e}`);
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }
        return { start, end, type: (a.type || a.availability_type || a.status || '').toString() };
      };

      const empAvailRanges = empAvails.map(parseAvailRange).filter(Boolean);
      const hasAvailData = empAvailRanges.length > 0;

      if (!hasAvailData) {
        shiftTypes.forEach(t => { 
          const isPast = isShiftTypeInPast(t, formData.date);
          map[String(t.id)] = !isPast; // Solo disponible si no ha pasado
          reasonsMap[String(t.id)] = isPast ? 'Este horario ya pasó' : 'SIN_REGISTROS';
        });
        // marcar que no hay registros de disponibilidad para este empleado en esta fecha
        map._hasAvail = false;
      } else {
        shiftTypes.forEach(type => {
          // Verificar primero si el tipo ya pasó
          const isPast = isShiftTypeInPast(type, formData.date);
          if (isPast) {
            map[String(type.id)] = false;
            reasonsMap[String(type.id)] = 'Este horario ya pasó';
            return;
          }

          const ts = type.startTime || type.start_time || type.start || '';
          const te = type.endTime || type.end_time || type.end || '';
          const start = combineDateAndTime(formData.date, ts);
          let end = combineDateAndTime(formData.date, te);
          if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);

          let available = true;
          let reason = '';

          const coveringAvailable = empAvailRanges.filter(a => 
            String(a.type).toLowerCase() === 'available' && a.start <= start && a.end >= end
          );
          
          const overlappingUnavailable = empAvailRanges.filter(a => 
            String(a.type).toLowerCase() === 'unavailable' && (start < a.end && end > a.start)
          );

          const hasExplicitAvailable = empAvailRanges.some(a => String(a.type).toLowerCase() === 'available');

          if (hasExplicitAvailable) {
            if (coveringAvailable.length === 0) {
              available = false;
              reason = `Fuera del horario disponible (${formatDisplayTime(ts)} - ${formatDisplayTime(te)})`;
            } else if (overlappingUnavailable.length > 0) {
              available = false;
              reason = `No disponible en este horario (${formatDisplayTime(ts)} - ${formatDisplayTime(te)})`;
            }
          } else {
            if (overlappingUnavailable.length > 0) {
              available = false;
              reason = `Marcado como no disponible (${formatDisplayTime(ts)} - ${formatDisplayTime(te)})`;
            }
          }

          map[String(type.id)] = Boolean(available);
          reasonsMap[String(type.id)] = reason;
          
          if (!available) {
          }
        });
      }
      // indicar que sí existen registros de disponibilidad para este empleado
      map._hasAvail = true;

      setTypeAvailabilityMap({ ...map, _reasons: reasonsMap, _hasAvail: map._hasAvail });
    } catch (err) {
      console.error('❌ Error calculando disponibilidad por tipo:', err);
      const fallback = {};
      shiftTypes.forEach(t => { 
        const isPast = isShiftTypeInPast(t, formData.date);
        fallback[String(t.id)] = !isPast;
      });
      fallback._hasAvail = false;
      fallback._reasons = {};
      setTypeAvailabilityMap(fallback);
    }
  }, [formData.employeeId, formData.date, shiftTypes, unavailabilities, employees, formData.shiftTypeId, shift]);

  // Detección de tipos por tiempo (modificada para no detectar tipos que ya pasaron)
  const detectShiftTypeByTime = useCallback((startTimeStr, endTimeStr) => {
    if (!shiftTypes.length) return null;

    const startTotalMinutes = timeStringToMinutes(startTimeStr);
    let endTotalMinutes = timeStringToMinutes(endTimeStr);

    if (isNaN(startTotalMinutes) || isNaN(endTotalMinutes)) return null;

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 1440;
    }

    let bestMatch = null;
    let bestScore = -1;

    shiftTypes.forEach(type => {
      // Saltar tipos que ya pasaron
      if (isShiftTypeInPast(type, formData.date)) {
        return;
      }

      let typeStartTotalMinutes = timeStringToMinutes(type.startTime);
      let typeEndTotalMinutes = timeStringToMinutes(type.endTime);

      if (isNaN(typeStartTotalMinutes) || isNaN(typeEndTotalMinutes)) return;

      if (typeEndTotalMinutes < typeStartTotalMinutes) {
        typeEndTotalMinutes += 1440;
      }

      let score = 0;

      if (startTotalMinutes === typeStartTotalMinutes && endTotalMinutes === typeEndTotalMinutes) {
        score = 100;
      } else if (Math.abs(startTotalMinutes - typeStartTotalMinutes) <= 30 && 
                 Math.abs(endTotalMinutes - typeEndTotalMinutes) <= 30) {
        score = 80;
      } else if (startTotalMinutes >= typeStartTotalMinutes && endTotalMinutes <= typeEndTotalMinutes) {
        score = 60;
      } else if (startTotalMinutes < typeEndTotalMinutes && endTotalMinutes > typeStartTotalMinutes) {
        score = 40;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = type;
      }
    });

    return bestMatch;
  }, [shiftTypes, formData.date]);

  useEffect(() => {
    if (formData.startTime && formData.endTime && !autoDetectedType) {
      const start = combineDateAndTime(formData.date, formData.startTime);
      const end = combineDateAndTime(formData.date, formData.endTime);
      const dur = calculateShiftDuration(start, end);
      setDuration(dur);
      
      const detectedType = detectShiftTypeByTime(formData.startTime, formData.endTime);
      if (detectedType && detectedType.id !== formData.shiftTypeId) {
        setFormData(prev => ({ ...prev, shiftTypeId: detectedType.id }));
        setAutoDetectedType(true);
      }
    }
  }, [formData.startTime, formData.endTime, formData.date, autoDetectedType, detectShiftTypeByTime, formData.shiftTypeId]);

  useEffect(() => {
    setAutoDetectedType(false);
  }, [formData.shiftTypeId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (field === 'startTime' || field === 'endTime') {
      setAutoDetectedType(false);
      if (!value) {
        setDuration(0);
      }
    }

    // Actualizar empleado seleccionado
    if (field === 'employeeId' && value) {
      const emp = employees.find(e => String(e.id) === String(value));
      setSelectedEmployee(emp || null);
    }

    // Si cambia la fecha, limpiar el tipo de turno si ya pasó
    if (field === 'date') {
      const endOfSelectedDay = createDateAtTimezone(value, '23:59');
      if (endOfSelectedDay && endOfSelectedDay < Date.now()) {
        setGeneralAlert({
          type: 'warning',
          message: 'Estás creando un turno en una fecha pasada. Solo podrás seleccionar horarios futuros.'
        });
      } else {
        setGeneralAlert(null);
      }
    }
  };

  const handleTimeChange = (field, value) => {
    handleChange(field, value);
  };

  const handleDateChange = (dateValue) => {
    if (!dateValue) return;
    handleChange('date', formatDateForInput(dateValue));
  };

  const handleDateRawInput = (event) => {
    const typedValue = event?.target?.value;
    const parsedDate = parseManualDateInput(typedValue);
    if (parsedDate) {
      handleChange('date', formatDateForInput(parsedDate));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.employeeId) {
      newErrors.employeeId = 'Selecciona un empleado';
    }
    
    if (!formData.shiftTypeId) {
      newErrors.shiftTypeId = 'Selecciona un tipo de turno';
    } else {
      const selTypeIdStr = String(formData.shiftTypeId);
      const isPast = pastShiftTypes.includes(selTypeIdStr);
      const isOriginal = shift && shift.id && originalShiftTypeId && selTypeIdStr === String(originalShiftTypeId);
      // Permitir el tipo original cuando estamos editando incluso si ya pasó
      if (isPast && !isOriginal) {
        newErrors.shiftTypeId = 'No puedes seleccionar un tipo de turno que ya pasó';
      }
    }
    
    if (!formData.date) {
      newErrors.time = 'Selecciona una fecha';
    }
    
    if (!formData.startTime) {
      newErrors.time = 'Selecciona hora de inicio';
    } else if (isTimeInPast(formData.date, formData.startTime)) {
      newErrors.time = 'La hora de inicio ya pasó';
    }
    
    if (!formData.endTime) {
      newErrors.time = 'Selecciona hora de fin';
    } else if (isTimeInPast(formData.date, formData.endTime)) {
      newErrors.time = 'La hora de fin ya pasó';
    }
    
    if (formData.startTime && formData.endTime) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;
      
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60;
      }
      
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      
      if (durationMinutes <= 0) {
        newErrors.time = 'La hora de fin debe ser posterior a la hora de inicio';
      }
      
      if (durationMinutes > 16 * 60) {
        newErrors.time = 'El turno no puede durar más de 16 horas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (formData.employeeId && formData.date && formData.startTime && formData.endTime) {
      const start = combineDateAndTime(formData.date, formData.startTime);
      const end = combineDateAndTime(formData.date, formData.endTime);
      
      const newShiftObj = {
        employeeId: formData.employeeId,
        start: start.toISOString(),
        end: end.toISOString(),
        id: shift?.id || null
      };

      const detectedConflicts = detectShiftConflicts(
        newShiftObj,
        existingShifts.filter(s => s.id !== shift?.id),
        unavailabilities
      );

      setConflicts(detectedConflicts);
    }
  }, [formData.employeeId, formData.date, formData.startTime, formData.endTime, existingShifts, unavailabilities, shift]);

  const applyShiftTypeHours = (typeId) => {
    const selectedType = shiftTypes.find(t => t.id === typeId);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        shiftTypeId: typeId,
        startTime: selectedType.startTime,
        endTime: selectedType.endTime
      }));
      setAutoDetectedType(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralAlert(null);

    // ✅ NUEVO: Validar si el turno está bloqueado
    if (isLocked) {
      setGeneralAlert({ 
        type: 'error', 
        message: 'No puedes editar este turno porque está bloqueado. ' + (lockReason || 'Turno intercambiado.')
      });
      return;
    }

    // ✅ NUEVO: Validar si el turno sería en el pasado
    if (isTimeInPast(formData.date, formData.startTime)) {
      setGeneralAlert({
        type: 'error',
        message: 'No puedes crear un turno en el pasado. La hora de inicio ya pasó.'
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (conflicts.length > 0) {
      return;
    }

    const selectedEmp = selectedEmployee || (Array.isArray(employees) ? 
      employees.find(emp => String(emp.id) === String(formData.employeeId)) : undefined);
    const selectedType = shiftTypes.find(type => type.id === formData.shiftTypeId);
    const resolvedRole = selectedEmp?.position || selectedEmp?.puesto || selectedEmp?.jobTitle || selectedEmp?.role || '';

    // Construir payload robusto para el backend:
    // - El backend espera `employee` como employee_id (PK del modelo Employee)
    // - El selector del formulario maneja user_id, por eso resolvemos ambos IDs
    const resolvedUserId = Number.isFinite(Number(formData.employeeId)) ? parseInt(formData.employeeId) : (selectedEmp?.id ? parseInt(selectedEmp.id) : undefined);
    const resolvedDbEmployeeId = selectedEmp?.employee_id ? parseInt(selectedEmp.employee_id) : undefined;

    const shiftData = {
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      // Preferir employee_id para backend; fallback a user_id si no existe mapeo
      employee: resolvedDbEmployeeId || resolvedUserId,
      shift_type: parseInt(formData.shiftTypeId),
      role: resolvedRole,
      notes: formData.notes.trim(),

      ...(shift?.id && { 
        id: shift.id,
        employeeId: shift.employeeId,
      }),

      // Campos auxiliares para uso en frontend
      employeeId: shift?.employeeId || (resolvedDbEmployeeId || undefined),
      employeeUserId: resolvedUserId,
      employeeName: selectedEmp?.name || '',
      shiftTypeId: parseInt(formData.shiftTypeId),
      shiftTypeName: selectedType?.name || '',
      backgroundColor: selectedType?.color || '#667eea'
    };

    try {
        const res = onSave ? await onSave(shiftData) : null;
        const isEditing = !!shift?.id;

        if (isEditing) {
          // En edición: cerrar modal tras actualizar
          onClose();
          return res;
        }

        // En creación: resetear formulario a estado inicial para poder crear otro turno
        setFormData({
          employeeId: '',
          shiftTypeId: '',
          date: formatDateForInput(new Date()),
          startTime: '',
          endTime: '',
          notes: ''
        });
        setErrors({});
        setConflicts([]);
        setDuration(0);
        setShowDeleteConfirm(false);
        setAutoDetectedType(false);
        setTypeAvailabilityMap({});
        setAvailabilityMessage('');
        setSelectedEmployee(null);
        setGeneralAlert({ type: 'success', message: 'Turno creado correctamente' });
        setPastShiftTypes([]);

        // dejar el modal abierto para crear otro, pero limpiar la alerta después
        setTimeout(() => setGeneralAlert(null), 3000);

        return res;
    } catch (err) {
      console.error('❌ [ShiftModal] Error en onSave:', err);

      const isEditing = !!shift?.id;
      const errorStatus = err?.response?.status;
      const errorDetail = err?.response?.data?.detail || err?.message || '';

      let userMessage = 'Error al actualizar el turno.';

      // ✅ NUEVO: Detectar error de turno bloqueado
      if (errorDetail.includes('bloqueado') || errorDetail.includes('locked') || errorDetail.includes('intercambiado')) {
        userMessage = errorDetail;
      }
      else if (isEditing && errorStatus === 500) {
        userMessage = 'No se pudo actualizar el turno. Es posible que haya sido bloqueado por una solicitud de cambio aprobada. Actualiza la página para ver los cambios.';
      }
      else if (errorStatus === 409 || /conflict|already|modified|change/i.test(errorDetail)) {
        userMessage = 'El turno ha sido modificado recientemente. Actualiza la página para ver el estado actual.';
      }
      else if (errorStatus === 400) {
        userMessage = `Error de validación: ${errorDetail || 'Datos inválidos'}`;
      }
      else if (errorDetail) {
        userMessage = errorDetail;
      }

      setGeneralAlert({ 
        type: 'error', 
        message: userMessage
      });

      setTimeout(() => {
        const alertElement = document.querySelector('.calendar-general-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
      return null;
    }
  };

  const handleDelete = () => {
    if (shift) {
      onDelete(shift.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  // ✅ MEJORA: Manejar click en tipo no disponible
  const handleTypeClick = (type) => {
    const key = String(type.id);
    // Determinar disponibilidad real para la fecha/empleado seleccionados
    let isAvailable = typeAvailabilityMap[key] !== false;
    // reason read from _reasons when needed below

    // Mensajes más amigables según la causa
    if (isAvailable) {
      // Si no hay registros del empleado, avisar primero
      if (!typeAvailabilityMap?._hasAvail) {
        setAvailabilityMessage('Empleado sin registros de disponibilidad para esta fecha');
        setTimeout(() => setAvailabilityMessage(''), 4000);
        return;
      }
      applyShiftTypeHours(type.id);
    } else {
      // Si la razón fue marcada como SIN_REGISTROS, traducir
      const raw = typeAvailabilityMap._reasons?.[key] || '';
      const pretty = raw === 'SIN_REGISTROS' ? 'Empleado sin registros de disponibilidad para esta fecha' : raw || 'No disponible';
      setAvailabilityMessage(`${type.name}: ${pretty}`);
      setTimeout(() => setAvailabilityMessage(''), 4000);
    }
  };

  if (!isOpen) return null;

  const selectedShiftType = shiftTypes.find(type => String(type.id) === String(formData.shiftTypeId));
  const deleteModalShiftTypeName =
    selectedShiftType?.name ||
    shift?.extendedProps?.shiftTypeName ||
    shift?.shiftTypeName ||
    'No especificado';
  const hasAvailabilityData = unavailabilities && unavailabilities.length > 0;
  // Determinar el tipo original asignado al turno: preferir id, sino intentar emparejar por nombre
  let originalShiftTypeId = null;
  if (shift) {
    const idCandidate = shift.extendedProps?.shiftTypeId ?? shift.shiftTypeId ?? null;
    if (idCandidate) {
      originalShiftTypeId = String(idCandidate);
    } else {
      const nameCandidate = (shift.extendedProps?.shiftTypeName ?? shift.shiftTypeName ?? shift.extendedProps?.shiftType ?? shift.shiftType ?? '').toString().trim();
      if (nameCandidate && Array.isArray(shiftTypes)) {
        const match = shiftTypes.find(t => (t.name || '').toString().trim() === nameCandidate);
        if (match) originalShiftTypeId = String(match.id);
      }
    }
  }

  // Filtrar tipos de turno: en modo creación ocultamos los que ya pasaron,
  // pero en modo edición queremos mostrar todos los tipos (marcados como no disponibles cuando aplique)
  const availableShiftTypes = Array.isArray(shiftTypes)
    ? (shift && shift.id ? shiftTypes : shiftTypes.filter(type => !pastShiftTypes.includes(String(type.id))))
    : [];

  return (
    <div className="calendar-modal-overlay" onMouseDown={handleModalBackdropMouseDown} onClick={handleModalBackdropClick}>
      <div className="calendar-modal-content calendar-shift-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-modal-header">
          <h3>
            <FaClock className="calendar-modal-header-icon" /> {shift?.id ? 'Editar Turno' : 'Crear Turno'}
          </h3>
          <button className="calendar-btn-close-modal" onClick={onClose} aria-label="Cerrar modal">
            <span className="calendar-close-x" aria-hidden="true">X</span>
          </button>
        </div>

        {isLocked && (
          <div className="calendar-locked-warning">
            <FaLock className="calendar-lock-icon" />
            <div className="calendar-lock-message">
              <strong>Turno bloqueado para edición</strong>
              <p>{lockReason || 'Este turno fue intercambiado y no puede ser modificado'}</p>
            </div>
          </div>
        )}
        

        <form onSubmit={handleSubmit} className="calendar-shift-form">
          {generalAlert && (
            <div className={`calendar-general-alert calendar-general-alert-${generalAlert.type || 'error'}`} role="alert">
              {generalAlert.message}
            </div>
          )}
          {/* DROPDOWN DE EMPLEADOS */}
          <div className="calendar-form-group">
            <label htmlFor="employeeId">
              <FaUser className="calendar-label-icon" /> Empleado *
            </label>
            <select
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              className={errors.employeeId ? 'calendar-input-error' : ''}
              disabled={!employees || employees.length === 0}
            >
              <option value="">
                {!employees || employees.length === 0 
                  ? 'Cargando empleados...' 
                  : 'Seleccionar empleado...'
                }
              </option>
              {Array.isArray(employees) && employees.map(emp => {
                const employeeId = String(emp.id || '');
                const employeeName = emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Sin nombre';
                const employeePosition = emp.position || emp.puesto || emp.jobTitle || emp.role || 'Sin puesto';
                
                return (
                  <option key={employeeId} value={employeeId}>
                    {employeeName} - {employeePosition}
                  </option>
                );
              })}
            </select>
            {!employees || employees.length === 0 ? (
              <div className="calendar-warning-message">
                No hay empleados disponibles. Verifica que estén cargados en el sistema.
              </div>
            ) : null}
            {errors.employeeId && <span className="calendar-error-message">{errors.employeeId}</span>}
          </div>

          {/* TIPO DE TURNO CON DISPONIBILIDAD */}
          <div className="calendar-form-group">
            <label htmlFor="shiftTypeId">
              <FaClock className="calendar-label-icon" /> Tipo de Turno *
              {formData.employeeId && hasAvailabilityData && (
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}>
                  <FaInfoCircle style={{ marginRight: '4px' }} />
                  Basado en disponibilidad del empleado
                </span>
              )}
              {!shift?.id && pastShiftTypes.length > 0 && (
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#dc2626', fontWeight: 'normal' }}>
                  ({pastShiftTypes.length} tipo(s) oculto(s) porque ya pasaron)
                </span>
              )}
            </label>
            <div className="calendar-shift-type-selector">
              {availableShiftTypes.map(type => {
                const key = String(type.id);
                // Por defecto usar el mapa de disponibilidad calculado
                let isAvailable = typeAvailabilityMap[key] !== false;
                const reason = typeAvailabilityMap._reasons?.[key] || '';
                
                return (
                  <div
                    key={type.id}
                    className={`calendar-shift-type-option ${
                      formData.shiftTypeId === type.id ? 'calendar-shift-type-selected' : ''
                    } ${!isAvailable ? 'calendar-shift-type-unavailable' : ''}`}
                    onClick={() => handleTypeClick(type)}
                    data-reason={reason}
                    role="button"
                    tabIndex={0}
                    aria-disabled={!isAvailable}
                      aria-label={`${type.name} ${getTypeTimeWindow(type)} ${!isAvailable ? 'No disponible' : ''}`}
                  >
                    <div className="calendar-type-color-dot" style={{ backgroundColor: type.color }}></div>
                    <div className="calendar-type-option-info">
                      <span className="calendar-type-name">{type.name}</span>
                        <span className="calendar-type-hours">{getTypeTimeWindow(type)}</span>
                    </div>
                      {!isAvailable && <span className="calendar-type-unavailable-badge">No disponible</span>}
                      {isAvailable && !typeAvailabilityMap?._hasAvail && (
                        <span className="calendar-type-unavailable-badge">Sin registros</span>
                      )}
                    {formData.shiftTypeId === type.id && <FaCheck className="calendar-check-icon" />}
                  </div>
                );
              })}
              {!shift?.id && availableShiftTypes.length === 0 && (
                <div className="calendar-no-types-available">
                  <FaExclamationTriangle />
                  <p>No hay tipos de turno disponibles para esta fecha/hora</p>
                  <p className="calendar-no-types-subtext">Todos los tipos de turno ya han pasado según la hora actual (UTC-05:00)</p>
                </div>
              )}
            </div>
            {errors.shiftTypeId && <span className="calendar-error-message">{errors.shiftTypeId}</span>}
            {availabilityMessage && (
              <div className="calendar-availability-message" role="alert">
                {availabilityMessage}
              </div>
            )}
            {formData.employeeId && !hasAvailabilityData && (
              <div className="calendar-no-availability-info">
                No hay registros de disponibilidad para este empleado. Todos los tipos están disponibles.
              </div>
            )}
          </div>

          {/* FECHA Y HORAS */}
          <div className="calendar-form-row">
            <div className="calendar-form-group">
              <label htmlFor="date">Fecha *</label>
              <div className="calendar-date-picker-wrapper">
                <DatePicker
                  id="date"
                  selected={selectedDateObject}
                  onChange={handleDateChange}
                  onChangeRaw={handleDateRawInput}
                  className={`calendar-date-picker-input ${errors.time ? 'calendar-input-error' : ''}`}
                  dateFormat="dd/MM/yyyy"
                  locale={es}
                  placeholderText="dd/MM/yyyy"
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  autoComplete="off"
                  shouldCloseOnSelect={true}
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                  }) => (
                    <div className="calendar-datepicker-header">
                      <button
                        type="button"
                        className="calendar-datepicker-nav"
                        onClick={decreaseMonth}
                        aria-label="Mes anterior"
                      >
                        <span className="calendar-datepicker-nav-arrow" aria-hidden="true">‹</span>
                      </button>
                      <span className="calendar-datepicker-current-month">
                        {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        className="calendar-datepicker-nav"
                        onClick={increaseMonth}
                        aria-label="Mes siguiente"
                      >
                        <span className="calendar-datepicker-nav-arrow" aria-hidden="true">›</span>
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="calendar-form-group">
              <label htmlFor="startTime">Hora Inicio *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className={errors.time ? 'calendar-input-error' : ''}
                  disabled={isTimeInPast(formData.date, formData.startTime) && !shift?.id}
                  style={{ color: 'transparent' }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>{formatDisplayTime(formData.startTime)}</span>
              </div>
              {isTimeInPast(formData.date, formData.startTime) && !shift?.id && (
                <div className="calendar-past-time-warning">
                  Esta hora ya pasó
                </div>
              )}
            </div>

            <div className="calendar-form-group">
              <label htmlFor="endTime">Hora Fin *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className={errors.time ? 'calendar-input-error' : ''}
                  disabled={isTimeInPast(formData.date, formData.endTime) && !shift?.id}
                  style={{ color: 'transparent' }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>{formatDisplayTime(formData.endTime)}</span>
              </div>
              {isTimeInPast(formData.date, formData.endTime) && !shift?.id && (
                <div className="calendar-past-time-warning">
                  Esta hora ya pasó
                </div>
              )}
            </div>
          </div>

          {/* DURACIÓN */}
          {duration > 0 && (
            <div className="calendar-duration-info">
              <FaClock className="calendar-duration-icon" aria-hidden="true" />
              <span>Duración: {duration} horas</span>
              {autoDetectedType && selectedShiftType && (
                <span className="calendar-auto-detected-badge">
                  (Tipo detectado: {selectedShiftType.name})
                </span>
              )}
            </div>
          )}

          {errors.time && <span className="calendar-error-message">{errors.time}</span>}

          {/* NOTAS */}
          <div className="calendar-form-group">
            <label htmlFor="notes">Notas (Opcional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre este turno..."
              rows="3"
            />
            <div className="calendar-char-count">
              {formData.notes.length} caracteres
            </div>
          </div>

          {/* CONFLICTOS */}
          {conflicts.length > 0 && (
            <div className="calendar-conflict-alert">
              <div className="calendar-alert-header">
                <FaExclamationTriangle className="calendar-alert-icon" aria-hidden="true" />
                <strong>Conflictos Detectados</strong>
              </div>
              <ul className="calendar-conflict-list">
                {conflicts.map((conflict, idx) => (
                  <li key={idx}>{conflict.message}</li>
                ))}
              </ul>
              <p className="calendar-conflict-note">
                El turno no puede crearse con estos conflictos. Ajusta la información.
              </p>
            </div>
          )}

          {/* RESUMEN */}
          {selectedEmployee && selectedShiftType && (
            <div className="calendar-shift-summary">
              <h4>Resumen del Turno</h4>
              <div className="calendar-summary-grid">
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Empleado:</span>
                  <span className="calendar-summary-value">{selectedEmployee.name}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Tipo:</span>
                  <span className="calendar-summary-value">
                    <span className="calendar-summary-color-dot" style={{ backgroundColor: selectedShiftType.color }}></span>
                    {selectedShiftType.name}
                  </span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Fecha:</span>
                  <span className="calendar-summary-value">{formatDateDisplay(formData.date)}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Horario:</span>
                  <span className="calendar-summary-value">{formatDisplayTime(formData.startTime)} - {formatDisplayTime(formData.endTime)}</span>
                </div>
                <div className="calendar-summary-item">
                  <span className="calendar-summary-label">Puesto:</span>
                  <span className="calendar-summary-value">{selectedEmployee?.position || selectedEmployee?.puesto || selectedEmployee?.jobTitle || selectedEmployee?.role || 'Sin especificar'}</span>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="calendar-modal-footer">
            {shift && (
              <button 
                type="button" 
                className="calendar-btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <FaTrash /> Eliminar Turno
              </button>
            )}
            <div className="calendar-footer-actions">
              <button type="button" className="calendar-btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="calendar-btn-primary" 
                disabled={isLocked || (pastShiftTypes.includes(String(formData.shiftTypeId)) && !(shift && shift.id && String(formData.shiftTypeId) === String(originalShiftTypeId)))}
                >
                <FaSave /> {shift?.id ? 'Actualizar' : 'Crear'} Turno
              </button>
            </div>
          </div>
        </form>

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {showDeleteConfirm && (
          <div className="calendar-delete-modal-overlay" onMouseDown={handleDeleteBackdropMouseDown} onClick={handleDeleteBackdropClick}>
            <div className="calendar-delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="calendar-delete-modal-header">
                <h3 className="calendar-delete-modal-header-title">
                  <FaTrash className="calendar-delete-modal-header-icon" /> Eliminar Turno
                </h3>
                <button className="calendar-delete-modal-close" onClick={() => setShowDeleteConfirm(false)} aria-label="Cerrar confirmación de eliminación">
                  <span className="calendar-delete-modal-close-x" aria-hidden="true">X</span>
                </button>
              </div>
              <div className="calendar-delete-modal-content">
                <div className="calendar-delete-warning">
                  <p className="calendar-delete-modal-message">
                    ¿Estás seguro de que deseas eliminar este turno?
                  </p>
                  <div className="calendar-delete-modal-details">
                    <p><strong>Empleado:</strong> {selectedEmployee?.name || 'Desconocido'}</p>
                    <p><strong>Fecha:</strong> {formatDateDisplay(formData.date)}</p>
                    <p><strong>Horario:</strong> {formatDisplayTime(formData.startTime)} - {formatDisplayTime(formData.endTime)}</p>
                    <p><strong>Tipo:</strong> {deleteModalShiftTypeName}</p>
                  </div>
                  <p className="calendar-delete-modal-warning">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <div className="calendar-delete-modal-actions">
                <button className="calendar-delete-modal-btn calendar-delete-modal-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </button>
                <button className="calendar-delete-modal-btn calendar-delete-modal-btn-confirm" onClick={handleDelete}>
                  <FaTrash /> Eliminar Turno
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftModal;
