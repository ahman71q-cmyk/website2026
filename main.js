// ==================== تهيئة Supabase ====================
if (typeof window.supabase !== 'undefined') {
    const SUPABASE_URL = 'https://lpigzuymmzisrawmfcuq.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_vQ6Eh--B3jrQXgP_q3iN6Q_uv1m3k0G';
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase connected successfully');
} else {
    console.error('❌ Supabase library not loaded! Check your internet connection.');
}
       
        // ==================== متغيرات عامة ====================
        let users = [];
        let tasks = [];
        let messages = [];
        let notifications = [];
        let files = []; // ← أضف هذا السطر
        let nextFileId = 1; // ← أضف هذا السطر
        
        let nextTaskId = 1;
        let nextUserId = 1;
        let nextMessageId = 1;
        let nextNotificationId = 1;
        
        let currentSection = 'dashboard';
        let messagesContentVisible = false;
        let notificationsVisible = false;
        let currentTaskId = null;
        let mobileMenuOpen = false;
        let currentChatUserId = null;
        let selectedUsersForPermission = [];
        let currentUser = null;
        
        let syncInterval = null;
        const app = document.getElementById('app');
        // متغيرات لمنع التكرار اللانهائي
        let isProcessingMessageUpdate = false;
        let lastMessageUpdateTime = 0;

        // ==================== دوال التحميل من Supabase ====================
        async function loadUsers() {
            try {
                const { data, error } = await supabaseClient
                    .from('users')
                    .select('*')
                    .order('id');
                
                if (error) throw error;
                users = data || [];
                
                if (users.length > 0) {
                    nextUserId = Math.max(...users.map(u => u.id)) + 1;
                }
                
                return true;
            } catch (error) {
                console.error('خطأ في تحميل المستخدمين:', error);
                return false;
            }
        }

        async function loadTasks() {
            try {
                const { data, error } = await supabaseClient
                    .from('tasks')
                    .select('*')
                    .order('id');
                
                if (error) throw error;
                tasks = data || [];
                
                if (tasks.length > 0) {
                    nextTaskId = Math.max(...tasks.map(t => t.id)) + 1;
                }
                
                return true;
            } catch (error) {
                console.error('خطأ في تحميل المهام:', error);
                return false;
            }
        }

        async function loadMessages() {
            try {
                const { data, error } = await supabaseClient
                    .from('messages')
                    .select('*')
                    .order('id');
                
                if (error) throw error;
                messages = data || [];
                
                if (messages.length > 0) {
                    nextMessageId = Math.max(...messages.map(m => m.id)) + 1;
                }
                
                return true;
            } catch (error) {
                console.error('خطأ في تحميل الرسائل:', error);
                return false;
            }
        }

        async function loadNotifications() {
            try {
                const { data, error } = await supabaseClient
                    .from('notifications')
                    .select('*')
                    .order('id');
                
                if (error) throw error;
                notifications = data || [];
                
                if (notifications.length > 0) {
                    nextNotificationId = Math.max(...notifications.map(n => n.id)) + 1;
                }
                
                return true;
            } catch (error) {
                console.error('خطأ في تحميل الإشعارات:', error);
                return false;
            }
        }
        async function loadFiles() {
    try {
        const { data, error } = await supabaseClient
            .from('files')
            .select('*')
            .order('id');
        
        if (error) throw error;
        files = data || [];
        
        if (files.length > 0) {
            nextFileId = Math.max(...files.map(f => f.id)) + 1;
        }
        
        return true;
    } catch (error) {
        console.error('خطأ في تحميل الملفات:', error);
        return false;
    }
}

        async function loadAllData() {
            await Promise.all([
                loadUsers(),
                loadTasks(),
                loadMessages(),
                loadNotifications(),
                loadFiles()
            ]);
            
            updateNotificationBadge();
            updateUnreadCount();
        }
// دالة بسيطة لتشفير كلمة المرور (استخدم bcrypt في الإنتاج)
function hashPassword(password) {
    // هذه مجرد تشفير بسيط - للتطبيق الحقيقي استخدم bcrypt
    return btoa(password); // base64 encoding
}

