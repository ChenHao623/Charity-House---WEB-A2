const mysql = require('mysql2');

// 创建数据库连接
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456', // 请根据您的MySQL配置修改密码
    database: 'charityevents_db'
});

// 连接到数据库
connection.connect((err) => {
    if (err) {
        console.error('连接数据库失败: ' + err.stack);
        return;
    }
    console.log('已连接到数据库，连接ID: ' + connection.threadId);
});

module.exports = connection;
