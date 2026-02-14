// server.js - 进阶版：带文件存储功能 (数据库雏形)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs'); 
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// =========== 请把下面这行代码加在这里！ ===========
app.use(express.static('public')); 
// ===============================================

// 定义我们的“日记本”文件路径
const DATA_FILE = path.join(__dirname, 'database.json');

// ... 后面的代码保持不变 ...
// === 工具函数 1：读取数据 (Read) ===
function loadData() {
    try {
        // 检查文件是否存在
        if (fs.existsSync(DATA_FILE)) {
            // 读取文件内容
            const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
            // 把文本转换回数组 (如果文件是空的，就返回空数组 [])
            return JSON.parse(rawData || '[]'); 
        }
    } catch (err) {
        console.error("读取数据库失败:", err);
    }
    return []; // 如果出错了，返回空数组
}

// === 工具函数 2：保存数据 (Write) ===
function saveData(data) {
    try {
        // 把数组转换成文本，并写入文件
        // null, 2 的意思是：格式化一下，让存进去的数据带缩进，好看一点
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("写入数据库失败:", err);
    }
}

// === 初始化：启动服务器时，先把硬盘里的数据读进内存 ===
let notes = loadData(); 
// 用户数据我们暂时还是存内存里（你可以试着模仿 notes 也给 users 做个文件存储）
let users = []; 

// === 接口 1：登录 ===
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: '名字不能为空' });
    
    // 如果是新用户，记下来
    if (!users.includes(username)) {
        users.push(username);
    }
    
    res.json({ token: username, msg: `欢迎回来, ${username}!` });
});

// === 接口 2：获取我的笔记 ===
app.get('/api/notes', (req, res) => {
    const user = req.headers['authorization']; 
    if (!user) return res.status(401).json({ error: '请先登录' });

    // 从内存里筛选出该用户的笔记
    // (注意：因为 notes 已经是通过 loadData 从硬盘读出来的，所以这里的数据是最新的)
    const myNotes = notes.filter(note => note.author === user);
    res.json(myNotes);
});

// === 接口 3：写新笔记 (这是关键！会触发保存) ===
app.post('/api/notes', (req, res) => {
    const user = req.headers['authorization'];
    const { content } = req.body;
    if (!user) return res.status(401).json({ error: '未登录' });

    const newNote = {
        id: Date.now(), // 用时间戳当ID
        author: user,
        content: content
    };

    // 1. 先更新内存
    notes.push(newNote); 
    
    // 2. 关键动作：立刻把更新后的 notes 数组写入硬盘！
    saveData(notes);     
    
    res.json({ success: true, note: newNote });
});

// === 接口 4：删除笔记 (也会触发保存) ===
app.delete('/api/notes/:id', (req, res) => {
    const user = req.headers['authorization'];
    const noteId = parseInt(req.params.id);

    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex === -1) return res.status(404).json({ error: '找不到笔记' });
    if (notes[noteIndex].author !== user) return res.status(403).json({ error: '你不能删别人的笔记' });

    // 1. 从内存删除
    notes.splice(noteIndex, 1); 
    
    // 2. 关键动作：立刻更新硬盘！
    saveData(notes);            

    res.json({ success: true });
});

// 启动服务器
app.listen(3000, () => {
    console.log('带记忆的云笔记后端已启动：http://localhost:3000');
});