function verifyPassword(inputPassword, storedPassword) {
    return btoa(inputPassword) === storedPassword;
}
        // ==================== دوال الحفظ في Supabase ====================
        async function saveUser(user) {
            try {
                const { error } = await supabaseClient
                    .from('users')
                    .upsert(user);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('خطأ في حفظ المستخدم:', error);
                return false;
            }
        }

        async function saveTask(task) {
            try {
                const { error } = await supabaseClient
                    .from('tasks')
                    .upsert(task);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('خطأ في حفظ المهمة:', error);
                return false;
            }
        }

        async function saveMessage(message) {
            try {
                const { error } = await supabaseClient
                    .from('messages')
                    .upsert(message);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('خطأ في حفظ الرسالة:', error);
                return false;
            }
        }
        async function saveNotification(notification) {
            try {
                const { error } = await supabaseClient
                    .from('notifications')
                    .upsert(notification);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('خطأ في حفظ الإشعار:', error);
                return false;
            }
        }

        // ==================== Realtime Subscriptions ====================

// إلغاء جميع الاشتراكات السابقة
// ==================== Realtime Subscriptions ====================

let realtimeSubscriptions = []; // ✅ مصفوفة تخزين الاشتراكات

// إلغاء جميع الاشتراكات السابقة
function unsubscribeAll() {
    realtimeSubscriptions.forEach(sub => sub.unsubscribe());
    realtimeSubscriptions = [];
}

// الاشتراك في التغييرات على جدول users
function subscribeToUsers() {
    const subscription = supabaseClient
        .channel('users-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'users' },
            async (payload) => {
                console.log('تغيير في المستخدمين:', payload);
                await loadUsers();
                
                // تحديث الصفحة الحالية
                if (currentUser) {
                    if (currentUser.isAdmin) {
                        if (currentSection === 'users') showUserManagement();
                    }
                }
            }
        )
        .subscribe();
    
    realtimeSubscriptions.push(subscription);
}

// الاشتراك في التغييرات على جدول tasks
function subscribeToTasks() {
    const subscription = supabaseClient
        .channel('tasks-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'tasks' },
            async (payload) => {
                console.log('تغيير في المهام:', payload);
                await loadTasks();
                
                // تحديث الصفحة الحالية
                if (currentUser) {
                    if (currentUser.isAdmin) {
                        if (currentSection === 'tasks') showTaskManagement();
                        else if (currentSection === 'dashboard') showAdminDashboard();
                    } else {
                        if (currentSection === 'user') showUserPage();
                    }
                }
            }
        )
        .subscribe();
    
    realtimeSubscriptions.push(subscription);
}

// الاشتراك في التغييرات على جدول messages
function subscribeToMessages() {
    const subscription = supabaseClient
        .channel('messages-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'messages' },
            async (payload) => {
                // منع التكرار اللانهائي
                const now = Date.now();
                if (isProcessingMessageUpdate || now - lastMessageUpdateTime < 1000) {
                    console.log('⚠️ تم تخطي تحديث رسالة لتجنب التكرار');
                    return;
                }
                
                isProcessingMessageUpdate = true;
                lastMessageUpdateTime = now;
                
                console.log('تغيير في الرسائل:', payload);
                await loadMessages();
                
                // تحديث عداد الرسائل غير المقروءة
                updateUnreadCount();
                
                // تحديث المحادثة المفتوحة فقط إذا كانت الرسالة تخص المستخدم الحالي
                if (currentChatUserId) {
                    const shouldUpdate = payload.new && (
                        payload.new.recipientId === currentUser.id || 
                        payload.new.senderId === currentUser.id
                    );
                    
                    if (shouldUpdate) {
                        showChatWithUser(currentChatUserId);
                    }
                }
                
                isProcessingMessageUpdate = false;
            }
        )
        .subscribe();
    
    realtimeSubscriptions.push(subscription);
}
// الاشتراك في التغييرات على جدول notifications
function subscribeToNotifications() {
    const subscription = supabaseClient
        .channel('notifications-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'notifications' },
            async (payload) => {
                console.log('تغيير في الإشعارات:', payload);
                await loadNotifications();
                
                // تحديث عداد الإشعارات
                updateNotificationBadge();
                
                // تحديث لوحة الإشعارات إذا كانت مفتوحة
                if (notificationsVisible) {
                    showNotifications();
                }
            }
        )
        .subscribe();
    
    realtimeSubscriptions.push(subscription);
}

