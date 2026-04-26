import { useState, useEffect, useRef } from 'react';
import { 
  getSystemData,
  getStudentApplications,
  getStudentApprovedTeacher,
  submitApplication,
  cancelApplication as cancelApplicationAPI,
  getPersonalChatMessages,
  sendPersonalMessage,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  addNotification,
  getStudentTasks,
  submitTask,
  initDemoData,
  getFullTeachersList,
  getTeachersOnlineStatus,
  getStudentGroups
} from './utils/systemStorage';

// ==================== УТИЛИТЫ ====================
const detectGender = (fullName) => {
  if (!fullName) return 'Не указан';
  const lastName = fullName.split(' ')[0].trim();
  if (lastName.endsWith('а') || lastName.endsWith('я') || 
      lastName.endsWith('ова') || lastName.endsWith('ева') || 
      lastName.endsWith('ина')) return 'Женский';
  return 'Мужской';
};

const getTaskWord = (count) => {
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 19) return 'заданий';
  if (lastDigit === 1) return 'задание';
  if (lastDigit >= 2 && lastDigit <= 4) return 'задания';
  return 'заданий';
};

// ==================== ИКОНКИ ====================

// Навигация
const HomeIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.69-8.69a2.25 2.25 0 00-3.18 0l-8.69 8.69a.75.75 0 001.06 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159a2.25 2.25 0 01.659 1.591v5.568a.75.75 0 01-.75.75h-5.25a.75.75 0 01-.75-.75v-4.5c0-.414-.336-.75-.75-.75h-3c-.414 0-.75.336-.75.75v4.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-5.568a2.25 2.25 0 01.659-1.591L12 5.432z" />
  </svg>
);

const CourseIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path d="M12 3L1 9l11 6 11-6-11-6z" />
    <path d="M1 15l11 6 11-6" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const ServicesIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm1.5 1.5h9A1.5 1.5 0 0118 6v12a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 015.5 18V6A1.5 1.5 0 017 4.5zm2 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3a.75.75 0 000 1.5h4a.75.75 0 000-1.5H9z" clipRule="evenodd" />
  </svg>
);

const ProfileIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Тема
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 hover:scale-110 transition-transform">
    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 hover:scale-110 transition-transform">
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
  </svg>
);

// Функциональные иконки
const MegaphoneIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path d="M16.881 4.345A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.402A19.52 19.52 0 0021 18.75V5.25a19.52 19.52 0 00-4.119-.905z" />
  </svg>
);

const ChartIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
  </svg>
);

const FolderIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
  </svg>
);

const TeacherIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
  </svg>
);

const ChatIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
  </svg>
);

const ForumIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
  </svg>
);

const VideoIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
  </svg>
);

const DocumentIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
    <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
  </svg>
);

const DownloadIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
  </svg>
);

const NewsIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125zM12 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H12zm-.75-2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H6zm-.75 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM6 6.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3A.75.75 0 009 6.75H6z" clipRule="evenodd" />
    <path d="M18.75 6.75h1.875c.621 0 1.125.504 1.125 1.125V18a1.5 1.5 0 01-3 0V6.75z" />
  </svg>
);

const ClockIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 mr-1 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

const ListIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0A.75.75 0 018.25 6h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75zM2.625 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 12a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12A.75.75 0 017.5 12zm-4.875 5.25a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875 0a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

const EditIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 mr-1 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
  </svg>
);

const DeleteIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zM6.12 6.164l.935 12.156A1.5 1.5 0 008.584 19.5h6.832a1.5 1.5 0 001.529-1.18l.935-12.156a49.548 49.548 0 00-11.76 0z" clipRule="evenodd" />
  </svg>
);

const SendIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
  </svg>
);

const ChevronDownIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 transition-transform ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500 mr-2">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const CircleIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" clipRule="evenodd" />
  </svg>
);

const VKRIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-12 h-12 mb-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M12 3L1 9l11 6 11-6-11-6z" />
    <path d="M1 15l11 6 11-6" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M7 11.5l5 3 5-3" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const GroupIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
  </svg>
);

// ==================== ДАННЫЕ ====================

const NEWS = [
  { id: 1, title: 'Запись на ВКР открыта!', desc: 'Период: 15 марта - 30 марта 2026', date: '15 мар. 2026 г.', important: true, tags: ['ВКР'] },
  { id: 2, title: 'Организационное собрание', desc: '10 апреля, 15:00 • Аудитория 342', date: '5 апр. 2026 г.', important: true, tags: ['ВКР'] },
  { id: 3, title: 'График защит утверждён', desc: 'Защита ВКР с 1 по 20 июня', date: '10 апр. 2026 г.', important: false, tags: ['Защита ВКР'] },
];

const COURSE_ANNOUNCEMENTS = [
  { id: 1, title: 'Запись на ВКР открыта!', desc: 'Период: 15 марта - 30 марта 2026', date: '15 мар. 2026 г.' },
  { id: 2, title: 'Организационное собрание', desc: '10 апреля, 15:00 • Аудитория 342', date: '5 апр. 2026 г.' },
];

const DEADLINES = [
  { id: 1, title: 'Сдача Введения и обзора литературы', date: '15 мая 2026 г.', deadline: '15.05.2026', urgent: true },
  { id: 2, title: 'Сдача Главы 1. Теоретическая часть', date: '30 мая 2026 г.', deadline: '30.05.2026', urgent: true },
  { id: 3, title: 'Сдача Главы 2. Практическая часть', date: '10 июня 2026 г.', deadline: '10.06.2026', urgent: false },
  { id: 4, title: 'Сдача итоговой версии ВКР', date: '20 июня 2026 г.', deadline: '20.06.2026', urgent: false },
];

const DOCUMENTS = [
  { id: 1, name: 'Заявление на закрепление темы ВКР', type: 'Word' },
  { id: 2, name: 'Титульный лист ВКР', type: 'Word' },
  { id: 3, name: 'Задание на ВКР', type: 'Word' },
  { id: 4, name: 'Отзыв руководителя', type: 'Word' },
  { id: 5, name: 'Рецензия на ВКР', type: 'Word' },
  { id: 6, name: 'Справка о проверке на антиплагиат', type: 'Word' },
];

const FORUM_QUESTIONS = [
  { id: 1, question: 'Кто-нибудь знает требования к оформлению списка литературы?', author: 'Петров П.П.', time: '09:20', date: '15 апреля 2026', answers: [
    { id: 11, text: 'ГОСТ Р 7.0.5-2008, в методичке есть примеры', author: 'Иванов И.И.', time: '09:35', date: '15 апреля 2026' },
  ]},
  { id: 2, question: 'Какой процент оригинальности требуется?', author: 'Сидорова А.С.', time: '11:10', date: '16 апреля 2026', answers: [
    { id: 21, text: 'От 70% для бакалавров, от 80% для магистров', author: 'Козлов Д.А.', time: '11:25', date: '16 апреля 2026' },
  ]},
];

