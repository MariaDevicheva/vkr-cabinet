// src/utils/systemStorage.js

// ==================== КОНСТАНТЫ ====================
const STORAGE_KEY = 'vtk_system_data';

// ==================== БАЗОВЫЕ ФУНКЦИИ ====================

// Получение всех данных системы
export const getSystemData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  // Начальное состояние
  return {
    applications: [],
    chats: {},
    tasks: {},
    notifications: [],
    teacherGroups: {},
    conferences: []
  };
};

// Сохранение данных системы
export const saveSystemData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Очистка всех данных (для отладки)
export const clearSystemData = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ==================== УВЕДОМЛЕНИЯ ====================

// Добавление уведомления
export const addNotification = (userId, type, title, message, data = {}) => {
  const systemData = getSystemData();
  const notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    userId,
    type,
    title,
    message,
    date: new Date().toLocaleDateString('ru-RU'),
    read: false,
    data
  };
  systemData.notifications.push(notification);
  saveSystemData(systemData);
  return notification;
};

// Получение уведомлений пользователя
export const getUserNotifications = (userId) => {
  const systemData = getSystemData();
  return systemData.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => b.id - a.id);
};

// Отметить уведомление как прочитанное
export const markNotificationAsRead = (notificationId) => {
  const systemData = getSystemData();
  const notification = systemData.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    saveSystemData(systemData);
  }
};

// Отметить все уведомления как прочитанные
export const markAllNotificationsAsRead = (userId) => {
  const systemData = getSystemData();
  systemData.notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  saveSystemData(systemData);
};

// Количество непрочитанных уведомлений
export const getUnreadNotificationsCount = (userId) => {
  const systemData = getSystemData();
  return systemData.notifications.filter(n => n.userId === userId && !n.read).length;
};

// ==================== ЗАЯВКИ ====================

// Подача заявки студентом
export const submitApplication = (studentId, studentName, studentGroup, studentCourse, teacherId, teacherName) => {
  const systemData = getSystemData();
  
  // Проверяем, нет ли уже активной заявки к этому преподавателю
  const existingPending = systemData.applications.find(a => 
    a.studentId === studentId && a.teacherId === teacherId && a.status === 'pending'
  );
  if (existingPending) {
    return { success: false, message: 'У вас уже есть активная заявка к этому преподавателю' };
  }
  
  // Проверяем, нет ли уже утверждённого руководителя
  const existingApproved = systemData.applications.find(a => 
    a.studentId === studentId && a.status === 'approved'
  );
  if (existingApproved) {
    return { success: false, message: 'У вас уже есть утверждённый руководитель' };
  }
  
  const application = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    studentId,
    studentName,
    studentGroup,
    studentCourse,
    teacherId,
    teacherName,
    status: 'pending',
    date: new Date().toLocaleDateString('ru-RU'),
    topic: null,
    rejectReason: null
  };
  
  systemData.applications.push(application);
  saveSystemData(systemData);
  return { success: true, application };
};

// Принятие заявки преподавателем
export const approveApplication = (applicationId, teacherId) => {
  const systemData = getSystemData();
  const application = systemData.applications.find(a => a.id === applicationId);
  
  if (!application) return { success: false, message: 'Заявка не найдена' };
  if (application.teacherId !== teacherId) return { success: false, message: 'Нет доступа' };
  
  // Отклоняем все остальные заявки этого студента
  systemData.applications.forEach(a => {
    if (a.studentId === application.studentId && a.id !== applicationId && a.status === 'pending') {
      a.status = 'rejected';
      a.rejectReason = 'Студент выбрал другого преподавателя';
      
      // Уведомление об автоматическом отклонении
      addNotification(
        a.studentId,
        'application_rejected',
        '❌ Заявка отклонена',
        `Ваша заявка к преподавателю ${a.teacherName} автоматически отклонена, так как вы выбрали другого руководителя.`,
        { teacherId: a.teacherId, teacherName: a.teacherName, reason: 'Студент выбрал другого преподавателя' }
      );
    }
  });
  
  // Утверждаем заявку
  application.status = 'approved';
  
  // Создаём уведомление для студента
  addNotification(
    application.studentId,
    'application_approved',
    '✅ Заявка утверждена',
    `Преподаватель ${application.teacherName} утвердил вашу заявку на руководство ВКР. Теперь вы можете общаться в чате и отслеживать прогресс.`,
    { teacherId: application.teacherId, teacherName: application.teacherName }
  );
  
  saveSystemData(systemData);
  return { success: true, application };
};

// Отклонение заявки преподавателем
export const rejectApplication = (applicationId, teacherId, reason) => {
  const systemData = getSystemData();
  const application = systemData.applications.find(a => a.id === applicationId);
  
  if (!application) return { success: false, message: 'Заявка не найдена' };
  if (application.teacherId !== teacherId) return { success: false, message: 'Нет доступа' };
  
  application.status = 'rejected';
  application.rejectReason = reason;
  
  // Создаём уведомление для студента
  addNotification(
    application.studentId,
    'application_rejected',
    '❌ Заявка отклонена',
    `Преподаватель ${application.teacherName} отклонил вашу заявку. Причина: ${reason}`,
    { teacherId: application.teacherId, teacherName: application.teacherName, reason }
  );
  
  saveSystemData(systemData);
  return { success: true, application };
};

// Отмена заявки студентом
export const cancelApplication = (applicationId, studentId) => {
  const systemData = getSystemData();
  const index = systemData.applications.findIndex(a => a.id === applicationId && a.studentId === studentId);
  
  if (index === -1) return { success: false, message: 'Заявка не найдена' };
  
  systemData.applications.splice(index, 1);
  saveSystemData(systemData);
  return { success: true };
};

// Получение заявок студента
export const getStudentApplications = (studentId) => {
  const systemData = getSystemData();
  return systemData.applications.filter(a => a.studentId === studentId);
};

// Получение утверждённого руководителя студента
export const getStudentApprovedTeacher = (studentId) => {
  const systemData = getSystemData();
  return systemData.applications.find(a => a.studentId === studentId && a.status === 'approved') || null;
};

// Получение заявок к преподавателю (ожидающие)
export const getTeacherPendingApplications = (teacherId) => {
  const systemData = getSystemData();
  return systemData.applications.filter(a => a.teacherId === teacherId && a.status === 'pending');
};

// Получение утверждённых дипломников преподавателя
export const getTeacherApprovedStudents = (teacherId) => {
  const systemData = getSystemData();
  return systemData.applications.filter(a => a.teacherId === teacherId && a.status === 'approved');
};

// ==================== ЗАДАНИЯ И ОЦЕНКИ ====================

// Отправка задания студентом
export const submitTask = (studentId, taskId, files) => {
  const systemData = getSystemData();
  const key = `${studentId}_${taskId}`;
  
  systemData.tasks[key] = {
    ...systemData.tasks[key],
    status: 'submitted',
    files,
    submittedDate: new Date().toLocaleDateString('ru-RU')
  };
  
  saveSystemData(systemData);
  return { success: true };
};

// Оценка задания преподавателем
export const gradeTask = (studentId, taskId, taskName, teacherId, teacherName, grade, feedback) => {
  const systemData = getSystemData();
  const key = `${studentId}_${taskId}`;
  
  systemData.tasks[key] = {
    ...systemData.tasks[key],
    status: 'completed',
    grade: `${grade} / 5,0`,
    feedback,
    feedbackDate: new Date().toLocaleDateString('ru-RU'),
    teacherId,
    teacherName
  };
  
  // Создаём уведомление для студента
  addNotification(
    studentId,
    'task_graded',
    '📝 Задание оценено',
    `Преподаватель ${teacherName} оценил задание "${taskName}" на ${grade}/5,0`,
    { taskId, taskName, grade, feedback }
  );
  
  saveSystemData(systemData);
  return { success: true };
};

// Получение заданий студента
export const getStudentTasks = (studentId) => {
  const systemData = getSystemData();
  const tasks = {};
  Object.keys(systemData.tasks).forEach(key => {
    if (key.startsWith(`${studentId}_`)) {
      const taskId = parseInt(key.split('_')[1]);
      tasks[taskId] = systemData.tasks[key];
    }
  });
  return tasks;
};

// ==================== ЧАТЫ ====================

// Получение ключа чата
const getPersonalChatKey = (studentId, teacherId) => `student_${studentId}_teacher_${teacherId}`;

// Отправка сообщения в личный чат
export const sendPersonalMessage = (studentId, teacherId, sender, senderId, senderName, text) => {
  const systemData = getSystemData();
  const chatKey = getPersonalChatKey(studentId, teacherId);
  
  if (!systemData.chats[chatKey]) {
    systemData.chats[chatKey] = [];
  }
  
  const message = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    text,
    sender, // 'student' или 'teacher'
    senderId,
    senderName,
    timestamp: Date.now()
  };
  
  systemData.chats[chatKey].push(message);
  saveSystemData(systemData);
  return { success: true, message };
};

// Получение сообщений личного чата
export const getPersonalChatMessages = (studentId, teacherId) => {
  const systemData = getSystemData();
  const chatKey = getPersonalChatKey(studentId, teacherId);
  return systemData.chats[chatKey] || [];
};

// Редактирование сообщения
export const editChatMessage = (chatKey, messageId, newText) => {
  const systemData = getSystemData();
  const messages = systemData.chats[chatKey];
  if (messages) {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.text = newText;
      message.edited = true;
      saveSystemData(systemData);
      return { success: true };
    }
  }
  return { success: false };
};

// Удаление сообщения
export const deleteChatMessage = (chatKey, messageId) => {
  const systemData = getSystemData();
  if (systemData.chats[chatKey]) {
    systemData.chats[chatKey] = systemData.chats[chatKey].filter(m => m.id !== messageId);
    saveSystemData(systemData);
    return { success: true };
  }
  return { success: false };
};

// ==================== ГРУППЫ (для преподавателя) ====================

// Создание группы
export const createTeacherGroup = (teacherId, name, course, students) => {
  const systemData = getSystemData();
  
  if (!systemData.teacherGroups[teacherId]) {
    systemData.teacherGroups[teacherId] = [];
  }
  
  const group = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name,
    course,
    students,
    messages: [],
    createdAt: new Date().toLocaleDateString('ru-RU')
  };
  
  systemData.teacherGroups[teacherId].push(group);
  saveSystemData(systemData);
  return { success: true, group };
};

// Получение групп преподавателя
export const getTeacherGroups = (teacherId) => {
  const systemData = getSystemData();
  return systemData.teacherGroups[teacherId] || [];
};

// Обновление названия группы
export const updateGroupName = (teacherId, groupId, newName) => {
  const systemData = getSystemData();
  const groups = systemData.teacherGroups[teacherId];
  if (groups) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.name = newName;
      saveSystemData(systemData);
      return { success: true };
    }
  }
  return { success: false };
};

// Удаление группы
export const deleteTeacherGroup = (teacherId, groupId) => {
  const systemData = getSystemData();
  if (systemData.teacherGroups[teacherId]) {
    systemData.teacherGroups[teacherId] = systemData.teacherGroups[teacherId].filter(g => g.id !== groupId);
    saveSystemData(systemData);
    return { success: true };
  }
  return { success: false };
};

// Получение групп, в которых состоит студент
export const getStudentGroups = (studentId, teacherId) => {
  const systemData = getSystemData();
  const teacherGroups = systemData.teacherGroups[teacherId] || [];
  
  // Возвращаем только те группы, где есть этот студент
  return teacherGroups.filter(group => 
    group.students && group.students.includes(studentId)
  ).map(group => ({
    ...group,
    messages: group.messages || []
  }));
};

// ==================== КОНФЕРЕНЦИИ ====================

// Добавление конференции
export const addConference = (teacherId, conference) => {
  const systemData = getSystemData();
  
  const newConference = {
    ...conference,
    id: Date.now() + Math.floor(Math.random() * 1000),
    teacherId,
    createdAt: new Date().toLocaleDateString('ru-RU')
  };
  
  systemData.conferences.push(newConference);
  saveSystemData(systemData);
  return { success: true, conference: newConference };
};

// Получение конференций преподавателя
export const getTeacherConferences = (teacherId) => {
  const systemData = getSystemData();
  return systemData.conferences.filter(c => c.teacherId === teacherId);
};

// Удаление конференции
export const deleteConference = (conferenceId, teacherId) => {
  const systemData = getSystemData();
  const index = systemData.conferences.findIndex(c => c.id === conferenceId && c.teacherId === teacherId);
  if (index !== -1) {
    systemData.conferences.splice(index, 1);
    saveSystemData(systemData);
    return { success: true };
  }
  return { success: false };
};

// ==================== ДЕМО-ДАННЫЕ ====================

// Инициализация демо-данных для тестирования
export const initDemoData = () => {
  const systemData = getSystemData();
  
  // Если данные уже есть, не перезаписываем
  if (systemData.applications.length > 0) return;
  
  // Добавляем тестовую заявку
  systemData.applications.push({
    id: 1001,
    studentId: 1,
    studentName: 'Иванов Иван Иванович',
    studentGroup: 'ИКБО-01-23',
    studentCourse: 3,
    teacherId: 1,
    teacherName: 'Аждер Т.Б.',
    status: 'pending',
    date: '15.04.2026',
    topic: null,
    rejectReason: null
  });
  
  // Создаём демо-группы для первого преподавателя
  if (!systemData.teacherGroups[1]) {
    systemData.teacherGroups[1] = [
      {
        id: 2001,
        name: 'Общая группа ВКР 2026',
        course: 4,
        students: [1, 2, 3, 4, 5],
        messages: [
          { id: 3001, text: 'Добро пожаловать в общую группу ВКР!', sender: 'Аждер Т.Б.', time: '10:00' },
          { id: 3002, text: 'Здесь будут публиковаться важные объявления', sender: 'Аждер Т.Б.', time: '10:01' }
        ],
        createdAt: '15.03.2026'
      },
      {
        id: 2002,
        name: 'Разработка веб-приложений',
        course: 4,
        students: [1, 3],
        messages: [
          { id: 3003, text: 'Группа для обсуждения тем по веб-разработке', sender: 'Аждер Т.Б.', time: '11:00' }
        ],
        createdAt: '20.03.2026'
      }
    ];
  }
  
  saveSystemData(systemData);
  console.log('Демо-данные инициализированы');
};

// ==================== СПИСОК ПРЕПОДАВАТЕЛЕЙ ====================

// Полный список преподавателей
const FULL_TEACHERS_LIST = [
  { id: 'teacher_1', fullName: 'Аждер Татьяна Борисовна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'azhder@mirea.ru', maxSlots: 3, occupied: 1 },
  { id: 'teacher_2', fullName: 'Бакланов Павел Анатольевич', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'baklanov@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_3', fullName: 'Бурлаков Вячеслав Викторович', position: 'Профессор', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'burlakov@mirea.ru', maxSlots: 2, occupied: 2 },
  { id: 'teacher_4', fullName: 'Вартанян Аревшад Апетович', position: 'Профессор', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'vartanyan@mirea.ru', maxSlots: 3, occupied: 1 },
  { id: 'teacher_5', fullName: 'Гостева Мария Александровна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'gosteva@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_6', fullName: 'Елагина Ольга Александровна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'elagina@mirea.ru', maxSlots: 2, occupied: 1 },
  { id: 'teacher_7', fullName: 'Емельянова Ольга Владимировна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'emelyanova@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_8', fullName: 'Земцов Алексей Дмитриевич', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'zemtsov@mirea.ru', maxSlots: 3, occupied: 2 },
  { id: 'teacher_9', fullName: 'Корецкий Владимир Павлович', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'koretsky@mirea.ru', maxSlots: 2, occupied: 0 },
  { id: 'teacher_10', fullName: 'Кудрявцева Ирина Генадьевна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'kudryavtseva@mirea.ru', maxSlots: 3, occupied: 1 },
  { id: 'teacher_11', fullName: 'Лукашевич Евгения Вадимовна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'lukashevich@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_12', fullName: 'Марухленко Анатолий Леонидович', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'marukhlenko@mirea.ru', maxSlots: 2, occupied: 1 },
  { id: 'teacher_13', fullName: 'Новикова Ольга Александровна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'novikova@mirea.ru', maxSlots: 3, occupied: 2 },
  { id: 'teacher_14', fullName: 'Паршин Игорь Олегович', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'parshin@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_15', fullName: 'Перминова Ольга Михайловна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'perminova@mirea.ru', maxSlots: 2, occupied: 1 },
  { id: 'teacher_16', fullName: 'Перцева Ольга Вадимовна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'pertseva@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_17', fullName: 'Проворова Ирина Павловна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'provorova@mirea.ru', maxSlots: 3, occupied: 1 },
  { id: 'teacher_18', fullName: 'Раменская Алина Владимировна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'ramenskaya@mirea.ru', maxSlots: 2, occupied: 0 },
  { id: 'teacher_19', fullName: 'Семенычева Ирина Флюровна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'semenycheva@mirea.ru', maxSlots: 3, occupied: 2 },
  { id: 'teacher_20', fullName: 'Сиганьков Алексей Александрович', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'sigankov@mirea.ru', maxSlots: 3, occupied: 0 },
  { id: 'teacher_21', fullName: 'Сороко Андрей Викторович', position: 'Заведующий кафедрой', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'soroko@mirea.ru', maxSlots: 3, occupied: 1 },
  { id: 'teacher_22', fullName: 'Стариковская Надежда Анатольевна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'starikovskaya@mirea.ru', maxSlots: 2, occupied: 0 },
  { id: 'teacher_23', fullName: 'Стебунова Ольга Ивановна', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'stebunova@mirea.ru', maxSlots: 3, occupied: 1 },
  { id: 'teacher_24', fullName: 'Тюрин Андрей Геннадьевич', position: 'Доцент', institute: 'Институт технологий управления', department: 'Кафедра информационных технологий в государственном управлении', email: 'tyurin@mirea.ru', maxSlots: 3, occupied: 0 }
];

// Экспорт функций для работы с преподавателями
export const getFullTeachersList = () => {
  const stored = localStorage.getItem('fullTeachersList');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('fullTeachersList', JSON.stringify(FULL_TEACHERS_LIST));
  return FULL_TEACHERS_LIST;
};

export const getTeachersOnlineStatus = () => {
  const stored = localStorage.getItem('teachersOnlineStatus');
  const now = Date.now();
  
  let statuses = stored ? JSON.parse(stored) : {};
  
  FULL_TEACHERS_LIST.forEach(teacher => {
    if (!statuses[teacher.id]) {
      statuses[teacher.id] = {
        lastSeen: now - Math.floor(Math.random() * 86400000),
        isOnline: Math.random() > 0.7
      };
    }
  });
  
  localStorage.setItem('teachersOnlineStatus', JSON.stringify(statuses));
  return statuses;
};