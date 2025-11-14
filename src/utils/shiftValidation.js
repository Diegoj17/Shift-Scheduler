import { formatTime } from './dateUtils';

/**
 * Valida si un turno se solapa con otro
 */
export const checkShiftOverlap = (shift1, shift2) => {
  const start1 = new Date(shift1.start);
  const end1 = new Date(shift1.end);
  const start2 = new Date(shift2.start);
  const end2 = new Date(shift2.end);

  return (start1 < end2 && end1 > start2);
};

/**
 * Valida si un empleado está disponible en un rango de tiempo
 */
export const checkEmployeeAvailability = (employeeId, start, end, unavailabilities) => {
  if (!unavailabilities || unavailabilities.length === 0) return true;

  const shiftStart = new Date(start);
  const shiftEnd = new Date(end);

  return !unavailabilities.some(unavail => {
    if (unavail.employeeId !== employeeId) return false;
    const unavailStart = new Date(unavail.start);
    const unavailEnd = new Date(unavail.end);
    return shiftStart < unavailEnd && shiftEnd > unavailStart;
  });
};

/**
 * Detecta conflictos al crear/modificar un turno
 */
export const detectShiftConflicts = (newShift, existingShifts, unavailabilities, excludeShiftId = null) => {
  const conflicts = [];

  // Guardar defensivamente los parámetros esperados
  if (!newShift || !newShift.employeeId || !newShift.start || !newShift.end) return conflicts;

  // Asegurarnos de que existingShifts es un arreglo antes de usar .filter
  const shiftsArray = Array.isArray(existingShifts) ? existingShifts : [];

  // Verificar solapamiento con otros turnos del mismo empleado
  const employeeShifts = shiftsArray.filter(
    shift => shift.employeeId === newShift.employeeId && shift.id !== excludeShiftId
  );

  employeeShifts.forEach(shift => {
    if (checkShiftOverlap(newShift, shift)) {
      conflicts.push({
        type: 'overlap',
        message: `El empleado ya tiene un turno asignado de ${formatTime(shift.start)} a ${formatTime(shift.end)}`,
        conflictingShift: shift
      });
    }
  });

  // Verificar disponibilidad del empleado
  if (!checkEmployeeAvailability(newShift.employeeId, newShift.start, newShift.end, unavailabilities)) {
    conflicts.push({
      type: 'unavailable',
      message: `El empleado no está disponible en este horario`,
    });
  }

  return conflicts;
};

/**
 * Detecta si un horario cruza medianoche (turno nocturno)
 */
export const isOvernightShift = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return end < start; // Si end es menor que start, cruza medianoche
};

/**
 * Valida el rango horario de un tipo de turno (SOPORTA TURNOS NOCTURNOS)
 */
