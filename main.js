  // ==================== البيانات ====================
        let users = JSON.parse(localStorage.getItem('users')) || [
            { id: 1, name: "أحمد", password: "1234", tasks: [1, 2], notifications: [], chatPermissions: [] },
            { id: 2, name: "محمد", password: "5678", tasks: [3, 4], notifications: [], chatPermissions: [] },
            { id: 3, name: "سارة", password: "9012", tasks: [5, 6, 7], notifications: [], chatPermissions: [] },
            { id: 4, name: "علي", password: "1111", tasks: [8, 9], notifications: [], chatPermissions: [] },
            { id: 5, name: "فاطمة", password: "2222", tasks: [10, 11], notifications: [], chatPermissions: [] },
            { id: 6, name: "يوسف", password: "3333", tasks: [12, 13, 14], notifications: [], chatPermissions: [] },
            { id: 7, name: "Ahmed", password: "admin123", tasks: [], isAdmin: true, notifications: [], chatPermissions: [] }
        ];

        // المهام مع الشرح والملفات
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [
            { id: 1, title: "Introduction", refs: "1.1, 1.2, 1.3, 2.1, 2.2", status: "لم تبدأ", description: "مقدمة عن المشروع وأهدافه. تشمل الأقسام: 1.1 نظرة عامة، 1.2 أهداف المشروع، 1.3 نطاق العمل، 2.1 المتطلبات الأساسية، 2.2 تحليل الجدوى", files: [] },
            { id: 2, title: "Introduction", refs: "2.3, 2.4", status: "لم تبدأ", description: "استكمال المقدمة: 2.3 دراسة السوق، 2.4 تحليل المنافسين", files: [] },
            { id: 3, title: "5G Radio Technology Fundamentals", refs: "2.5, 2.6, 2.9", status: "لم تبدأ", description: "أساسيات تقنية الراديو في 5G: 2.5 مبادئ الاتصالات، 2.6 تقنيات التعديل، 2.9 معايير الأداء", files: [] },
            { id: 4, title: "Planning Analysis", refs: "3.1, 3.2", status: "لم تبدأ", description: "تحليل التخطيط: 3.1 متطلبات التغطية، 3.2 سعة الشبكة", files: [] },
            { id: 5, title: "Planning Analysis", refs: "3.3", status: "لم تبدأ", description: "3.3 تحليل الموقع واختيار المواقع", files: [] },
            { id: 6, title: "Planning Analysis", refs: "3.4, 3.5, 3.6", status: "لم تبدأ", description: "3.4 تخطيط الترددات، 3.5 تحليل التداخل، 3.6 تحسين الأداء", files: [] },
            { id: 7, title: "Analysis", refs: "4.1, 4.2, 4.3", status: "لم تبدأ", description: "التحليل الفني: 4.1 تحليل الإشارة، 4.2 جودة الخدمة، 4.3 متطلبات الأجهزة", files: [] },
            { id: 8, title: "Analysis", refs: "4.4", status: "لم تبدأ", description: "4.4 تحليل التكاليف", files: [] },
            { id: 9, title: "Analysis", refs: "4.5, 4.6, 4.7", status: "لم تبدأ", description: "4.5 تحليل المخاطر، 4.6 تحليل الأمان، 4.7 تحليل الأداء", files: [] },
            { id: 10, title: "التنفيذ والنتائج", refs: "5.1, 5.2, 5.3, 5.4", status: "لم تبدأ", description: "مرحلة التنفيذ: 5.1 خطة التنفيذ، 5.2 تجهيز المواقع، 5.3 تركيب المعدات، 5.4 الاختبارات الأولية", files: [] },
            { id: 11, title: "التنفيذ والنتائج", refs: "5.5, 5.6", status: "لم تبدأ", description: "5.5 قياسات الأداء، 5.6 تحليل النتائج", files: [] },
            { id: 12, title: "التنفيذ والنتائج", refs: "5.7, 5.8", status: "لم تبدأ", description: "5.7 التعديلات والتحسينات، 5.8 النتائج النهائية", files: [] },
            { id: 13, title: "Massive MIMO", refs: "6", status: "لم تبدأ", description: "تقنية Massive MIMO في 5G: شرح المصفوفات الضخمة، فوائدها في زيادة السعة وتحسين التغطية", files: [] },
            { id: 14, title: "Radio Network Challenges", refs: "7", status: "لم تبدأ", description: "تحديات شبكات الراديو: التداخل، التغطية، سعة الشبكة، جودة الخدمة، حلول هذه التحديات", files: [] }
        ];

        // الرسائل
        let messages = JSON.parse(localStorage.getItem('messages')) || [];

        // الإشعارات المنفصلة
        let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

        // متغيرات عامة
        let nextTaskId = tasks.length + 1;
        let nextUserId = users.length + 1;
        let nextMessageId = messages.length + 1;
        let nextNotificationId = notifications.length + 1;
        let currentSection = 'dashboard';
        let messagesVisible = false;
        let messagesContentVisible = false;
        let notificationsVisible = false;
        let currentTaskId = null;
        let mobileMenuOpen = false;
        let currentChatUserId = null;
        let selectedUsersForPermission = [];

        // حفظ البيانات
        function saveAllData() {
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('messages', JSON.stringify(messages));
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }

        // تحديث حالة المهمة (للمدير فقط)
        function updateTaskStatus(taskId, newStatus) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                saveAllData();
                return true;
            }
            return false;
        }

        // ==================== دوال الإشعارات ====================
        function addNotification(userId, title, text, type = 'info') {
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
            }
            
            saveAllData();
            updateNotificationBadge();
            return notification;
        }

        function addNotificationToAll(title, text, type = 'info') {
            users.filter(u => !u.isAdmin).forEach(user => {
                addNotification(user.id, title, text, type);
            });
        }

        function getUnreadNotifications() {
            if (!currentUser) return 0;
            return notifications.filter(n => n.userId === currentUser.id && !n.read).length;
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

        function markNotificationRead(notificationId) {
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                saveAllData();
                showNotifications();
                updateNotificationBadge();
            }
        }

        // ==================== دوال رفع الملفات مع المعاينة ====================
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

        window.uploadFiles = function() {
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
                
                reader.onload = function(e) {
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
                    
                    // تغيير الحالة إلى "قيد التنفيذ" تلقائياً عند رفع الملفات
                    if (task.status === 'لم تبدأ') {
                        task.status = 'قيد التنفيذ';
                    }
                    
                    saveAllData();
                    updateFilePreview(currentTaskId);
                    
                    addNotification(7, '📎 ملفات جديدة', `قام ${currentUser.name} برفع ملف: ${file.name} للمهمة: ${task.title}`, 'file');
                    
                    if (!currentUser.isAdmin) {
                        showUserPage();
                    }
                };
                
                reader.readAsDataURL(file);
            }
            
            alert('✅ تم رفع الملفات بنجاح');
            document.getElementById('fileUpload').value = '';
        };

        window.approveTask = function(taskId) {
            if (confirm('هل تريد الموافقة على هذه المهمة؟')) {
                updateTaskStatus(taskId, 'تمت');
                closeDescriptionPanel();
                
                const task = tasks.find(t => t.id === taskId);
                const assignedUser = users.find(u => u.tasks.includes(taskId));
                if (assignedUser) {
                    addNotification(assignedUser.id, '✅ مهمة مكتملة', `تمت الموافقة على مهمتك: ${task.title}`, 'success');
                }
                
                showAdminDashboard();
            }
        };

        window.rejectTask = function(taskId) {
            if (confirm('هل تريد رفض هذه المهمة؟')) {
                updateTaskStatus(taskId, 'لم تبدأ');
                closeDescriptionPanel();
                
                const task = tasks.find(t => t.id === taskId);
                const assignedUser = users.find(u => u.tasks.includes(taskId));
                if (assignedUser) {
                    addNotification(assignedUser.id, '❌ مهمة مرفوضة', `تم رفض مهمتك: ${task.title}، يرجى مراجعتها`, 'error');
                }
                
                showAdminDashboard();
            }
        };

        // ==================== دوال صلاحيات المحادثة المتطورة ====================
        window.showChatPermissionForm = function() {
            currentSection = 'chat-permissions';
            updateNavLinks();
            
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

        window.grantChatPermissions = function() {
            if (selectedUsersForPermission.length === 0) {
                alert('❌ الرجاء اختيار مستخدمين على الأقل');
                return;
            }

            // منح كل مستخدم مختار صلاحية التحدث مع الآخرين المختارين
            selectedUsersForPermission.forEach(sourceId => {
                const sourceUser = users.find(u => u.id === sourceId);
                if (!sourceUser.chatPermissions) sourceUser.chatPermissions = [];
                
                // إضافة جميع المستخدمين المختارين الآخرين كصلاحيات
                selectedUsersForPermission.forEach(targetId => {
                    if (sourceId !== targetId && !sourceUser.chatPermissions.includes(targetId)) {
                        sourceUser.chatPermissions.push(targetId);
                    }
                });
            });

            saveAllData();
            
            // إشعار للمستخدمين المختارين
            selectedUsersForPermission.forEach(userId => {
                const otherUsers = selectedUsersForPermission.filter(id => id !== userId)
                    .map(id => users.find(u => u.id === id)?.name).join('، ');
                addNotification(userId, '🔓 صلاحية محادثة جديدة', `يمكنك الآن التواصل مع: ${otherUsers}`, 'permission');
            });

            alert('✅ تم منح صلاحيات المحادثة بنجاح');
            selectedUsersForPermission = [];
            showChatPermissionForm();
        };

        window.revokeAllChatPermissions = function() {
            if (confirm('هل أنت متأكد من إلغاء جميع صلاحيات المحادثة؟')) {
                users.forEach(u => {
                    if (!u.isAdmin) {
                        u.chatPermissions = [];
                    }
                });
                saveAllData();
                alert('✅ تم إلغاء جميع الصلاحيات');
                showChatPermissionForm();
            }
        };

        // ==================== دوال تغيير الرقم السري ====================
        let passwordFormVisible = false;

        window.togglePasswordForm = function() {
            passwordFormVisible = !passwordFormVisible;
            const passwordForm = document.getElementById('passwordForm');
            const toggleBtn = document.querySelector('.password-toggle-btn');
            
            if (passwordFormVisible) {
                passwordForm.classList.add('show');
                if (toggleBtn) toggleBtn.innerHTML = '🔐 إلغاء تغيير الرقم السري';
            } else {
                passwordForm.classList.remove('show');
                if (toggleBtn) toggleBtn.innerHTML = '🔐 تغيير الرقم السري';
            }
        };

        window.showPasswordForm = function() {
            // هذه الدالة تظهر نموذج تغيير الرقم السري في نفس الصفحة
            const passwordSection = document.querySelector('.password-section');
            if (passwordSection) {
                passwordSection.scrollIntoView({ behavior: 'smooth' });
                const form = document.getElementById('passwordForm');
                const btn = document.querySelector('.password-toggle-btn');
                if (form && !form.classList.contains('show')) {
                    passwordFormVisible = true;
                    form.classList.add('show');
                    if (btn) btn.innerHTML = '🔐 إلغاء تغيير الرقم السري';
                }
            } else {
                // إذا كنا في صفحة المستخدم، نذهب إلى صفحة المهام أولاً
                if (!currentUser.isAdmin) {
                    showUserPage();
                    setTimeout(() => {
                        const passwordSection = document.querySelector('.password-section');
                        if (passwordSection) {
                            passwordSection.scrollIntoView({ behavior: 'smooth' });
                            const form = document.getElementById('passwordForm');
                            const btn = document.querySelector('.password-toggle-btn');
                            if (form && !form.classList.contains('show')) {
                                passwordFormVisible = true;
                                form.classList.add('show');
                                if (btn) btn.innerHTML = '🔐 إلغاء تغيير الرقم السري';
                            }
                        }
                    }, 500);
                }
            }
        };

        window.checkPasswordStrength = function() {
            const newPassword = document.getElementById('newPassword').value;
            const strengthBar = document.getElementById('passwordStrengthBar');
            const lengthReq = document.getElementById('lengthReq');
            const numberReq = document.getElementById('numberReq');
            
            let strength = 0;
            
            if (newPassword.length >= 4) {
                strength += 33.33;
                if (lengthReq) lengthReq.className = 'requirement-met';
            } else {
                if (lengthReq) lengthReq.className = 'requirement-not-met';
            }
            
            if (/\d/.test(newPassword)) {
                strength += 33.33;
                if (numberReq) numberReq.className = 'requirement-met';
            } else {
                if (numberReq) numberReq.className = 'requirement-not-met';
            }
            
            if (/[a-zA-Z]/.test(newPassword)) {
                strength += 33.34;
            }
            
            if (strengthBar) {
                strengthBar.style.width = strength + '%';
            }
        };

        window.changePassword = function() {
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
            
            currentUser.password = newPassword;
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                saveAllData();
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert('✅ تم تغيير الرقم السري بنجاح');
                
                passwordFormVisible = false;
                const passwordForm = document.getElementById('passwordForm');
                const toggleBtn = document.querySelector('.password-toggle-btn');
                if (passwordForm) passwordForm.classList.remove('show');
                if (toggleBtn) toggleBtn.innerHTML = '🔐 تغيير الرقم السري';
                
                addNotification(7, '🔐 تغيير رقم سري', `قام ${currentUser.name} بتغيير الرقم السري`, 'security');
            }
        };

        // ==================== دوال الرسائل الجماعية ====================
        window.showMassMessageForm = function() {
            const app = document.getElementById('app');
            const currentHtml = app.innerHTML;
            
            const userOptions = users
                .filter(u => !u.isAdmin)
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
            
            app.innerHTML = massForm + currentHtml;
        };

        window.hideMassMessageForm = function() {
            showAdminDashboard();
        };

        window.sendMassMessage = function() {
            const recipient = document.getElementById('massRecipient').value;
            const messageText = document.getElementById('massMessage').value.trim();
            
            if (!messageText) {
                alert('❌ الرجاء كتابة الرسالة');
                return;
            }
            
            if (recipient === 'all') {
                users.filter(u => !u.isAdmin).forEach(user => {
                    addNotification(user.id, '📨 رسالة جماعية', messageText, 'mass');
                });
                alert('✅ تم إرسال الرسالة لجميع المستخدمين');
            } else {
                const userId = parseInt(recipient);
                const user = users.find(u => u.id === userId);
                addNotification(userId, '📨 رسالة خاصة', messageText, 'private');
                alert(`✅ تم إرسال الرسالة إلى ${user.name}`);
            }
            
            showAdminDashboard();
        };

        // ==================== دوال حذف الرسائل ====================
        window.deleteMessage = function(messageId) {
            if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                messages = messages.filter(m => m.id !== messageId);
                saveAllData();
                showMessagesManagement();
                alert('✅ تم حذف الرسالة بنجاح');
            }
        };

        // ==================== إدارة الصفحات ====================
        const app = document.getElementById('app');
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));

        window.logout = function() {
            localStorage.removeItem('currentUser');
            currentUser = null;
            document.getElementById('navbar').style.display = 'none';
            document.getElementById('messagesPanel').style.display = 'none';
            document.getElementById('notificationPanel').classList.remove('show');
            closeDescriptionPanel();
            showLoginPage();
        };

        function login(username, password) {
            const user = users.find(u => u.name === username && u.password === password);
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                currentUser = user;
                document.getElementById('navbar').style.display = 'block';
                document.getElementById('displayUsername').textContent = user.name;
                updateNavLinks();
                updateMobileMenu();
                document.getElementById('messagesPanel').style.display = 'block';
                updateNotificationBadge();
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
            if (currentUser.isAdmin) {
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
            
            if (currentUser && currentUser.isAdmin) {
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
            } else if (currentUser && !currentUser.isAdmin) {
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

        // ==================== دوال التحقق من صلاحيات المحادثة ====================
        function canUserChatWith(targetUserId) {
            if (currentUser.isAdmin) return true;
            
            const targetUser = users.find(u => u.id === targetUserId);
            if (!targetUser) return false;
            
            // التحقق من أن المستخدم الحالي لديه صلاحية التحدث مع المستخدم الهدف
            const currentUserPermissions = currentUser.chatPermissions || [];
            return currentUserPermissions.includes(targetUserId);
        }

        function sendMessage() {
            const messageText = document.getElementById('newMessage').value.trim();
            if (!messageText) return;

            const recipientId = currentChatUserId || (currentUser.isAdmin ? null : 7);
            
            if (recipientId && recipientId !== 7 && !canUserChatWith(recipientId)) {
                alert('❌ لا يمكنك إرسال رسالة لهذا المستخدم. ليس لديك صلاحية للتواصل معه.');
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
            saveAllData();
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
            document.getElementById('unreadCount').textContent = count;
            if (count > 0) {
                document.getElementById('unreadCount').style.display = 'inline';
            } else {
                document.getElementById('unreadCount').style.display = 'none';
            }
        }

        function markMessagesAsRead(userId) {
            messages.forEach(m => {
                if (m.recipientId === userId || (m.senderId === userId && m.recipientId === currentUser.id)) {
                    m.read = true;
                }
            });
            saveAllData();
            updateUnreadCount();
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
                // المدير يرى جميع المستخدمين
                availableUsers = users.filter(u => !u.isAdmin);
            } else {
                // المستخدم العادي يرى فقط المستخدمين الذين لديه صلاحية التحدث معهم
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
                    task.files.filter(f => f.uploadedBy === userId).forEach(file => {
                        const fileIcon = file.type.includes('pdf') ? '📕' : 
                                        file.type.includes('word') ? '📘' : 
                                        file.type.includes('image') ? '🖼️' : '📄';
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
        function addUser(userData) {
            const newUser = {
                id: nextUserId++,
                ...userData,
                tasks: [],
                notifications: [],
                chatPermissions: []
            };
            users.push(newUser);
            saveAllData();
            return newUser;
        }

        function deleteUser(userId) {
            if (userId === 7) {
                alert('❌ لا يمكن حذف المدير');
                return false;
            }
            users = users.filter(u => u.id !== userId);
            saveAllData();
            return true;
        }

        function updateUser(userId, newData) {
            const user = users.find(u => u.id === userId);
            if (user) {
                Object.assign(user, newData);
                saveAllData();
                return true;
            }
            return false;
        }

        // ==================== دوال المهام ====================
        function addTask(taskData) {
            const newTask = {
                id: nextTaskId++,
                ...taskData,
                status: "لم تبدأ",
                files: []
            };
            tasks.push(newTask);
            saveAllData();
            
            addNotificationToAll('📋 مهمة جديدة', `تم إضافة مهمة جديدة: ${taskData.title}`, 'task');
            
            return newTask;
        }

        function deleteTask(taskId) {
            tasks = tasks.filter(t => t.id !== taskId);
            users.forEach(u => {
                u.tasks = u.tasks.filter(id => id !== taskId);
            });
            saveAllData();
            return true;
        }

        function updateTask(taskId, newData) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, newData);
                saveAllData();
                return true;
            }
            return false;
        }

        function assignTaskToUser(taskId, userId) {
            const user = users.find(u => u.id === userId);
            if (user && !user.tasks.includes(taskId)) {
                user.tasks.push(taskId);
                saveAllData();
                
                const task = tasks.find(t => t.id === taskId);
                addNotification(userId, '📋 مهمة جديدة', `تم تعيين مهمة جديدة لك: ${task.title}`, 'task');
                
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
                        
                        <!-- زر الحسابات الجديد -->
                        <button class="accounts-button" onclick="window.open('https://your-accounts-link.com', '_blank')">
                            <span class="btn-icon">👥</span>
                            الحسابات
                        </button>
                        
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
    
    const userTasks = tasks.filter(t => currentUser.tasks.includes(t.id));
    
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

    // هنا شيلنا قسم تغيير الرقم السري بالكامل
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
    
    passwordFormVisible = false;
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
                const assigned = users.find(u => u.tasks.includes(t.id))?.name || 'غير معين';
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
                if (!u.isAdmin) {
                    const userFiles = tasks.filter(t => t.files && t.files.some(f => f.uploadedBy === u.id)).length;
                    const permissions = u.chatPermissions && u.chatPermissions.length > 0 
                        ? u.chatPermissions.map(id => users.find(user => user.id === id)?.name).join('، ')
                        : 'لا يوجد';
                    
                    usersHtml += `<tr>
                        <td>${u.id}</td>
                        <td>${u.name}</td>
                        <td>${u.password}</td>
                        <td>${u.tasks.length}</td>
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
                const assignedUsers = users.filter(u => u.tasks.includes(t.id)).map(u => u.name).join('، ') || 'غير معين';
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
        window.handleLogin = function() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorEl = document.getElementById('error');
            
            if (login(username, password)) {
                errorEl.style.display = 'none';
            } else {
                errorEl.style.display = 'block';
                errorEl.innerText = '❌ اسم المستخدم أو الرقم السري خطأ';
            }
        };

        window.addUserHandler = function() {
            const name = document.getElementById('newUserName').value.trim();
            const password = document.getElementById('newUserPassword').value.trim();
            
            if (name && password) {
                addUser({ name, password });
                showUserManagement();
            } else {
                alert('❌ الرجاء إدخال جميع البيانات');
            }
        };

        window.deleteUserHandler = function(userId) {
            if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                if (deleteUser(userId)) {
                    showUserManagement();
                }
            }
        };

        window.editUser = function(userId) {
            const user = users.find(u => u.id === userId);
            const newName = prompt('أدخل الاسم الجديد:', user.name);
            const newPassword = prompt('أدخل الرقم السري الجديد:', user.password);
            
            if (newName && newPassword) {
                updateUser(userId, { name: newName, password: newPassword });
                addNotification(7, '🔐 تعديل مستخدم', `تم تعديل بيانات المستخدم ${newName}`, 'edit');
                showUserManagement();
            }
        };

        window.addTaskHandler = function() {
            const title = document.getElementById('newTaskTitle').value.trim();
            const refs = document.getElementById('newTaskRefs').value.trim();
            const description = document.getElementById('newTaskDescription').value.trim();
            
            if (title && refs) {
                addTask({ title, refs, description });
                showTaskManagement();
            } else {
                alert('❌ الرجاء إدخال جميع البيانات');
            }
        };

        window.deleteTaskHandler = function(taskId) {
            if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                deleteTask(taskId);
                showTaskManagement();
            }
        };

        window.editTask = function(taskId) {
            const task = tasks.find(t => t.id === taskId);
            const newTitle = prompt('أدخل العنوان الجديد:', task.title);
            const newRefs = prompt('أدخل الأرقام المرجعية الجديدة:', task.refs);
            
            if (newTitle && newRefs) {
                updateTask(taskId, { title: newTitle, refs: newRefs });
                showTaskManagement();
            }
        };

        window.editTaskDescription = function(taskId) {
            const task = tasks.find(t => t.id === taskId);
            const newDescription = prompt('أدخل الشرح الجديد للمهمة:', task.description || '');
            
            if (newDescription !== null) {
                updateTask(taskId, { description: newDescription });
                showTaskManagement();
            }
        };

        window.assignTask = function(taskId) {
            const availableUsers = users.filter(u => !u.isAdmin);
            let userList = 'اختر المستخدم:\n';
            availableUsers.forEach((u, index) => {
                userList += `${index + 1}. ${u.name}\n`;
            });
            
            const choice = prompt(userList + 'أدخل رقم المستخدم:');
            const userIndex = parseInt(choice) - 1;
            
            if (userIndex >= 0 && userIndex < availableUsers.length) {
                const userId = availableUsers[userIndex].id;
                assignTaskToUser(taskId, userId);
                showTaskManagement();
            }
        };

        // ==================== تشغيل الموقع ====================
        if (currentUser) {
            document.getElementById('navbar').style.display = 'block';
            document.getElementById('displayUsername').textContent = currentUser.name;
            updateNavLinks();
            updateMobileMenu();
            document.getElementById('messagesPanel').style.display = 'block';
            updateNotificationBadge();
            if (currentUser.isAdmin) {
                showAdminDashboard();
            } else {
                showUserPage();
            }
        } else {
            showLoginPage();
        }

        // تحديث الإشعارات كل 5 ثواني
        setInterval(updateNotificationBadge, 5000);
        setInterval(updateUnreadCount, 5000);