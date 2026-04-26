import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import {
  getTeacherPendingApplications,
  getTeacherApprovedStudents,
  approveApplication,
  rejectApplication,
  getPersonalChatMessages,
  sendPersonalMessage,
  getTeacherGroups,
  createTeacherGroup,
  updateGroupName,
  deleteTeacherGroup,
  getTeacherConferences,
  addConference,
  deleteConference,
  gradeTask,
  initDemoData
} from './utils/systemStorage';

// Вспомогательные функции для получения описаний заданий
const getTaskDescription = (taskIndex) => {
  const descriptions = [
    'Необходимо согласовать с научным руководителем тему выпускной квалификационной работы. Студент должен предложить тему, обосновать её актуальность и получить утверждение.',
    'Заполните и загрузите подписанное заявление на закрепление темы ВКР. Документ должен быть подписан студентом и научным руководителем.',
    'Подготовьте введение к ВКР и обзор литературы. Необходимо проанализировать не менее 15 источников, описать актуальность, цель и задачи исследования.',
    'Разработайте теоретическую часть ВКР. Опишите основные концепции, методы и подходы, используемые в исследовании.',
    'Разработайте практическую часть ВКР. Реализуйте проект, проведите эксперименты, опишите полученные результаты.',
    'Загрузите итоговую версию ВКР. Документ должен быть полностью оформлен, включая все главы, список литературы и приложения.'
  ];
  return descriptions[taskIndex] || 'Описание задания отсутствует';
};

const getTaskOpenFrom = (taskIndex) => {
  const dates = [
    '15 марта 2026, 00:00',
    '15 марта 2026, 00:00',
    '28 марта 2026, 00:00',
    '5 апреля 2026, 00:00',
    '25 апреля 2026, 00:00',
    '1 июня 2026, 00:00'
  ];
  return dates[taskIndex] || 'Не указано';
};

const getTaskDeadline = (taskIndex) => {
  const dates = [
    '1 апреля 2026, 23:59',
    '5 апреля 2026, 23:59',
    '3 мая 2026, 23:59',
    '20 мая 2026, 23:59',
    '15 июня 2026, 23:59',
    '20 июня 2026, 23:59'
  ];
  return dates[taskIndex] || 'Не указано';
};

const getTaskMaxAttempts = (taskIndex) => {
  const attempts = [1, 1, 3, 3, 3, 1];
  return attempts[taskIndex] || 1;
};

// ==================== УТИЛИТЫ ====================
const detectGender = (fullName) => {
  if (!fullName) return 'Не указан';
  const lastName = fullName.split(' ')[0];
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
const HomeIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.69-8.69a2.25 2.25 0 00-3.18 0l-8.69 8.69a.75.75 0 001.06 1.06l8.69-8.69z" />
    <path d="M12 5.432l8.159 8.159a2.25 2.25 0 01.659 1.591v5.568a.75.75 0 01-.75.75h-5.25a.75.75 0 01-.75-.75v-4.5c0-.414-.336-.75-.75-.75h-3c-.414 0-.75.336-.75.75v4.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-5.568a2.25 2.25 0 01.659-1.591L12 5.432z" />
  </svg>
);

const ServicesIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm1.5 1.5h9A1.5 1.5 0 0118 6v12a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 015.5 18V6A1.5 1.5 0 017 4.5zm2 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3a.75.75 0 000 1.5h4a.75.75 0 000-1.5H9z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM9 12a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3a.75.75 0 000 1.5h4a.75.75 0 000-1.5H9z" clipRule="evenodd" />
  </svg>
);

const ProfileIcon = ({ active, isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 transition-all duration-200 hover:scale-110 ${active ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

const MegaphoneIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M16.881 4.345A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.402A19.52 19.52 0 0021 18.75V5.25a19.52 19.52 0 00-4.119-.905z" />
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

const ConferenceIcon = ({ isDark, active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${active ? 'text-white' : (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]')}`}>
    <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
  </svg>
);

const CameraIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.267 1.309l.422.691c.436.724 1.068 1.185 1.788 1.332a4.5 4.5 0 013.617 4.396v7.5a4.5 4.5 0 01-4.5 4.5H5.25a4.5 4.5 0 01-4.5-4.5v-7.5a4.5 4.5 0 013.617-4.396c.72-.147 1.352-.608 1.788-1.332l.422-.691c.437-.724 1.3-1.257 2.267-1.309zM2.25 11.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm16.5 0a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

const GroupIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
  </svg>
);

const ClockIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 mr-1 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

const ArrowBackIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
  </svg>
);

const NewsIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 mr-2 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 003 3h15a3 3 0 01-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125zM12 9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H12zm-.75-2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75zM6 12.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H6zm-.75 3.75a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75zM6 6.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3A.75.75 0 009 6.75H6z" clipRule="evenodd" />
  </svg>
);

const EditIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 mr-1 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
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

const SendIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
  </svg>
);

const DeleteIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = ({ isDark }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 transition-transform ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}>
    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
  </svg>
);

// ==================== ДАННЫЕ ====================
const NEWS = [
  { id: 1, title: 'Приём заявок на ВКР завершён', desc: 'Заявки принимались до 1 марта 2026', date: '2 мар. 2026 г.', important: true, tags: ['важно'] },
  { id: 2, title: 'Утверждение тем до 1 апреля', desc: 'Не забудьте утвердить темы дипломников', date: '15 мар. 2026 г.', important: true, tags: ['дедлайн'] },
  { id: 3, title: 'График защит утверждён', desc: 'Защиты пройдут с 1 по 20 июня', date: '10 апр. 2026 г.', important: false, tags: ['защита'] },
];

const VKR_TASKS = [
  'Утверждение темы ВКР',
  'Заявление на ВКР',
  'Введение и обзор литературы',
  'Глава 1. Теоретическая часть',
  'Глава 2. Практическая часть',
  'Итоговая версия',
];

const DEMO_PENDING_APPLICATIONS = [
  { id: 101, studentName: 'Иванов Иван Иванович', group: 'ИКБО-01-23', date: '25.02.2026', gpa: 4.8, course: 3, degree: 'Бакалавриат', topicProposed: false },
  { id: 102, studentName: 'Петров Пётр Петрович', group: 'ИКБО-02-23', date: '27.02.2026', gpa: 4.5, course: 4, degree: 'Бакалавриат', topicProposed: true, proposedTopic: 'Анализ больших данных' },
];

const DEMO_DIPLOMNIKS = [
  { id: 4, studentName: 'Смирнов Алексей Владимирович', group: 'ИКБО-04-22', topic: 'Веб-сервис для бронирования', gpa: 4.6, course: 4, degree: 'Бакалавриат' },
  { id: 5, studentName: 'Морозова Елена Игоревна', group: 'ИКБО-05-22', topic: null, gpa: 4.4, course: 4, degree: 'Бакалавриат' },
  { id: 6, studentName: 'Козлов Дмитрий Андреевич', group: 'ИКМО-01-22', topic: 'Исследование алгоритмов шифрования', gpa: 4.7, course: 4, degree: 'Магистратура' },
];

