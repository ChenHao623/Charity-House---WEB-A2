// Event details page script
document.addEventListener('DOMContentLoaded', function() {
    const eventId = getEventIdFromUrl();
    if (eventId) {
        loadEventDetail(eventId);
    } else {
        showError('Invalid event ID');
    }

    setupNavigation();
    setupRegistrationForm();
});

// Get event ID from URL
function getEventIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

// Load event details
async function loadEventDetail(eventId) {
    const container = document.getElementById('detailContainer');
    
    try {
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event does not exist');
            }
            throw new Error('Failed to load event details');
        }
        
        const event = await response.json();
        renderEventDetail(event);
        
    } catch (error) {
        console.error('Failed to load event details:', error);
        showError(error.message);
    }
}

// Render event details
function renderEventDetail(event) {
    const container = document.getElementById('detailContainer');
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    // Use actual status from database
    const statusText = getStatusText(event.status);
    
    // Set different icons based on event category
    const categoryIcons = {
        '环保': '🌱',
        '教育': '📚',
        '关爱': '❤️',
        '筹款': '💰',
        '扶贫': '🤝',
        '医疗': '🏥'
    };
    
    const icon = categoryIcons[event.category] || '🎯';
    
    container.innerHTML = `
        <!-- 返回按钮区域 -->
        <section class="back-section">
            <div class="container">
                <a href="/search" class="back-button">
                    ← Back to Search
                </a>
            </div>
        </section>

        <!-- 活动头部区域 - 类似主页hero-section -->
        <section class="detail-hero">
            <div class="hero-content">
                ${event.image_url ? 
                    `<div class="detail-image-container" style="margin-bottom: 1rem;">
                        <img src="${event.image_url}" alt="${event.name}" style="max-width: 300px; max-height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    </div>` : 
                    `<span class="detail-icon">${icon}</span>`
                }
                <h1>${event.name}</h1>
                <p>${event.description || '一起参与这个有意义的慈善活动'}</p>
                <span class="detail-status">${statusText}</span>
            </div>
        </section>

        <!-- 活动详情内容区域 - 类似主页organization-info -->
        <section class="detail-info-section">
            <div class="container">
                <div class="detail-content">
                    <div class="detail-nav">
                        <button class="detail-nav-item active" onclick="showSection('basic')">Basic Info</button>
                        <button class="detail-nav-item" onclick="showSection('description')">Description</button>
                        <button class="detail-nav-item" onclick="showSection('registration')">Registration</button>
                    </div>
            
            <div class="detail-section active" id="basic">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-icon">📅</div>
                        <div class="info-content">
                            <h4>Event Date</h4>
                            <p>${formattedDate}</p>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">⏰</div>
                        <div class="info-content">
                            <h4>Event Time</h4>
                            <p>${event.time || '全天'}</p>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">📍</div>
                        <div class="info-content">
                            <h4>Event Location</h4>
                            <p>${event.location}</p>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">🏷️</div>
                        <div class="info-content">
                            <h4>Event Category</h4>
                            <p>${event.category}</p>
                        </div>
                    </div>
                    
                    ${event.organizer ? `
                    <div class="info-item">
                        <div class="info-icon">👥</div>
                        <div class="info-content">
                            <h4>Organizer</h4>
                            <p>${event.organizer}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${event.contact_info ? `
                    <div class="info-item">
                        <div class="info-icon">📞</div>
                        <div class="info-content">
                            <h4>Contact Information</h4>
                            <p>${event.contact_info}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${event.registration_fee !== undefined ? `
                    <div class="info-item">
                        <div class="info-icon">💰</div>
                        <div class="info-content">
                            <h4>Participation Fee</h4>
                            <p>${event.registration_fee > 0 ? '¥' + event.registration_fee : 'Free'}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <div class="info-icon">👫</div>
                        <div class="info-content">
                            <h4>Participants</h4>
                            <p>${event.current_participants || 0}/${event.max_participants || '不限'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section" id="description">
                <div class="description-content">
                    ${event.description ? `
                        <p>${event.description}</p>
                        <br>
                        <h3>Event Goals & Progress</h3>
                        <p>Through this ${event.category} event, we hope to:</p>
                        <ul>
                            <li>Provide practical support for those in need</li>
                            <li>Raise social awareness of ${event.category} issues</li>
                            <li>Promote community unity and spread positive energy</li>
                            <li>Provide meaningful volunteer service experience for participants</li>
                        </ul>
                        
                        <h3>Ways to Participate</h3>
                        <p>You can participate in our activities in the following ways:</p>
                        <ul>
                            <li>Participate directly in on-site activities</li>
                            <li>Provide material or financial support</li>
                            <li>Help promote and publicize the event</li>
                            <li>Share your professional skills</li>
                        </ul>
                    ` : `
                        <p>This is a charity event about ${event.category} that will be held in ${event.location}.</p>
                        <p>We sincerely invite your participation to contribute to society together.</p>
                        
                        <h3>Event Significance</h3>
                        <p>Every charity event is a reflection of social warmth. Through your participation, we can:</p>
                        <ul>
                            <li>Help more people in need of care</li>
                            <li>Spread positive social energy</li>
                            <li>Build a more harmonious community environment</li>
                            <li>Foster a social atmosphere of mutual help and friendship</li>
                        </ul>
                    `}
                </div>
            </div>
            
            <div class="detail-section" id="registration">
                <div class="registration-section">
                    <h3>Join this meaningful activity</h3>
                    <p>Your participation contributes to society, let's spread love together!</p>
                    
                    <div class="registration-info">
                        <div class="registration-stat">
                            <span class="stat-number">${event.current_participants || 0}</span>
                            <span class="stat-label">Registered</span>
                        </div>
                        <div class="registration-stat">
                            <span class="stat-number">${event.max_participants || '∞'}</span>
                            <span class="stat-label">Capacity Limit</span>
                        </div>
                        <div class="registration-stat">
                            <span class="stat-number">${event.registration_fee > 0 ? '¥' + event.registration_fee : 'Free'}</span>
                            <span class="stat-label">Participation Fee</span>
                        </div>
                    </div>
                    
                    <button class="registration-button" onclick="showUnderConstruction()" ${event.status !== 'upcoming' ? 'disabled' : ''}>
                        ${event.status === 'upcoming' ? '🎯 Register Now' : getStatusText(event.status)}
                    </button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

// 显示指定的详情区域
function showSection(sectionId) {
    // 隐藏所有区域
    document.querySelectorAll('.detail-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 移除所有导航项的激活状态
    document.querySelectorAll('.detail-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 显示指定区域
    document.getElementById(sectionId).classList.add('active');
    
    // 激活对应的导航项 - 通过查找包含对应文本的按钮
    const navItems = document.querySelectorAll('.detail-nav-item');
    const sectionNames = {
        'basic': 'Basic Info',
        'description': 'Description', 
        'registration': 'Registration'
    };
    
    navItems.forEach(item => {
        if (item.textContent.trim() === sectionNames[sectionId]) {
            item.classList.add('active');
        }
    });
}

// 设置导航功能
function setupNavigation() {
    // 这个函数在页面加载时调用，用于设置导航相关的事件监听
}

// 设置注册表单
function setupRegistrationForm() {
    // 等待DOM完全加载后再设置事件监听器
    setTimeout(() => {
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistrationSubmit);
        }
    }, 100);
}

// 显示"功能建设中"提示
function showUnderConstruction() {
    // 显示错误提示模态框，内容为"此功能正在建设中"
    document.getElementById('errorMessage').textContent = '此功能正在建设中，敬请期待！';
    document.getElementById('errorModal').style.display = 'block';
}

// 显示注册表单
function showRegistrationForm(eventId) {
    // 存储当前活动ID供表单提交使用
    window.currentEventId = eventId;

    // 重置表单
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();
    }

    // 显示注册表单模态框
    document.getElementById('registrationFormModal').style.display = 'block';
}

// 处理注册表单提交
async function handleRegistrationSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // 验证必填字段
    const name = formData.get('name');
    const phone = formData.get('phone');
    const agreeTerms = formData.get('agreeTerms');

    if (!name || !phone || !agreeTerms) {
        alert('请填写所有必填字段并同意相关条款');
        return;
    }

    // 构建注册数据
    const registrationData = {
        name: name,
        phone: phone,
        email: formData.get('email') || '',
        age: formData.get('age') || '',
        experience: formData.get('experience') || '',
        motivation: formData.get('motivation') || '',
        allowContact: formData.get('allowContact') === 'on'
    };

    try {
        // 提交注册信息
        await registerForEvent(window.currentEventId, registrationData);

        // 关闭注册表单
        closeModal();

    } catch (error) {
        console.error('注册失败:', error);
        alert('注册失败，请稍后重试');
    }
}

// 注册参加活动
async function registerForEvent(eventId, registrationData = {}) {
    try {
        const response = await fetch(`/api/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            throw new Error('注册失败');
        }

        const result = await response.json();
        showRegistrationSuccess();

        // 重新加载活动详情以更新参与人数
        setTimeout(() => {
            loadEventDetail(eventId);
        }, 2000);

    } catch (error) {
        console.error('注册失败:', error);
        showRegistrationError();
        throw error; // 重新抛出错误供调用者处理
    }
}

// 显示注册成功模态框
function showRegistrationSuccess() {
    document.getElementById('registrationModal').style.display = 'block';
}

// 显示注册错误模态框
function showRegistrationError() {
    document.getElementById('errorMessage').textContent = '注册失败，请稍后重试或联系客服。';
    document.getElementById('errorModal').style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// 显示错误信息
function showError(message) {
    const container = document.getElementById('detailContainer');
    container.innerHTML = `
        <div class="error-detail">
            <h2>😔 出现了一些问题</h2>
            <p>${message}</p>
            <p>请检查活动链接是否正确，或者返回主页浏览其他活动。</p>
            <a href="/" class="btn btn-primary">返回主页</a>
            <a href="/search" class="btn btn-outline">浏览所有活动</a>
        </div>
    `;
}

// 点击模态框外部关闭模态框
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'upcoming': 'Upcoming',
        'ongoing': 'Ongoing',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || 'Unknown Status';
}
