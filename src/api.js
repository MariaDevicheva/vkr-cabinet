const API_URL = "http://127.0.0.1:8000/api";

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Ошибка входа');
    }

    // Сохраняем всё в localStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('profile', JSON.stringify(data.profile));
    
    console.log('✅ Вход выполнен:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка входа:', error.message);
    throw error;
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getCurrentProfile = () => {
  const profileStr = localStorage.getItem('profile');
  return profileStr ? JSON.parse(profileStr) : null;
};

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('profile');
};