// بدء الاشتراكات
function startRealtimeSubscriptions() {
    unsubscribeAll(); // إلغاء الاشتراكات القديمة
    subscribeToUsers();
    subscribeToTasks();
    subscribeToMessages();
    subscribeToNotifications();
    console.log('✅ تم بدء الاشتراكات المباشرة');
}     
  // ==================== دوال الإشعارات ====================
        async function addNotification(userId, title, text, type = 'info') {
            const notification = {
                id: nextNotificationId++,
                userId: userId,
                title: title,
                text: text,
                time: new Date().toLocaleString('ar-EG'),
                read: false,
                type: type
            };
            
            notifications.push(notification);
            
            const user = users.find(u => u.id === userId);
            if (user) {
                if (!user.notifications) user.notifications = [];
                user.notifications.push(notification.id);
                await saveUser(user);
            }
            
            await saveNotification(notification);
            updateNotificationBadge();
            return notification;
        }

        async function addNotificationToAll(title, text, type = 'info') {
            for (const user of users.filter(u => !u.isAdmin)) {
                await addNotification(user.id, title, text, type);
            }
        }

        function getUnreadNotifications() {
            if (!currentUser) return 0;
            return notifications.filter(n => n.userId === currentUser.id && !n.read).length;
        }

        function updateNotificationBadge() {
            const count = getUnreadNotifications();
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                if (count > 0) {
                    badge.style.display = 'inline';
                    badge.textContent = count;
                } else {
                    badge.style.display = 'none';
                }
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
                .filter(n => n.userId === currentUser.id)
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
                notification.read = true;
                await saveNotification(notification);
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
                
                document.getElementById('uploadSection').style.display = currentUser && !currentUser.isAdmin ? 'block' : 'none';
                
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
                const fileIcon = file.type?.includes('pdf') ? '📕' : 
                                file.type?.includes('word') ? '📘' : 
                                file.type?.includes('image') ? '🖼️' : '📄';
                
                let preview = '';
                if (file.type?.includes('image')) {
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
                        ${currentUser && currentUser.isAdmin ? `
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
                    
                    await saveTask(task);
                    updateFilePreview(currentTaskId);
                    
                    await addNotification(7, '📎 ملفات جديدة', `قام ${currentUser.name} برفع ملف: ${file.name} للمهمة: ${task.title}`, 'file');
                    
                    if (!currentUser.isAdmin) {
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
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = 'تمت';
                    await saveTask(task);
                }
                
                closeDescriptionPanel();
                
                const assignedUser = users.find(u => u.tasks?.includes(taskId));
                if (assignedUser) {
                    await addNotification(assignedUser.id, '✅ مهمة مكتملة', `تمت الموافقة على مهمتك: ${task.title}`, 'success');
                }
                
                showAdminDashboard();
            }
        };

        window.rejectTask = async function(taskId) {
            if (confirm('هل تريد رفض هذه المهمة؟')) {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = 'لم تبدأ';
                    await saveTask(task);
                }
                
                closeDescriptionPanel();
                
                const assignedUser = users.find(u => u.tasks?.includes(taskId));
                if (assignedUser) {
                    await addNotification(assignedUser.id, '❌ مهمة مرفوضة', `تم رفض مهمتك: ${task.title}، يرجى مراجعتها`, 'error');
                }
                
                showAdminDashboard();
            }
        };

        // ==================== دوال صلاحيات المحادثة ====================
        window.showChatPermissionForm = function() {
            currentSection = 'chat-permissions';
            updateNavLinks();
            updateMobileMenu();
            
            const nonAdminUsers = users.filter(u => !u.isAdmin);
            
            let usersHtml = '';
            nonAdminUsers.forEach(u => {
                const selected = selectedUsersForPermission.includes(u.id) ? 'selected' : '';
                usersHtml += `
                    <div class="user-card ${selected}" onclick="toggleUserSelection(${u.id})">
                        <div class="user-name">${u.name}</div>
                        <div class="user-status">${u.chatPermissions && u.chatPermissions.length > 0 ? '✅ لديه صلاحيات' : '❌ لا توجد صلاحيات'}</div>
                    </div>
                `;
            });

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

                    <div style="margin-top: 30px; padding: 20px; background: rgba(74,144,226,0.05); border-radius: 20px;">
                        <h4 style="color: #00ffaa; margin-bottom: 15px;">📋 المستخدمون الحاليون مع صلاحياتهم:</h4>
                        ${nonAdminUsers.map(u => {
                            const permissions = u.chatPermissions && u.chatPermissions.length > 0 
                                ? u.chatPermissions.map(id => users.find(user => user.id === id)?.name).join('، ')
                                : 'لا يوجد';
                            return `
                                <div style="padding: 10px; margin: 5px 0; background: rgba(0,0,0,0.2); border-radius: 15px;">
                                    <span style="color: #4a90e2; font-weight: 600;">${u.name}:</span> 
                                    <span style="color: #e0e0ff;">يمكنه التحدث مع: ${permissions}</span>
                                </div>
                            `;
                        }).join('')}
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
                if (!sourceUser) continue;
                
                if (!sourceUser.chatPermissions) sourceUser.chatPermissions = [];
                
                selectedUsersForPermission.forEach(targetId => {
                    if (sourceId !== targetId && !sourceUser.chatPermissions.includes(targetId)) {
                        sourceUser.chatPermissions.push(targetId);
                    }
                });
                
                await saveUser(sourceUser);
            }

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
                    if (!u.isAdmin) {
                        u.chatPermissions = [];
                        await saveUser(u);
                    }
                }
                alert('✅ تم إلغاء جميع الصلاحيات');
                showChatPermissionForm();
            }
        };

        // ==================== دوال تغيير الرقم السري ====================
        window.changePassword = async function() {
            const currentPassword = document.getElementById('currentPassword')?.value;
            const newPassword = document.getElementById('newPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('❌ الرجاء إدخال جميع الحقول');
                return;
            }
            
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
            
            currentUser.password = newPassword;
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                await saveUser(users[userIndex]);
                
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                alert('✅ تم تغيير الرقم السري بنجاح');
                
                await addNotification(7, '🔐 تغيير رقم سري', `قام ${currentUser.name} بتغيير الرقم السري`, 'security');
            }
        };

        // ==================== دوال الرسائل الجماعية ====================
        window.showMassMessageForm = function() {
            const currentHtml = app.innerHTML;
            
            const userOptions = users
                .filter(u => !u.isAdmin)
                .map(u => `<option value="${u.id}">${u.name}</option>`)
                .join('');
            
            const massForm = `
                <div class="mass-message-form">
                    <h3 style="color: #00ffaa; margin-bottom: 15px;">📨 إرسال رسالة جماعية</h3>
                    <select id="massRecipient">
                        <option value="all"> جميع المستخدمين</option>
                        ${userOptions}
                    </select>
                    <textarea id="massMessage" placeholder="اكتب رسالتك هنا..."></textarea>
                    <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
                        <button class="action-btn btn-mass-message" onclick="sendMassMessage()" style="flex: 2;">
                            <span class="btn-icon">📨</span>
                            إرسال الرسالة
                        </button>
                        <button class="action-btn" onclick="hideMassMessageForm()" style="flex: 1; background: #e74c3c;">
                            <span class="btn-icon">✖️</span>
                            إلغاء
                        </button>
                    </div>
                </div>
            `;
            
            app.innerHTML = massForm + currentHtml;
        };

        window.hideMassMessageForm = function() {
            showAdminDashboard();
        };

        window.sendMassMessage = async function() {
            const recipient = document.getElementById('massRecipient')?.value;
            const messageText = document.getElementById('massMessage')?.value.trim();
            
            if (!messageText) {
                alert('❌ الرجاء كتابة الرسالة');
                return;
            }
            
            if (recipient === 'all') {
                for (const user of users.filter(u => !u.isAdmin)) {
                    await addNotification(user.id, '📨 رسالة جماعية', messageText, 'mass');
                }
                alert('✅ تم إرسال الرسالة لجميع المستخدمين');
            } else {
                const userId = parseInt(recipient);
                const user = users.find(u => u.id === userId);
                if (user) {
                    await addNotification(userId, '📨 رسالة خاصة', messageText, 'private');
                    alert(`✅ تم إرسال الرسالة إلى ${user.name}`);
                }
            }
            
            showAdminDashboard();
        };

        // ==================== دوال حذف الرسائل ====================
        window.deleteMessage = async function(messageId) {
            if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                try {
                    const { error } = await supabaseClient
                        .from('messages')
                        .delete()
                        .eq('id', messageId);
                    
                    if (error) throw error;
                    
                    messages = messages.filter(m => m.id !== messageId);
                    
                    alert('✅ تم حذف الرسالة بنجاح');
                    showMessagesManagement();
                } catch (error) {
                    console.error('خطأ في حذف الرسالة:', error);
                    alert('❌ حدث خطأ في حذف الرسالة');
                }
            }
        };

        // ==================== إدارة الصفحات ====================
        window.logout = function() {
            sessionStorage.removeItem('currentUser');
            currentUser = null;
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('messagesPanel').style.display = 'none';
            document.getElementById('notificationPanel').classList.remove('show');
            closeDescriptionPanel();
            
            if (syncInterval) clearInterval(syncInterval);
            
            showLoginPage();
        };
      
        async function login(username, password) {
            const user = users.find(u => u.name === username);
    if (user && verifyPassword(password, user.password)) {
            
                currentUser = user;
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                
                document.getElementById('navbar').style.display = 'block';
                document.getElementById('displayUsername').textContent = user.name;
                
                updateNavLinks();
                updateMobileMenu();
                
                document.getElementById('messagesPanel').style.display = 'block';
                
                updateNotificationBadge();
                updateUnreadCount();
                
                startSync();
                
                if (user.isAdmin) {
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
            if (!navLinks || !currentUser) return;
            
            if (currentUser.isAdmin) {
                navLinks.innerHTML = `
                    <div class="nav-link ${currentSection === 'dashboard' ? 'active' : ''}" onclick="showAdminDashboard()">
                        <span>📊</span>
                        <span>الرئيسية</span>
                    </div>
                    <div class="nav-link ${currentSection === 'users' ? 'active' : ''}" onclick="showUserManagement()">
                        <span></span>
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
                    <div class="nav-link logout" onclick="logout()">
                        <span>🚪</span>
                        <span>خروج</span>
                    </div>
                `;
            }
        }

        function updateMobileMenu() {
            const mobileMenu = document.getElementById('mobileMenu');
            if (!mobileMenu || !currentUser) return;
            
            if (currentUser.isAdmin) {
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
            } else {
                mobileMenu.innerHTML = `
                    <div class="nav-link ${currentSection === 'user' ? 'active' : ''}" onclick="navigateAndClose('user')">
                        <span>📋</span>
                        <span>مهامي</span>
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

        // ==================== دوال المحادثة ====================
        function canUserChatWith(targetUserId) {
    if (currentUser.isAdmin) return true; // المدير يقدر يكلم أي حد
    const currentUserPermissions = currentUser.chatPermissions || [];
    return currentUserPermissions.includes(targetUserId);
}

        async function sendMessage() {
            const messageText = document.getElementById('newMessage')?.value.trim();
            if (!messageText) return;

            const recipientId = currentChatUserId || (currentUser.isAdmin ? null : 7);
            
            if (recipientId && recipientId !== 7 && !canUserChatWith(recipientId)) {
                alert('❌ لا يمكنك إرسال رسالة لهذا المستخدم');
                return;
            }

            const newMessage = {
                id: nextMessageId++,
                senderId: currentUser.id,
                senderName: currentUser.name,
                recipientId: recipientId,
                text: messageText,
                time: new Date().toLocaleString('ar-EG'),
                read: false,
                type: 'text'
            };

            messages.push(newMessage);
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
            
            if (currentUser.isAdmin) {
                return messages.filter(m => m.recipientId === 7 && !m.read).length;
            } else {
                return messages.filter(m => m.recipientId === currentUser.id && !m.read).length;
            }
        }

        function updateUnreadCount() {
            const count = getUnreadCount();
            const badge = document.getElementById('unreadCount');
            if (badge) {
                if (count > 0) {
                    badge.style.display = 'inline';
                    badge.textContent = count;
                } else {
                    badge.style.display = 'none';
                }
            }
        }

        async function markMessagesAsRead(userId) {
    // منع التكرار
    if (isProcessingMessageUpdate) return;
    
    isProcessingMessageUpdate = true;
    
    let hasChanges = false;
    for (const m of messages) {
        if (m.recipientId === userId || (m.senderId === userId && m.recipientId === currentUser.id)) {
            if (!m.read) {
                m.read = true;
                await saveMessage(m);
                hasChanges = true;
            }
        }
    }
    
    isProcessingMessageUpdate = false;
    
    if (hasChanges) {
        updateUnreadCount();
    }
}

        function toggleMessages() {
            messagesContentVisible = !messagesContentVisible;
            document.getElementById('messagesContent').style.display = messagesContentVisible ? 'block' : 'none';
            document.getElementById('messageInput').style.display = messagesContentVisible ? 'flex' : 'none';
            
            if (messagesContentVisible) {
                showUserList();
            }
        }

        function showUserList() {
            const content = document.getElementById('messagesContent');
            let html = '<div style="padding: 10px;">';
            
            let availableUsers = [];
            
            if (currentUser.isAdmin) {
                availableUsers = users.filter(u => !u.isAdmin);
            } else {
                availableUsers = users.filter(u => !u.isAdmin && u.id !== currentUser.id && 
                    (currentUser.chatPermissions || []).includes(u.id));
            }
            
            availableUsers.forEach(u => {
                const unreadFromUser = messages.filter(m => m.senderId === u.id && !m.read).length;
                const userFiles = tasks.filter(t => t.files && t.files.some(f => f.uploadedBy === u.id)).length;
                
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
            
            if (!currentUser.isAdmin && !canUserChatWith(userId)) {
                alert('❌ لا يمكنك التواصل مع هذا المستخدم');
                showUserList();
                return;
            }
            
            markMessagesAsRead(userId);
            
            const userTasks = currentUser.isAdmin ? tasks.filter(t => t.files && t.files.some(f => f.uploadedBy === userId)) : [];
            
            let html = `<div style="padding: 10px;">
                <button class="back-button" onclick="showUserList()">🔙 رجوع لقائمة المستخدمين</button>
                
                <div class="chat-header">
                    محادثة مع: ${user.name}
                </div>
            `;
            
            if (currentUser.isAdmin && userTasks.length > 0) {
                html += '<div style="margin: 15px 0;"><h4 style="color: #00ffaa; font-size: 16px;">📎 ملفات المستخدم:</h4>';
                userTasks.forEach(task => {
                    task.files?.filter(f => f.uploadedBy === userId).forEach(file => {
                        const fileIcon = file.type?.includes('pdf') ? '📕' : 
                                        file.type?.includes('word') ? '📘' : 
                                        file.type?.includes('image') ? '🖼️' : '📄';
                        html += `
                            <div class="file-item" style="margin: 8px 0;">
                                <div class="file-info">
                                    <div>
                                        ${fileIcon} 
                                        <a href="${file.data}" download="${file.name}" target="_blank">${file.name}</a>
                                    </div>
                                    <div class="file-meta">
                                        المهمة: ${task.title} - ${file.uploadTime}
                                    </div>
                                </div>
                                <button onclick="approveTask(${task.id})" class="approve-btn">✔️ موافقة</button>
                            </div>
                        `;
                    });
                });
                html += '</div>';
            }
            
            const chatMessages = messages.filter(m => 
                (m.senderId === currentUser.id && m.recipientId === userId) ||
                (m.senderId === userId && m.recipientId === currentUser.id)
            ).sort((a, b) => new Date(a.time) - new Date(b.time));
            
            chatMessages.forEach(m => {
                const messageClass = m.senderId === currentUser.id ? 'sent' : 'received';
                html += `
                    <div class="message ${messageClass}">
                        <div class="sender">${m.senderName}</div>
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
                m.senderId === currentUser.id || m.recipientId === currentUser.id
            ).sort((a, b) => new Date(a.time) - new Date(b.time));
            
            markMessagesAsRead(currentUser.id);
            
            userMessages.forEach(m => {
                const messageClass = m.senderId === currentUser.id ? 'sent' : 'received';
                html += `
                    <div class="message ${messageClass}">
                        <div class="sender">${m.senderName}</div>
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
        id: nextUserId++,
        name: userData.name,
        password: hashPassword(userData.password), // ← أضف هذه السطر
        tasks: [],
        notifications: [],
        chatPermissions: []
    };
    users.push(newUser);
    await saveUser(newUser);
    return newUser;
}
        async function deleteUser(userId) {
            if (userId === 7) {
                alert('❌ لا يمكن حذف المدير');
                return false;
            }
            
            try {
                const { error } = await supabaseClient
                    .from('users')
                    .delete()
                    .eq('id', userId);
                
                if (error) throw error;
                
                users = users.filter(u => u.id !== userId);
                return true;
            } catch (error) {
                console.error('خطأ في حذف المستخدم:', error);
                alert('❌ حدث خطأ في حذف المستخدم');
                return false;
            }
        }

        async function updateUser(userId, newData) {
            const user = users.find(u => u.id === userId);
            if (user) {
                Object.assign(user, newData);
                await saveUser(user);
                return true;
            }
            return false;
        }

        // ==================== دوال المهام ====================
        async function addTask(taskData) {
            const newTask = {
                id: nextTaskId++,
                ...taskData,
                status: "لم تبدأ",
                files: []
            };
            tasks.push(newTask);
            await saveTask(newTask);
            
            await addNotificationToAll('📋 مهمة جديدة', `تم إضافة مهمة جديدة: ${taskData.title}`, 'task');
            
            return newTask;
        }

        async function deleteTask(taskId) {
            try {
                const { error } = await supabaseClient
                    .from('tasks')
                    .delete()
                    .eq('id', taskId);
                
                if (error) throw error;
                
                tasks = tasks.filter(t => t.id !== taskId);
                
                for (const u of users) {
                    if (u.tasks?.includes(taskId)) {
                        u.tasks = u.tasks.filter(id => id !== taskId);
                        await saveUser(u);
                    }
                }
                
                return true;
            } catch (error) {
                console.error('خطأ في حذف المهمة:', error);
                alert('❌ حدث خطأ في حذف المهمة');
                return false;
            }
        }

        async function updateTask(taskId, newData) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, newData);
                await saveTask(task);
                return true;
            }
            return false;
        }

        async function assignTaskToUser(taskId, userId) {
            const user = users.find(u => u.id === userId);
            if (user && !user.tasks?.includes(taskId)) {
                if (!user.tasks) user.tasks = [];
                user.tasks.push(taskId);
                await saveUser(user);
                
                const task = tasks.find(t => t.id === taskId);
                await addNotification(userId, '📋 مهمة جديدة', `تم تعيين مهمة جديدة لك: ${task.title}`, 'task');
                
                return true;
            }
            return false;
        }

        // ==================== عرض صفحات الموقع ====================
        function showLoginPage() {
            app.innerHTML = `
                <div class="login-wrapper">
                    <div class="login-glass">
                        <div class="login-header">
                            <h1>5G Project</h1>
                            <p>نظام إدارة <span>المهام</span></p>
                        </div>
                        
                        <div class="login-input-group">
                            <i></i>
                            <input type="text" id="username" placeholder="اسم المستخدم">
                        </div>
                        
                        <div class="login-input-group">
                            <i> </i>
                            <input type="password" id="password" placeholder="الرقم السري">
                        </div>
                        
                        <button class="login-button" onclick="handleLogin()">دخول </button>
                        
                        <button class="accounts-button" onclick="window.open('https://www.instagram.com/a7medka711?igsh=MWFrdnNuN2Rwb3BsaQ==', '_blank')">
                            <span class="btn-icon">  #</span>
                            الحسابات
                        </button>
                        
                        <p id="error" class="login-error" style="display: none;"></p>
                        
                        
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
            const totalUsers = users.length - 1;

            let tasksHtml = '';
            tasks.forEach(t => {
                const assigned = users.find(u => u.tasks?.includes(t.id))?.name || 'غير معين';
                let statusClass = 'status-pending';
                if (t.status === 'قيد التنفيذ') statusClass = 'status-review';
                else if (t.status === 'تمت') statusClass = 'status-done';
                
                const fileCount = t.files?.length || 0;
                
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
                                    <th> مده التسليم</th>
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
                if (!u.isAdmin) {
                    const userFiles = tasks.filter(t => t.files && t.files.some(f => f.uploadedBy === u.id)).length;
                    const permissions = u.chatPermissions && u.chatPermissions.length > 0 
                        ? u.chatPermissions.map(id => users.find(user => user.id === id)?.name).join('، ')
                        : 'لا يوجد';
                    
                    usersHtml += `<tr>
                        <td>${u.id}</td>
                        <td>${u.name}</td>
                        <td>${u.password}</td>
                        <td>${u.tasks?.length || 0}</td>
                        <td>${userFiles}</td>
                        <td><span style="color: ${u.chatPermissions && u.chatPermissions.length > 0 ? '#00ffaa' : '#ff8a80'}; font-weight: 600;">${u.chatPermissions && u.chatPermissions.length > 0 ? '✅' : '❌'} ${permissions}</span></td>
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
                                <span class="btn-icon"></span>
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
                const assignedUsers = users.filter(u => u.tasks?.includes(t.id)).map(u => u.name).join('، ') || 'غير معين';
                const fileCount = t.files?.length || 0;
                
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
                        <button class="edit-btn" onclick="assignTask(${t.id})"> تعيين</button>
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
                            <input type="text" id="newTaskRefs" placeholder=" مده التسليم">
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
                                    <th> مده التسليم</th>
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
                const sender = users.find(u => u.id === m.senderId)?.name || 'غير معروف';
                const recipient = users.find(u => u.id === m.recipientId)?.name || 'غير معروف';
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

        // ==================== دوال المعالجة ====================
        window.handleLogin = async function() {
            const username = document.getElementById('username')?.value.trim();
            const password = document.getElementById('password')?.value.trim();
            const errorEl = document.getElementById('error');
            
            if (!username || !password) {
                errorEl.style.display = 'block';
                errorEl.innerText = '❌ الرجاء إدخال اسم المستخدم والرقم السري';
                return;
            }
            
            if (await login(username, password)) {
                errorEl.style.display = 'none';
            } else {
                errorEl.style.display = 'block';
                errorEl.innerText = '❌ اسم المستخدم أو الرقم السري خطأ';
            }
        };

        window.addUserHandler = async function() {
            const name = document.getElementById('newUserName')?.value.trim();
            const password = document.getElementById('newUserPassword')?.value.trim();
            
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
            if (!user) return;
            
            const newName = prompt('أدخل الاسم الجديد:', user.name);
            const newPassword = prompt('أدخل الرقم السري الجديد:', user.password);
            
            if (newName && newPassword) {
                await updateUser(userId, { name: newName, password: newPassword });
                await addNotification(7, '🔐 تعديل مستخدم', `تم تعديل بيانات المستخدم ${newName}`, 'edit');
                showUserManagement();
            }
        };

        window.addTaskHandler = async function() {
            const title = document.getElementById('newTaskTitle')?.value.trim();
            const refs = document.getElementById('newTaskRefs')?.value.trim();
            const description = document.getElementById('newTaskDescription')?.value.trim();
            
            if (title && refs) {
                await addTask({ title, refs, description });
                showTaskManagement();
            } else {
                alert('❌ الرجاء إدخال جميع البيانات');
            }
        };

        window.deleteTaskHandler = async function(taskId) {
            if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                if (await deleteTask(taskId)) {
                    showTaskManagement();
                }
            }
        };

        window.editTask = async function(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const newTitle = prompt('أدخل العنوان الجديد:', task.title);
            const newRefs = prompt('أدخل الأرقام المرجعية الجديدة:', task.refs);
            
            if (newTitle && newRefs) {
                await updateTask(taskId, { title: newTitle, refs: newRefs });
                showTaskManagement();
            }
        };

        window.editTaskDescription = async function(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const newDescription = prompt('أدخل الشرح الجديد للمهمة:', task.description || '');
            
            if (newDescription !== null) {
                await updateTask(taskId, { description: newDescription });
                showTaskManagement();
            }
        };

        window.assignTask = async function(taskId) {
            const availableUsers = users.filter(u => !u.isAdmin);
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

        // ==================== دوال تسجيل الدخول والخروج ====================
window.logout = function() {
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('messagesPanel').style.display = 'none';
    document.getElementById('notificationPanel').classList.remove('show');
    closeDescriptionPanel();
    
    unsubscribeAll(); // إلغاء الاشتراكات عند الخروج
    
    showLoginPage();
};

async function login(username, password) {
    const user = users.find(u => u.name === username && u.password === password);
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        document.getElementById('navbar').style.display = 'block';
        document.getElementById('displayUsername').textContent = user.name;
        
        updateNavLinks();
        updateMobileMenu();
        
        document.getElementById('messagesPanel').style.display = 'block';
        
        updateNotificationBadge();
        updateUnreadCount();
        
        startRealtimeSubscriptions(); // بدء الاشتراكات بعد تسجيل الدخول
        
        if (user.isAdmin) {
            showAdminDashboard();
        } else {
            showUserPage();
        }
        return true;
    }
    return false;
}


        // ==================== بدء التشغيل ====================
        
(async function init() {
    await loadAllData();
    
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            const userExists = users.find(u => u.id === currentUser.id);
            if (userExists) {
                currentUser = userExists;
                document.getElementById('navbar').style.display = 'block';
                document.getElementById('displayUsername').textContent = currentUser.name;
                updateNavLinks();
                updateMobileMenu();
                document.getElementById('messagesPanel').style.display = 'block';
                updateNotificationBadge();
                updateUnreadCount();
                
                startRealtimeSubscriptions(); // ✅ صح - استخدم الـ Realtime subscriptions
                
                if (currentUser.isAdmin) {
                    showAdminDashboard();
                } else {
                    showUserPage();
                }
            } else {
                sessionStorage.removeItem('currentUser');
                showLoginPage();
            }
        } catch {
            sessionStorage.removeItem('currentUser');
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
})();