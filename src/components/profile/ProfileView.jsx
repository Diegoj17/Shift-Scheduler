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
import { useAuth } from "/src/hooks/useAuth.js"
import ProfileLayout from "./layout/ProfileLayout"
import "../../styles/components/profile/ProfileView.css"

const ProfileView = () => {
  const navigate = useNavigate()
  const { currentUser: user } = useAuth()

  // Datos del perfil (vienen del contexto)
  const userProfile = user || {
    firstName: "Admin",
    lastName: "Usuario",
    email: "admin@shiftscheduler.com",
    phone: "+57 300 123 4567",
    position: "Supervisor",
    department: "Gestión de Turnos",
    location: "Cúcuta, Colombia",
    employeeId: "EMP-2024-001",
    joinDate: "15 de Enero, 2024",
    workSchedule: "Lunes a Viernes, 8:00 AM - 5:00 PM",
    avatar: "AD",
  }

  const handleEditProfile = () => {
    navigate("/edit-profile")
  }

  return (
    <ProfileLayout pageTitle="Mi Perfil">
      <div className="profile-view-container">
        <div className="profile-view-header">
          <div className="header-content">
            <h1>Mi Perfil</h1>
            <p>Información personal y detalles de tu cuenta</p>
          </div>
          <button className="edit-profile-btn" onClick={handleEditProfile}>
            <FaEdit />
            <span>Editar Perfil</span>
          </button>
        </div>

        <div className="profile-view-content">
          {/* Card Principal con Avatar */}
          <div className="profile-main-card">
            <div className="profile-banner"></div>
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">{userProfile.avatar}</div>
              <div className="profile-name-section">
                <h2>
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <p className="profile-position">{userProfile.position}</p>
                <span className="profile-badge">{userProfile.department}</span>
              </div>
            </div>
          </div>

          {/* Grid de Información */}
          <div className="profile-info-grid">
            {/* Información Personal */}
            <div className="info-card">
              <div className="info-card-header">
                <FaUser className="card-icon" />
                <h3>Información Personal</h3>
              </div>
              <div className="info-card-content">
                <div className="info-row">
                  <div className="info-label">
                    <FaEnvelope className="info-icon" />
                    <span>Email</span>
                  </div>
                  <div className="info-value">{userProfile.email}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <FaPhone className="info-icon" />
                    <span>Teléfono</span>
                  </div>
                  <div className="info-value">{userProfile.phone}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <FaMapMarkerAlt className="info-icon" />
                    <span>Ubicación</span>
                  </div>
                  <div className="info-value">{userProfile.location}</div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="info-card">
              <div className="info-card-header">
                <FaBriefcase className="card-icon" />
                <h3>Información Laboral</h3>
              </div>
              <div className="info-card-content">
                <div className="info-row">
                  <div className="info-label">
                    <FaIdBadge className="info-icon" />
                    <span>ID Empleado</span>
                  </div>
                  <div className="info-value">{userProfile.employeeId}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <FaBriefcase className="info-icon" />
                    <span>Cargo</span>
                  </div>
                  <div className="info-value">{userProfile.position}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <FaCalendarAlt className="info-icon" />
                    <span>Fecha de Ingreso</span>
                  </div>
                  <div className="info-value">{userProfile.joinDate}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <FaClock className="info-icon" />
                    <span>Horario</span>
                  </div>
                  <div className="info-value">{userProfile.workSchedule}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-icon blue">
                <FaClock />
              </div>
              <div className="stat-content">
                <h4>156</h4>
                <p>Turnos Completados</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <FaCalendarAlt />
              </div>
              <div className="stat-content">
                <h4>98%</h4>
                <p>Asistencia</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">
                <FaBriefcase />
              </div>
              <div className="stat-content">
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
