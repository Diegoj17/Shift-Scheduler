import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaCamera
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProfileLayout from './layout/ProfileLayout';
import '../../styles/components/profile/EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || 'Admin',
    lastName: user?.lastName || 'Usuario',
    email: user?.email || 'admin@shiftscheduler.com',
    phone: user?.phone || '+57 300 123 4567',
    location: user?.location || 'Cúcuta, Colombia',
    bio: user?.bio || 'Supervisor con 8 meses de experiencia en gestión de turnos y coordinación de equipos.'
  });

  // Cuando el usuario se carga desde el contexto/backend, actualizar el formulario
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        firstName: user.first_name || user.firstName || prev.firstName,
        lastName: user.last_name || user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.telefono || user.phone || prev.phone,
        location: user.location || prev.location,
        bio: user.bio || prev.bio
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    // Actualizar perfil usando el contexto
    const result = await updateProfile(formData);
    
    setIsSaving(false);
    
    if (result.success) {
      console.log('Perfil actualizado exitosamente');
      navigate('/profile');
    } else {
      console.error('Error al actualizar perfil:', result.error);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <ProfileLayout pageTitle="Editar Perfil">
      <div className="profile-edit-container">
        <div className="profile-edit-header">
          <div className="profile-edit-header-content">
            <p>Actualiza tu información personal</p>
          </div>
        </div>

        <form className="profile-edit-form" onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="profile-form-section profile-avatar-section">
            <div className="profile-avatar-upload">
              <div className="profile-avatar-preview">AD</div>
              <button type="button" className="profile-avatar-upload-btn">
                <FaCamera />
                <span>Cambiar Foto</span>
              </button>
            </div>
          </div>

          {/* Columnas: Información Personal (izquierda) y Contacto (derecha) */}
          <div className="profile-form-columns">
            {/* Información Personal */}
            <div className="profile-form-section">
              <div className="profile-section-header">
                <FaUser className="profile-section-icon" />
                <h3>Información Personal</h3>
              </div>

              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label htmlFor="firstName">
                    Nombre <span className="profile-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Tu nombre"
                  />
                  {errors.firstName && (
                    <span className="profile-error-message">{errors.firstName}</span>
                  )}
                </div>

                <div className="profile-form-group">
                  <label htmlFor="lastName">
                    Apellido <span className="profile-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Tu apellido"
                  />
                  {errors.lastName && (
                    <span className="profile-error-message">{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="bio">
                  Biografía
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="profile-form-section">
              <div className="profile-section-header">
                <FaEnvelope className="profile-section-icon" />
                <h3>Información de Contacto</h3>
              </div>

              <div className="profile-form-group">
                <label htmlFor="email">
                  Email <span className="profile-required">*</span>
                </label>
                <div className="profile-input-with-icon">
                  <FaEnvelope className="profile-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && (
                  <span className="profile-error-message">{errors.email}</span>
                )}
              </div>

              <div className="profile-form-group">
                <label htmlFor="phone">
                  Teléfono <span className="profile-required">*</span>
                </label>
                <div className="profile-input-with-icon">
                  <FaPhone className="profile-input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                {errors.phone && (
                  <span className="profile-error-message">{errors.phone}</span>
                )}
              </div>

              <div className="profile-form-group">
                <label htmlFor="location">
                  Ubicación
                </label>
                <div className="profile-input-with-icon">
                  <FaMapMarkerAlt className="profile-input-icon" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ciudad, País"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="profile-form-actions">
            <button 
              type="button" 
              className="profile-btn-cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <FaTimes />
              <span>Cancelar</span>
            </button>
            <button 
              type="submit" 
              className="profile-btn-save"
              disabled={isSaving}
            >
              <FaSave />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </ProfileLayout>
  );
};

export default EditProfile;