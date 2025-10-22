import { userAPI } from '../api/Axios'; 

export const userService = {
  // Obtener usuarios desde la API
  getUsers: async () => {
    try {
      const data = await userAPI.getUsers();

      let usersArray = [];

      if (!data) {
        usersArray = [];
      } else if (Array.isArray(data)) {
        usersArray = data;
      } else if (data.users && Array.isArray(data.users)) {
        usersArray = data.users;
      } else if (data.results && Array.isArray(data.results)) {
        usersArray = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        usersArray = data.data;
      } else if (data.data && Array.isArray(data.data.results)) {
        usersArray = data.data.results;
      } else if (data.items && Array.isArray(data.items)) {
        usersArray = data.items;
      } else {
        // Intentar encontrar el primer array dentro del objeto
        const firstArray = Object.values(data).find(v => Array.isArray(v));
        usersArray = firstArray || [];
      }

      return usersArray.map(user => {
        const id = user.id ?? user.pk ?? user.user_id ?? null;
        const firstName = user.first_name || user.firstName || user.name?.split?.(' ')?.[0] || '';
        const lastName = user.last_name || user.lastName || '';
        const email = user.email || user.user?.email || '';
        const telefono = user.telefono || user.phone || '';
        const role = user.role || user.user?.role || 'EMPLEADO';

        return {
          id,
          name: ((firstName || lastName) ? `${firstName} ${lastName}`.trim() : (user.name || user.username || email)),
          firstName,
          lastName,
          email,
          phone: telefono,
          department: userService.mapRoleToDepartment(role),
          position: userService.mapRoleToPosition(role),
          employeeId: user.employee_id || user.employeeId || (id ? `EMP${String(id).padStart(3, '0')}` : ''),
          hireDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : (user.hireDate || user.hired_at || new Date().toISOString().split('T')[0]),
          status: userService.mapStatus(user.status || user.state || 'ACTIVE'),
          role,
          avatar: user.avatar || `/img/avatars/default.jpg`
        };
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Crear usuario
  createUser: async (userData) => {
    try {
      const apiData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        telefono: userData.phone,
        password: userData.password,
        password_confirm: userData.passwordConfirm,
        role: userData.role || 'EMPLEADO',
        status: 'ACTIVE'
      };

      const response = await userAPI.createUser(apiData);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      // Mejorar el manejo de errores
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

updateUser: async (userId, userData) => {
  try {
    
    const apiData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      telefono: userData.phone,
      role: userData.role,
      status: userService.mapStatusToAPI(userData.status)
    };

    const response = await userAPI.updateUser(userId, apiData);
    return response;
  } catch (error) {
    console.error('❌ Error updating user:', error);
    if (error.response?.data) {
      throw error.response.data;
    }
    throw error;
  }
},

  // Eliminar usuario
  deleteUser: async (userId) => {
    try {
      const response = await userAPI.deleteUser(userId);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  

  toggleUserStatus: async (userId, statusOrTarget) => {
    try {
      let targetFrontendStatus = 'active';

      // Si recibimos la acción objetivo ('blocked' o 'active' o 'inactive'), la usamos
      if (typeof statusOrTarget === 'string') {
        const s = statusOrTarget.toLowerCase();
        if (s === 'blocked' || s === 'active' || s === 'inactive') {
          targetFrontendStatus = s;
        } else {
          // Si recibimos el estado actual ('active'/'inactive'), invertimos
          targetFrontendStatus = s === 'active' ? 'inactive' : 'active';
        }
      }

      // Mapear al formato de la API
      const apiStatus = userService.mapStatusToAPI(targetFrontendStatus);
      const response = await userAPI.updateUserStatus(userId, apiStatus);
      return response;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Mapeos entre frontend y backend
  mapRoleToDepartment: (role) => {
    const roleMap = {
      'ADMIN': 'Administración',
      'GERENTE': 'Administración',
      'EMPLEADO': 'TI',
      'SUPERVISOR': 'Recursos Humanos'
    };
    return roleMap[role] || 'TI';
  },

  mapRoleToPosition: (role) => {
    const positionMap = {
      'ADMIN': 'Administrador',
      'GERENTE': 'Gerente',
      'EMPLEADO': 'Desarrollador',
      'SUPERVISOR': 'Supervisor'
    };
    return positionMap[role] || 'Empleado';
  },

  mapStatus: (apiStatus) => {
    const statusMap = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive',
      'BLOCKED': 'blocked'
    };
    return statusMap[apiStatus] || 'active';
  },

  mapStatusToAPI: (frontendStatus) => {
    const statusMap = {
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'blocked': 'BLOCKED'
    };
    return statusMap[frontendStatus] || 'ACTIVE';
  },

  // Datos estáticos para selects

  getRoles: () => [
    'ADMIN', 'GERENTE', 'SUPERVISOR', 'EMPLEADO'
  ]
};