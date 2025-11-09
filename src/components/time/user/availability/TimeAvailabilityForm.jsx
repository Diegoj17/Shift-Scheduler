import React, { useState, useEffect } from 'react';
import { MdListAlt, MdAdd, MdCheck, MdClose } from 'react-icons/md';
import availabilityService from '../../../../services/availabilityService';
import '../../../../styles/components/time/user/availability/TimeAvailabilityForm.css';

const TimeAvailabilityForm = ({ onSubmit, initialData = null, onUpdate, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    type: 'available',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(initialData && initialData.id);

  // Cargar datos cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || '',
        startTime: initialData.startTime || initialData.start_time || '',
        endTime: initialData.endTime || initialData.end_time || '',
        type: initialData.type || 'available',
        notes: initialData.notes || ''
      });
    } else {
      // Reset
      setFormData({ 
        date: '', 
        startTime: '', 
        endTime: '', 
        type: 'available',
        notes: '' 
      });
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La hora de inicio es requerida';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'La hora de fin es requerida';
    }

    // Validación de horas (permitir turnos nocturnos)
    if (formData.startTime && formData.endTime) {
      if (formData.startTime === formData.endTime) {
        newErrors.time = 'La hora de inicio y fin no pueden ser iguales';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const availabilityData = {
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        type: formData.type,
        notes: formData.notes
      };

      console.log('📝 [TimeAvailabilityForm] Datos a enviar:', availabilityData);

      if (isEditing) {
        // ✅ Actualizar disponibilidad existente
        const response = await availabilityService.updateAvailability(
          initialData.id, 
          availabilityData
        );
        
        console.log('✅ Disponibilidad actualizada:', response);
        
        if (onUpdate) {
          onUpdate({
            id: initialData.id,
            ...response
          });
        }
      } else {
        // ✅ Crear nueva disponibilidad
        const response = await availabilityService.createAvailability(availabilityData);
        
        console.log('✅ Disponibilidad creada:', response);
        
        if (onSubmit) {
          onSubmit(response);
        }

        // Resetear formulario después de crear
        setFormData({
          date: '',
          startTime: '',
          endTime: '',
          type: 'available',
          notes: ''
        });
      }
    } catch (error) {
      console.error('❌ Error al guardar disponibilidad:', error);
      
      // Mostrar error del backend
      const errorMessage = error.message || 'Error al guardar disponibilidad';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !initialData.id) return;

    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta disponibilidad?');
    
    if (!confirmDelete) return;

    setIsSubmitting(true);

    try {
      await availabilityService.deleteAvailability(initialData.id);
      
      console.log('✅ Disponibilidad eliminada:', initialData.id);
      
      if (onDelete) {
        onDelete(initialData.id);
      }

      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error('❌ Error al eliminar disponibilidad:', error);
      setErrors({ submit: error.message || 'Error al eliminar disponibilidad' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="time-availability-form-card">
      <div className="time-availability-form-header">
        <div className="time-availability-form-icon" aria-hidden="true">
          <MdListAlt size={25} />
        </div>
        <div>
          <h2 className="time-availability-form-title">
            {isEditing ? 'Editar Disponibilidad' : 'Registrar Disponibilidad'}
          </h2>
          <p className="time-availability-form-subtitle">
            Completa el formulario para {isEditing ? 'modificar la disponibilidad' : 'agregar un nuevo rango'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="time-availability-form">
        {/* Error general */}
        {errors.submit && (
          <div className="time-availability-form-error-alert">
            {errors.submit}
          </div>
        )}

        {/* Date Input */}
        <div className="time-availability-form-group">
          <label className="time-availability-form-label">
            Fecha
            <span className="time-availability-form-required">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`time-availability-form-input ${errors.date ? 'error' : ''}`}
            required
            min={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
          />
          {errors.date && <span className="time-availability-form-error">{errors.date}</span>}
        </div>

        {/* Time Range */}
        <div className="time-availability-form-row">
          <div className="time-availability-form-group">
            <label className="time-availability-form-label">
              Hora inicio
              <span className="time-availability-form-required">*</span>
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={`time-availability-form-input ${errors.startTime || errors.time ? 'error' : ''}`}
              required
              disabled={isSubmitting}
            />
            {errors.startTime && <span className="time-availability-form-error">{errors.startTime}</span>}
          </div>

          <div className="time-availability-form-group">
            <label className="time-availability-form-label">
              Hora fin
              <span className="time-availability-form-required">*</span>
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`time-availability-form-input ${errors.endTime || errors.time ? 'error' : ''}`}
              required
              disabled={isSubmitting}
            />
            {errors.endTime && <span className="time-availability-form-error">{errors.endTime}</span>}
          </div>
        </div>
        {errors.time && <span className="time-availability-form-error">{errors.time}</span>}

        {/* Type Selection */}
        <div className="time-availability-form-group">
          <label className="time-availability-form-label">Tipo de registro</label>
          <div className="time-availability-type-selector">
            <label className={`time-availability-type-option available-option ${formData.type === 'available' ? 'active' : ''}`}>
              <input
                type="radio"
                name="type"
                value="available"
                checked={formData.type === 'available'}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span className="time-availability-type-icon" aria-hidden="true">
                <MdCheck size={16} />
              </span>
              <span className="time-availability-type-text">Disponible</span>
            </label>

            <label className={`time-availability-type-option unavailable-option ${formData.type === 'unavailable' ? 'active' : ''}`}>
              <input
                type="radio"
                name="type"
                value="unavailable"
                checked={formData.type === 'unavailable'}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span className="time-availability-type-icon" aria-hidden="true">
                <MdClose size={16} />
              </span>
              <span className="time-availability-type-text">No disponible</span>
            </label>
          </div>
        </div>

        {/* Notes (opcional) */}
        <div className="time-availability-form-group">
          <label className="time-availability-form-label">Notas (Opcional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="time-availability-form-input"
            placeholder="Agrega notas adicionales..."
            rows="3"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="time-availability-form-actions">
          <button 
            type="submit" 
            className="time-availability-form-submit"
            disabled={isSubmitting}
          >
            <span className="time-availability-form-submit-icon" aria-hidden="true">
              {isEditing ? <MdCheck size={18} /> : <MdAdd size={18} />}
            </span>
            <span>
              {isSubmitting 
                ? 'Guardando...' 
                : isEditing 
                  ? 'Guardar cambios' 
                  : 'Registrar Disponibilidad'
              }
            </span>
          </button>

          {isEditing && (
            <div className="time-availability-form-actions-right">
              <button 
                type="button" 
                className="time-availability-form-cancel" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <span>Cancelar</span>
              </button>
              <button 
                type="button" 
                className="time-availability-form-delete" 
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TimeAvailabilityForm;