# 慈善活动网站

一个使用Node.js和MySQL构建的慈善活动管理网站，提供活动展示、搜索和报名功能。

## 功能特点

### 🏠 主页
- 显示慈善组织的基本信息和联系方式
- 展示即将举行的慈善活动列表
- 提供清晰的导航菜单

### 🔍 搜索活动页面
- 根据日期、地点和活动类别筛选活动
- 直观的筛选表单界面
- 实时显示搜索结果

### 📋 活动详情页面
- 显示活动的完整信息（名称、时间、地点、目的、详细说明）
- 提供活动报名功能
- 显示当前参与人数和报名状态

### 🧭 导航系统
- 响应式导航菜单
- 页面间流畅跳转
- 用户友好的界面设计

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (原生)
- **后端**: Node.js, Express.js
- **数据库**: MySQL
- **API**: RESTful API 设计

## 项目结构

```
cs/
├── public/                 # 前端静态文件
│   ├── index.html         # 主页
│   ├── search.html        # 搜索页面
│   ├── detail.html        # 详情页面
│   ├── styles.css         # 通用样式
│   ├── search.css         # 搜索页面样式
│   ├── detail.css         # 详情页面样式
│   ├── script.js          # 主页脚本
│   ├── search.js          # 搜索页面脚本
│   └── detail.js          # 详情页面脚本
├── server.js              # Express服务器
├── event_db.js            # 数据库连接配置
├── database_setup.sql     # 数据库初始化脚本
├── package.json           # 项目依赖配置
└── README.md             # 项目说明文档
```

## 安装和运行

### 1. 环境要求
- Node.js (版本 14.0 或更高)
- MySQL (版本 5.7 或更高)

### 2. 安装依赖
```bash
npm install
```

### 3. 数据库设置
1. 确保MySQL服务正在运行
2. 创建数据库并导入初始数据：
```sql
source database_setup.sql
```

3. 修改 `event_db.js` 中的数据库连接配置：
```javascript
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',        // 修改为您的MySQL用户名
    password: 'your_password',    // 修改为您的MySQL密码
    database: 'charityevents_db'
});
```

### 4. 启动服务器
```bash
npm start
```

或者使用开发模式（自动重启）：
```bash
npm run dev
```

### 5. 访问网站
打开浏览器访问: `http://localhost:3000`

## API 端点

### 获取活动列表
- `GET /api/events` - 获取所有活动
- `GET /api/events/upcoming` - 获取即将举行的活动

### 搜索活动
- `GET /api/events/search?date=YYYY-MM-DD&location=地点&category=类别`

### 获取活动详情
- `GET /api/events/:id` - 获取指定活动的详细信息

### 活动报名
- `POST /api/events/:id/register` - 报名参加指定活动

### 获取活动类别
- `GET /api/categories` - 获取所有活动类别列表

## 数据库结构

### events 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(255) | 活动名称 |
| description | TEXT | 活动描述 |
| date | DATE | 活动日期 |
| time | TIME | 活动时间 |
| location | VARCHAR(255) | 活动地点 |
| category | VARCHAR(100) | 活动类别 |
| organizer | VARCHAR(255) | 主办方 |
| contact_info | VARCHAR(255) | 联系方式 |
| registration_fee | DECIMAL(10,2) | 报名费用 |
| max_participants | INT | 最大参与人数 |
| current_participants | INT | 当前参与人数 |
| status | ENUM | 活动状态 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 特色功能

1. **响应式设计**: 支持桌面和移动设备访问
2. **动态加载**: 使用AJAX异步加载数据，提升用户体验
3. **筛选搜索**: 多条件组合搜索活动
4. **实时更新**: 报名后实时更新参与人数
5. **用户友好**: 清晰的界面设计和交互反馈

## 开发说明

- 前端使用原生JavaScript，无需额外框架
- 后端采用Express.js构建RESTful API
- 数据库使用MySQL存储活动信息
- 所有页面都支持响应式设计
- 代码结构清晰，易于维护和扩展

## 许可证

MIT License
