const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./event_db');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'img');
        // 确保目录存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 限制文件大小为2MB
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API 路由

// 图片上传接口
app.post('/api/upload/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        // 返回图片的相对路径
        const imagePath = `/img/${req.file.filename}`;
        res.json({ 
            message: '图片上传成功',
            imagePath: imagePath 
        });
    } catch (error) {
        console.error('图片上传失败:', error);
        res.status(500).json({ error: '图片上传失败' });
    }
});

// 获取所有活动（主页使用）
app.get('/api/events', (req, res) => {
    const query = `
        SELECT * FROM events 
        WHERE status = 'upcoming' OR status = 'ongoing'
        ORDER BY date ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询活动失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }
        res.json(results);
    });
});

// 获取即将举行的活动（主页重点显示）
app.get('/api/events/upcoming', (req, res) => {
    const query = `
        SELECT * FROM events 
        WHERE date >= CURDATE() AND status = 'upcoming'
        ORDER BY date ASC 
        LIMIT 6
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询即将举行的活动失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }
        res.json(results);
    });
});

// 搜索活动（搜索页面使用）
app.get('/api/events/search', (req, res) => {
    const { date, location, category } = req.query;
    let query = 'SELECT * FROM events WHERE 1=1';
    let params = [];
    
    if (date) {
        query += ' AND date = ?';
        params.push(date);
    }
    
    if (location) {
        query += ' AND location LIKE ?';
        params.push(`%${location}%`);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY date ASC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('搜索活动失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }
        res.json(results);
    });
});

// 获取单个活动详情
app.get('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    const query = 'SELECT * FROM events WHERE id = ?';
    
    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('查询活动详情失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: '活动不存在' });
            return;
        }
        
        res.json(results[0]);
    });
});

// 获取活动类别列表
app.get('/api/categories', (req, res) => {
    const query = 'SELECT DISTINCT category FROM events ORDER BY category';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询活动类别失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }
        
        const categories = results.map(row => row.category);
        res.json(categories);
    });
});

