"use client"

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaEdit,
  FaClock,
  FaIdBadge,
} from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useAuth } from '../../contexts/AuthContext'
import ProfileLayout from "./layout/ProfileLayout"
import "../../styles/components/profile/ProfileView.css"

const ProfileView = () => {
  const navigate = useNavigate()
  const { currentUser: user, loading } = useAuth()

  // Mapear los datos del usuario (soporta distintos nombres de campo que vienen del backend)
  const userProfile = user
    ? {
        firstName: user.first_name || user.firstName || user.first || 'Admin',
        lastName: user.last_name || user.lastName || user.last || 'Usuario',
        email: user.email || user.user?.email || 'admin@shiftscheduler.com',
        phone: user.telefono || user.phone || user.mobile || '+57 300 123 4567',
        position: user.position || user.role || 'Supervisor',
        department: user.department || user.dept || 'Gestión de Turnos',
        location: user.location || user.ubicacion || 'Cúcuta, Colombia',
        employeeId: user.employee_id || user.employeeId || user.id ? `EMP-${user.id}` : 'EMP-000',
        joinDate: user.join_date || user.joinDate || user.created_at || '15 de Enero, 2024',
        workSchedule: user.work_schedule || user.workSchedule || 'Lunes a Viernes, 8:00 AM - 5:00 PM',
        avatar: user.avatar || (user.first_name ? `${user.first_name[0]}${(user.last_name||'')[0]}`.toUpperCase() : 'AD')
      }
    : {
        firstName: 'Admin',
        lastName: 'Usuario',
        email: 'admin@shiftscheduler.com',
        phone: '+57 300 123 4567',
        position: 'Supervisor',
        department: 'Gestión de Turnos',
        location: 'Cúcuta, Colombia',
        employeeId: 'EMP-2024-001',
        joinDate: '15 de Enero, 2024',
        workSchedule: 'Lunes a Viernes, 8:00 AM - 5:00 PM',
        avatar: 'AD'
      }

  if (loading) {
    return (
      <ProfileLayout pageTitle="Mi Perfil">
        <div className="profile-view-container">
          <div className="profile-loading">Cargando perfil...</div>
        </div>
      </ProfileLayout>
    )
  }




  const handleEditProfile = () => {
    navigate("/edit-profile")
  }

  return (
    <ProfileLayout pageTitle="Mi Perfil">
      <div className="profile-view-container">
        <div className="profile-view-header">
          <div className="profile-view-header-content">
            <p>Información personal y detalles de tu cuenta</p>
          </div>
          <button className="profile-view-edit-btn" onClick={handleEditProfile}>
            <FaEdit />
            <span>Editar Perfil</span>
          </button>
        </div>

        <div className="profile-view-content">
          {/* Card Principal con Avatar */}
          <div className="profile-view-main-card">
            <div className="profile-view-banner"></div>
            <div className="profile-view-avatar-section">
              <div className="profile-view-avatar-large">{userProfile.avatar}</div>
              <div className="profile-view-name-section">
                <h2>
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <p className="profile-view-position">{userProfile.position}</p>
                <span className="profile-view-badge">{userProfile.department}</span>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="profile-view-info-grid">
            {/* Información Personal */}
            <div className="profile-view-info-card">
              <div className="profile-view-info-card-header">
                <FaUser className="profile-view-card-icon" />
                <h3>Información Personal</h3>
              </div>
              <div className="profile-view-info-card-content">
                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaEnvelope className="profile-view-info-icon" />
                    <span>Email</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.email}</div>
                </div>

                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaPhone className="profile-view-info-icon" />
                    <span>Teléfono</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.phone}</div>
                </div>

                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaMapMarkerAlt className="profile-view-info-icon" />
                    <span>Ubicación</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.location}</div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="profile-view-info-card">
              <div className="profile-view-info-card-header">
                <FaBriefcase className="profile-view-card-icon" />
                <h3>Información Laboral</h3>
              </div>
              <div className="profile-view-info-card-content">
                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaIdBadge className="profile-view-info-icon" />
                    <span>ID Empleado</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.employeeId}</div>
                </div>

                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaBriefcase className="profile-view-info-icon" />
                    <span>Cargo</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.position}</div>
                </div>

                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaCalendarAlt className="profile-view-info-icon" />
                    <span>Fecha de Ingreso</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.joinDate}</div>
                </div>

                <div className="profile-view-info-row">
                  <div className="profile-view-info-label">
                    <FaClock className="profile-view-info-icon" />
                    <span>Horario</span>
                  </div>
                  <div className="profile-view-info-value">{userProfile.workSchedule}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="profile-view-stats">
            <div className="profile-view-stat-card">
              <div className="profile-view-stat-icon blue">
                <FaClock />
              </div>
              <div className="profile-view-stat-content">
                <h4>156</h4>
                <p>Turnos Completados</p>
              </div>
            </div>

            <div className="profile-view-stat-card">
              <div className="profile-view-stat-icon green">
                <FaCalendarAlt />
              </div>
              <div className="profile-view-stat-content">
                <h4>98%</h4>
                <p>Asistencia</p>
              </div>
            </div>

            <div className="profile-view-stat-card">
              <div className="profile-view-stat-icon orange">
                <FaBriefcase />
              </div>
              <div className="profile-view-stat-content">
                <h4>8</h4>
                <p>Meses Activo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  )
}

export default ProfileView