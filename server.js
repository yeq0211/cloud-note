const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 👇 你的云端数据库连接密码（已填好）
// 👇 换回官方推荐的标准短链接（最适合 Render 云服务器）
const MONGO_URL = "mongodb+srv://yeq0211_db_user:jluSBo38nOFtIJtw@cluster0.tapeiwd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// 1. 连接数据库
mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ 成功连接到云端数据库 MongoDB!"))
    .catch(err => console.error("❌ 连接失败:", err));

// 2. 定义笔记长什么样 (Schema)
const NoteSchema = new mongoose.Schema({
    content: String,
    author: String,
    createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', NoteSchema);

// === 接口部分 ===

// 登录 (简单模拟)
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: '名字不能为空' });
    res.json({ token: username, msg: `欢迎回来, ${username}!` });
});

// 获取笔记
app.get('/api/notes', async (req, res) => {
    const user = req.headers['authorization'];
    if (!user) return res.status(401).json({ error: '请先登录' });

    // 从云端数据库拿数据
    const myNotes = await Note.find({ author: user }).sort({ createdAt: -1 });
    
    const formattedNotes = myNotes.map(n => ({
        id: n._id,
        author: n.author,
        content: n.content
    }));
    
    res.json(formattedNotes);
});

// 写新笔记
app.post('/api/notes', async (req, res) => {
    const user = req.headers['authorization'];
    const { content } = req.body;
    if (!user) return res.status(401).json({ error: '未登录' });

    // 存入云端数据库
    const newNote = await Note.create({
        author: user,
        content: content
    });

    res.json({ 
        success: true, 
        note: { id: newNote._id, author: newNote.author, content: newNote.content } 
    });
});

// 删除笔记
app.delete('/api/notes/:id', async (req, res) => {
    const user = req.headers['authorization'];
    const noteId = req.params.id;

    // 在云端删除
    const result = await Note.deleteOne({ _id: noteId, author: user });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: '删除失败' });
    }
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行中: http://localhost:${PORT}`);
});