// 活动注册（完整实现）
app.post('/api/events/:id/register', (req, res) => {
    const eventId = req.params.id;
    const {
        name,
        phone,
        email = '',
        age = '',
        experience = '',
        motivation = '',
        allowContact = false
    } = req.body;

    // 验证必填字段
    if (!name || !phone) {
        res.status(400).json({ error: '姓名和联系电话为必填项' });
        return;
    }

    // 首先检查活动是否存在以及是否还有名额
    const checkEventQuery = 'SELECT max_participants, current_participants FROM events WHERE id = ?';

    db.query(checkEventQuery, [eventId], (err, eventResults) => {
        if (err) {
            console.error('查询活动信息失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }

        if (eventResults.length === 0) {
            res.status(404).json({ error: '活动不存在' });
            return;
        }

        const event = eventResults[0];

        // 检查是否还有名额（如果设置了最大参与人数）
        if (event.max_participants && event.current_participants >= event.max_participants) {
            res.status(400).json({ error: '活动名额已满' });
            return;
        }

        // 检查是否已经注册过（基于电话号码）
        const checkRegistrationQuery = 'SELECT id FROM event_registrations WHERE event_id = ? AND participant_phone = ?';

        db.query(checkRegistrationQuery, [eventId, phone], (err, registrationResults) => {
            if (err) {
                console.error('检查注册状态失败:', err);
                res.status(500).json({ error: '服务器内部错误' });
                return;
            }

            if (registrationResults.length > 0) {
                res.status(400).json({ error: '您已经注册过此活动' });
                return;
            }

            // 开始事务：插入注册记录并更新参与人数
            db.beginTransaction((err) => {
                if (err) {
                    console.error('开始事务失败:', err);
                    res.status(500).json({ error: '注册失败' });
                    return;
                }

                // 插入注册记录
                const insertRegistrationQuery = `
                    INSERT INTO event_registrations
                    (event_id, participant_name, participant_phone, participant_email,
                     participant_age, volunteer_experience, motivation, allow_contact)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(insertRegistrationQuery, [
                    eventId, name, phone, email, age, experience, motivation, allowContact
                ], (err, insertResults) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('插入注册记录失败:', err);
                            res.status(500).json({ error: '注册失败' });
                        });
                    }

                    // 更新活动参与人数
                    const updateParticipantsQuery = 'UPDATE events SET current_participants = current_participants + 1 WHERE id = ?';

                    db.query(updateParticipantsQuery, [eventId], (err, updateResults) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('更新参与人数失败:', err);
                                res.status(500).json({ error: '注册失败' });
                            });
                        }

                        // 提交事务
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('提交事务失败:', err);
                                    res.status(500).json({ error: '注册失败' });
                                });
                            }

                            res.json({
                                message: '注册成功！',
                                registrationId: insertResults.insertId
                            });
                        });
                    });
                });
            });
        });
    });
});

// 管理员API路由

// 获取统计数据
app.get('/api/admin/statistics', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as totalEvents FROM events',
        'SELECT COUNT(*) as upcomingEvents FROM events WHERE date >= CURDATE() AND status = "upcoming"',
        'SELECT COALESCE(SUM(current_participants), 0) as totalParticipants FROM events',
        'SELECT COUNT(*) as completedEvents FROM events WHERE status = "completed"'
    ];
    
    Promise.all(queries.map(query => new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    }))).then(results => {
        const statistics = {
            totalEvents: results[0].totalEvents,
            upcomingEvents: results[1].upcomingEvents,
            totalParticipants: results[2].totalParticipants,
            completedEvents: results[3].completedEvents
        };
        res.json(statistics);
    }).catch(err => {
        console.error('获取统计数据失败:', err);
        res.status(500).json({ error: '服务器内部错误' });
    });
});

// 获取所有活动（管理员视图）
app.get('/api/admin/events', (req, res) => {
    const query = 'SELECT * FROM events ORDER BY date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('查询活动失败:', err);
            res.status(500).json({ error: '服务器内部错误' });
            return;
        }
        res.json(results);
    });
});

// 创建新活动
app.post('/api/admin/events', (req, res) => {
    const {
        name,
        category,
        date,
        time,
        location,
        organizer,
        max_participants,
        registration_fee,
        contact_info,
        status,
        description,
        image_url
    } = req.body;

    // 验证必填字段
    if (!name || !category || !date || !location) {
        res.status(400).json({ error: '活动名称、类别、日期和地点为必填项' });
        return;
    }

    const query = `
        INSERT INTO events 
        (name, category, date, time, location, organizer, max_participants, 
         registration_fee, contact_info, status, description, image_url, current_participants)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    db.query(query, [
        name, category, date, time || null, location, organizer || null,
        max_participants || null, registration_fee || 0, contact_info || null,
        status || 'upcoming', description || null, image_url || null
    ], (err, results) => {
        if (err) {
            console.error('创建活动失败:', err);
            res.status(500).json({ error: '创建活动失败' });
            return;
        }
        res.json({ message: '活动创建成功', id: results.insertId });
    });
});

// 更新活动
app.put('/api/admin/events/:id', (req, res) => {
    const eventId = req.params.id;
    const {
        name,
        category,
        date,
        time,
        location,
        organizer,
        max_participants,
        registration_fee,
        contact_info,
        status,
        description,
        image_url
    } = req.body;

    // 验证必填字段
    if (!name || !category || !date || !location) {
        res.status(400).json({ error: '活动名称、类别、日期和地点为必填项' });
        return;
    }

    const query = `
        UPDATE events SET 
        name = ?, category = ?, date = ?, time = ?, location = ?, 
        organizer = ?, max_participants = ?, registration_fee = ?, 
        contact_info = ?, status = ?, description = ?, image_url = ?
        WHERE id = ?
    `;

    db.query(query, [
        name, category, date, time || null, location, organizer || null,
        max_participants || null, registration_fee || 0, contact_info || null,
        status || 'upcoming', description || null, image_url || null, eventId
    ], (err, results) => {
        if (err) {
            console.error('更新活动失败:', err);
            res.status(500).json({ error: '更新活动失败' });
            return;
        }
        
        if (results.affectedRows === 0) {
            res.status(404).json({ error: '活动不存在' });
            return;
        }
        
        res.json({ message: '活动更新成功' });
    });
});

// 删除活动
app.delete('/api/admin/events/:id', (req, res) => {
    const eventId = req.params.id;
    
    // 开始事务：删除活动及相关注册记录
    db.beginTransaction((err) => {
        if (err) {
            console.error('开始事务失败:', err);
            res.status(500).json({ error: '删除活动失败' });
            return;
        }

        // 首先删除相关的注册记录
        const deleteRegistrationsQuery = 'DELETE FROM event_registrations WHERE event_id = ?';
        
        db.query(deleteRegistrationsQuery, [eventId], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    console.error('删除注册记录失败:', err);
                    res.status(500).json({ error: '删除活动失败' });
                });
            }

            // 然后删除活动
            const deleteEventQuery = 'DELETE FROM events WHERE id = ?';
            
            db.query(deleteEventQuery, [eventId], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('删除活动失败:', err);
                        res.status(500).json({ error: '删除活动失败' });
                    });
                }

                if (results.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ error: '活动不存在' });
                    });
                }

                // 提交事务
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('提交事务失败:', err);
                            res.status(500).json({ error: '删除活动失败' });
                        });
                    }

                    res.json({ message: '活动删除成功' });
                });
            });
        });
    });
});

// 提供静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/event/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'detail.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