export const validateShiftTypeRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { valid: false, message: 'Las horas de inicio y fin son requeridas' };
  }

  // ✅ CORREGIDO: Soporte para turnos nocturnos
  const isOvernight = isOvernightShift(startTime, endTime);
  
  if (isOvernight) {
    // Para turnos nocturnos: calcular duración considerando que termina al día siguiente
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-02T${endTime}`); // +1 día para el horario de fin
    
    const diffMs = end - start;
    const durationHours = diffMs / (1000 * 60 * 60);
    
    // Exigir exactamente 8 horas (permitir pequeña tolerancia por coma flotante)
    if (Math.abs(durationHours - 8) > 0.01) {
      return { 
        valid: false, 
        message: 'La duración del tipo de turno nocturno debe ser exactamente 8 horas' 
      };
    }
    
    return { 
      valid: true, 
      crossesMidnight: true,
      duration: durationHours,
      message: 'Turno nocturno válido'
    };
  } else {
    // Para turnos diurnos (mismo día)
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (start >= end) {
      return { 
        valid: false, 
        message: 'La hora de fin debe ser mayor a la hora de inicio para turnos diurnos' 
      };
    }
    
    const diffMs = end - start;
    const durationHours = diffMs / (1000 * 60 * 60);
    
    // Exigir exactamente 8 horas (permitir pequeña tolerancia por coma flotante)
    if (Math.abs(durationHours - 8) > 0.01) {
      return { 
        valid: false, 
        message: 'La duración del tipo de turno debe ser exactamente 8 horas' 
      };
    }
    
    return { 
      valid: true, 
      crossesMidnight: false,
      duration: durationHours,
      message: 'Turno diurno válido'
    };
  }
};

/**
 * Valida duplicación de nombre de tipo de turno
 */
export const validateShiftTypeName = (name, existingTypes, excludeId = null) => {
  const duplicate = existingTypes.find(
    type => type.name.toLowerCase() === name.toLowerCase() && type.id !== excludeId
  );
  
  if (duplicate) {
    return { valid: false, message: 'Ya existe un tipo de turno con este nombre' };
  }
  
  return { valid: true };
};

/**
 * Detecta conflictos al duplicar turnos
 */
export const detectDuplicationConflicts = (shiftsToClone, targetDate, existingShifts, unavailabilities) => {
  const conflicts = [];
  const validShifts = [];

  shiftsToClone.forEach(shift => {
    const dayDiff = targetDate.getDate() - new Date(shift.start).getDate();
    const newStart = new Date(shift.start);
    newStart.setDate(newStart.getDate() + dayDiff);
    const newEnd = new Date(shift.end);
    newEnd.setDate(newEnd.getDate() + dayDiff);

    const newShift = {
      ...shift,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      id: null // Nuevo turno
    };

    const shiftConflicts = detectShiftConflicts(newShift, existingShifts, unavailabilities);

    if (shiftConflicts.length > 0) {
      conflicts.push({
        originalShift: shift,
        newShift,
        conflicts: shiftConflicts
      });
    } else {
      validShifts.push(newShift);
    }
  });

  return { conflicts, validShifts };
};

// Usamos formatTime exportado desde dateUtils (12h AM/PM)

/**
 * Calcula duración del turno en horas (SOPORTA TURNOS NOCTURNOS)
 */
export const calculateShiftDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Si el turno termina antes de empezar, asumimos que cruza medianoche
  if (endDate < startDate) {
    const endNextDay = new Date(endDate);
    endNextDay.setDate(endNextDay.getDate() + 1);
    const diffMs = endNextDay - startDate;
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  }
  
  const diffMs = endDate - startDate;
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
};

/**
 * Valida que los datos del turno sean completos (SOPORTA TURNOS NOCTURNOS)
 */
export const validateShiftData = (shiftData) => {
  const errors = [];

  if (!shiftData.employeeId) {
    errors.push('Debe seleccionar un empleado');
  }

  if (!shiftData.shiftTypeId) {
    errors.push('Debe seleccionar un tipo de turno');
  }

  if (!shiftData.start || !shiftData.end) {
    errors.push('Debe especificar fecha y hora de inicio y fin');
  }

  if (shiftData.start && shiftData.end) {
    const start = new Date(shiftData.start);
    const end = new Date(shiftData.end);
    
    // ✅ CORREGIDO: Permitir turnos nocturnos (end < start)
    const isOvernight = end < start;
    
    if (!isOvernight && end <= start) {
      errors.push('La hora de fin debe ser posterior a la hora de inicio para turnos diurnos');
    }
    
    // Validar duración máxima (24 horas como límite razonable)
    const duration = calculateShiftDuration(start, end);
    if (duration > 24) {
      errors.push('La duración del turno no puede exceder las 24 horas');
    }
  }

  if (!shiftData.role || shiftData.role.trim() === '') {
    errors.push('Debe especificar el rol en el turno');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Obtiene información sobre el tipo de turno (diurno/nocturno)
 */
export const getShiftTypeInfo = (startTime, endTime) => {
  const isOvernight = isOvernightShift(startTime, endTime);
  const validation = validateShiftTypeRange(startTime, endTime);
  
  return {
    isOvernight,
    duration: validation.duration || 0,
    valid: validation.valid,
    message: validation.message
  };
};

export default {
  checkShiftOverlap,
  checkEmployeeAvailability,
  detectShiftConflicts,
  validateShiftTypeRange,
  validateShiftTypeName,
  detectDuplicationConflicts,
  calculateShiftDuration,
  validateShiftData,
  isOvernightShift,
  getShiftTypeInfo
};