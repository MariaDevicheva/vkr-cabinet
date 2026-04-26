// src/components/LoginScreen.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import gerb from '../assets/images/gerb.png';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  // Быстрый вход для демо
  const demoLogin = (type) => {
    if (type === 'teacher') {
      setEmail('ramenskaya.a.v@edu.mirea.ru');
      setPassword('PrepodMirea');
    } else {
      setEmail('amirmetov.r.i@edu.mirea.ru');
      setPassword('StudentMirea');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        
        {/* Герб университета */}
        <div className="flex justify-center mb-4">
          <img 
            src={gerb} 
            alt="Герб университета" 
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Заголовок */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Запись на ВКР
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Войдите в личный кабинет
        </p>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Поле Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200"
              placeholder="ivanov@edu.mirea.ru"
              required
              disabled={isLoading}
            />
          </div>

          {/* Поле Пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-200"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {/* Ошибка */}
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Кнопка Входа */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Вход...' : 'Вход'}
          </button>

          {/* Ссылка Забыли пароль */}
          <div className="text-center">
            <a 
              href="#" 
              className="text-sm text-indigo-600 hover:text-indigo-800 transition"
              onClick={(e) => {
                e.preventDefault();
                alert('Функция восстановления пароля будет доступна позже');
              }}
            >
              Забыли пароль?
            </a>
          </div>
        </form>

        {/* Демо-аккаунты */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <p className="text-xs text-center text-gray-400 mb-3">
            Демо-аккаунты (нажмите для автозаполнения):
          </p>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => demoLogin('student')}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium py-2 px-3 rounded-lg transition"
            >
              👨‍🎓 Студент
            </button>
            <button 
              type="button"
              onClick={() => demoLogin('teacher')}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium py-2 px-3 rounded-lg transition"
            >
              👩‍🏫 Преподаватель
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 mt-3">
            Система автоматически определит вашу роль по email
          </p>
        </div>

      </div>
    </div>
  );
}

export default LoginScreen;