import { AuthProvider, useAuth } from './context/AuthContext';
import TeacherCabinet from './TeacherCabinet';
import StudentCabinet from './StudentCabinet';
import LoginScreen from './components/LoginScreen';

function AppContent() {
  const { user, profile, userType, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121218]">
        <div className="text-white text-center">
          <div className="w-10 h-10 border-4 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (userType === 'teacher') {
    return <TeacherCabinet user={user} profile={profile} onLogout={logout} />;
  }

  if (userType === 'student') {
    return <StudentCabinet user={user} profile={profile} onLogout={logout} />;
  }

  return <LoginScreen />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;