const VIDEOCONFERENCES = [
  { id: 1, title: 'Групповая консультация по оформлению', date: '20 мая 2026, 18:00', link: null, activeSoon: true },
  { id: 2, title: 'Индивидуальная консультация', date: '25 мая 2026, 15:00', link: 'https://mts-link.ru/...', activeSoon: false },
];

const VKR_TASKS = [
  { id: 1, name: 'Утверждение темы ВКР', deadline: '20.04.2026', openFrom: '15.03.2026', description: 'Необходимо согласовать с научным руководителем тему выпускной квалификационной работы.', status: 'pending', grade: null, feedback: null, feedbackDate: null, teacher: null, files: [], submittedDate: null, attempts: 0, maxAttempts: 1 },
  { id: 2, name: 'Заявление на ВКР', deadline: '25.04.2026', openFrom: '15.03.2026', description: 'Заполните и загрузите подписанное заявление на закрепление темы ВКР.', status: 'pending', grade: null, feedback: null, feedbackDate: null, teacher: null, files: [], submittedDate: null, attempts: 0, maxAttempts: 1 },
  { id: 3, name: 'Введение и обзор литературы', deadline: '15.05.2026', openFrom: '01.04.2026', description: 'Подготовьте введение к ВКР и обзор литературы. Не менее 15 источников.', status: 'pending', grade: null, feedback: null, feedbackDate: null, teacher: null, files: [], submittedDate: null, attempts: 0, maxAttempts: 3 },
  { id: 4, name: 'Глава 1. Теоретическая часть', deadline: '30.05.2026', openFrom: '16.05.2026', description: 'Разработайте теоретическую часть ВКР.', status: 'pending', grade: null, feedback: null, feedbackDate: null, teacher: null, files: [], submittedDate: null, attempts: 0, maxAttempts: 3 },
  { id: 5, name: 'Глава 2. Практическая часть', deadline: '10.06.2026', openFrom: '31.05.2026', description: 'Разработайте практическую часть ВКР.', status: 'blocked', grade: null, feedback: null, feedbackDate: null, teacher: null, files: [], submittedDate: null, attempts: 0, maxAttempts: 3 },
  { id: 6, name: 'Итоговая версия', deadline: '20.06.2026', openFrom: '11.06.2026', description: 'Загрузите итоговую версию ВКР.', status: 'blocked', grade: null, feedback: null, feedbackDate: null, teacher: null, files: [], submittedDate: null, attempts: 0, maxAttempts: 1 },
];

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
function StudentCabinet({ user, profile, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'home');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [activeNewsTab, setActiveNewsTab] = useState('all');
  const [courseTab, setCourseTab] = useState('announcements');
  const [servicesTab, setServicesTab] = useState('teachers');
  const [teacherViewTab, setTeacherViewTab] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [allTeachers, setAllTeachers] = useState([]);
  const [teachersOnlineStatus, setTeachersOnlineStatus] = useState({});
  
  // Новые стейты для работы с системой хранения
  const [applications, setApplications] = useState([]);
  const [approvedApplication, setApprovedApplication] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [chatTab, setChatTab] = useState('personal');
  const [personalChatMessages, setPersonalChatMessages] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessageText, setGroupMessageText] = useState('');
  
  const [forumQuestions, setForumQuestions] = useState(FORUM_QUESTIONS);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  
  const [vkrTasks, setVkrTasks] = useState(VKR_TASKS);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const gender = detectGender(profile.full_name);
  
  const hasApprovedTeacher = !!approvedApplication;

  const calculateProgress = () => {
    if (!approvedApplication) return 0;
    const completedTasks = vkrTasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / vkrTasks.length) * 100);
  };

  // Инициализация и загрузка данных
  useEffect(() => {
    initDemoData();
    loadStudentData();
    
    const teachers = getFullTeachersList();
    const statuses = getTeachersOnlineStatus();
    setAllTeachers(teachers);
    setTeachersOnlineStatus(statuses);
    
    const interval = setInterval(() => {
      const updatedStatuses = getTeachersOnlineStatus();
      setTeachersOnlineStatus(updatedStatuses);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [user.id]);

  const loadStudentData = () => {
    const apps = getStudentApplications(user.id);
    setApplications(apps);
    const approved = apps.find(a => a.status === 'approved');
    setApprovedApplication(approved || null);
    
    setNotifications(getUserNotifications(user.id));
    
    const savedTasks = getStudentTasks(user.id);
    if (Object.keys(savedTasks).length > 0) {
      setVkrTasks(prev => prev.map(task => ({
        ...task,
        ...(savedTasks[task.id] || {}),
        teacher: approved?.teacher || null
      })));
    } else if (approved) {
      setVkrTasks(prev => prev.map(task => ({
        ...task,
        teacher: approved.teacher
      })));
    }
    
    if (approved) {
      const messages = getPersonalChatMessages(user.id, approved.teacherId);
      setPersonalChatMessages(messages.map(m => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        time: new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      })));
      
      const groups = getStudentGroups(user.id, approved.teacherId);
      setStudentGroups(groups);
    }
  };

  useEffect(() => { 
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
  }, [isDark]);
  
  useEffect(() => { 
    localStorage.setItem('activeTab', activeTab); 
  }, [activeTab]);

  const filteredNews = activeNewsTab === 'all' ? NEWS : NEWS.filter(item => item.important);

  const handleApply = (teacher) => {
    const result = submitApplication(
      user.id,
      profile.full_name,
      profile.group_number || profile.group,
      profile.course,
      teacher.id,
      teacher.fullName
    );
    
    if (result.success) {
      loadStudentData();
      setShowConfirmModal(false);
      setSelectedTeacher(null);
    } else {
      alert(result.message);
    }
  };

  const confirmApply = () => {
    handleApply(selectedTeacher);
  };

  const cancelApplicationHandler = (appId) => {
    const result = cancelApplicationAPI(appId, user.id);
    if (result.success) {
      loadStudentData();
    }
  };

  const handleSendMessage = (text) => {
    if (!approvedApplication) return;
    
    const result = sendPersonalMessage(
      user.id,
      approvedApplication.teacherId,
      'student',
      user.id,
      profile.full_name,
      text
    );
    
    if (result.success) {
      setPersonalChatMessages(prev => [...prev, {
        id: result.message.id,
        text: result.message.text,
        sender: result.message.sender,
        time: new Date(result.message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const handleSendGroupMessage = (groupId, text) => {
    if (!text.trim()) return;
    setStudentGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          messages: [...g.messages, {
            id: Date.now(),
            text,
            sender: profile.full_name,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          }]
        };
      }
      return g;
    }));
  };

  const addAnswer = (questionId) => {
    if (!newAnswer.trim()) return;
    const updated = forumQuestions.map(q => q.id === questionId ? { ...q, answers: [...q.answers, { id: Date.now(), text: newAnswer, author: profile.full_name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }] } : q);
    setForumQuestions(updated); 
    setNewAnswer('');
  };

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setForumQuestions([{ id: Date.now(), question: newQuestion, author: profile.full_name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }), answers: [] }, ...forumQuestions]);
    setNewQuestion(''); 
    setShowNewQuestion(false);
  };

  const downloadDocument = (doc) => { alert(`Скачивание файла: ${doc.name}.docx`); };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const uploadFileToTask = (taskId) => {
    const fileName = prompt('Введите название файла:', `Отчет_${taskId}.docx`);
    if (fileName) {
      const result = submitTask(user.id, taskId, [fileName]);
      if (result.success) {
        setVkrTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return { ...t, files: [...t.files, fileName], submittedDate: new Date().toLocaleDateString('ru-RU'), status: 'submitted' };
          }
          return t;
        }));
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => ({ ...prev, files: [...prev.files, fileName], submittedDate: new Date().toLocaleDateString('ru-RU'), status: 'submitted' }));
        }
      }
    }
  };

  const deleteFileFromTask = (taskId, fileName) => {
    setVkrTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, files: t.files.filter(f => f !== fileName) };
      }
      return t;
    }));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, files: prev.files.filter(f => f !== fileName) }));
    }
  };

  const getStatusStyle = (task) => {
    if (!approvedApplication) return { text: 'Ожидание', style: 'text-gray-400 border-gray-500/30 bg-gray-500/10' };
    switch (task.status) {
      case 'completed': return { text: ' Выполнено', style: 'text-green-400 border-green-500/30 bg-green-500/10' };
      case 'submitted': return { text: ' Отправлено', style: 'text-blue-400 border-blue-500/30 bg-blue-500/10' };
      case 'overdue': return { text: ' Просрочено', style: 'text-red-400 border-red-500/30 bg-red-500/10' };
      case 'blocked': return { text: ' Заблокировано', style: 'text-purple-400 border-purple-500/30 bg-purple-500/10' };
      default: return { text: 'Ожидание', style: 'text-gray-400 border-gray-500/30 bg-gray-500/10' };
    }
  };

  const theme = {
    bg: isDark ? 'bg-[#121218]' : 'bg-white',
    header: isDark ? 'bg-[#121218]/80 backdrop-blur-md border-[#2A2A3A]' : 'bg-white/80 backdrop-blur-md border-gray-200',
    card: isDark ? 'bg-[#1E1E2A] border border-[#2A2A3A]' : 'bg-white border border-gray-200 shadow-sm',
    cardInner: isDark ? 'bg-[#121218]' : 'bg-gray-50',
    text: isDark ? 'text-[#F1F5F9]' : 'text-[#1E293B]',
    textSecondary: isDark ? 'text-[#94A3B8]' : 'text-[#64748B]',
    textMuted: isDark ? 'text-[#64748B]' : 'text-[#94A3B8]',
    input: isDark ? 'bg-[#1E1E2A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400',
    inputChat: isDark ? 'bg-[#2A2A3A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400',
    filterActive: isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white',
    filterInactive: isDark ? 'bg-[#1E1E2A] text-white border border-[#2A2A3A]' : 'bg-gray-100 text-gray-600 border-gray-200',
    bottomBar: isDark ? 'bg-[#1E1E2A]/90 backdrop-blur-xl border-[#2A2A3A]' : 'bg-white/90 backdrop-blur-xl border-gray-200 shadow-lg',
    progressBg: isDark ? 'bg-gray-700' : 'bg-gray-200',
    myMessage: isDark ? 'bg-[#A78BFA] text-white rounded-br-md' : 'bg-[#2563EB] text-white rounded-br-md',
    otherMessage: isDark ? 'bg-[#2E7D32] text-white rounded-bl-md' : 'bg-[#E8F5E9] text-gray-800 rounded-bl-md',
  };

  const noScrollbar = { scrollbarWidth: 'none', msOverflowStyle: 'none' };
  
  const scrollbarCSS = `
    html, body {
      background-color: ${isDark ? '#121218' : '#ffffff'};
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .forum-scroll::-webkit-scrollbar { display: none; }
    .answers-scroll::-webkit-scrollbar { display: none; }
  `;

  // Компонент уведомлений
  const NotificationBell = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    return (
      <div className="relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA] hover:bg-[#2A2A3A]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9z" clipRule="evenodd" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        
        {showNotifications && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowNotifications(false)}
            />
            <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-50 ${theme.card} max-h-96 overflow-hidden`}>
              <div className={`p-3 border-b flex items-center justify-between ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'}`}>
                <h4 className={`font-medium ${theme.text}`}>Уведомления</h4>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => {
                      markAllNotificationsAsRead(user.id);
                      setNotifications(getUserNotifications(user.id));
                    }}
                    className={`text-xs ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'} hover:underline`}
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className={`p-4 text-center text-sm ${theme.textMuted}`}>Нет уведомлений</p>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3 border-b cursor-pointer transition-colors ${isDark ? 'border-[#2A2A3A] hover:bg-[#1A1A2A]' : 'border-gray-100 hover:bg-gray-50'} ${!n.read ? (isDark ? 'bg-[#A78BFA]/10' : 'bg-blue-50') : ''}`}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        setNotifications(getUserNotifications(user.id));
                        setShowNotifications(false);
                      }}
                    >
                      <p className={`text-sm font-medium flex items-center gap-2 ${theme.text}`}>
                        <span className={`w-2 h-2 rounded-full mr-1 ${
                          n.type === 'application_approved' ? 'bg-green-500' : 
                          n.type === 'application_rejected' ? 'bg-red-500' : 
                          'bg-blue-500'
                        }`}></span>
                        {n.title}
                      </p>
                      <p className={`text-xs mt-1 ${theme.textSecondary}`}>{n.message}</p>
                      <p className={`text-xs mt-1 ${theme.textMuted}`}>{n.date}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ==================== ЭКРАНЫ ====================
  const HomeScreen = () => (
    <div className="space-y-4 fade-in">
      <div className={`${isDark ? 'bg-[#1E1E2A] border-[#2A2A3A]' : 'bg-[#F8FAFC] border-gray-200'} rounded-2xl border p-5`}>
        <h2 className={`font-semibold text-lg flex items-center ${theme.text}`}>
          <NewsIcon isDark={isDark} />
          Добрый день, {profile.full_name?.split(' ').slice(1).join(' ') || profile.full_name}!
        </h2>
      </div>
      
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-lg flex items-center ${theme.text}`}>
          <MegaphoneIcon isDark={isDark} />
          Новости
        </h3>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveNewsTab('all')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
            activeNewsTab === 'all' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          Все
        </button>
        <button 
          onClick={() => setActiveNewsTab('important')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
            activeNewsTab === 'important' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          Важное
        </button>
      </div>

      <div className="space-y-3">
        {filteredNews.map(item => (
          <div key={item.id} className={`news-card rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg ${item.important ? (isDark ? 'border-l-4 border-l-[#1E3A5F]' : 'border-l-4 border-l-blue-800') : ''} ${theme.card}`}>
            <div className="p-4">
              <h4 className={`font-semibold mb-2 ${theme.text}`}>{item.title}</h4>
              {item.desc && <p className={`text-sm mb-3 ${theme.textSecondary}`}>{item.desc}</p>}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium flex items-center ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
                  <ClockIcon isDark={isDark} />
                  {item.date}
                </span>
                <div className="flex gap-1">
                  {item.tags && item.tags.map((tag, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-md font-medium border ${isDark ? 'text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10' : 'text-green-600 border-green-200 bg-green-50'}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CourseScreen = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold text-lg ${theme.text}`}>ВКР 2026</h2>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setCourseTab('announcements')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            courseTab === 'announcements' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <MegaphoneIcon isDark={isDark} active={courseTab === 'announcements'} />
          Объявления
        </button>
        
        <button 
          onClick={() => setCourseTab('progress')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            courseTab === 'progress' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <ChartIcon isDark={isDark} active={courseTab === 'progress'} />
          Прогресс
        </button>
        
        <button 
          onClick={() => setCourseTab('documents')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            courseTab === 'documents' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <FolderIcon isDark={isDark} active={courseTab === 'documents'} />
          Документы
        </button>
      </div>

      <div className="pt-2">
        {courseTab === 'announcements' && (
          <div className="space-y-4">
            <div className={`p-6 rounded-xl ${theme.card}`}>
              <h3 className={`font-semibold mb-4 flex items-center ${theme.text}`}>
                <MegaphoneIcon isDark={isDark} />
                Объявления курса
              </h3>
              <div className="space-y-3">
                {COURSE_ANNOUNCEMENTS.map(item => (
                  <div key={item.id} className={`p-4 rounded-lg transition-all hover:scale-[1.01] ${theme.cardInner}`}>
                    <h4 className={`font-medium flex items-center ${theme.text}`}>
                      <MegaphoneIcon isDark={isDark} />
                      {item.title}
                    </h4>
                    <p className={`text-sm mt-1 ${theme.textSecondary}`}>{item.desc}</p>
                    <p className={`text-xs mt-2 flex items-center ${theme.textMuted}`}>
                      <ClockIcon isDark={isDark} />
                      {item.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {courseTab === 'progress' && (
          <div className={`p-6 rounded-xl ${theme.card}`}>
            <h3 className={`font-semibold mb-2 flex items-center ${theme.text}`}>
              <ChartIcon isDark={isDark} />
              Прогресс выполнения ВКР
            </h3>
            <p className={`mb-4 ${theme.textSecondary}`}>
              Студент: {profile.full_name} | Руководитель: {approvedApplication?.teacherName || approvedApplication?.teacher || 'Не назначен'}
            </p>
            
            <div className="flex flex-col items-center mb-4">
              <div className={`${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
                <VKRIcon isDark={isDark} />
              </div>
              <span className={`text-2xl font-bold ${theme.text}`}>{calculateProgress()}%</span>
              <span className={`text-xs ${theme.textMuted}`}>общий прогресс</span>
            </div>
            
            <div className={`w-full h-2 ${theme.progressBg} rounded-full mb-6`}>
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${calculateProgress()}%` }} />
            </div>
            
            <h4 className={`font-medium mb-3 flex items-center ${theme.text}`}>
              <ClockIcon isDark={isDark} />
              Ближайшие дедлайны
            </h4>
            <div className="space-y-2 mb-6">
              {DEADLINES.map(item => (
                <div key={item.id} className={`p-3 rounded-lg transition-all hover:scale-[1.01] ${item.urgent ? (isDark ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-l-4 border-l-orange-500' : 'bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-l-orange-500') : (isDark ? 'bg-[#121218] border border-[#2A2A3A]' : 'bg-gray-50 border border-gray-200')}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme.text}`}>{item.title}</span>
                    <span className={`text-xs font-medium ${item.urgent ? (isDark ? 'text-orange-400' : 'text-orange-600') : theme.textMuted}`}>
                      <ClockIcon isDark={isDark} />
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <h4 className={`font-medium mb-3 flex items-center ${theme.text}`}>
              <DocumentIcon isDark={isDark} />
              Этапы ВКР
            </h4>
            <div className="space-y-2">
              {vkrTasks.map((task) => {
                const statusInfo = getStatusStyle(task);
                const completed = task.status === 'completed';
                return (
                  <button key={task.id} onClick={() => openTaskDetails(task)} className={`w-full p-3 rounded-lg flex items-center justify-between transition-all hover:scale-[1.01] ${isDark ? 'bg-[#121218] hover:bg-[#1A1A2A]' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      {completed ? <CheckCircleIcon /> : <CircleIcon isDark={isDark} />}
                      <span className={theme.text}>{task.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${theme.textMuted}`}>
                        <ClockIcon isDark={isDark} />
                        {task.deadline}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${statusInfo.style}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {courseTab === 'documents' && (
          <div className={`p-4 rounded-xl ${theme.card}`}>
            <h3 className={`font-semibold mb-4 flex items-center ${theme.text}`}>
              <FolderIcon isDark={isDark} />
              Документы
            </h3>
            <p className={`text-sm ${theme.textSecondary} mb-3`}>Шаблоны документов для ВКР (скачать в формате Word)</p>
            <div className="space-y-2">
              {DOCUMENTS.map(doc => (
                <div key={doc.id} className={`w-full p-3 rounded-lg flex items-center justify-between transition-all hover:scale-[1.01] ${isDark ? 'bg-[#121218] hover:bg-[#1A1A2A]' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <DocumentIcon isDark={isDark} />
                    <div className="text-left">
                      <p className={`text-sm font-medium ${theme.text}`}>{doc.name}</p>
                      <p className={`text-xs ${theme.textMuted}`}>.{doc.type}</p>
                    </div>
                  </div>
                  <button onClick={() => downloadDocument(doc)} className={`p-2 rounded-lg transition-all hover:scale-110 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
                    <DownloadIcon isDark={isDark} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Компонент поля ввода поиска
  const SearchInput = () => {
    const [localValue, setLocalValue] = useState(searchQuery);
    
    useEffect(() => {
      setLocalValue(searchQuery);
    }, [searchQuery]);
    
    return (
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
        <input 
          type="text" 
          placeholder="Поиск по ФИО..." 
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            setSearchQuery(e.target.value);
          }}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl ${theme.input} focus:outline-none`} 
        />
      </div>
    );
  };

  // Компонент поля сообщения в чате
  const ChatInput = ({ onSend, isDark, theme }) => {
    const [localValue, setLocalValue] = useState('');
    const inputRef = useRef(null);
    
    const handleSend = () => {
      if (localValue.trim()) {
        onSend(localValue);
        setLocalValue('');
        inputRef.current?.focus();
      }
    };
    
    return (
      <div className="flex gap-2">
        <input 
          ref={inputRef}
          type="text" 
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Сообщение..." 
          className={`flex-1 px-4 py-3 rounded-full focus:outline-none ${theme.inputChat}`} 
        />
        <button 
          onClick={handleSend}
          disabled={!localValue.trim()}
          className={`p-3 rounded-full font-medium transition-all flex items-center justify-center ${
            localValue.trim() 
              ? (isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]') 
              : (isDark ? 'bg-[#2A2A3A]' : 'bg-gray-200')
          }`}
        >
          <SendIcon isDark={isDark} />
        </button>
      </div>
    );
  };

  // Компонент поля ответа на форуме
  const ForumAnswerInput = ({ questionId, onAddAnswer, isDark, theme }) => {
    const [localValue, setLocalValue] = useState('');
    const inputRef = useRef(null);
    
    const handleSubmit = () => {
      if (localValue.trim()) {
        onAddAnswer(questionId, localValue);
        setLocalValue('');
      }
    };
    
    return (
      <div className="flex gap-2 mt-3">
        <input 
          ref={inputRef}
          type="text" 
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ваш ответ..." 
          className={`flex-1 px-4 py-3 rounded-full text-sm focus:outline-none ${theme.inputChat}`} 
        />
        <button 
          onClick={handleSubmit}
          disabled={!localValue.trim()}
          className={`p-3 rounded-full text-sm font-medium transition-all flex items-center justify-center ${
            localValue.trim() 
              ? (isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]') 
              : (isDark ? 'bg-[#2A2A3A]' : 'bg-gray-200')
          }`}
        >
          <SendIcon isDark={isDark} />
        </button>
      </div>
    );
  };

  // Компонент поля нового вопроса
  const NewQuestionInput = ({ onAdd, onCancel, isDark, theme }) => {
    const [localValue, setLocalValue] = useState('');
    const textareaRef = useRef(null);
    
    useEffect(() => {
      textareaRef.current?.focus();
    }, []);
    
    const handleSubmit = () => {
      if (localValue.trim()) {
        onAdd(localValue);
        setLocalValue('');
      }
    };
    
    return (
      <div className={`p-4 rounded-xl ${theme.card}`}>
        <textarea 
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="Введите ваш вопрос..." 
          className={`w-full p-3 rounded-lg text-sm mb-3 focus:outline-none resize-none ${theme.input}`} 
          rows="2"
        />
        <div className="flex gap-2">
          <button 
            onClick={handleSubmit}
            disabled={!localValue.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105 ${localValue.trim() ? (isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]') : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Опубликовать
          </button>
          <button 
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${isDark ? 'bg-[#1E1E2A] text-white border border-[#2A2A3A]' : 'bg-[#F8FAFC] text-gray-600 border border-gray-200'}`}
          >
            Отмена
          </button>
        </div>
      </div>
    );
  };

  const ServicesScreen = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold text-lg flex items-center ${theme.text}`}>
          <ServicesIcon active={true} isDark={isDark} />
          Сервисы
        </h2>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => { setServicesTab('teachers'); setTeacherViewTab('catalog'); }} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            servicesTab === 'teachers' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <TeacherIcon isDark={isDark} active={servicesTab === 'teachers'} />
          Преподаватели
        </button>
        
        <button 
          onClick={() => setServicesTab('chat')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            servicesTab === 'chat' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <ChatIcon isDark={isDark} active={servicesTab === 'chat'} />
          Чаты
        </button>
        
        <button 
          onClick={() => setServicesTab('forum')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            servicesTab === 'forum' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <ForumIcon isDark={isDark} active={servicesTab === 'forum'} />
          Форум
        </button>
        
        <button 
          onClick={() => setServicesTab('video')} 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${
            servicesTab === 'video' 
              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') 
              : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')
          }`}
        >
          <VideoIcon isDark={isDark} active={servicesTab === 'video'} />
          Видео
        </button>
      </div>

      <div className="pt-2">
        {servicesTab === 'teachers' && (
          <div className="space-y-3">
            <div className="flex gap-2 border-b pb-2" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
              <button onClick={() => setTeacherViewTab('catalog')} className={`px-4 py-2 text-sm font-medium transition-all ${teacherViewTab === 'catalog' ? (isDark ? 'text-[#A78BFA] border-b-2 border-[#A78BFA]' : 'text-[#2563EB] border-b-2 border-[#2563EB]') : theme.textMuted}`}>Каталог</button>
              <button onClick={() => setTeacherViewTab('myApplications')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center ${teacherViewTab === 'myApplications' ? (isDark ? 'text-[#A78BFA] border-b-2 border-[#A78BFA]' : 'text-[#2563EB] border-b-2 border-[#2563EB]') : theme.textMuted}`}>
                <ListIcon isDark={isDark} />
                Мои заявки
                {applications.filter(app => app.status === 'pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">{applications.filter(app => app.status === 'pending').length}</span>
                )}
              </button>
            </div>

            {teacherViewTab === 'myApplications' && (
              <div className="space-y-3">
                {applications.filter(app => app.status === 'pending').length === 0 && applications.filter(app => app.status === 'approved').length === 0 ? (
                  <div className={`p-8 text-center rounded-xl ${theme.card}`}>
                    <ListIcon isDark={isDark} />
                    <p className={`text-lg mb-2 ${theme.text}`}>Нет активных заявок</p>
                  </div>
                ) : (
                  <>
                    {applications.filter(app => app.status === 'pending').map(app => (
                      <div key={app.id} className={`p-4 rounded-xl ${theme.card} border-l-4 border-l-yellow-500`}>
                        <h4 className={`font-medium flex items-center ${theme.text}`}>
                          <TeacherIcon isDark={isDark} />
                          {app.teacherName || app.teacher}
                        </h4>
                        <p className={`text-xs mb-3 ${theme.textMuted}`}>Подана: {app.date}</p>
                        <button onClick={() => cancelApplicationHandler(app.id)} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>Отменить заявку</button>
                      </div>
                    ))}
                    {applications.filter(app => app.status === 'approved').map(app => (
                      <div key={app.id} className={`p-4 rounded-xl ${theme.card} border-l-4 border-l-green-500`}>
                        <h4 className={`font-medium flex items-center ${theme.text}`}>
                          <TeacherIcon isDark={isDark} />
                          {app.teacherName || app.teacher}
                        </h4>
                        <p className={`text-xs mb-2 ${theme.textMuted}`}>Утверждена: {app.date}</p>
                        {app.topic && <p className={`text-sm ${theme.textSecondary}`}>Тема: {app.topic}</p>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {teacherViewTab === 'catalog' && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={noScrollbar}>
                  {['all', 'free'].map(filter => (
                    <button key={filter} onClick={() => setSelectedFilter(filter)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all hover:scale-105 ${selectedFilter === filter ? theme.filterActive : theme.filterInactive}`}>{filter === 'all' ? 'Все' : 'Есть места'}</button>
                  ))}
                </div>
                
                <SearchInput />
                
                {approvedApplication && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-green-600/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                    <p className={`text-sm flex items-center ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      <TeacherIcon isDark={isDark} />
                      У вас уже есть утверждённый руководитель: {approvedApplication.teacherName || approvedApplication.teacher}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar" style={noScrollbar}>
                  {allTeachers
                    .filter(teacher => {
                      const matchesSearch = teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesFilter = selectedFilter === 'all' || (selectedFilter === 'free' && teacher.occupied < teacher.maxSlots);
                      return matchesSearch && matchesFilter;
                    })
                    .map(teacher => {
                      const freeSlots = teacher.maxSlots - teacher.occupied;
                      const isFull = freeSlots === 0;
                      const hasApplication = applications.some(app => app.teacherId === teacher.id && (app.status === 'pending' || app.status === 'approved'));
                      const isDisabled = isFull || hasApplication || approvedApplication;
                      
                      let buttonText = 'Записаться';
                      let buttonStyle = '';
                      
                      if (approvedApplication) {
                        buttonText = 'Руководитель уже назначен';
                        buttonStyle = isDark ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed';
                      } else if (hasApplication) {
                        const app = applications.find(app => app.teacherId === teacher.id);
                        buttonText = app?.status === 'pending' ? 'Заявка на рассмотрении' : 'Заявка подана';
                        buttonStyle = isDark ? 'bg-yellow-600/30 text-yellow-300 cursor-not-allowed border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 cursor-not-allowed border border-yellow-300';
                      } else if (isFull) {
                        buttonText = 'Нет мест';
                        buttonStyle = isDark ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed';
                      } else {
                        buttonStyle = isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA] text-white' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white';
                      }
                      
                      return (
                        <div key={teacher.id} className={`rounded-xl p-4 transition-all hover:scale-[1.01] hover:shadow-md ${theme.card}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all hover:scale-110 ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>{teacher.fullName.split(' ')[0].charAt(0)}</div>
                              <div>
                                <h4 className={`font-medium flex items-center ${theme.text}`}>
                                  <TeacherIcon isDark={isDark} />
                                  {teacher.fullName}
                                </h4>
                                <p className={`text-xs ${theme.textMuted}`}>{teacher.position}</p>
                                <p className={`text-xs ${theme.textMuted}`}>{teacher.department}</p>
                                <p className={`text-xs ${theme.textMuted}`}>{teacher.institute}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isFull ? 'bg-red-500/20 text-red-400' : freeSlots === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                                </svg>
                                {freeSlots}/{teacher.maxSlots}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowConfirmModal(true);
                            }}
                            disabled={isDisabled} 
                            className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${buttonStyle}`}
                          >
                            {buttonText}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        )}

        {servicesTab === 'chat' && (
          <div className="space-y-4">
            {!hasApprovedTeacher ? (
              <div className={`p-8 text-center rounded-xl ${theme.card}`}>
                <ChatIcon isDark={isDark} />
                <p className={`text-lg mb-2 ${theme.text}`}>Чаты недоступны</p>
                <p className={`${theme.textSecondary}`}>Чаты станут доступны после утверждения руководителя</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 border-b pb-2" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
                  <button 
                    onClick={() => { setChatTab('personal'); setSelectedGroup(null); }} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all hover:scale-105 flex items-center ${chatTab === 'personal' ? (isDark ? 'text-[#A78BFA] border-[#A78BFA]' : 'text-[#2563EB] border-[#2563EB]') : theme.textMuted}`}
                  >
                    <ChatIcon isDark={isDark} />
                    Чат с руководителем
                  </button>
                  <button 
                    onClick={() => setChatTab('groups')} 
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all hover:scale-105 flex items-center ${chatTab === 'groups' ? (isDark ? 'text-[#A78BFA] border-[#A78BFA]' : 'text-[#2563EB] border-[#2563EB]') : theme.textMuted}`}
                  >
                    <GroupIcon isDark={isDark} />
                    Группы
                  </button>
                </div>
                
                {chatTab === 'personal' && (
                  <>
                    <div className={`p-3 rounded-lg ${theme.card}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>
                          {(approvedApplication.teacherName || approvedApplication.teacher).charAt(0)}
                        </div>
                        <div>
                          <p className={`font-medium ${theme.text}`}>{approvedApplication.teacherName || approvedApplication.teacher}</p>
                          <p className={`text-xs ${theme.textMuted}`}>Научный руководитель</p>
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-xl p-3 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar ${isDark ? 'bg-[#121218]' : 'bg-gray-50'}`} style={noScrollbar}>
                      {personalChatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] ${msg.sender === 'student' ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`p-3 rounded-2xl ${msg.sender === 'student' ? theme.myMessage : theme.otherMessage}`}>
                              <p className="text-sm">{msg.text}</p>
                            </div>
                            <p className={`text-xs mt-1 ${msg.sender === 'student' ? 'text-white/70' : theme.textMuted}`}>
                              {msg.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ChatInput 
                      onSend={handleSendMessage}
                      isDark={isDark}
                      theme={theme}
                    />
                  </>
                )}
                
                {chatTab === 'groups' && (
                  <>
                    {!selectedGroup ? (
                      <div className="space-y-3">
                        {studentGroups.length === 0 ? (
                          <div className={`p-8 text-center rounded-xl ${theme.card}`}>
                            <GroupIcon isDark={isDark} />
                            <p className={`text-lg mb-2 ${theme.text}`}>Нет доступных групп</p>
                            <p className={`${theme.textSecondary}`}>Преподаватель ещё не создал группы</p>
                          </div>
                        ) : (
                          studentGroups.map(group => (
                            <button
                              key={group.id}
                              onClick={() => setSelectedGroup(group)}
                              className={`w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01] ${theme.card}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>
                                  <GroupIcon isDark={isDark} />
                                </div>
                                <div className="flex-1">
                                  <p className={`font-medium ${theme.text}`}>{group.name}</p>
                                  <p className={`text-xs ${theme.textMuted}`}>{group.course} курс • {group.students?.length || 0} студентов</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => setSelectedGroup(null)}
                          className={`flex items-center gap-2 text-sm ${theme.textMuted} hover:${theme.text}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                          </svg>
                          Назад к списку групп
                        </button>
                        <div className={`p-3 rounded-lg ${theme.card}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>
                              <GroupIcon isDark={isDark} />
                            </div>
                            <div>
                              <p className={`font-medium ${theme.text}`}>{selectedGroup.name}</p>
                              <p className={`text-xs ${theme.textMuted}`}>{selectedGroup.course} курс • {selectedGroup.students?.length || 0} студентов</p>
                            </div>
                          </div>
                        </div>
                        <div className={`rounded-xl p-3 space-y-3 max-h-[250px] overflow-y-auto no-scrollbar ${isDark ? 'bg-[#121218]' : 'bg-gray-50'}`} style={noScrollbar}>
                          {selectedGroup.messages?.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === profile.full_name ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] ${msg.sender === profile.full_name ? 'items-end' : 'items-start'} flex flex-col`}>
                                {msg.sender !== profile.full_name && (
                                  <span className={`text-xs mb-1 ${theme.textMuted}`}>{msg.sender}</span>
                                )}
                                <div className={`p-3 rounded-2xl ${msg.sender === profile.full_name ? theme.myMessage : theme.otherMessage}`}>
                                  <p className="text-sm">{msg.text}</p>
                                </div>
                                <p className={`text-xs mt-1 ${msg.sender === profile.full_name ? 'text-white/70' : theme.textMuted}`}>
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={groupMessageText} 
                            onChange={(e) => setGroupMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && groupMessageText.trim()) {
                                e.preventDefault();
                                handleSendGroupMessage(selectedGroup.id, groupMessageText);
                                setGroupMessageText('');
                              }
                            }}
                            placeholder="Написать в группу..." 
                            className={`flex-1 px-4 py-3 rounded-full focus:outline-none ${theme.inputChat}`} 
                          />
                          <button 
                            onClick={() => {
                              handleSendGroupMessage(selectedGroup.id, groupMessageText);
                              setGroupMessageText('');
                            }}
                            disabled={!groupMessageText.trim()}
                            className={`p-3 rounded-full font-medium transition-all flex items-center justify-center ${
                              groupMessageText.trim() 
                                ? (isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]') 
                                : (isDark ? 'bg-[#2A2A3A]' : 'bg-gray-200')
                            }`}
                          >
                            <SendIcon isDark={isDark} />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {servicesTab === 'forum' && (
          <div className="space-y-4">
            <button onClick={() => setShowNewQuestion(!showNewQuestion)} className={`w-full py-3 rounded-lg font-medium transition-all hover:scale-105 flex items-center justify-center ${isDark ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-blue-50 text-[#2563EB] border border-blue-200'}`}>
              <ForumIcon isDark={isDark} />
              Задать вопрос
            </button>
            
            {showNewQuestion && (
              <NewQuestionInput 
                onAdd={(text) => {
                  setForumQuestions([{ id: Date.now(), question: text, author: profile.full_name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }), answers: [] }, ...forumQuestions]);
                  setShowNewQuestion(false);
                }}
                onCancel={() => setShowNewQuestion(false)}
                isDark={isDark}
                theme={theme}
              />
            )}
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto forum-scroll" style={noScrollbar}>
              <style>{scrollbarCSS}</style>
              {forumQuestions.map(q => (
                <div key={q.id} className={`rounded-xl overflow-hidden transition-all hover:scale-[1.01] ${theme.card}`}>
                  <button onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)} className="w-full p-4 text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-medium flex items-center ${theme.text}`}>
                          <ForumIcon isDark={isDark} />
                          {q.question}
                        </p>
                        <p className={`text-xs mt-1 flex items-center ${theme.textMuted}`}>
                          <TeacherIcon isDark={isDark} />
                          {q.author} • {q.date} в {q.time}
                        </p>
                      </div>
                      <ChevronDownIcon isDark={isDark} className={`transition-transform ${expandedQuestion === q.id ? 'rotate-180' : ''}`} />
                    </div>
                    {q.answers.length > 0 && <p className={`text-xs mt-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>{q.answers.length} ответов</p>}
                  </button>
                  {expandedQuestion === q.id && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
                      <div className="pt-3 space-y-3 max-h-[250px] overflow-y-auto answers-scroll" style={noScrollbar}>
                        <style>{scrollbarCSS}</style>
                        {q.answers.map(a => (
                          <div key={a.id} className={`p-3 rounded-lg transition-all hover:scale-[1.01] ${theme.cardInner}`}>
                            <p className={`text-sm ${theme.text}`}>{a.text}</p>
                            <p className={`text-xs mt-1 flex items-center ${theme.textMuted}`}>
                              <TeacherIcon isDark={isDark} />
                              {a.author} • {a.date} в {a.time}
                            </p>
                          </div>
                        ))}
                      </div>
                      <ForumAnswerInput 
                        questionId={q.id}
                        onAddAnswer={(qId, text) => {
                          const updated = forumQuestions.map(qq => qq.id === qId ? { ...qq, answers: [...qq.answers, { id: Date.now(), text, author: profile.full_name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }] } : qq);
                          setForumQuestions(updated);
                        }}
                        isDark={isDark}
                        theme={theme}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {servicesTab === 'video' && (
          <div className={`p-6 rounded-xl ${theme.card}`}>
            <h3 className={`font-semibold mb-4 flex items-center ${theme.text}`}>
              <VideoIcon isDark={isDark} />
              Видеоконференции
            </h3>
            <div className="space-y-3">
              {VIDEOCONFERENCES.map(conf => (
                <div key={conf.id} className={`p-4 rounded-lg transition-all hover:scale-[1.01] hover:shadow-md ${theme.cardInner}`}>
                  <div className="flex items-center gap-3">
                    <VideoIcon isDark={isDark} />
                    <div className="flex-1">
                      <h4 className={`font-medium ${theme.text}`}>{conf.title}</h4>
                      <p className={`text-sm flex items-center ${theme.textSecondary}`}>
                        <CalendarIcon isDark={isDark} />
                        {conf.date}
                      </p>
                      {conf.link ? (
                        <a href={conf.link} className={`text-sm ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'} hover:underline`}>Подключиться</a>
                      ) : (
                        <p className={`text-sm ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>Ссылка станет активна за 15 минут до начала</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold text-lg flex items-center ${theme.text}`}>
          <ProfileIcon active={true} isDark={isDark} />
          Профиль
        </h2>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button>
      </div>

      <div className={`rounded-2xl p-5 transition-all hover:scale-[1.01] ${theme.card}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
            <ProfileIcon active={true} isDark={isDark} />
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${theme.text}`}>{profile.full_name}</h3>
            <p className={`text-sm ${theme.textSecondary}`}>
              {profile.group} • {profile.course} курс • {profile.degree}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-4 ${theme.card}`}>
        <h4 className={`text-sm font-medium mb-3 ${theme.text}`}>Личные данные</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5">
            <span className={`text-sm ${theme.textMuted}`}>Почта</span>
            <span className={`text-sm ${theme.text}`}>{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className={`text-sm ${theme.textMuted}`}>Пол</span>
            <span className={`text-sm ${theme.text}`}>{detectGender(profile.full_name) === 'Женский' ? 'Женский' : 'Мужской'}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className={`text-sm ${theme.textMuted}`}>Курс</span>
            <span className={`text-sm ${theme.text}`}>{profile.course} курс</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className={`text-sm ${theme.textMuted}`}>Учебная группа</span>
            <span className={`text-sm ${theme.text}`}>{profile.group}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className={`text-sm ${theme.textMuted}`}>Степень</span>
            <span className={`text-sm ${theme.text}`}>{profile.degree}</span>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-4 ${theme.card}`}>
        <h4 className={`text-sm font-medium mb-3 ${theme.text}`}>Информация об обучении</h4>
        <div className="space-y-3">
          <div>
            <span className={`text-xs ${theme.textMuted}`}>Формирующее подразделение</span>
            <p className={`text-sm mt-1 ${theme.text}`}>Институт технологий управления</p>
          </div>
          <div>
            <span className={`text-xs ${theme.textMuted}`}>Выпускающее подразделение</span>
            <p className={`text-sm mt-1 ${theme.text}`}>Кафедра информационных технологий в государственном управлении</p>
          </div>
          <div>
            <span className={`text-xs ${theme.textMuted}`}>Направление подготовки (специальность)</span>
            <p className={`text-sm mt-1 ${theme.text}`}>Бизнес-информатика (Управление ИТ-инфраструктурой организации)</p>
          </div>
        </div>
      </div>

      {approvedApplication && (
        <div className={`rounded-2xl p-4 ${theme.card}`}>
          <h4 className={`text-sm font-medium mb-3 ${theme.text}`}>Выпускная квалификационная работа</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className={`text-sm ${theme.textMuted}`}>Научный руководитель</span>
              <span className={`text-sm ${theme.text}`}>{approvedApplication.teacherName || approvedApplication.teacher}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className={`text-sm ${theme.textMuted}`}>Тема ВКР</span>
              <span className={`text-sm ${theme.text}`}>{approvedApplication.topic || 'На утверждении'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className={`text-sm ${theme.textMuted}`}>Статус</span>
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700'}`}> Утверждён</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={onLogout} className={`w-full p-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center justify-center ${isDark ? 'bg-[#A78BFA]/20 text-red-400 border border-[#A78BFA]/30 hover:bg-[#A78BFA]/30' : 'bg-[#2563EB]/10 text-red-600 border border-[#2563EB]/20 hover:bg-[#2563EB]/20'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
          <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
        Выйти из аккаунта
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 relative ${theme.bg}`}>
      <style>{scrollbarCSS}</style>
      <div className={`px-4 py-4 sticky top-0 z-30 border-b ${theme.header}`}>
        <div className="max-w-3xl mx-auto">
          <h1 className={`text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-[#A78BFA] via-[#C4B5FD] to-[#A78BFA]' : 'from-[#2563EB] via-[#3B82F6] to-[#2563EB]'}`}>РТУ МИРЭА • Студент</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 tab-content">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'course' && <CourseScreen />}
        {activeTab === 'services' && <ServicesScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      {showConfirmModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card}`}>
            <h3 className={`text-xl font-bold mb-2 flex items-center ${theme.text}`}>
              <TeacherIcon isDark={isDark} />
              Подтверждение записи
            </h3>
            <p className={`mb-6 ${theme.textSecondary}`}>Записаться к {selectedTeacher.fullName}?</p>
            <div className="flex gap-3">
              <button onClick={confirmApply} className={`flex-1 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>Подтвердить</button>
              <button onClick={() => setShowConfirmModal(false)} className={`flex-1 py-3 rounded-xl transition-all hover:scale-105 ${theme.card}`}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden ${theme.card}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-semibold text-lg ${theme.text}`}>{selectedTask.name}</h3>
              <button onClick={() => setShowTaskModal(false)} className={`text-2xl ${theme.textMuted}`}>✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 no-scrollbar" style={noScrollbar}>
              <div className={`p-3 rounded-lg ${theme.cardInner}`}>
                <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Открыто с:</span> {selectedTask.openFrom}</p>
                <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Срок сдачи:</span> {selectedTask.deadline}</p>
              </div>
              <div>
                <h4 className={`font-medium mb-2 ${theme.text}`}>Описание</h4>
                <p className={`text-sm ${theme.textSecondary}`}>{selectedTask.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${theme.cardInner}`}>
                <h4 className={`font-medium mb-2 ${theme.text}`}>Состояние ответа</h4>
                <div className="space-y-2">
                  <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Номер попытки:</span> {selectedTask.attempts} / {selectedTask.maxAttempts}</p>
                  <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Состояние:</span> {selectedTask.submittedDate ? 'Отправлено для оценивания' : 'Не отправлено'}</p>
                  {selectedTask.submittedDate && <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Последнее изменение:</span> {selectedTask.submittedDate}</p>}
                </div>
              </div>
              <div>
                <h4 className={`font-medium mb-2 ${theme.text}`}>Ответ в виде файла</h4>
                {selectedTask.files.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTask.files.map((file, i) => (
                      <div key={i} className={`p-3 rounded-lg flex items-center justify-between ${theme.cardInner}`}>
                        <div className="flex items-center gap-2">
                          <DocumentIcon isDark={isDark} />
                          <span className={`text-sm ${theme.text}`}>{file}</span>
                        </div>
                        <div className="flex gap-2">
                          <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <EditIcon isDark={isDark} />
                          </button>
                          <button onClick={() => deleteFileFromTask(selectedTask.id, file)} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                            <DeleteIcon isDark={isDark} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${theme.textMuted}`}>Файлы не загружены</p>
                )}
                <button onClick={() => uploadFileToTask(selectedTask.id)} className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-blue-100 text-[#2563EB]'}`}>+ Добавить файл</button>
              </div>
              {selectedTask.grade && (
                <div className={`p-3 rounded-lg ${theme.cardInner}`}>
                  <h4 className={`font-medium mb-2 ${theme.text}`}>Отзыв</h4>
                  <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Оценка:</span> {selectedTask.grade}</p>
                  <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Оценено в:</span> {selectedTask.feedbackDate}</p>
                  <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Оценено:</span> {selectedTask.teacher}</p>
                  <p className={`text-sm mt-2 ${theme.textSecondary}`}>{selectedTask.feedback}</p>
                </div>
              )}
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'}`}>
              <button onClick={() => setShowTaskModal(false)} className={`w-full py-2 rounded-lg ${theme.card} ${theme.text}`}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 px-4">
        <div className={`rounded-full px-2 py-2 shadow-2xl ${theme.bottomBar}`}>
          <div className="flex items-center gap-1">
            {['home', 'course', 'services', 'profile'].map(id => {
              const icons = { home: HomeIcon, course: CourseIcon, services: ServicesIcon, profile: ProfileIcon };
              const labels = { home: 'Главная', course: 'Курс', services: 'Сервисы', profile: 'Профиль' };
              const Icon = icons[id];
              return (
                <button key={id} onClick={() => setActiveTab(id)} className={`relative px-5 py-2 rounded-full transition-all duration-200 flex flex-col items-center`}>
                  <Icon active={activeTab === id} isDark={isDark} />
                  <span className={`text-xs font-medium mt-0.5 ${activeTab === id ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : theme.textMuted}`}>{labels[id]}</span>
                  {activeTab === id && <span className={`absolute bottom-[-4px] w-1 h-1 rounded-full ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentCabinet;