// ==================== إعداد Supabase ====================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://pigzuymmzisrawmfcuq.supabase.co'; // حط رابطك هنا
const supabaseKey = 'sb_publishable_vQ6Eh--B3jrQXgP_q3iN6Q_uv1m3k0G'; // حط مفتاحك هنا
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== البيانات ====================
let users = [];
let tasks = [];
let messages = [];
let notifications = [];
let currentUser = null;
let currentSection = 'dashboard';
let messagesVisible = false;
let messagesContentVisible = false;
let notificationsVisible = false;
let currentTaskId = null;
let mobileMenuOpen = false;
let currentChatUserId = null;
let selectedUsersForPermission = [];

// متغيرات العدادات
let nextTaskId = 1;
let nextUserId = 1;
let nextMessageId = 1;
let nextNotificationId = 1;

// قنوات Realtime
let realtimeChannels = [];

// ==================== تحميل البيانات من Supabase ====================
async function loadAllData() {
    try {
        const [usersRes, tasksRes, messagesRes, notificationsRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('tasks').select('*'),
            supabase.from('messages').select('*'),
            supabase.from('notifications').select('*')
        ]);

        users = usersRes.data || [];
        tasks = tasksRes.data || [];
        messages = messagesRes.data || [];
        notifications = notificationsRes.data || [];

        // تحديث العدادات
        nextTaskId = Math.max(...tasks.map(t => t.id), 0) + 1;
        nextUserId = Math.max(...users.map(u => u.id), 0) + 1;
        nextMessageId = Math.max(...messages.map(m => m.id), 0) + 1;
        nextNotificationId = Math.max(...notifications.map(n => n.id), 0) + 1;
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// ==================== تفعيل Realtime Subscriptions ====================
function setupRealtimeSubscriptions() {
    // الاستماع لتغييرات المستخدمين
    const usersChannel = supabase
        .channel('public:users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, 
            async (payload) => {
                console.log('🔄 تغيير في المستخدمين:', payload);
                await loadAllData();
                if (currentUser) {
                    const updatedUser = users.find(u => u.id === currentUser.id);
                    if (updatedUser) {
                        currentUser = updatedUser;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                    updateNavLinks();
                    updateMobileMenu();
                    if (currentSection === 'users') showUserManagement();
                }
            })
        .subscribe();
    realtimeChannels.push(usersChannel);

    // الاستماع لتغييرات المهام
    const tasksChannel = supabase
        .channel('public:tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
            async (payload) => {
                console.log('🔄 تغيير في المهام:', payload);
                await loadAllData();
                if (currentSection === 'dashboard') showAdminDashboard();
                if (currentSection === 'tasks') showTaskManagement();
                if (currentSection === 'user') showUserPage();
                updateFilePreview(currentTaskId);
            })
        .subscribe();
    realtimeChannels.push(tasksChannel);

    // الاستماع لتغييرات الرسائل
    const messagesChannel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
            async (payload) => {
                console.log('🔄 تغيير في الرسائل:', payload);
                await loadAllData();
                updateUnreadCount();
                if (messagesContentVisible) {
                    if (currentChatUserId) {
                        showChatWithUser(currentChatUserId);
                    } else {
                        showMessages();
                    }
                }
            })
        .subscribe();
    realtimeChannels.push(messagesChannel);

    // الاستماع لتغييرات الإشعارات
    const notificationsChannel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
            async (payload) => {
                console.log('🔄 تغيير في الإشعارات:', payload);
                await loadAllData();
                updateNotificationBadge();
                if (notificationsVisible) showNotifications();
            })
        .subscribe();
    realtimeChannels.push(notificationsChannel);
}

// ==================== دوال الحفظ في Supabase ====================
async function saveUser(userData) {
    const { error } = await supabase.from('users').upsert(userData);
    if (error) console.error('خطأ في حفظ المستخدم:', error);
    await loadAllData();
}

async function saveTask(taskData) {
    const { error } = await supabase.from('tasks').upsert(taskData);
    if (error) console.error('خطأ في حفظ المهمة:', error);
    await loadAllData();
}

async function saveMessage(messageData) {
    const { error } = await supabase.from('messages').insert(messageData);
    if (error) console.error('خطأ في حفظ الرسالة:', error);
    await loadAllData();
}

async function saveNotification(notificationData) {
    const { error } = await supabase.from('notifications').insert(notificationData);
    if (error) console.error('خطأ في حفظ الإشعار:', error);
    await loadAllData();
}

// ==================== دوال الإشعارات ====================
async function addNotification(userId, title, text, type = 'info') {
    const notification = {
        user_id: userId,
        title: title,
        text: text,
        time: new Date().toLocaleString('ar-EG'),
        read: false,
        type: type
    };
    
    await saveNotification(notification);
    updateNotificationBadge();
    return notification;
}

async function addNotificationToAll(title, text, type = 'info') {
    const nonAdminUsers = users.filter(u => !u.is_admin);
    for (const user of nonAdminUsers) {
        await addNotification(user.id, title, text, type);
    }
}

function getUnreadNotifications() {
    if (!currentUser) return 0;
    return notifications.filter(n => n.user_id === currentUser.id && !n.read).length;
}

function updateNotificationBadge() {
    const count = getUnreadNotifications();
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.style.display = 'inline';
        badge.textContent = count;
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotifications() {
    notificationsVisible = !notificationsVisible;
    const panel = document.getElementById('notificationPanel');
    
    if (notificationsVisible) {
        panel.classList.add('show');
        showNotifications();
    } else {
        panel.classList.remove('show');
    }
}

function showNotifications() {
    const list = document.getElementById('notificationList');
    const userNotifications = notifications
        .filter(n => n.user_id === currentUser.id)
        .sort((a, b) => new Date(b.time) - new Date(a.time));
    
    let html = '';
    
    if (userNotifications.length === 0) {
        html = '<div style="text-align: center; color: #8899aa; padding: 25px;">لا توجد إشعارات</div>';
    } else {
        userNotifications.forEach(n => {
            const unreadClass = n.read ? '' : 'unread';
            html += `
                <div class="notification-item ${unreadClass}" onclick="markNotificationRead(${n.id})">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-text">${n.text}</div>
                    <div class="notification-time">${n.time}</div>
                </div>
            `;
        });
    }
    
    list.innerHTML = html;
}

async function markNotificationRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
        await loadAllData();
        showNotifications();
        updateNotificationBadge();
    }
}

// ==================== دوال رفع الملفات ====================
window.openDescriptionPanel = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        currentTaskId = taskId;
        document.getElementById('panelTaskTitle').textContent = task.title;
        document.getElementById('panelTaskDescription').textContent = task.description || 'لا يوجد شرح لهذه المهمة';
        
        updateFilePreview(taskId);
        
        document.getElementById('uploadSection').style.display = currentUser && !currentUser.is_admin ? 'block' : 'none';
        
        document.getElementById('taskDescriptionPanel').classList.add('open');
    }
};

window.closeDescriptionPanel = function() {
    document.getElementById('taskDescriptionPanel').classList.remove('open');
    currentTaskId = null;
};

function updateFilePreview(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const previewList = document.getElementById('filePreviewList');
    
    if (!task || !task.files || task.files.length === 0) {
        previewList.innerHTML = '<p style="color: #8899aa;">لا توجد ملفات مرفوعة</p>';
        return;
    }
    
    let html = '';
    task.files.forEach((file, index) => {
        const fileIcon = file.type.includes('pdf') ? '📕' : 
                        file.type.includes('word') ? '📘' : 
                        file.type.includes('image') ? '🖼️' : '📄';
        
        let preview = '';
        if (file.type.includes('image')) {
            preview = `<img src="${file.data}" class="file-preview" onclick="window.open('${file.data}', '_blank')" alt="${file.name}">`;
        }
        
        html += `
            <div class="file-item">
                <div class="file-info">
                    <div>
                        ${fileIcon} 
                        <a href="${file.data}" download="${file.name}" target="_blank">${file.name}</a>
                    </div>
                    ${preview}
                    <div class="file-meta">
                        رفع: ${file.uploadedByName} - ${file.uploadTime}
                    </div>
                </div>
                ${currentUser && currentUser.is_admin ? `
                    <div>
                        <button onclick="approveTask(${taskId})" class="approve-btn">✔️ موافقة</button>
                        <button onclick="rejectTask(${taskId})" class="reject-btn">✖️ رفض</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    previewList.innerHTML = html;
}

window.uploadFiles = async function() {
    if (!currentTaskId) return;
    
    const files = document.getElementById('fileUpload').files;
    if (files.length === 0) {
        alert('❌ الرجاء اختيار ملفات للرفع');
        return;
    }
    
    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                uploadedBy: currentUser.id,
                uploadedByName: currentUser.name,
                uploadTime: new Date().toLocaleString('ar-EG'),
                taskId: currentTaskId,
                taskTitle: task.title
            };
            
            if (!task.files) task.files = [];
            task.files.push(fileData);
            
            if (task.status === 'لم تبدأ') {
                task.status = 'قيد التنفيذ';
            }
            
            await supabase.from('tasks').update({ 
                files: task.files,
                status: task.status
            }).eq('id', currentTaskId);
            
            await loadAllData();
            updateFilePreview(currentTaskId);
            
            await addNotification(7, '📎 ملفات جديدة', `قام ${currentUser.name} برفع ملف: ${file.name} للمهمة: ${task.title}`, 'file');
            
            if (!currentUser.is_admin) {
                showUserPage();
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    alert('✅ تم رفع الملفات بنجاح');
    document.getElementById('fileUpload').value = '';
};

window.approveTask = async function(taskId) {
    if (confirm('هل تريد الموافقة على هذه المهمة؟')) {
        await supabase.from('tasks').update({ status: 'تمت' }).eq('id', taskId);
        await loadAllData();
        closeDescriptionPanel();
        
        const task = tasks.find(t => t.id === taskId);
        const assignedUser = users.find(u => u.tasks && u.tasks.includes(taskId));
        if (assignedUser) {
            await addNotification(assignedUser.id, '✅ مهمة مكتملة', `تمت الموافقة على مهمتك: ${task.title}`, 'success');
        }
        
        showAdminDashboard();
    }
};

window.rejectTask = async function(taskId) {
    if (confirm('هل تريد رفض هذه المهمة؟')) {
        await supabase.from('tasks').update({ status: 'لم تبدأ' }).eq('id', taskId);
        await loadAllData();
        closeDescriptionPanel();
        
        const task = tasks.find(t => t.id === taskId);
        const assignedUser = users.find(u => u.tasks && u.tasks.includes(taskId));
        if (assignedUser) {
            await addNotification(assignedUser.id, '❌ مهمة مرفوضة', `تم رفض مهمتك: ${task.title}، يرجى مراجعتها`, 'error');
        }
        
        showAdminDashboard();
    }
};

// ==================== دوال الرسائل ====================
async function sendMessage() {
    const messageText = document.getElementById('newMessage').value.trim();
    if (!messageText) return;

    const recipientId = currentChatUserId || (currentUser.is_admin ? null : 7);
    
    if (recipientId && recipientId !== 7 && !canUserChatWith(recipientId)) {
        alert('❌ لا يمكنك إرسال رسالة لهذا المستخدم. ليس لديك صلاحية للتواصل معه.');
        return;
    }

    const newMessage = {
        sender_id: currentUser.id,
        recipient_id: recipientId,
        text: messageText,
        time: new Date().toLocaleString('ar-EG'),
        read: false
    };

    await saveMessage(newMessage);
    document.getElementById('newMessage').value = '';
    
    if (currentChatUserId) {
        showChatWithUser(currentChatUserId);
    } else {
        showMessages();
    }
    
    updateUnreadCount();
}

function getUnreadCount() {
    if (!currentUser) return 0;
    
    if (currentUser.is_admin) { 
        return messages.filter(m => m.recipient_id === 7 && !m.read).length;
    } else {
        return messages.filter(m => m.recipient_id === currentUser.id && !m.read).length;
    }
}

function updateUnreadCount() {
    const count = getUnreadCount();
    const badge = document.getElementById('unreadCount');
    if (badge) {
        badge.textContent = count;
        if (count > 0) {
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function markMessagesAsRead(userId) {
    for (const m of messages) {
        if (m.recipient_id === userId || (m.sender_id === userId && m.recipient_id === currentUser.id)) {
            if (!m.read) {
                await supabase.from('messages').update({ read: true }).eq('id', m.id);
            }
        }
    }
    await loadAllData();
    updateUnreadCount();
}

function toggleMessages() {
    messagesContentVisible = !messagesContentVisible;
    const content = document.getElementById('messagesContent');
    const input = document.getElementById('messageInput');
    
    if (content && input) {
        content.style.display = messagesContentVisible ? 'block' : 'none';
        input.style.display = messagesContentVisible ? 'flex' : 'none';
    }
    
    if (messagesContentVisible) {
        showUserList();
    }
}

function showUserList() {
    const content = document.getElementById('messagesContent');
    let html = '<div style="padding: 10px;">';
    
    let availableUsers = [];
    
    if (currentUser.is_admin) {
        availableUsers = users.filter(u => !u.is_admin);
    } else {
        availableUsers = users.filter(u => !u.is_admin && u.id !== currentUser.id && 
            (currentUser.chat_permissions || []).includes(u.id));
    }
    
    availableUsers.forEach(u => {
        const unreadFromUser = messages.filter(m => m.sender_id === u.id && !m.read).length;
        const userFiles = tasks.filter(t => t.files && t.files.some(f => f.uploaded_by === u.id)).length;
        
        html += `
            <div class="user-list-item" onclick="showChatWithUser(${u.id})">
                <div class="user-name">${u.name}</div>
                <div class="user-stats">
                    ${userFiles > 0 ? `<span class="file-count">📎 ${userFiles}</span>` : ''}
                    ${unreadFromUser > 0 ? `<span class="unread-badge">${unreadFromUser}</span>` : ''}
                </div>
            </div>
        `;
    });
    
    if (availableUsers.length === 0) {
        html += '<div style="text-align: center; color: #8899aa; padding: 25px;">لا يوجد مستخدمين متاحين للمحادثة</div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

function showChatWithUser(userId) {
    currentChatUserId = userId;
    const user = users.find(u => u.id === userId);
    const content = document.getElementById('messagesContent');
    
    if (!currentUser.is_admin && !canUserChatWith(userId)) {
        alert('❌ لا يمكنك التواصل مع هذا المستخدم');
        showUserList();
        return;
    }
    
    markMessagesAsRead(userId);
    
    let html = `<div style="padding: 10px;">
        <button class="back-button" onclick="showUserList()">🔙 رجوع لقائمة المستخدمين</button>
        
        <div class="chat-header">
            محادثة مع: ${user.name}
        </div>
    `;
    
    const chatMessages = messages.filter(m => 
        (m.sender_id === currentUser.id && m.recipient_id === userId) ||
        (m.sender_id === userId && m.recipient_id === currentUser.id)
    ).sort((a, b) => new Date(a.time) - new Date(b.time));
    
    chatMessages.forEach(m => {
        const messageClass = m.sender_id === currentUser.id ? 'sent' : 'received';
        html += `
            <div class="message ${messageClass}">
                <div class="sender">${m.sender_name || user.name}</div>
                <div>${m.text}</div>
                <div class="time">${m.time}</div>
            </div>
        `;
    });
    
    if (chatMessages.length === 0) {
        html += '<div style="text-align: center; color: #8899aa; padding: 25px;">لا توجد رسائل بعد. ابدأ المحادثة!</div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
    
    setTimeout(() => {
        content.scrollTop = content.scrollHeight;
    }, 100);
}

function showMessages() {
    if (!currentUser) return;
    
    const content = document.getElementById('messagesContent');
    let html = '';
    
    const userMessages = messages.filter(m => 
        m.sender_id === currentUser.id || m.recipient_id === currentUser.id
    ).sort((a, b) => new Date(a.time) - new Date(b.time));
    
    markMessagesAsRead(currentUser.id);
    
    userMessages.forEach(m => {
        const sender = users.find(u => u.id === m.sender_id);
        const messageClass = m.sender_id === currentUser.id ? 'sent' : 'received';
        html += `
            <div class="message ${messageClass}">
                <div class="sender">${sender ? sender.name : 'غير معروف'}</div>
                <div>${m.text}</div>
                <div class="time">${m.time}</div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<div style="text-align: center; color: #8899aa; padding: 25px;">لا توجد رسائل بعد</div>';
    }
    
    content.innerHTML = html;
    
    setTimeout(() => {
        content.scrollTop = content.scrollHeight;
    }, 100);
}

// ==================== دوال المستخدمين ====================
async function addUser(userData) {
    const newUser = {
        name: userData.name,
        password: userData.password,
        is_admin: false,
        tasks: [],
        chat_permissions: []
    };
    
    await saveUser(newUser);
    return newUser;
}

async function deleteUser(userId) {
    if (userId === 7) {
        alert('❌ لا يمكن حذف المدير');
        return false;
    }
    await supabase.from('users').delete().eq('id', userId);
    await loadAllData();
    return true;
}

async function updateUser(userId, newData) {
    await supabase.from('users').update(newData).eq('id', userId);
    await loadAllData();
    return true;
}

// ==================== دوال المهام ====================
async function addTask(taskData) {
    const newTask = {
        title: taskData.title,
        refs: taskData.refs,
        description: taskData.description,
        status: 'لم تبدأ',
        files: []
    };
    
    await saveTask(newTask);
    await addNotificationToAll('📋 مهمة جديدة', `تم إضافة مهمة جديدة: ${taskData.title}`, 'task');
    
    return newTask;
}

async function deleteTask(taskId) {
    await supabase.from('tasks').delete().eq('id', taskId);
    await loadAllData();
    return true;
}

async function updateTask(taskId, newData) {
    await supabase.from('tasks').update(newData).eq('id', taskId);
    await loadAllData();
    return true;
}

async function assignTaskToUser(taskId, userId) {
    const user = users.find(u => u.id === userId);
    if (user && user.tasks && !user.tasks.includes(taskId)) {
        const updatedTasks = [...user.tasks, taskId];
        await supabase.from('users').update({ tasks: updatedTasks }).eq('id', userId);
        await loadAllData();
        
        const task = tasks.find(t => t.id === taskId);
        await addNotification(userId, '📋 مهمة جديدة', `تم تعيين مهمة جديدة لك: ${task.title}`, 'task');
        
        return true;
    }
    return false;
}

// ==================== دوال صلاحيات المحادثة ====================
function canUserChatWith(targetUserId) {
    if (currentUser.is_admin) return true;
    
    const currentUserPermissions = currentUser.chat_permissions || [];
    return currentUserPermissions.includes(targetUserId);
}

window.showChatPermissionForm = function() {
    currentSection = 'chat-permissions';
    updateNavLinks();
    
    const nonAdminUsers = users.filter(u => !u.is_admin);
    
    let usersHtml = '';
    nonAdminUsers.forEach(u => {
        const selected = selectedUsersForPermission.includes(u.id) ? 'selected' : '';
        usersHtml += `
            <div class="user-card ${selected}" onclick="toggleUserSelection(${u.id})">
                <div class="user-name">${u.name}</div>
                <div class="user-status">${u.chat_permissions && u.chat_permissions.length > 0 ? '✅ لديه صلاحيات' : '❌ لا توجد صلاحيات'}</div>
            </div>
        `;
    });

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="container">
            <h2>🔓 إدارة صلاحيات المحادثات</h2>

            <div class="chat-permission-form">
                <h3 style="color: #00ffaa;">اختر المستخدمين الذين تريد منحهم صلاحية المحادثة</h3>
                
                <div class="users-grid">
                    ${usersHtml}
                </div>

                <div style="display: flex; gap: 15px; margin-top: 25px; flex-wrap: wrap;">
                    <button class="action-btn btn-mass-message" onclick="grantChatPermissions()" style="flex: 2;">
                        <span class="btn-icon">🔓</span>
                        منح الصلاحية للمختارين
                    </button>
                    <button class="action-btn" onclick="revokeAllChatPermissions()" style="flex: 1; background: #e74c3c;">
                        <span class="btn-icon">🔒</span>
                        إلغاء الكل
                    </button>
                    <button class="action-btn" onclick="showUserManagement()" style="flex: 1; background: #4a90e2;">
                        <span class="btn-icon">🔙</span>
                        رجوع
                    </button>
                </div>
            </div>
        </div>
    `;
};

window.toggleUserSelection = function(userId) {
    const index = selectedUsersForPermission.indexOf(userId);
    if (index === -1) {
        selectedUsersForPermission.push(userId);
    } else {
        selectedUsersForPermission.splice(index, 1);
    }
    showChatPermissionForm();
};

window.grantChatPermissions = async function() {
    if (selectedUsersForPermission.length === 0) {
        alert('❌ الرجاء اختيار مستخدمين على الأقل');
        return;
    }

    for (const sourceId of selectedUsersForPermission) {
        const sourceUser = users.find(u => u.id === sourceId);
        if (!sourceUser.chat_permissions) sourceUser.chat_permissions = [];
        
        for (const targetId of selectedUsersForPermission) {
            if (sourceId !== targetId && !sourceUser.chat_permissions.includes(targetId)) {
                sourceUser.chat_permissions.push(targetId);
            }
        }
        
        await supabase.from('users').update({ 
            chat_permissions: sourceUser.chat_permissions 
        }).eq('id', sourceId);
    }

    await loadAllData();
    
    for (const userId of selectedUsersForPermission) {
        const otherUsers = selectedUsersForPermission.filter(id => id !== userId)
            .map(id => users.find(u => u.id === id)?.name).join('، ');
        await addNotification(userId, '🔓 صلاحية محادثة جديدة', `يمكنك الآن التواصل مع: ${otherUsers}`, 'permission');
    }

    alert('✅ تم منح صلاحيات المحادثة بنجاح');
    selectedUsersForPermission = [];
    showChatPermissionForm();
};

window.revokeAllChatPermissions = async function() {
    if (confirm('هل أنت متأكد من إلغاء جميع صلاحيات المحادثة؟')) {
        for (const u of users) {
            if (!u.is_admin) {
                await supabase.from('users').update({ chat_permissions: [] }).eq('id', u.id);
            }
        }
        await loadAllData();
        alert('✅ تم إلغاء جميع الصلاحيات');
        showChatPermissionForm();
    }
};

// ==================== دوال الرسائل الجماعية ====================
window.showMassMessageForm = function() {
    const app = document.getElementById('app');
    
    const userOptions = users
        .filter(u => !u.is_admin)
        .map(u => `<option value="${u.id}">${u.name}</option>`)
        .join('');
    
    const massForm = `
        <div class="mass-message-form">
            <h3 style="color: #00ffaa; margin-bottom: 15px;">📨 إرسال رسالة جماعية</h3>
            <select id="massRecipient">
                <option value="all">👥 جميع المستخدمين</option>
                ${userOptions}
            </select>
            <textarea id="massMessage" placeholder="اكتب رسالتك هنا..."></textarea>
            <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                <button onclick="sendMassMessage()" class="action-btn btn-mass-message" style="flex: 2;">
                    <span class="btn-icon">📨</span>
                    إرسال الرسالة
                </button>
                <button onclick="hideMassMessageForm()" class="action-btn" style="flex: 1; background: #e74c3c;">
                    <span class="btn-icon">✖️</span>
                    إلغاء
                </button>
            </div>
        </div>
    `;
    
    app.innerHTML = massForm + app.innerHTML;
};

window.hideMassMessageForm = function() {
    showAdminDashboard();
};

window.sendMassMessage = async function() {
    const recipient = document.getElementById('massRecipient').value;
    const messageText = document.getElementById('massMessage').value.trim();
    
    if (!messageText) {
        alert('❌ الرجاء كتابة الرسالة');
        return;
    }
    
    if (recipient === 'all') {
        for (const user of users.filter(u => !u.is_admin)) {
            await addNotification(user.id, '📨 رسالة جماعية', messageText, 'mass');
        }
        alert('✅ تم إرسال الرسالة لجميع المستخدمين');
    } else {
        const userId = parseInt(recipient);
        const user = users.find(u => u.id === userId);
        await addNotification(userId, '📨 رسالة خاصة', messageText, 'private');
        alert(`✅ تم إرسال الرسالة إلى ${user.name}`);
    }
    
    showAdminDashboard();
};

// ==================== دوال تغيير الرقم السري ====================
window.changePassword = async function() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (currentUser.password !== currentPassword) {
        alert('❌ الرقم السري الحالي غير صحيح');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('❌ الرقم السري الجديد غير متطابق');
        return;
    }
    
    if (newPassword.length < 4) {
        alert('❌ الرقم السري يجب أن يكون 4 أحرف على الأقل');
        return;
    }
    
    await supabase.from('users').update({ password: newPassword }).eq('id', currentUser.id);
    await loadAllData();
    
    currentUser.password = newPassword;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    alert('✅ تم تغيير الرقم السري بنجاح');
    await addNotification(7, '🔐 تغيير رقم سري', `قام ${currentUser.name} بتغيير الرقم السري`, 'security');
};

// ==================== إدارة الصفحات ====================
const app = document.getElementById('app');

window.logout = function() {
    // إلغاء اشتراكات Realtime
    realtimeChannels.forEach(channel => {
        supabase.removeChannel(channel);
    });
    realtimeChannels = [];
    
    localStorage.removeItem('currentUser');
    currentUser = null;
    const navbar = document.getElementById('navbar');
    const messagesPanel = document.getElementById('messagesPanel');
    const notificationPanel = document.getElementById('notificationPanel');
    
    if (navbar) navbar.style.display = 'none';
    if (messagesPanel) messagesPanel.style.display = 'none';
    if (notificationPanel) notificationPanel.classList.remove('show');
    closeDescriptionPanel();
    showLoginPage();
};

async function login(username, password) {
    const user = users.find(u => u.name === username && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        const navbar = document.getElementById('navbar');
        const displayUsername = document.getElementById('displayUsername');
        const messagesPanel = document.getElementById('messagesPanel');
        
        if (navbar) navbar.style.display = 'block';
        if (displayUsername) displayUsername.textContent = user.name;
        if (messagesPanel) messagesPanel.style.display = 'block';
        
        updateNavLinks();
        updateMobileMenu();
        updateNotificationBadge();
        
        if (user.is_admin) {
            showAdminDashboard();
        } else {
            showUserPage();
        }
        return true;
    }
    return false;
}

function updateNavLinks() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;
    
    if (currentUser.is_admin) {
        navLinks.innerHTML = `
            <div class="nav-link ${currentSection === 'dashboard' ? 'active' : ''}" onclick="showAdminDashboard()">
                <span>📊</span>
                <span>الرئيسية</span>
            </div>
            <div class="nav-link ${currentSection === 'users' ? 'active' : ''}" onclick="showUserManagement()">
                <span>👥</span>
                <span>إدارة المستخدمين</span>
            </div>
            <div class="nav-link ${currentSection === 'tasks' ? 'active' : ''}" onclick="showTaskManagement()">
                <span>📋</span>
                <span>إدارة المهام</span>
            </div>
            <div class="nav-link ${currentSection === 'messages' ? 'active' : ''}" onclick="showMessagesManagement()">
                <span>📨</span>
                <span>الرسائل</span>
            </div>
            <div class="nav-link ${currentSection === 'chat-permissions' ? 'active' : ''}" onclick="showChatPermissionForm()">
                <span>🔓</span>
                <span>صلاحيات المحادثة</span>
            </div>
            <div class="nav-link logout" onclick="logout()">
                <span>🚪</span>
                <span>خروج</span>
            </div>
        `;
    } else {
        navLinks.innerHTML = `
            <div class="nav-link ${currentSection === 'user' ? 'active' : ''}" onclick="showUserPage()">
                <span>📋</span>
                <span>مهامي</span>
            </div>
            <div class="nav-link password" onclick="showPasswordForm()">
                <span>🔐</span>
                <span>تغيير الرقم السري</span>
            </div>
            <div class="nav-link logout" onclick="logout()">
                <span>🚪</span>
                <span>خروج</span>
            </div>
        `;
    }
}

function updateMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;
    
    if (currentUser && currentUser.is_admin) {
        mobileMenu.innerHTML = `
            <div class="nav-link ${currentSection === 'dashboard' ? 'active' : ''}" onclick="navigateAndClose('dashboard')">
                <span>📊</span>
                <span>الرئيسية</span>
            </div>
            <div class="nav-link ${currentSection === 'users' ? 'active' : ''}" onclick="navigateAndClose('users')">
                <span>👥</span>
                <span>إدارة المستخدمين</span>
            </div>
            <div class="nav-link ${currentSection === 'tasks' ? 'active' : ''}" onclick="navigateAndClose('tasks')">
                <span>📋</span>
                <span>إدارة المهام</span>
            </div>
            <div class="nav-link ${currentSection === 'messages' ? 'active' : ''}" onclick="navigateAndClose('messages')">
                <span>📨</span>
                <span>الرسائل</span>
            </div>
            <div class="nav-link ${currentSection === 'chat-permissions' ? 'active' : ''}" onclick="navigateAndClose('chat-permissions')">
                <span>🔓</span>
                <span>صلاحيات المحادثة</span>
            </div>
            <div class="nav-link logout" onclick="logoutAndClose()">
                <span>🚪</span>
                <span>خروج</span>
            </div>
        `;
    } else if (currentUser && !currentUser.is_admin) {
        mobileMenu.innerHTML = `
            <div class="nav-link ${currentSection === 'user' ? 'active' : ''}" onclick="navigateAndClose('user')">
                <span>📋</span>
                <span>مهامي</span>
            </div>
            <div class="nav-link password" onclick="navigateAndClose('password')">
                <span>🔐</span>
                <span>تغيير الرقم السري</span>
            </div>
            <div class="nav-link logout" onclick="logoutAndClose()">
                <span>🚪</span>
                <span>خروج</span>
            </div>
        `;
    }
}

window.toggleMobileMenu = function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!hamburger || !mobileMenu) return;
    
    mobileMenuOpen = !mobileMenuOpen;
    
    if (mobileMenuOpen) {
        mobileMenu.classList.add('show');
        hamburger.classList.add('open');
        document.body.style.overflow = 'hidden';
    } else {
        mobileMenu.classList.remove('show');
        hamburger.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
};

document.addEventListener('click', function(event) {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!hamburger || !mobileMenu || !mobileMenuOpen) return;
    
    if (!hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileMenuOpen = false;
        mobileMenu.classList.remove('show');
        hamburger.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
});

window.navigateAndClose = function(section) {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger) hamburger.classList.remove('open');
    if (mobileMenu) mobileMenu.classList.remove('show');
    mobileMenuOpen = false;
    document.body.style.overflow = 'auto';
    
    if (section === 'dashboard') showAdminDashboard();
    else if (section === 'users') showUserManagement();
    else if (section === 'tasks') showTaskManagement();
    else if (section === 'messages') showMessagesManagement();
    else if (section === 'chat-permissions') showChatPermissionForm();
    else if (section === 'user') showUserPage();
    else if (section === 'password') showPasswordForm();
};

window.logoutAndClose = function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger) hamburger.classList.remove('open');
    if (mobileMenu) mobileMenu.classList.remove('show');
    mobileMenuOpen = false;
    document.body.style.overflow = 'auto';
    
    logout();
};

// ==================== عرض الصفحات ====================
function showLoginPage() {
    app.innerHTML = `
        <div class="login-wrapper">
            <div class="login-glass">
                <div class="login-header">
                    <h1>5G Project</h1>
                    <p>نظام إدارة <span>المشاريع</span></p>
                </div>
                
                <div class="login-input-group">
                    <i>👤</i>
                    <input type="text" id="username" placeholder="اسم المستخدم">
                </div>
                
                <div class="login-input-group">
                    <i>🔒</i>
                    <input type="password" id="password" placeholder="الرقم السري">
                </div>
                
                <button class="login-button" onclick="handleLogin()">دخول ⚡</button>
                
                <p id="error" class="login-error" style="display: none;"></p>
                
                <div class="login-hint">
                    <small><span class="highlight">👤 المستخدمين:</span> أحمد (1234) - محمد (5678) - سارة (9012)</small>
                    <small><span class="highlight">👥 إضافيين:</span> علي (1111) - فاطمة (2222) - يوسف (3333)</small>
                    <small><span class="highlight">👑 المدير:</span> Ahmed (admin123)</small>
                </div>
            </div>
        </div>
    `;
}

function showUserPage() {
    currentSection = 'user';
    updateNavLinks();
    updateMobileMenu();

    const userTasks = tasks.filter(t => currentUser.tasks && currentUser.tasks.includes(t.id));

    let tasksHtml = '';
    userTasks.forEach(t => {
        let statusClass = 'status-pending';
        if (t.status === 'قيد التنفيذ') {
            statusClass = 'status-review';
        } else if (t.status === 'تمت') {
            statusClass = 'status-done';
        }
        
        tasksHtml += `<tr>
            <td>${t.id}</td>
            <td>
                ${t.title}
                <button class="edit-btn" onclick="openDescriptionPanel(${t.id})" style="font-size: 12px; padding: 4px 10px;">📖 شرح</button>
            </td>
            <td><span class="${statusClass}">${t.status}</span></td>
            <td>${t.refs}</td>
            <td>
                <button class="upload-btn" onclick="openDescriptionPanel(${t.id})">📎 رفع ملفات</button>
            </td>
        </tr>`;
    });

    app.innerHTML = `
        <div class="container">
            <div class="tasks-summary">
                <p>📋 مهامك في شبكة 5G: <span style="font-weight: 700; color: #00ffaa;">${userTasks.length}</span></p>
                <p style="font-size: 14px; margin-top: 8px; color: #a0b0c0;">الحالة تتغير تلقائياً عند رفع الملفات</p>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الموضوع</th>
                            <th>الحالة</th>
                            <th>الأرقام المرجعية</th>
                            <th>الملفات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasksHtml || '<tr><td colspan="5" style="color: #8899aa;">لا توجد مهام مخصصة لك</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAdminDashboard() {
    currentSection = 'dashboard';
    updateNavLinks();
    updateMobileMenu();
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'تمت').length;
    const pendingTasks = tasks.filter(t => t.status !== 'تمت').length;
    const totalUsers = users.filter(u => !u.is_admin).length;

    let tasksHtml = '';
    tasks.forEach(t => {
        const assigned = users.find(u => u.tasks && u.tasks.includes(t.id))?.name || 'غير معين';
        let statusClass = 'status-pending';
        if (t.status === 'قيد التنفيذ') statusClass = 'status-review';
        else if (t.status === 'تمت') statusClass = 'status-done';
        
        const fileCount = t.files ? t.files.length : 0;
        
        tasksHtml += `<tr>
            <td>${t.id}</td>
            <td>${t.title}</td>
            <td><span class="${statusClass}">${t.status}</span></td>
            <td>${t.refs}</td>
            <td>${assigned}</td>
            <td>
                <button class="view-files-btn" onclick="openDescriptionPanel(${t.id})">
                    📎 ${fileCount} ملف
                </button>
            </td>
        </tr>`;
    });

    app.innerHTML = `
        <div class="container dashboard">
            <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 30px;">
                <button class="action-btn btn-mass-message" onclick="showMassMessageForm()">
                    <span class="btn-icon">📨</span>
                    إرسال رسالة جماعية
                </button>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <h3>إجمالي المهام</h3>
                    <p class="stat-number">${totalTasks}</p>
                </div>
                <div class="stat-card">
                    <h3>المهام المنجزة</h3>
                    <p class="stat-number">${completedTasks}</p>
                </div>
                <div class="stat-card">
                    <h3>المهام قيد التنفيذ</h3>
                    <p class="stat-number">${pendingTasks}</p>
                </div>
                <div class="stat-card">
                    <h3>عدد المستخدمين</h3>
                    <p class="stat-number">${totalUsers}</p>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الموضوع</th>
                            <th>الحالة</th>
                            <th>الأرقام المرجعية</th>
                            <th>المسؤول</th>
                            <th>الملفات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasksHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showUserManagement() {
    currentSection = 'users';
    updateNavLinks();
    updateMobileMenu();
    
    let usersHtml = ''; 
    users.forEach(u => {
        if (!u.is_admin) {
            const userFiles = tasks.filter(t => t.files && t.files.some(f => f.uploaded_by === u.id)).length;
            const permissions = u.chat_permissions && u.chat_permissions.length > 0 
                ? u.chat_permissions.map(id => users.find(user => user.id === id)?.name).join('، ')
                : 'لا يوجد';
            
            usersHtml += `<tr>
                <td>${u.id}</td>
                <td>${u.name}</td>
                <td>${u.password}</td>
                <td>${u.tasks ? u.tasks.length : 0}</td>
                <td>${userFiles}</td>
                <td><span style="color: ${u.chat_permissions && u.chat_permissions.length > 0 ? '#00ffaa' : '#ff8a80'}; font-weight: 600;">${u.chat_permissions && u.chat_permissions.length > 0 ? '✅' : '❌'} ${permissions}</span></td>
                <td>
                    <button class="edit-btn" onclick="editUser(${u.id})">✏️ تعديل</button>
                    <button class="delete-btn" onclick="deleteUserHandler(${u.id})">🗑️ حذف</button>
                    <button class="message-btn" onclick="showChatWithUser(${u.id})">📨 محادثة</button>
                </td>
            </tr>`;
        }
    });

    app.innerHTML = `
        <div class="container">
            <h2>👥 إدارة المستخدمين</h2>

            <div class="add-form">
                <h3 style="color: #00ffaa; margin-bottom: 20px;">➕ إضافة مستخدم جديد</h3>
                <div class="form-row">
                    <input type="text" id="newUserName" placeholder="اسم المستخدم">
                    <input type="password" id="newUserPassword" placeholder="الرقم السري">
                    <button class="action-btn btn-add-user" onclick="addUserHandler()" style="padding: 16px 35px;">
                        <span class="btn-icon">👥</span>
                        إضافة مستخدم
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الاسم</th>
                            <th>الرقم السري</th>
                            <th>عدد المهام</th>
                            <th>الملفات</th>
                            <th>صلاحيات المحادثة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usersHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showTaskManagement() {
    currentSection = 'tasks';
    updateNavLinks();
    updateMobileMenu();
    
    let tasksHtml = ''; 
    tasks.forEach(t => {
        const assignedUsers = users.filter(u => u.tasks && u.tasks.includes(t.id)).map(u => u.name).join('، ') || 'غير معين';
        const fileCount = t.files ? t.files.length : 0;
        
        tasksHtml += `<tr>
            <td>${t.id}</td>
            <td>
                ${t.title}
                <button class="edit-btn" onclick="openDescriptionPanel(${t.id})" style="font-size: 12px; padding: 4px 10px;">📖 شرح</button>
            </td>
            <td>${t.refs}</td>
            <td><span class="${t.status === 'تمت' ? 'status-done' : t.status === 'قيد التنفيذ' ? 'status-review' : 'status-pending'}">${t.status}</span></td>
            <td>${assignedUsers}</td>
            <td>${fileCount}</td>
            <td>
                <button class="edit-btn" onclick="editTask(${t.id})">✏️ تعديل</button>
                <button class="delete-btn" onclick="deleteTaskHandler(${t.id})">🗑️ حذف</button>
                <button class="edit-btn" onclick="assignTask(${t.id})">👥 تعيين</button>
                <button class="edit-btn" onclick="editTaskDescription(${t.id})">📝 شرح</button>
            </td>
        </tr>`;
    });

    app.innerHTML = `
        <div class="container">
            <h2>📋 إدارة المهام</h2>

            <div class="add-form">
                <h3 style="color: #00ffaa; margin-bottom: 20px;">➕ إضافة مهمة جديدة</h3>
                <div class="form-row">
                    <input type="text" id="newTaskTitle" placeholder="عنوان المهمة">
                    <input type="text" id="newTaskRefs" placeholder="الأرقام المرجعية">
                </div>
                <div class="form-row">
                    <textarea id="newTaskDescription" placeholder="شرح المهمة" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <button class="action-btn btn-add-task" onclick="addTaskHandler()" style="width: 100%;">
                        <span class="btn-icon">➕</span>
                        إضافة مهمة جديدة
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>العنوان</th>
                            <th>الأرقام المرجعية</th>
                            <th>الحالة</th>
                            <th>المسؤولون</th>
                            <th>الملفات</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasksHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showMessagesManagement() {
    currentSection = 'messages';
    updateNavLinks();
    updateMobileMenu();
    
    let messagesHtml = '';
    messages.forEach(m => {
        const sender = users.find(u => u.id === m.sender_id)?.name || 'غير معروف';
        const recipient = users.find(u => u.id === m.recipient_id)?.name || 'غير معروف';
        const readStatus = m.read ? 'مقروءة' : 'غير مقروءة';
        const statusClass = m.read ? 'status-done' : 'status-pending';
        
        messagesHtml += `<tr>
            <td>${m.id}</td>
            <td>${sender}</td>
            <td>${recipient}</td>
            <td>${m.text}</td>
            <td>${m.time}</td>
            <td><span class="${statusClass}">${readStatus}</span></td>
            <td>
                <button class="delete-btn" onclick="deleteMessage(${m.id})">
                    <span>🗑️</span>
                    حذف
                </button>
            </td>
        </tr>`;
    });

    app.innerHTML = `
        <div class="container">
            <h2>📨 إدارة الرسائل</h2>

            <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
                <button class="action-btn btn-mass-message" onclick="showMassMessageForm()">
                    <span class="btn-icon">📨</span>
                    إرسال رسالة جماعية
                </button>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المرسل</th>
                            <th>المستلم</th>
                            <th>نص الرسالة</th>
                            <th>وقت الإرسال</th>
                            <th>حالة القراءة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${messagesHtml || '<tr><td colspan="7" style="color: #8899aa; text-align: center;">لا توجد رسائل</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showPasswordForm() {
    currentSection = 'password';
    updateNavLinks();
    
    app.innerHTML = `
        <div class="container">
            <h2>🔐 تغيير الرقم السري</h2>
            
            <div class="add-form password-section">
                <div class="form-row">
                    <input type="password" id="currentPassword" placeholder="الرقم السري الحالي">
                </div>
                <div class="form-row">
                    <input type="password" id="newPassword" placeholder="الرقم السري الجديد" oninput="checkPasswordStrength()">
                </div>
                <div class="form-row">
                    <input type="password" id="confirmPassword" placeholder="تأكيد الرقم السري الجديد">
                </div>
                
                <div class="password-requirements">
                    <div id="lengthReq" class="requirement-not-met">✅ 4 أحرف على الأقل</div>
                    <div id="numberReq" class="requirement-not-met">✅ رقم واحد على الأقل</div>
                </div>
                
                <div class="password-strength">
                    <div class="strength-bar">
                        <div id="passwordStrengthBar" class="strength-fill" style="width: 0%"></div>
                    </div>
                </div>
                
                <button class="action-btn btn-password" onclick="changePassword()" style="width: 100%; margin-top: 20px;">
                    <span class="btn-icon">🔐</span>
                    تغيير الرقم السري
                </button>
            </div>
        </div>
    `;
}

window.checkPasswordStrength = function() {
    const newPassword = document.getElementById('newPassword').value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const lengthReq = document.getElementById('lengthReq');
    const numberReq = document.getElementById('numberReq');
    
    let strength = 0;
    
    if (newPassword.length >= 4) {
        strength += 50;
        if (lengthReq) lengthReq.className = 'requirement-met';
    } else {
        if (lengthReq) lengthReq.className = 'requirement-not-met';
    }
    
    if (/\d/.test(newPassword)) {
        strength += 50;
        if (numberReq) numberReq.className = 'requirement-met';
    } else {
        if (numberReq) numberReq.className = 'requirement-not-met';
    }
    
    if (strengthBar) {
        strengthBar.style.width = strength + '%';
    }
};

// ==================== دوال المعالجة ====================
window.handleLogin = async function() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('error');
    
    if (await login(username, password)) {
        errorEl.style.display = 'none';
    } else {
        errorEl.style.display = 'block';
        errorEl.innerText = '❌ اسم المستخدم أو الرقم السري خطأ';
    }
};

window.addUserHandler = async function() {
    const name = document.getElementById('newUserName').value.trim();
    const password = document.getElementById('newUserPassword').value.trim();
    
    if (name && password) {
        await addUser({ name, password });
        showUserManagement();
    } else {
        alert('❌ الرجاء إدخال جميع البيانات');
    }
};

window.deleteUserHandler = async function(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        if (await deleteUser(userId)) {
            showUserManagement();
        }
    }
};

window.editUser = async function(userId) {
    const user = users.find(u => u.id === userId);
    const newName = prompt('أدخل الاسم الجديد:', user.name);
    const newPassword = prompt('أدخل الرقم السري الجديد:', user.password);
    
    if (newName && newPassword) {
        await updateUser(userId, { name: newName, password: newPassword });
        await addNotification(7, '🔐 تعديل مستخدم', `تم تعديل بيانات المستخدم ${newName}`, 'edit');
        showUserManagement();
    }
};

window.addTaskHandler = async function() {
    const title = document.getElementById('newTaskTitle').value.trim();
    const refs = document.getElementById('newTaskRefs').value.trim();
    const description = document.getElementById('newTaskDescription').value.trim();
    
    if (title && refs) {
        await addTask({ title, refs, description });
        showTaskManagement();
    } else {
        alert('❌ الرجاء إدخال جميع البيانات');
    }
};

window.deleteTaskHandler = async function(taskId) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        await deleteTask(taskId);
        showTaskManagement();
    }
};

window.editTask = async function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const newTitle = prompt('أدخل العنوان الجديد:', task.title);
    const newRefs = prompt('أدخل الأرقام المرجعية الجديدة:', task.refs);
    
    if (newTitle && newRefs) {
        await updateTask(taskId, { title: newTitle, refs: newRefs });
        showTaskManagement();
    }
};

window.editTaskDescription = async function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const newDescription = prompt('أدخل الشرح الجديد للمهمة:', task.description || '');
    
    if (newDescription !== null) {
        await updateTask(taskId, { description: newDescription });
        showTaskManagement();
    }
};

window.assignTask = async function(taskId) {
    const availableUsers = users.filter(u => !u.is_admin);
    let userList = 'اختر المستخدم:\n';
    availableUsers.forEach((u, index) => {
        userList += `${index + 1}. ${u.name}\n`;
    });
    
    const choice = prompt(userList + 'أدخل رقم المستخدم:');
    const userIndex = parseInt(choice) - 1;
    
    if (userIndex >= 0 && userIndex < availableUsers.length) {
        const userId = availableUsers[userIndex].id;
        await assignTaskToUser(taskId, userId);
        showTaskManagement();
    }
};

window.deleteMessage = async function(messageId) {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
        await supabase.from('messages').delete().eq('id', messageId);
        await loadAllData();
        showMessagesManagement();
        alert('✅ تم حذف الرسالة بنجاح');
    }
};

// ==================== التهيئة عند بدء التشغيل ====================
async function init() {
    await loadAllData();
    setupRealtimeSubscriptions();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        const userExists = users.find(u => u.id === currentUser.id);
        if (userExists) {
            currentUser = userExists;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            const navbar = document.getElementById('navbar');
            const displayUsername = document.getElementById('displayUsername');
            const messagesPanel = document.getElementById('messagesPanel');
            
            if (navbar) navbar.style.display = 'block';
            if (displayUsername) displayUsername.textContent = currentUser.name;
            if (messagesPanel) messagesPanel.style.display = 'block';
            
            updateNavLinks();
            updateMobileMenu();
            updateNotificationBadge();
            
            if (currentUser.is_admin) {
                showAdminDashboard();
            } else {
                showUserPage();
            }
        } else {
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

// تشغيل التطبيق
init();

// تحديث دوري
setInterval(updateNotificationBadge, 5000);
setInterval(updateUnreadCount, 5000);