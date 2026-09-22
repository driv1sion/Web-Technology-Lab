const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// 2. Todo Schema & Model (prevent OverwriteModelError in hot-reload)
const TodoSchema = new mongoose.Schema({
  task: { type: String, required: true },
  completed: { type: Boolean, default: false },
  deadline: { type: String },
  urgent: { type: Boolean, default: false }
});
const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);

// 3. API Endpoints
// GET: Fetch all tasks
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ urgent: -1, _id: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add a new task
app.post('/api/todos', async (req, res) => {
  try {
    const newTodo = new Todo({
      task: req.body.task,
      completed: false,
      deadline: req.body.deadline,
      urgent: req.body.urgent || false
    });
    const savedTodo = await newTodo.save();
    res.json(savedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update task (supports completed status or full updates)
app.put('/api/todos/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete a single task
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Delete multiple selected tasks
app.post('/api/todos/delete-batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid or missing IDs array' });
    }
    await Todo.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Selected tasks deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(5000, () => console.log('Server running on port 5000'));