const DEMO_SUBMITTED_TASKS = [
  { id: 1, studentId: 4, studentName: 'Смирнов Алексей Владимирович', taskName: 'Утверждение темы ВКР', taskIndex: 0, description: 'Необходимо согласовать тему ВКР с руководителем.', openFrom: '15 марта 2026, 00:00', deadline: '1 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 1, status: 'submitted', gradeStatus: 'graded', grade: '5,0 / 5,0', gradedDate: '2 апреля 2026, 10:30', gradedBy: null, feedback: 'Тема утверждена.', submittedDate: '28 марта 2026, 15:20', files: [{ name: 'Тема_ВКР_Смирнов.docx', date: '28 марта 2026, 15:20' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 2, studentId: 4, studentName: 'Смирнов Алексей Владимирович', taskName: 'Заявление на ВКР', taskIndex: 1, description: 'Заполните и загрузите заявление на ВКР.', openFrom: '15 марта 2026, 00:00', deadline: '5 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 1, status: 'submitted', gradeStatus: 'graded', grade: '5,0 / 5,0', gradedDate: '6 апреля 2026, 09:15', gradedBy: null, feedback: 'Заявление принято.', submittedDate: '3 апреля 2026, 11:40', files: [{ name: 'Заявление_Смирнов.pdf', date: '3 апреля 2026, 11:40' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 3, studentId: 4, studentName: 'Смирнов Алексей Владимирович', taskName: 'Введение и обзор литературы', taskIndex: 2, description: 'Подготовьте введение и обзор литературы.', openFrom: '28 марта 2026, 00:00', deadline: '3 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 3, status: 'submitted', gradeStatus: 'graded', grade: '4,5 / 5,0', gradedDate: '4 апреля 2026, 15:46', gradedBy: null, feedback: 'Хорошая работа.', submittedDate: '3 апреля 2026, 22:02', files: [{ name: 'Введение_Смирнов.docx', date: '3 апреля 2026, 20:16' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 4, studentId: 4, studentName: 'Смирнов Алексей Владимирович', taskName: 'Глава 1. Теоретическая часть', taskIndex: 3, description: 'Разработайте теоретическую часть ВКР.', openFrom: '5 апреля 2026, 00:00', deadline: '20 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 3, status: 'submitted', gradeStatus: 'graded', grade: '5,0 / 5,0', gradedDate: '21 апреля 2026, 10:15', gradedBy: null, feedback: 'Отличная работа!', submittedDate: '18 апреля 2026, 14:30', files: [{ name: 'Глава1_Смирнов.docx', date: '18 апреля 2026, 14:30' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 5, studentId: 4, studentName: 'Смирнов Алексей Владимирович', taskName: 'Глава 2. Практическая часть', taskIndex: 4, description: 'Разработайте практическую часть ВКР.', openFrom: '25 апреля 2026, 00:00', deadline: '15 мая 2026, 23:59', attemptNumber: 1, maxAttempts: 3, status: 'submitted', gradeStatus: 'not_graded', grade: null, gradedDate: null, gradedBy: null, feedback: null, submittedDate: '14 мая 2026, 11:20', files: [{ name: 'Глава2_Смирнов.docx', date: '14 мая 2026, 11:20' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 6, studentId: 5, studentName: 'Морозова Елена Игоревна', taskName: 'Утверждение темы ВКР', taskIndex: 0, description: 'Необходимо согласовать тему ВКР.', openFrom: '15 марта 2026, 00:00', deadline: '1 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 1, status: 'submitted', gradeStatus: 'graded', grade: '5,0 / 5,0', gradedDate: '28 марта 2026, 14:20', gradedBy: null, feedback: 'Тема утверждена.', submittedDate: '25 марта 2026, 10:30', files: [{ name: 'Тема_ВКР_Морозова.docx', date: '25 марта 2026, 10:30' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 7, studentId: 5, studentName: 'Морозова Елена Игоревна', taskName: 'Введение и обзор литературы', taskIndex: 2, description: 'Подготовьте введение и обзор литературы.', openFrom: '28 марта 2026, 00:00', deadline: '3 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 3, status: 'submitted', gradeStatus: 'not_graded', grade: null, gradedDate: null, gradedBy: null, feedback: null, submittedDate: '2 апреля 2026, 18:30', files: [{ name: 'Введение_Морозова.docx', date: '2 апреля 2026, 18:30' }], timeRemaining: 'Ответ на задание представлен заранее' },
  { id: 8, studentId: 6, studentName: 'Козлов Дмитрий Андреевич', taskName: 'Глава 1. Теоретическая часть', taskIndex: 3, description: 'Разработайте теоретическую часть ВКР.', openFrom: '5 апреля 2026, 00:00', deadline: '20 апреля 2026, 23:59', attemptNumber: 1, maxAttempts: 3, status: 'submitted', gradeStatus: 'not_graded', grade: null, gradedDate: null, gradedBy: null, feedback: null, submittedDate: '19 апреля 2026, 09:15', files: [{ name: 'Глава1_Козлов.docx', date: '19 апреля 2026, 09:15' }], timeRemaining: 'Ответ на задание представлен заранее' },
];

const FORUM_QUESTIONS = [
  { id: 1, question: 'Требования к оформлению списка литературы?', author: 'Петров П.П.', time: '09:20', date: '15 апреля 2026', answers: [
    { id: 11, text: 'ГОСТ Р 7.0.5-2008, в методичке есть примеры', author: 'Иванов И.И.', time: '09:35', date: '15 апреля 2026' },
  ]},
  { id: 2, question: 'Какой процент оригинальности требуется?', author: 'Сидорова А.С.', time: '11:10', date: '16 апреля 2026', answers: [
    { id: 21, text: 'От 70% для бакалавров, от 80% для магистров', author: 'Преподаватель', time: '11:25', date: '16 апреля 2026' },
  ]},
];

// ==================== КОМПОНЕНТ ГРУППЫ В ЧАТАХ ====================
const GroupChatItem = ({ group, isDark, theme, onSelect, onUpdateName, onDeleteGroup, diplomniks }) => {
  const [showMembers, setShowMembers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);

  const handleSaveName = () => { if (editName.trim()) onUpdateName(editName.trim()); setIsEditing(false); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditName(group.name); setIsEditing(false); } };
  const getStudentName = (id) => diplomniks.find(d => d.id === id)?.studentName || 'Неизвестный студент';
  const getStudentGroup = (id) => diplomniks.find(d => d.id === id)?.group || '';

  const handleDelete = () => setShowDeleteConfirm(true);
  const confirmDelete = () => { onDeleteGroup(group.id); setShowDeleteConfirm(false); };

  return (
    <div className={`rounded-xl overflow-hidden ${theme.card}`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>
            <GroupIcon isDark={isDark} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input ref={inputRef} type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleSaveName} onKeyDown={handleKeyDown} className={`text-sm px-2 py-1 rounded ${theme.input} focus:outline-none`} />
              ) : (
                <>
                  <p className={`font-medium ${theme.text}`}>{group.name}</p>
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-[#2A2A3A] text-[#A78BFA]' : 'hover:bg-gray-100 text-[#2563EB]'}`} title="Редактировать"><EditIcon isDark={isDark} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}`} title="Удалить группу"><DeleteIcon isDark={isDark} /></button>
                </>
              )}
            </div>
            <p className={`text-xs ${theme.textMuted}`}>{group.course} курс • {group.students.length} студентов</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all ${isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'}`}>Открыть чат</button>
          <button onClick={(e) => { e.stopPropagation(); setShowMembers(!showMembers); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#2A2A3A] text-gray-300 hover:bg-[#3A3A4A]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{showMembers ? 'Скрыть' : 'Участники'}</button>
        </div>
      </div>
      {showMembers && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'}`}>
          <div className="pt-3 space-y-2 max-h-48 overflow-y-auto members-list" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.members-list::-webkit-scrollbar { display: none; }`}</style>
            {group.students.length === 0 ? <p className={`text-sm text-center ${theme.textMuted}`}>Нет участников</p> : group.students.map(id => (
              <div key={id} className={`p-2 rounded-lg flex items-center gap-2 ${theme.cardInner}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>{getStudentName(id).charAt(0)}</div>
                <div className="flex-1"><p className={`text-sm ${theme.text}`}>{getStudentName(id)}</p><p className={`text-xs ${theme.textMuted}`}>{getStudentGroup(id)}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className={`rounded-2xl max-w-sm w-full p-6 ${theme.card}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${theme.text}`}>Удалить группу?</h3>
            <p className={`text-sm mb-6 ${theme.textSecondary}`}>Вы уверены, что хотите удалить группу "{group.name}"?</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600">Удалить</button>
              <button onClick={() => setShowDeleteConfirm(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${theme.card} ${theme.text}`}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== КОМПОНЕНТЫ ЧАТА ====================
const Message = ({ text, isMyMessage, timestamp, sender, onContextMenu, messageId, isEditing, editText, onEditChange, onSaveEdit, onCancelEdit, isDark }) => {
  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
  if (isEditing) {
    return (
      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} py-1`}>
        <div className="flex items-center gap-1">
          <input type="text" value={editText} onChange={(e) => onEditChange(e.target.value)} className={`px-3 py-2 rounded-xl text-sm focus:outline-none ${isDark ? 'bg-[#2A2A3A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400'}`} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSaveEdit(messageId); } if (e.key === 'Escape') onCancelEdit(); }} autoFocus />
          <button onClick={() => onSaveEdit(messageId)} className={`p-1.5 rounded-full text-white ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>✓</button>
          <button onClick={onCancelEdit} className={`p-1.5 rounded-full text-white ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}>✕</button>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} py-1`}>
      {!isMyMessage && <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-auto ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>{sender?.charAt(0) || 'S'}</div>}
      <div className={`max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`p-3 rounded-2xl ${isMyMessage ? (isDark ? 'bg-[#A78BFA] text-white rounded-br-md' : 'bg-[#2563EB] text-white rounded-br-md') : (isDark ? 'bg-[#2E7D32] text-white rounded-bl-md' : 'bg-[#E8F5E9] text-gray-800 rounded-bl-md')}`} onContextMenu={(e) => isMyMessage && onContextMenu(e, messageId)}>
          <p className="text-sm break-words leading-relaxed">{text}</p>
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isMyMessage ? 'text-white/70' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>{formatTime(timestamp)}</span>
          {isMyMessage && <span className="text-[10px] text-white/90">✓✓</span>}
        </div>
      </div>
      {isMyMessage && <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 mt-auto ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>Я</div>}
    </div>
  );
};

const MessageList = ({ messages, currentUserId, onContextMenu, editingMessageId, editText, onEditChange, onSaveEdit, onCancelEdit, messagesEndRef, isDark }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
    <style>{`.flex-1::-webkit-scrollbar { display: none; }`}</style>
    {messages.length === 0 ? <div className="flex items-center justify-center h-full"><p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Нет сообщений. Начните общение!</p></div> : messages.map((msg) => <Message key={msg.id} {...msg} isMyMessage={msg.sender === 'teacher'} onContextMenu={onContextMenu} isEditing={editingMessageId === msg.id} editText={editText} onEditChange={onEditChange} onSaveEdit={onSaveEdit} onCancelEdit={onCancelEdit} isDark={isDark} />)}
    <div ref={messagesEndRef} />
  </div>
);

const MessageInput = ({ onSendMessage, isEditing, editText, onSaveEdit, messageId, onCancelEdit, isDark }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (isEditing && editText) setText(editText); inputRef.current?.focus(); }, [isEditing, editText]);
  const handleSubmit = (e) => { e.preventDefault(); if (isEditing) { if (text.trim()) onSaveEdit(messageId); } else { if (text.trim()) { onSendMessage(text); setText(''); } } };
  return (
    <form onSubmit={handleSubmit} className={`p-4 border-t flex gap-2 ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'}`}>
      <input ref={inputRef} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={isEditing ? "Редактирование..." : "Введите сообщение..."} className={`flex-1 px-4 py-3 rounded-full focus:outline-none ${isDark ? 'bg-[#2A2A3A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400'}`} autoComplete="off" />
      <button type="submit" disabled={!text.trim()} className={`p-3 rounded-full font-medium text-white transition-all ${text.trim() ? (isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]') : 'bg-gray-400 cursor-not-allowed'}`}><SendIcon isDark={isDark} /></button>
      {isEditing && <button type="button" onClick={onCancelEdit} className={`p-3 rounded-full text-white ${isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}>✕</button>}
    </form>
  );
};

const ChatComponent = ({ chat, onBack, isDark, currentUserId, onUpdateChat, onSendMessage }) => {
  const [messages, setMessages] = useState(chat.messages || []);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, messageId: null });
  const messagesEndRef = useRef(null);
  
  // Определяем статус студента
  const studentOnline = chat.messages?.length > 0 
    ? (Date.now() - chat.messages[chat.messages.length - 1].timestamp) < 300000 // 5 минут
    : false;
    
  const getLastSeenFormatted = () => {
    if (!chat.messages || chat.messages.length === 0) return null;
    const lastMsg = chat.messages[chat.messages.length - 1];
    const date = new Date(lastMsg.timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `Был(а) в сети ${day}.${month}.${year} в ${hours}:${minutes}`;
  };
  
  const lastSeenText = getLastSeenFormatted();
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  
  const handleSendMessage = (text) => { 
    if (onSendMessage) {
      onSendMessage(chat.id, text);
    } else {
      const newMessage = { id: Date.now(), text, sender: 'teacher', senderName: 'Преподаватель', timestamp: Date.now() }; 
      const updated = [...messages, newMessage]; 
      setMessages(updated); 
      if (onUpdateChat) onUpdateChat(chat.id, updated); 
    }
  };
  
  const handleContextMenu = (e, messageId) => { e.preventDefault(); setContextMenu({ show: true, x: e.clientX, y: e.clientY, messageId }); };
  const closeContextMenu = () => setContextMenu({ show: false, x: 0, y: 0, messageId: null });
  
  const handleEditMessage = () => { 
    const msg = messages.find(m => m.id === contextMenu.messageId); 
    if (msg) { setEditingMessageId(msg.id); setEditText(msg.text); } 
    closeContextMenu(); 
  };
  
  const handleDeleteMessage = () => { 
    const updated = messages.filter(m => m.id !== contextMenu.messageId); 
    setMessages(updated); 
    if (onUpdateChat) onUpdateChat(chat.id, updated); 
    closeContextMenu(); 
  };
  
  const handleSaveEdit = (id) => { 
    if (!editText.trim()) return; 
    const updated = messages.map(m => m.id === id ? { ...m, text: editText, edited: true } : m); 
    setMessages(updated); 
    if (onUpdateChat) onUpdateChat(chat.id, updated); 
    setEditingMessageId(null); setEditText(''); 
  };
  
  const theme = { bg: isDark ? 'bg-[#121218]' : 'bg-white', header: isDark ? 'bg-[#1E1E2A] border-[#2A2A3A]' : 'bg-white border-gray-200', card: isDark ? 'bg-[#1E1E2A]' : 'bg-white', text: isDark ? 'text-[#F1F5F9]' : 'text-[#1E293B]', textMuted: isDark ? 'text-[#94A3B8]' : 'text-[#64748B]' };
  
  return (
    <div className={`flex flex-col h-full ${theme.card} rounded-xl overflow-hidden`} onClick={closeContextMenu}>
      <div className={`p-4 border-b ${theme.header} flex items-center gap-3`}>
        <button onClick={onBack} className={`p-2 rounded-full ${theme.textMuted} ${isDark ? 'hover:bg-[#2A2A3A]' : 'hover:bg-gray-100'}`}>
          <ArrowBackIcon isDark={isDark} />
        </button>
        <div className="relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>
            {chat.type === 'group' ? <GroupIcon isDark={isDark} /> : chat.studentName?.charAt(0) || chat.name?.charAt(0) || 'S'}
          </div>
          {/* Индикатор онлайн статуса */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${isDark ? 'border-[#1E1E2A]' : 'border-white'} ${
            studentOnline ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${theme.text}`}>
            {chat.type === 'group' ? chat.name : chat.studentName}
          </h3>
          <p className={`text-xs ${
            studentOnline 
              ? (isDark ? 'text-green-400' : 'text-green-600') 
              : theme.textMuted
          }`}>
            {chat.type === 'group' 
              ? `${chat.course} курс • ${chat.students?.length || 0} студентов`
              : studentOnline 
                ? 'В сети' 
                : lastSeenText || 'Был(а) в сети 10.04.2026'
            }
          </p>
        </div>
      </div>
      <MessageList messages={messages} currentUserId={currentUserId} onContextMenu={handleContextMenu} editingMessageId={editingMessageId} editText={editText} onEditChange={setEditText} onSaveEdit={handleSaveEdit} onCancelEdit={() => { setEditingMessageId(null); setEditText(''); }} messagesEndRef={messagesEndRef} isDark={isDark} />
      <MessageInput onSendMessage={handleSendMessage} isEditing={editingMessageId !== null} editText={editText} messageId={editingMessageId} onSaveEdit={handleSaveEdit} onCancelEdit={() => { setEditingMessageId(null); setEditText(''); }} isDark={isDark} />
      {contextMenu.show && (
        <div className={`fixed z-50 py-1 rounded-lg shadow-xl ${isDark ? 'bg-[#1E1E2A] border border-[#2A2A3A]' : 'bg-white border border-gray-200'}`} style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={handleEditMessage} className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-white hover:bg-[#2A2A3A]' : 'text-gray-700 hover:bg-gray-100'}`}><EditIcon isDark={isDark} /> Редактировать</button>
          <button onClick={handleDeleteMessage} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><DeleteIcon isDark={isDark} /> Удалить</button>
        </div>
      )}
    </div>
  );
};

// ==================== МОДАЛКА КОНФЕРЕНЦИИ С КАСТОМНЫМ КАЛЕНДАРЕМ ====================
const ConferenceModal = ({ isDark, theme, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [link, setLink] = useState('');
  const [recordingLink, setRecordingLink] = useState('');
  const [description, setDescription] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
  const [tempHour, setTempHour] = useState(18);
  const [tempMinute, setTempMinute] = useState(0);
  const [dateError, setDateError] = useState('');
  const titleInputRef = useRef(null);
  const calendarRef = useRef(null);
  const timePickerRef = useRef(null);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const dateInputRef = useRef(null);

  useEffect(() => { titleInputRef.current?.focus(); }, []);
  
  // Закрытие календаря и time picker при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
      if (timePickerRef.current && !timePickerRef.current.contains(e.target)) setShowTimePicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Скролл к выбранному времени
  useEffect(() => {
    if (showTimePicker) {
      setTimeout(() => {
        if (hourScrollRef.current) hourScrollRef.current.querySelector(`[data-hour="${tempHour}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (minuteScrollRef.current) minuteScrollRef.current.querySelector(`[data-minute="${tempMinute}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 50);
    }
  }, [showTimePicker, tempHour, tempMinute]);

  const formatDateForDisplay = (d) => {
    if (!d) return '';
    if (typeof d === 'string' && d.includes('-')) {
      const [y, m, day] = d.split('-');
      return `${day}.${m}.${y}`;
    }
    return d;
  };

  const handleDateInputChange = (e) => {
    const input = e.target;
    // Разрешаем только цифры и точки
    let value = input.value.replace(/[^\d.]/g, '');
    
    // Автодобавление точек
    if (value.length >= 2 && !value.includes('.')) {
      value = value.slice(0, 2) + '.' + value.slice(2);
    }
    if (value.length >= 5 && value.indexOf('.', 3) === -1) {
      const parts = value.split('.');
      if (parts.length === 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2) + '.' + parts[1].slice(2);
      }
    }
    
    // Ограничение длины
    if (value.length > 10) value = value.slice(0, 10);
    
    input.value = value;
    
    // Проверка формата ДД.ММ.ГГГГ
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      const d = new Date(year, month - 1, day);
      
      if (d.getDate() === day && d.getMonth() === month - 1 && d.getFullYear() === year) {
        setDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        setSelectedDate(d);
        setTempSelectedDate(d);
        setDateError('');
      } else {
        setDateError('Неверная дата');
        setDate('');
      }
    } else if (value.length === 10) {
      setDateError('Неверный формат');
      setDate('');
    } else {
      setDate('');
      setDateError(value.length > 0 ? '' : '');
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !date || !link.trim()) {
      alert('Заполните обязательные поля: название, дата и ссылка');
      return;
    }
    onAdd({
      title: title.trim(),
      date: `${date}T${time}`,
      link: link.trim(),
      recordingLink: recordingLink.trim(),
      description: description.trim()
    });
    onClose();
  };

  const year = tempSelectedDate.getFullYear();
  const month = tempSelectedDate.getMonth();
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const isToday = (d) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const isSelected = (d) => {
    return selectedDate && d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          div::-webkit-scrollbar { display: none; }
          .time-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .time-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${theme.text}`}>Новая конференция</h3>
          <button onClick={onClose} className={`p-1 rounded-full ${isDark ? 'hover:bg-[#2A2A3A]' : 'hover:bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${theme.textMuted}`} viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Название */}
        <input
          ref={titleInputRef}
          type="text"
          placeholder="Название конференции *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-3 rounded-lg text-sm mb-3 ${theme.input} focus:outline-none`}
        />

        {/* Дата и время */}
        <div className="flex gap-2 mb-3">
          {/* Поле даты с календарем */}
          <div className="flex-1 relative" ref={calendarRef}>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="text"
                placeholder="ДД.ММ.ГГГГ *"
                defaultValue={date ? formatDateForDisplay(date) : ''}
                onChange={handleDateInputChange}
                onFocus={() => {
                  if (date) {
                    const [y, m, d] = date.split('-');
                    setTempSelectedDate(new Date(+y, +m - 1, +d));
                    setSelectedDate(new Date(+y, +m - 1, +d));
                  } else {
                    setTempSelectedDate(new Date());
                    setSelectedDate(new Date());
                  }
                }}
                className={`w-full p-3 pr-10 rounded-lg text-sm ${theme.input} focus:outline-none ${dateError ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${isDark ? 'text-[#A78BFA] hover:bg-[#2A2A3A]' : 'text-[#2563EB] hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {dateError && <p className="text-red-500 text-xs mt-1 absolute">{dateError}</p>}
            
            {/* Кастомный календарь */}
            {showCalendar && (
              <div className={`absolute z-50 mt-2 p-4 rounded-xl shadow-2xl border ${isDark ? 'bg-[#2A2A3A] border-[#3A3A4A]' : 'bg-white border-gray-200'}`} style={{ width: '280px', left: -10 }}>
                {/* Навигация по месяцам */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setTempSelectedDate(new Date(year, month - 1, 1))}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-[#3A3A4A] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className={`font-medium ${theme.text}`}>
                    {monthNames[month]} {year}
                  </span>
                  <button
                    onClick={() => setTempSelectedDate(new Date(year, month + 1, 1))}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-[#3A3A4A] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Дни недели */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(d => (
                    <div key={d} className={`text-xs font-medium text-center ${theme.textMuted}`}>{d}</div>
                  ))}
                </div>

                {/* Дни месяца */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const currentDate = new Date(year, month, day);
                    const isSel = isSelected(currentDate);
                    const isTdy = isToday(currentDate);
                    
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setTempSelectedDate(currentDate);
                          setSelectedDate(currentDate);
                          const y = currentDate.getFullYear();
                          const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                          const d = String(currentDate.getDate()).padStart(2, '0');
                          setDate(`${y}-${m}-${d}`);
                          if (dateInputRef.current) {
                            dateInputRef.current.value = `${d}.${m}.${y}`;
                          }
                          setShowCalendar(false);
                          setDateError('');
                        }}
                        className={`p-2 text-sm rounded-lg transition-colors ${
                          isSel
                            ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white')
                            : isTdy
                              ? (isDark ? 'bg-[#3A3A4A] text-white font-medium' : 'bg-blue-50 text-[#2563EB] font-medium')
                              : (isDark ? 'text-gray-300 hover:bg-[#3A3A4A]' : 'text-gray-700 hover:bg-gray-100')
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Кнопки быстрых действий */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setTempSelectedDate(today);
                      setSelectedDate(today);
                      const y = today.getFullYear();
                      const m = String(today.getMonth() + 1).padStart(2, '0');
                      const d = String(today.getDate()).padStart(2, '0');
                      setDate(`${y}-${m}-${d}`);
                      if (dateInputRef.current) {
                        dateInputRef.current.value = `${d}.${m}.${y}`;
                      }
                      setShowCalendar(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#3A3A4A] text-gray-300 hover:bg-[#4A4A5A]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Сегодня
                  </button>
                  <button
                    onClick={() => {
                      const y = tempSelectedDate.getFullYear();
                      const m = String(tempSelectedDate.getMonth() + 1).padStart(2, '0');
                      const d = String(tempSelectedDate.getDate()).padStart(2, '0');
                      setDate(`${y}-${m}-${d}`);
                      setSelectedDate(tempSelectedDate);
                      if (dateInputRef.current) {
                        dateInputRef.current.value = `${d}.${m}.${y}`;
                      }
                      setShowCalendar(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium text-white ${isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'}`}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Поле времени с time picker */}
          <div className="w-28 relative" ref={timePickerRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="ЧЧ:ММ"
                value={time}
                onChange={(e) => setTime(e.target.value.replace(/[^\d:]/g, ''))}
                onFocus={() => {
                  setShowTimePicker(true);
                  const [h, m] = time.split(':').map(Number);
                  setTempHour(h || 18);
                  setTempMinute(m || 0);
                }}
                className={`w-full p-3 pr-10 rounded-lg text-sm ${theme.input} focus:outline-none`}
              />
              <button
                onClick={() => setShowTimePicker(!showTimePicker)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg ${isDark ? 'text-[#A78BFA] hover:bg-[#2A2A3A]' : 'text-[#2563EB] hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Кастомный time picker */}
            {showTimePicker && (
              <div className={`absolute z-50 mt-2 p-4 rounded-xl shadow-2xl border ${isDark ? 'bg-[#2A2A3A] border-[#3A3A4A]' : 'bg-white border-gray-200'}`} style={{ width: '220px', right: 0 }}>
                <div className="flex gap-2">
                  {/* Часы */}
                  <div className="flex-1">
                    <p className={`text-xs font-medium mb-2 text-center ${theme.textMuted}`}>Часы</p>
                    <div ref={hourScrollRef} className="time-scroll max-h-40 overflow-y-auto snap-y snap-mandatory" style={{ scrollSnapType: 'y mandatory' }}>
                      {hours.map(h => (
                        <button
                          key={h}
                          data-hour={h}
                          onClick={() => setTempHour(h)}
                          className={`w-full py-2 px-2 rounded-lg text-sm mb-1 snap-center transition-colors ${
                            tempHour === h
                              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white')
                              : (isDark ? 'text-gray-300 hover:bg-[#3A3A4A]' : 'text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          {String(h).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Минуты */}
                  <div className="flex-1">
                    <p className={`text-xs font-medium mb-2 text-center ${theme.textMuted}`}>Минуты</p>
                    <div ref={minuteScrollRef} className="time-scroll max-h-40 overflow-y-auto snap-y snap-mandatory" style={{ scrollSnapType: 'y mandatory' }}>
                      {minutes.map(m => (
                        <button
                          key={m}
                          data-minute={m}
                          onClick={() => setTempMinute(m)}
                          className={`w-full py-2 px-2 rounded-lg text-sm mb-1 snap-center transition-colors ${
                            tempMinute === m
                              ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white')
                              : (isDark ? 'text-gray-300 hover:bg-[#3A3A4A]' : 'text-gray-700 hover:bg-gray-100')
                          }`}
                        >
                          {String(m).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Кнопки быстрых действий */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const now = new Date();
                      setTempHour(now.getHours());
                      setTempMinute(now.getMinutes());
                      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                      setShowTimePicker(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#3A3A4A] text-gray-300 hover:bg-[#4A4A5A]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Сейчас
                  </button>
                  <button
                    onClick={() => {
                      setTime(`${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`);
                      setShowTimePicker(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium text-white ${isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'}`}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ссылка */}
        <input
          type="text"
          placeholder="Ссылка на конференцию *"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className={`w-full p-3 rounded-lg text-sm mb-3 ${theme.input} focus:outline-none`}
        />

        {/* Ссылка на запись */}
        <input
          type="text"
          placeholder="Ссылка на запись (необязательно)"
          value={recordingLink}
          onChange={(e) => setRecordingLink(e.target.value)}
          className={`w-full p-3 rounded-lg text-sm mb-3 ${theme.input} focus:outline-none`}
        />

        {/* Описание */}
        <textarea
          placeholder="Описание конференции"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full p-3 rounded-lg text-sm mb-4 ${theme.input} focus:outline-none resize-none`}
          rows="3"
        />

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all ${isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'}`}
          >
            Добавить
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#1E1E2A] text-white border border-[#2A2A3A] hover:bg-[#2A2A3A]' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
function TeacherCabinet({ user, profile, onLogout }) {
  const { API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('teacherActiveTab') || 'home');
  const [isDark, setIsDark] = useState(() => { const saved = localStorage.getItem('teacherTheme'); return saved ? saved === 'dark' : true; });
  const [activeNewsTab, setActiveNewsTab] = useState('all');
  const [servicesTab, setServicesTab] = useState('diplomniks');
  const [diplomniksSubTab, setDiplomniksSubTab] = useState('approved');
  const [diplomniksFilter, setDiplomniksFilter] = useState('all');
  const [pendingApplications, setPendingApplications] = useState([]);
  const [rejectDialog, setRejectDialog] = useState({ show: false, application: null });
  const [rejectReason, setRejectReason] = useState('');
  const [diplomniks, setDiplomniks] = useState([]);
  const [selectedDiplomnik, setSelectedDiplomnik] = useState(null);
  const [showDiplomnikModal, setShowDiplomnikModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState('');
  const [submittedTasks, setSubmittedTasks] = useState(DEMO_SUBMITTED_TASKS);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewGrade, setReviewGrade] = useState('');
  const [newTaskComment, setNewTaskComment] = useState('');
  const [forumQuestions, setForumQuestions] = useState(FORUM_QUESTIONS);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [forumAnswer, setForumAnswer] = useState('');
  const [conferences, setConferences] = useState([]);
  const [loadingConferences, setLoadingConferences] = useState(true);
  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', course: '4', students: [] });
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatFilter, setChatFilter] = useState('all');
  const [chats, setChats] = useState([]);
  const [showStartChatModal, setShowStartChatModal] = useState(false);

  const gender = detectGender(profile.full_name);
  const currentUserId = 'teacher';
  const teacherFullName = profile?.full_name || 'Преподаватель';

  useEffect(() => { initDemoData(); loadTeacherData(); }, []);
  useEffect(() => { loadTeacherData(); }, [user.id]);

  const loadTeacherData = () => {
    // Загружаем реальные заявки
    const pending = getTeacherPendingApplications(user.id);
    
    // ВСЕГДА показываем демо-заявки + реальные заявки
    const realPending = pending.map(app => ({
      id: app.id,
      studentName: app.studentName,
      group: app.studentGroup,
      date: app.date,
      course: app.studentCourse,
      degree: 'Бакалавриат',
      gpa: 4.5,
      topicProposed: !!app.topic,
      proposedTopic: app.topic
    }));
    
    // Объединяем демо и реальные заявки (демо всегда показываются)
    setPendingApplications([...DEMO_PENDING_APPLICATIONS, ...realPending]);
    
    // Загружаем реальных утверждённых студентов
    const approved = getTeacherApprovedStudents(user.id);
    const realApproved = approved.map(app => ({
      id: app.studentId,
      studentName: app.studentName,
      group: app.studentGroup,
      course: app.studentCourse,
      topic: app.topic,
      gpa: 4.5,
      degree: 'Бакалавриат'
    }));
    
    // ВСЕГДА показываем демо-студентов + реальных студентов
    setDiplomniks([...DEMO_DIPLOMNIKS, ...realApproved]);
    
    // Загружаем группы
    const teacherGroups = getTeacherGroups(user.id);
    setGroups(teacherGroups.length > 0 ? teacherGroups.map(g => ({
      ...g,
      messages: []
    })) : []);
    
    // Загружаем конференции
    const teacherConferences = getTeacherConferences(user.id);
    setConferences(teacherConferences);
    setLoadingConferences(false);
    
    // Объединяем демо и реальных студентов для чатов
    const allDiplomniks = [...DEMO_DIPLOMNIKS, ...realApproved];
    const studentChats = allDiplomniks.map(student => {
      const messages = getPersonalChatMessages(student.id, user.id);
      return {
        id: student.id,
        studentName: student.studentName,
        course: student.course,
        messages: messages.length > 0 ? messages.map(m => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          senderName: m.sender === 'student' ? student.studentName : profile.full_name,
          timestamp: m.timestamp
        })) : []
      };
    });
    setChats(studentChats);
  };

  useEffect(() => { if (teacherFullName && teacherFullName !== 'Преподаватель') { setSubmittedTasks(prev => prev.map(task => task.gradeStatus === 'graded' ? { ...task, gradedBy: teacherFullName } : task)); } }, [teacherFullName]);
  useEffect(() => { localStorage.setItem('teacherTheme', isDark ? 'dark' : 'light'); }, [isDark]);
  useEffect(() => { localStorage.setItem('teacherActiveTab', activeTab); }, [activeTab]);

  const filteredNews = activeNewsTab === 'all' ? NEWS : NEWS.filter(n => n.important);
  const filteredDiplomniks = diplomniks.filter(d => {
    if (diplomniksFilter === 'all') return true;
    if (diplomniksFilter === 'course4') return d.course === 4;
    if (diplomniksFilter === 'course3') return d.course === 3;
    return true;
  });
  
  const calculateProgress = (sid) => {
    const tasks = submittedTasks.filter(t => t.studentId === sid);
    const done = tasks.filter(t => t.gradeStatus === 'graded' && t.grade && parseFloat(t.grade) >= 3).length;
    return Math.round((done / VKR_TASKS.length) * 100);
  };
  
  const studentsWithSubmissions = diplomniks.map(s => ({ ...s, submittedTasks: submittedTasks.filter(t => t.studentId === s.id) }));
  
  const handleAccept = (app) => { const result = approveApplication(app.id, user.id); if (result.success) loadTeacherData(); };
  const handleReject = (app) => setRejectDialog({ show: true, application: app });
  const confirmReject = () => { const result = rejectApplication(rejectDialog.application.id, user.id, rejectReason || 'Без указания причины'); if (result.success) { loadTeacherData(); setRejectDialog({ show: false, application: null }); setRejectReason(''); } };
  
  const openDiplomnikModal = (d) => { setSelectedDiplomnik(d); setShowDiplomnikModal(true); };
  const openTopicModal = (d) => { setSelectedDiplomnik(d); setEditingTopic(d.proposedTopic || ''); setShowTopicModal(true); };
  const saveTopic = () => { if (!editingTopic.trim()) return; setDiplomniks(diplomniks.map(d => d.id === selectedDiplomnik.id ? { ...d, topic: editingTopic } : d)); setShowTopicModal(false); };
  
  const openTaskModal = (t) => { setSelectedTask(t); setNewTaskComment(''); setShowTaskModal(true); };
  const openReviewModal = (t) => { setSelectedTask(t); setReviewComment(t.feedback || ''); setReviewGrade(t.grade ? t.grade.split(' ')[0].replace(',', '.') : ''); setShowReviewModal(true); };
  
  const submitReview = () => {
    if (!reviewGrade || !selectedTask) return;
    const result = gradeTask(selectedTask.studentId, selectedTask.taskIndex, selectedTask.taskName, user.id, profile.full_name, reviewGrade, reviewComment);
    if (result.success) {
      setSubmittedTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, gradeStatus: 'graded', grade: `${reviewGrade} / 5,0`, gradedDate: new Date().toLocaleDateString('ru-RU') + ', ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), gradedBy: profile.full_name, feedback: reviewComment } : t));
      setShowReviewModal(false);
    }
  };
  
  const addTaskComment = () => { if (!newTaskComment.trim()) return; setSubmittedTasks(submittedTasks.map(t => t.id === selectedTask.id ? { ...t, feedback: t.feedback ? t.feedback + '\n\nДоп. комментарий: ' + newTaskComment : newTaskComment } : t)); setSelectedTask(submittedTasks.find(t => t.id === selectedTask.id)); setNewTaskComment(''); };
  
  const createGroup = () => { if (!newGroup.name.trim()) return; const result = createTeacherGroup(user.id, newGroup.name, parseInt(newGroup.course), newGroup.students); if (result.success) { setGroups([...groups, { ...result.group, messages: [] }]); setNewGroup({ name: '', course: '4', students: [] }); setShowGroupModal(false); } };
  const updateGroupNameHandler = (id, name) => { if (!name.trim()) return; const result = updateGroupName(user.id, id, name); if (result.success) setGroups(groups.map(g => g.id === id ? { ...g, name } : g)); };
  const deleteGroupHandler = (id) => { const result = deleteTeacherGroup(user.id, id); if (result.success) { setGroups(groups.filter(g => g.id !== id)); if (selectedChat?.type === 'group' && selectedChat?.id === id) setSelectedChat(null); } };
  
  const handleUpdateChat = (id, msgs) => {
    if (selectedChat?.type === 'group') { const upd = groups.map(g => g.id === id ? { ...g, messages: msgs } : g); setGroups(upd); setSelectedChat(upd.find(g => g.id === id)); }
    else { const upd = chats.map(c => c.id === id ? { ...c, messages: msgs } : c); setChats(upd); setSelectedChat(upd.find(c => c.id === id)); }
  };
  
  const handleSendPersonalMessage = (studentId, text) => {
    const result = sendPersonalMessage(studentId, user.id, 'teacher', user.id, profile.full_name, text);
    if (result.success) {
      const updatedChats = chats.map(c => c.id === studentId ? { ...c, messages: [...c.messages, { id: result.message.id, text: result.message.text, sender: result.message.sender, senderName: profile.full_name, timestamp: result.message.timestamp }] } : c);
      setChats(updatedChats);
      if (selectedChat?.id === studentId) setSelectedChat(updatedChats.find(c => c.id === studentId));
    }
    return result;
  };
  
  const addConferenceHandler = (conf) => {
    const result = addConference(user.id, conf);
    if (result.success) {
      setConferences([...conferences, result.conference]);
    }
  };
  
  const startChatWithStudent = (student) => {
    const existingChat = chats.find(c => c.id === student.id);
    if (existingChat) { setSelectedChat(existingChat); setServicesTab('chats'); }
    else { const newChat = { id: student.id, studentName: student.studentName, course: student.course, messages: [] }; setChats([...chats, newChat]); setSelectedChat(newChat); setServicesTab('chats'); }
  };
  
  const filteredChats = () => { let all = [...chats]; if (chatFilter === 'course4') all = chats.filter(c => c.course === 4); if (chatFilter === 'course3') all = chats.filter(c => c.course === 3); return all; };

  const theme = {
    bg: isDark ? 'bg-[#121218]' : 'bg-white', header: isDark ? 'bg-[#121218]/80 backdrop-blur-md border-[#2A2A3A]' : 'bg-white/80 backdrop-blur-md border-gray-200',
    card: isDark ? 'bg-[#1E1E2A] border border-[#2A2A3A]' : 'bg-white border border-gray-200 shadow-sm', cardInner: isDark ? 'bg-[#121218]' : 'bg-gray-50',
    text: isDark ? 'text-[#F1F5F9]' : 'text-[#1E293B]', textSecondary: isDark ? 'text-[#94A3B8]' : 'text-[#64748B]', textMuted: isDark ? 'text-[#64748B]' : 'text-[#94A3B8]',
    input: isDark ? 'bg-[#1E1E2A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400',
    inputChat: isDark ? 'bg-[#2A2A3A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400',
    bottomBar: isDark ? 'bg-[#1E1E2A]/90 backdrop-blur-xl border-[#2A2A3A]' : 'bg-white/90 backdrop-blur-xl border-gray-200 shadow-lg',
    myMessage: isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white', otherMessage: isDark ? 'bg-[#2E7D32] text-white' : 'bg-[#E8F5E9] text-gray-800',
    acceptBtn: 'bg-green-500 hover:bg-green-600 text-white', rejectBtn: isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA] text-white' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
    progressBg: isDark ? 'bg-gray-700' : 'bg-gray-200',
  };

  const noScrollbar = { scrollbarWidth: 'none', msOverflowStyle: 'none' };
  const scrollbarCSS = `html, body { background-color: ${isDark ? '#121218' : '#ffffff'}; min-height: 100vh; margin: 0; padding: 0; } .no-scrollbar::-webkit-scrollbar { display: none; } .forum-scroll::-webkit-scrollbar { display: none; } .answers-scroll::-webkit-scrollbar { display: none; } .conference-list::-webkit-scrollbar { display: none; } .chats-list::-webkit-scrollbar { display: none; } .members-list::-webkit-scrollbar { display: none; }`;

  const HomeScreen = () => (
    <div className="space-y-4 fade-in">
      <div className={`${isDark ? 'bg-[#1E1E2A] border-[#2A2A3A]' : 'bg-[#F8FAFC] border-gray-200'} rounded-2xl border p-5`}>
        <h2 className={`font-semibold text-lg flex items-center ${theme.text}`}><NewsIcon isDark={isDark} />Добрый день, {profile.full_name.split(' ').slice(1).join(' ')}!</h2>
        <p className={`text-sm ${theme.textSecondary}`}>{profile.position} • {profile.department}</p>
      </div>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-lg flex items-center ${theme.text}`}><MegaphoneIcon isDark={isDark} />Новости</h3>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button>
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
            <div className="p-4"><h4 className={`font-semibold mb-2 ${theme.text}`}>{item.title}</h4>{item.desc && <p className={`text-sm mb-3 ${theme.textSecondary}`}>{item.desc}</p>}<div className="flex items-center justify-between"><span className={`text-xs font-medium flex items-center ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}><ClockIcon isDark={isDark} />{item.date}</span><div className="flex gap-1">{item.tags?.map((tag, i) => <span key={i} className={`text-xs px-2 py-0.5 rounded-md font-medium border ${isDark ? 'text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10' : 'text-green-600 border-green-200 bg-green-50'}`}>{tag}</span>)}</div></div></div>
          </div>
        ))}
      </div>
    </div>
  );

  const ServicesScreen = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between"><h2 className={`font-semibold text-lg flex items-center ${theme.text}`}><ServicesIcon active={true} isDark={isDark} />Сервисы</h2><button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setServicesTab('diplomniks')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${servicesTab === 'diplomniks' ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')}`}><TeacherIcon isDark={isDark} active={servicesTab === 'diplomniks'} />Мои дипломники</button>
        <button onClick={() => setServicesTab('forum')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${servicesTab === 'forum' ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')}`}><ForumIcon isDark={isDark} active={servicesTab === 'forum'} />Форум</button>
        <button onClick={() => setServicesTab('conferences')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${servicesTab === 'conferences' ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')}`}><ConferenceIcon isDark={isDark} active={servicesTab === 'conferences'} />Конференции</button>
        <button onClick={() => setServicesTab('chats')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center ${servicesTab === 'chats' ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') : (isDark ? 'bg-[#1E1E2A] text-gray-400 border border-[#2A2A3A] hover:text-white' : 'bg-[#F8FAFC] text-gray-500 border border-gray-200 hover:text-gray-700')}`}><ChatIcon isDark={isDark} active={servicesTab === 'chats'} />Чаты</button>
      </div>
      <div className="pt-2">
        {servicesTab === 'diplomniks' && (
          <div className="space-y-3">
            <div className="flex gap-2 border-b pb-2" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
              <button onClick={() => setDiplomniksSubTab('approved')} className={`px-4 py-2 text-sm font-medium transition-all ${diplomniksSubTab === 'approved' ? (isDark ? 'text-white border-b-2 border-[#A78BFA]' : 'text-[#2563EB] border-b-2 border-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>Утверждённые ({diplomniks.length})</button>
              <button onClick={() => setDiplomniksSubTab('applications')} className={`px-4 py-2 text-sm font-medium transition-all ${diplomniksSubTab === 'applications' ? (isDark ? 'text-white border-b-2 border-[#A78BFA]' : 'text-[#2563EB] border-b-2 border-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>Заявки ({pendingApplications.length})</button>
            </div>
            {diplomniksSubTab === 'approved' && (
              <div className="space-y-3">
                {filteredDiplomniks.map(d => { const p = calculateProgress(d.id); return (
                  <div key={d.id} className={`w-full p-4 rounded-xl transition-all hover:scale-[1.01] text-left ${theme.card}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div><h4 className={`font-medium flex items-center ${theme.text}`}><TeacherIcon isDark={isDark} />{d.studentName}</h4><p className={`text-xs ${theme.textMuted}`}>{d.group} • {d.course} курс • {d.degree}</p><p className={`text-xs ${theme.textMuted}`}>Средний балл: {d.gpa}</p></div>
                    </div>
                    {d.topic && <p className={`text-sm mb-3 ${theme.textSecondary}`}>Тема: {d.topic}</p>}
                    <div><div className="flex items-center justify-between mb-1"><span className={`text-xs ${theme.textMuted}`}>Прогресс ВКР</span><span className={`text-xs font-medium ${theme.text}`}>{p}%</span></div><div className={`w-full h-2 ${theme.progressBg} rounded-full`}><div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${p}%` }} /></div></div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openDiplomnikModal(d)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-blue-100 text-[#2563EB]'}`}>Подробнее</button>
                      <button onClick={() => startChatWithStudent(d)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white'}`}><ChatIcon isDark={isDark} active={true} />Чат</button>
                    </div>
                  </div>
                ); })}
              </div>
            )}
            {diplomniksSubTab === 'applications' && (
              <div className="space-y-3">
                {pendingApplications.length === 0 ? <div className={`p-8 text-center rounded-xl ${theme.card}`}><TeacherIcon isDark={isDark} /><p className={`text-lg mb-2 ${theme.text}`}>Нет новых заявок</p></div> : pendingApplications.map(app => (
                  <div key={app.id} className={`p-4 rounded-xl ${theme.card} border-l-4 border-l-yellow-500`}>
                    <div className="flex items-start justify-between mb-2"><div><h4 className={`font-medium flex items-center ${theme.text}`}><TeacherIcon isDark={isDark} />{app.studentName}</h4><p className={`text-xs ${theme.textMuted}`}>{app.group} • {app.course} курс • {app.degree}</p><p className={`text-xs ${theme.textMuted}`}>Средний балл: {app.gpa}</p></div><span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>На рассмотрении</span></div>
                    {app.topicProposed && <p className={`text-sm mb-3 ${theme.textSecondary}`}>Предложенная тема: {app.proposedTopic}</p>}
                    <p className={`text-xs mb-3 ${theme.textMuted}`}>Подана: {app.date}</p>
                    <div className="flex gap-2"><button onClick={() => handleAccept(app)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${theme.acceptBtn}`}>Принять</button><button onClick={() => handleReject(app)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${theme.rejectBtn}`}>Отклонить</button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {servicesTab === 'forum' && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto forum-scroll" style={noScrollbar}><style>{scrollbarCSS}</style>
            {forumQuestions.map(q => (
              <div key={q.id} className={`rounded-xl overflow-hidden transition-all hover:scale-[1.01] ${theme.card}`}>
                <button onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)} className="w-full p-4 text-left">
                  <div className="flex items-start justify-between"><div className="flex-1"><p className={`font-medium flex items-center ${theme.text}`}><ForumIcon isDark={isDark} />{q.question}</p><p className={`text-xs mt-1 flex items-center ${theme.textMuted}`}><TeacherIcon isDark={isDark} />{q.author} • {q.date} в {q.time}</p></div><ChevronDownIcon isDark={isDark} className={`transition-transform ${expandedQuestion === q.id ? 'rotate-180' : ''}`} /></div>
                </button>
                {expandedQuestion === q.id && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
                    <div className="pt-3 space-y-3 max-h-[250px] overflow-y-auto answers-scroll" style={noScrollbar}><style>{scrollbarCSS}</style>{q.answers.map(a => (<div key={a.id} className={`p-3 rounded-lg ${theme.cardInner}`}><p className={`text-sm ${theme.text}`}>{a.text}</p><p className={`text-xs mt-1 flex items-center ${theme.textMuted}`}><TeacherIcon isDark={isDark} />{a.author} • {a.date} в {a.time}</p></div>))}</div>
                    <div className="flex gap-2 mt-3">
                      <input type="text" value={forumAnswer} onChange={(e) => setForumAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (forumAnswer.trim()) { setForumQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, answers: [...qq.answers, { id: Date.now(), text: forumAnswer, author: profile.full_name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('ru-RU') }] } : qq)); setForumAnswer(''); } } }} placeholder="Напишите ответ..." className={`flex-1 px-4 py-3 rounded-full text-sm focus:outline-none transition-all ${isDark ? 'bg-[#2A2A3A] border-2 border-[#A78BFA] text-white placeholder-gray-400' : 'bg-white border-2 border-[#2563EB] text-gray-800 placeholder-gray-400'}`} autoFocus />
                      <button onClick={() => { if (forumAnswer.trim()) { setForumQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, answers: [...qq.answers, { id: Date.now(), text: forumAnswer, author: profile.full_name, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('ru-RU') }] } : qq)); setForumAnswer(''); } }} disabled={!forumAnswer.trim()} className={`px-5 py-3 rounded-full font-medium transition-all flex items-center justify-center ${forumAnswer.trim() ? (isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA] text-white' : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white') : (isDark ? 'bg-[#2A2A3A] text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}`}><SendIcon isDark={isDark} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {servicesTab === 'conferences' && (
          <div className="space-y-3">
            <button onClick={() => setShowConferenceModal(true)} className={`w-full py-3 rounded-lg font-medium text-white transition-all hover:scale-[1.01] ${isDark ? 'bg-[#A78BFA] hover:bg-[#9B7BEA]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'}`}>+ Добавить конференцию</button>
            {loadingConferences ? <div className={`p-8 text-center rounded-xl ${theme.card}`}><div className="w-8 h-8 border-4 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className={`text-sm ${theme.textMuted}`}>Загрузка...</p></div> : conferences.length === 0 ? <div className={`p-8 text-center rounded-xl ${theme.card}`}><ConferenceIcon isDark={isDark} /><p className={`text-lg mb-2 ${theme.text}`}>Нет конференций</p></div> : (
              <div className="space-y-3 conference-list max-h-[450px] overflow-y-auto" style={noScrollbar}><style>{scrollbarCSS}</style>
                {conferences.map(c => (<div key={c.id} className={`p-4 rounded-xl transition-all hover:scale-[1.01] ${theme.card}`}><h4 className={`font-medium ${theme.text}`}>{c.title}</h4>{c.description && <p className={`text-sm mb-2 ${theme.textSecondary}`}>{c.description}</p>}<p className={`text-xs mb-3 flex items-center ${theme.textMuted}`}><ClockIcon isDark={isDark} />{c.date.includes('T') ? new Date(c.date).toLocaleString('ru-RU') : c.date}</p><div className="flex gap-2"><a href={c.link} target="_blank" rel="noopener noreferrer" className={`flex-1 py-2 rounded-lg text-sm font-medium text-center transition-all ${isDark ? 'bg-[#A78BFA] text-white hover:bg-[#9B7BEA]' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'}`}>Подключиться</a><button onClick={() => { deleteConference(c.id, user.id); loadTeacherData(); }} className={`p-2 rounded-lg transition-all ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`} title="Удалить"><DeleteIcon isDark={isDark} /></button></div></div>))}
              </div>
            )}
          </div>
        )}
        {servicesTab === 'chats' && (
          <div className="h-[500px]">
            {!selectedChat ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2 border-b pb-2" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>{['all', 'course4', 'course3', 'groups'].map(f => <button key={f} onClick={() => setChatFilter(f)} className={`px-3 py-1.5 text-xs font-medium ${chatFilter === f ? (isDark ? 'text-white border-b-2 border-[#A78BFA]' : 'text-[#2563EB] border-b-2 border-[#2563EB]') : theme.textMuted}`}>{f === 'all' ? 'Все' : f === 'course4' ? '4 курс' : f === 'course3' ? '3 курс' : 'Группы'}</button>)}</div>
                  <div className="flex gap-2"><button onClick={() => setShowStartChatModal(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>+ Начать чат</button><button onClick={() => setShowGroupModal(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>+ Группа</button></div>
                </div>
                <div className="space-y-2 max-h-[450px] overflow-y-auto chats-list" style={noScrollbar}><style>{scrollbarCSS}</style>
                  {chatFilter === 'groups' ? (groups.length === 0 ? <div className={`p-8 text-center rounded-xl ${theme.card}`}><GroupIcon isDark={isDark} /><p className={`text-lg mb-2 ${theme.text}`}>Нет групп</p></div> : groups.map(g => <GroupChatItem key={g.id} group={g} isDark={isDark} theme={theme} onSelect={() => setSelectedChat({ ...g, type: 'group' })} onUpdateName={(n) => updateGroupNameHandler(g.id, n)} onDeleteGroup={deleteGroupHandler} diplomniks={diplomniks} />)) : filteredChats().map(c => <button key={c.id} onClick={() => setSelectedChat(c)} className={`w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01] ${theme.card}`}><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>{c.studentName.charAt(0)}</div><div className="flex-1"><p className={`font-medium ${theme.text}`}>{c.studentName}</p><p className={`text-xs ${theme.textMuted}`}>{c.course} курс</p></div></div></button>)}
                </div>
              </>
            ) : <ChatComponent chat={selectedChat} onBack={() => setSelectedChat(null)} isDark={isDark} currentUserId={currentUserId} onUpdateChat={handleUpdateChat} onSendMessage={(chatId, text) => handleSendPersonalMessage(chatId, text)} />}
          </div>
        )}
      </div>
    </div>
  );

  const CheckScreen = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold text-lg flex items-center ${theme.text}`}>
          <CheckIcon active={true} isDark={isDark} />
          Проверка отчётов
        </h2>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <div className="space-y-3">
        {studentsWithSubmissions.length === 0 ? (
          <div className={`p-8 text-center rounded-xl ${theme.card}`}>
            <CheckIcon active={false} isDark={isDark} />
            <p className={`text-lg mb-2 ${theme.text}`}>Нет отчётов на проверку</p>
          </div>
        ) : (
          studentsWithSubmissions.map(s => {
            const cnt = s.submittedTasks.filter(t => t.gradeStatus === 'not_graded').length;
            const p = calculateProgress(s.id);
            return (
              <div key={s.id} className={`rounded-xl overflow-hidden ${theme.card}`}>
                <button 
                  onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)} 
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${theme.text}`}>{s.studentName}</h4>
                      <p className={`text-xs ${theme.textMuted}`}>{s.group} • {s.course} курс • {s.degree}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cnt > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                          {cnt} {getTaskWord(cnt)} на проверке
                        </span>
                      )}
                      <ChevronDownIcon isDark={isDark} className={`transition-transform ${expandedStudent === s.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>
                
                {expandedStudent === s.id && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
                    <div className="pt-3 space-y-1">
                      {VKR_TASKS.map((name, idx) => {
                        const t = s.submittedTasks.find(x => x.taskIndex === idx);
                        const expanded = expandedTask === `${s.id}-${idx}`;
                        const isGraded = t?.gradeStatus === 'graded' && parseFloat(t.grade) >= 3;
                        const isSubmitted = t && !isGraded;
                        const isNotSubmitted = !t;
                        
                        return (
                          <div key={idx} className={`rounded-lg overflow-hidden ${theme.cardInner}`}>
                            <button 
                              onClick={() => setExpandedTask(expanded ? null : `${s.id}-${idx}`)} 
                              className="w-full p-3 text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isGraded ? (
                                    <CheckCircleIcon />
                                  ) : isSubmitted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500 mr-2">
                                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <CircleIcon isDark={isDark} />
                                  )}
                                  <span className={`text-sm ${isGraded ? theme.text : isSubmitted ? theme.text : theme.textMuted}`}>
                                    {name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {t ? (
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      t.gradeStatus === 'graded' 
                                        ? (isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-700') 
                                        : (isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                                    }`}>
                                      {t.gradeStatus === 'graded' ? `Оценка: ${t.grade}` : 'На проверке'}
                                    </span>
                                  ) : (
                                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                      Не сдано
                                    </span>
                                  )}
                                  <ChevronDownIcon isDark={isDark} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                              {t && (
                                <p className={`text-xs mt-1 ${theme.textMuted}`}>Сдано: {t.submittedDate}</p>
                              )}
                            </button>
                            
                            {expanded && (
                              <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: isDark ? '#2A2A3A' : '#E5E7EB' }}>
                                {t ? (
                                  // ===== СДАННОЕ ЗАДАНИЕ =====
                                  <>
                                    <div className="pt-3">
                                      <p className={`text-xs font-medium ${theme.textMuted}`}>Описание:</p>
                                      <p className={`text-sm mt-1 ${theme.textSecondary}`}>{t.description}</p>
                                    </div>
                                    <div>
                                      <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>Файлы:</p>
                                      {t.files && t.files.length > 0 ? (
                                        <div className="space-y-1">
                                          {t.files.map((f, i) => (
                                            <div key={i} className={`p-2 rounded-lg flex items-center justify-between ${isDark ? 'bg-[#0A0A0F]' : 'bg-white'}`}>
                                              <div className="flex items-center gap-2">
                                                <DocumentIcon isDark={isDark} />
                                                <span className={`text-sm ${theme.text}`}>{f.name}</span>
                                              </div>
                                              <button className={`p-1 rounded ${isDark ? 'text-[#A78BFA] hover:bg-[#1A1A2A]' : 'text-[#2563EB] hover:bg-blue-50'}`}>
                                                <DownloadIcon isDark={isDark} />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className={`text-xs ${theme.textMuted} italic`}>Файлы не прикреплены</p>
                                      )}
                                    </div>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0A0A0F]' : 'bg-white'}`}>
                                      <p className={`text-xs font-medium ${theme.textMuted}`}>Состояние ответа:</p>
                                      <div className="space-y-1 mt-1">
                                        <p className={`text-xs ${theme.textSecondary}`}>
                                          <span className={theme.textMuted}>Номер попытки:</span> {t.attemptNumber} / {t.maxAttempts}
                                        </p>
                                        <p className={`text-xs ${theme.textSecondary}`}>
                                          <span className={theme.textMuted}>Оставшееся время:</span> {t.timeRemaining}
                                        </p>
                                        <p className={`text-xs ${theme.textSecondary}`}>
                                          <span className={theme.textMuted}>Последнее изменение:</span> {t.submittedDate}
                                        </p>
                                      </div>
                                    </div>
                                    {t.gradeStatus === 'graded' && (
                                      <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0A0A0F]' : 'bg-white'}`}>
                                        <p className={`text-xs font-medium ${theme.text}`}>Отзыв преподавателя:</p>
                                        <p className={`text-sm mt-1 ${theme.textSecondary}`}>{t.feedback}</p>
                                        <p className={`text-xs mt-2 ${theme.textMuted}`}>{t.gradedBy} • {t.gradedDate}</p>
                                      </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                      <button 
                                        onClick={() => openTaskModal(t)} 
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-blue-100 text-[#2563EB]'}`}
                                      >
                                        Подробнее
                                      </button>
                                      <button 
                                        onClick={() => openReviewModal(t)} 
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700'}`}
                                      >
                                        {t.gradeStatus === 'graded' ? 'Изменить' : 'Оценить'}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  // ===== НЕСДАННОЕ ЗАДАНИЕ =====
                                  <div className="pt-3">
                                    <div className="mb-3">
                                      <p className={`text-xs font-medium ${theme.textMuted}`}>Описание:</p>
                                      <p className={`text-sm mt-1 ${theme.textSecondary}`}>
                                        {getTaskDescription(idx)}
                                      </p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0A0A0F]' : 'bg-white'}`}>
                                      <p className={`text-xs font-medium ${theme.textMuted}`}>Состояние ответа:</p>
                                      <div className="space-y-1 mt-1">
                                        <p className={`text-xs ${theme.textSecondary}`}>
                                          <span className={theme.textMuted}>Номер попытки:</span> 0 / {getTaskMaxAttempts(idx)}
                                        </p>
                                        <p className={`text-xs ${theme.textSecondary}`}>
                                          <span className={theme.textMuted}>Открыто с:</span> {getTaskOpenFrom(idx)}
                                        </p>
                                        <p className={`text-xs ${theme.textSecondary}`}>
                                          <span className={theme.textMuted}>Срок сдачи:</span> {getTaskDeadline(idx)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0A0A0F]' : 'bg-white'} text-center`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 mx-auto mb-2 ${theme.textMuted}`}>
                                        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" clipRule="evenodd" />
                                      </svg>
                                      <p className={`text-sm ${theme.textMuted}`}>Задание ещё не сдано</p>
                                      <p className={`text-xs mt-1 ${theme.textMuted}`}>Студент не загрузил файлы для проверки</p>
                                    </div>
                                    <div className="flex gap-2 pt-3">
                                      <button 
                                        onClick={() => {
                                          const tempTask = {
                                            studentId: s.id,
                                            studentName: s.studentName,
                                            taskName: name,
                                            taskIndex: idx,
                                            description: getTaskDescription(idx),
                                            openFrom: getTaskOpenFrom(idx),
                                            deadline: getTaskDeadline(idx),
                                            files: [],
                                            gradeStatus: 'not_submitted',
                                            submittedDate: null,
                                            attemptNumber: 0,
                                            maxAttempts: getTaskMaxAttempts(idx),
                                            timeRemaining: 'Ещё не сдано',
                                            status: 'not_submitted'
                                          };
                                          openTaskModal(tempTask);
                                        }} 
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-blue-100 text-[#2563EB]'}`}
                                      >
                                        Подробнее
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between"><h2 className={`font-semibold text-lg flex items-center ${theme.text}`}><ProfileIcon active={true} isDark={isDark} />Профиль</h2><button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition ${isDark ? 'bg-[#1E1E2A] text-[#A78BFA]' : 'bg-gray-200 text-gray-600'}`}>{isDark ? <SunIcon /> : <MoonIcon />}</button></div>
      <div className={`rounded-2xl p-5 transition-all hover:scale-[1.01] ${theme.card}`}><div className="flex items-center gap-4"><div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]'}`}><ProfileIcon active={true} isDark={isDark} /></div><div><h3 className={`font-semibold text-lg ${theme.text}`}>{profile.full_name}</h3><p className={`text-sm ${theme.textSecondary}`}>{profile.position}</p></div></div></div>
      <div className={`rounded-2xl p-4 ${theme.card}`}><h4 className={`text-sm font-medium mb-3 ${theme.text}`}>Личные данные</h4><div className="space-y-2"><div className="flex items-center justify-between py-1.5"><span className={`text-sm ${theme.textMuted}`}>Кафедра</span><span className={`text-sm ${theme.text}`}>{profile.department}</span></div><div className="flex items-center justify-between py-1.5"><span className={`text-sm ${theme.textMuted}`}>Научная степень</span><span className={`text-sm ${theme.text}`}>{profile.academic_degree || 'Кандидат наук'}</span></div><div className="flex items-center justify-between py-1.5"><span className={`text-sm ${theme.textMuted}`}>Email</span><span className={`text-sm ${theme.text}`}>{user.email}</span></div><div className="flex items-center justify-between py-1.5"><span className={`text-sm ${theme.textMuted}`}>Дипломников</span><span className={`text-sm ${theme.text}`}>{diplomniks.length}</span></div></div></div>
      <button onClick={onLogout} className={`w-full p-4 rounded-2xl font-medium transition-all hover:scale-105 flex items-center justify-center ${isDark ? 'bg-[#A78BFA]/20 text-red-400 border border-[#A78BFA]/30 hover:bg-[#A78BFA]/30' : 'bg-[#2563EB]/10 text-red-600 border border-[#2563EB]/20 hover:bg-[#2563EB]/20'}`}>Выйти из аккаунта</button>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 relative ${theme.bg}`}><style>{scrollbarCSS}</style>
      <div className={`px-4 py-4 sticky top-0 z-30 border-b ${theme.header}`}><div className="max-w-3xl mx-auto"><h1 className={`text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-[#A78BFA] via-[#C4B5FD] to-[#A78BFA]' : 'from-[#2563EB] via-[#3B82F6] to-[#2563EB]'}`}>РТУ МИРЭА • Преподаватель</h1></div></div>
      <div className="max-w-3xl mx-auto px-4 py-6 tab-content">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'services' && <ServicesScreen />}
        {activeTab === 'check' && <CheckScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      {/* Диалог отклонения заявки */}
      {rejectDialog.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme.text}`}>Причина отказа</h3>
            <div className="space-y-2 mb-4">
              {['Нет мест', 'Не подходит профиль'].map(r => (
                <button key={r} onClick={() => setRejectReason(r)} className={`w-full p-2 rounded-lg text-left text-sm ${rejectReason === r ? (isDark ? 'bg-[#A78BFA] text-white' : 'bg-[#2563EB] text-white') : theme.card}`}>{r}</button>
              ))}
            </div>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Или напишите причину..." className={`w-full p-2 rounded-lg text-sm mb-4 ${theme.input}`} rows="2" />
            <div className="flex gap-3">
              <button onClick={confirmReject} className={`flex-1 py-2 rounded-lg text-sm font-medium ${theme.rejectBtn}`}>Отклонить</button>
              <button onClick={() => setRejectDialog({ show: false, application: null })} className={`flex-1 py-2 rounded-lg ${theme.card} ${theme.text}`}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка утверждения темы */}
      {showTopicModal && selectedDiplomnik && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme.text}`}>Утверждение темы</h3>
            <p className={`text-sm mb-2 ${theme.textSecondary}`}>Студент: {selectedDiplomnik.studentName}</p>
            <textarea value={editingTopic} onChange={(e) => setEditingTopic(e.target.value)} placeholder="Тема ВКР..." className={`w-full p-3 rounded-lg text-sm mb-4 ${theme.input}`} rows="3" />
            <div className="flex gap-3">
              <button onClick={saveTopic} className={`flex-1 py-2 rounded-lg text-sm font-medium text-white ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>Утвердить</button>
              <button onClick={() => setShowTopicModal(false)} className={`flex-1 py-2 rounded-lg ${theme.card} ${theme.text}`}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка дипломника */}
      {showDiplomnikModal && selectedDiplomnik && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden ${theme.card}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-semibold text-lg ${theme.text}`}>{selectedDiplomnik.studentName}</h3>
              <button onClick={() => setShowDiplomnikModal(false)} className={`text-2xl ${theme.textMuted}`}>✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4" style={noScrollbar}>
              <div className={`p-3 rounded-lg ${theme.cardInner}`}>
                <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Группа:</span> {selectedDiplomnik.group}</p>
                <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Курс:</span> {selectedDiplomnik.course}</p>
                <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Средний балл:</span> {selectedDiplomnik.gpa}</p>
              </div>
              <div>
                <h4 className={`font-medium mb-2 ${theme.text}`}>Задачи ВКР</h4>
                <div className="space-y-2">
                  {VKR_TASKS.map((task, idx) => {
                    const t = submittedTasks.find(x => x.studentId === selectedDiplomnik.id && x.taskIndex === idx);
                    const done = t?.gradeStatus === 'graded' && parseFloat(t.grade) >= 3;
                    return (
                      <div key={idx} className={`p-3 rounded-lg flex items-center ${theme.cardInner}`}>
                        {done ? <CheckCircleIcon /> : <CircleIcon isDark={isDark} />}
                        <span className={`text-sm ${done ? theme.text : theme.textMuted}`}>{task}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'}`}>
              <button onClick={() => setShowDiplomnikModal(false)} className={`w-full py-2 rounded-lg ${theme.card} ${theme.text}`}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка задания */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden ${theme.card}`}>
            <div className={`p-4 border-b ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-semibold text-lg ${theme.text}`}>{selectedTask.taskName}</h3>
              <button onClick={() => setShowTaskModal(false)} className={`text-2xl ${theme.textMuted}`}>✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4" style={noScrollbar}>
              <div className={`p-3 rounded-lg ${theme.cardInner}`}>
                <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Срок сдачи:</span> {selectedTask.deadline}</p>
              </div>
              <div>
                <h4 className={`font-medium mb-2 ${theme.text}`}>Файлы:</h4>
                <div className="space-y-2">
                  {selectedTask.files.map((f, i) => (
                    <div key={i} className={`p-3 rounded-lg flex items-center justify-between ${theme.cardInner}`}>
                      <div className="flex items-center gap-2">
                        <DocumentIcon isDark={isDark} />
                        <span className={`text-sm ${theme.text}`}>{f.name}</span>
                      </div>
                      <button className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        <DownloadIcon isDark={isDark} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTask.gradeStatus === 'graded' && (
                <div className={`p-3 rounded-lg ${theme.cardInner}`}>
                  <h4 className={`font-medium mb-2 ${theme.text}`}>Отзыв</h4>
                  <p className={`text-sm ${theme.text}`}><span className={theme.textMuted}>Оценка:</span> {selectedTask.grade}</p>
                  <p className={`text-sm mt-2 ${theme.textSecondary}`}>{selectedTask.feedback}</p>
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={newTaskComment} onChange={(e) => setNewTaskComment(e.target.value)} placeholder="Добавить комментарий..." className={`flex-1 px-3 py-2 rounded-lg text-sm ${theme.input}`} />
                <button onClick={addTaskComment} className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>Отправить</button>
              </div>
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-[#2A2A3A]' : 'border-gray-200'} flex gap-3`}>
              <button onClick={() => { setShowTaskModal(false); openReviewModal(selectedTask); }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-blue-100 text-[#2563EB]'}`}>{selectedTask.gradeStatus === 'graded' ? 'Изменить оценку' : 'Оценить'}</button>
              <button onClick={() => setShowTaskModal(false)} className={`flex-1 py-2 rounded-lg ${theme.card} ${theme.text}`}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка оценки */}
      {showReviewModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme.text}`}>Оценить работу</h3>
            <p className={`text-sm mb-2 ${theme.textSecondary}`}>Студент: {selectedTask.studentName}</p>
            <p className={`text-sm mb-4 ${theme.textSecondary}`}>Задание: {selectedTask.taskName}</p>
            <select value={reviewGrade} onChange={(e) => setReviewGrade(e.target.value)} className={`w-full p-3 rounded-lg text-sm mb-4 ${theme.input}`}>
              <option value="">Выберите оценку</option>
              <option value="5">5 — Отлично</option>
              <option value="4">4 — Хорошо</option>
              <option value="3">3 — Удовлетворительно</option>
              <option value="2">2 — На доработку</option>
            </select>
            <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Комментарий..." className={`w-full p-3 rounded-lg text-sm mb-4 ${theme.input}`} rows="3" />
            <div className="flex gap-3">
              <button onClick={submitReview} disabled={!reviewGrade} className={`flex-1 py-2 rounded-lg text-sm font-medium text-white ${reviewGrade ? (isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]') : 'bg-gray-500 cursor-not-allowed'}`}>Сохранить</button>
              <button onClick={() => setShowReviewModal(false)} className={`flex-1 py-2 rounded-lg ${theme.card} ${theme.text}`}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка создания группы */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card}`}>
            <h3 className={`text-lg font-bold mb-4 ${theme.text}`}>Создать группу</h3>
            <input type="text" placeholder="Название группы" value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} className={`w-full p-3 rounded-lg text-sm mb-3 ${theme.input}`} />
            <select value={newGroup.course} onChange={(e) => setNewGroup({...newGroup, course: e.target.value})} className={`w-full p-3 rounded-lg text-sm mb-4 ${theme.input}`}>
              <option value="4">4 курс</option>
              <option value="3">3 курс</option>
            </select>
            <p className={`text-sm mb-2 ${theme.text}`}>Выберите студентов:</p>
            <div className="max-h-40 overflow-y-auto space-y-2 mb-4" style={noScrollbar}>
              {diplomniks.filter(d => d.course === parseInt(newGroup.course)).map(d => (
                <label key={d.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={newGroup.students.includes(d.id)} onChange={(e) => { if (e.target.checked) setNewGroup({...newGroup, students: [...newGroup.students, d.id]}); else setNewGroup({...newGroup, students: newGroup.students.filter(id => id !== d.id)}); }} className="rounded" />
                  <span className={`text-sm ${theme.text}`}>{d.studentName} ({d.group})</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={createGroup} className={`flex-1 py-2 rounded-lg text-sm font-medium text-white ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>Создать</button>
              <button onClick={() => setShowGroupModal(false)} className={`flex-1 py-2 rounded-lg ${theme.card} ${theme.text}`}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка создания конференции */}
      {showConferenceModal && (
        <ConferenceModal
          isDark={isDark}
          theme={theme}
          onClose={() => setShowConferenceModal(false)}
          onAdd={addConferenceHandler}
        />
      )}

      {/* Модалка начала чата */}
      {showStartChatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowStartChatModal(false)}>
          <div className={`rounded-2xl max-w-md w-full p-6 ${theme.card}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${theme.text}`}>Выберите студента</h3>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {diplomniks.length === 0 ? (
                <p className={`text-sm text-center ${theme.textMuted}`}>Нет утверждённых студентов</p>
              ) : (
                diplomniks.map(student => (
                  <button
                    key={student.id}
                    onClick={() => startChatWithStudent(student)}
                    className={`w-full p-3 rounded-lg text-left transition-all hover:scale-[1.01] ${theme.cardInner}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`}>
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium ${theme.text}`}>{student.studentName}</p>
                        <p className={`text-xs ${theme.textMuted}`}>{student.group} • {student.course} курс</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowStartChatModal(false)} className={`w-full mt-4 py-2 rounded-lg ${theme.card} ${theme.text}`}>Отмена</button>
          </div>
        </div>
      )}

      {/* Нижняя панель навигации */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 px-4">
        <div className={`rounded-full px-2 py-2 shadow-2xl ${theme.bottomBar}`}>
          <div className="flex items-center gap-1">
            {['home', 'services', 'check', 'profile'].map(id => {
              const icons = { home: HomeIcon, services: ServicesIcon, check: CheckIcon, profile: ProfileIcon };
              const labels = { home: 'Главная', services: 'Сервисы', check: 'Проверка', profile: 'Профиль' };
              const Icon = icons[id];
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative px-5 py-2 rounded-full transition-all duration-200 flex flex-col items-center`}
                >
                  <Icon active={activeTab === id} isDark={isDark} />
                  <span className={`text-xs font-medium mt-0.5 ${activeTab === id ? (isDark ? 'text-[#A78BFA]' : 'text-[#2563EB]') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                    {labels[id]}
                  </span>
                  {activeTab === id && (
                    <span className={`absolute bottom-[-4px] w-1 h-1 rounded-full ${isDark ? 'bg-[#A78BFA]' : 'bg-[#2563EB]'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherCabinet;