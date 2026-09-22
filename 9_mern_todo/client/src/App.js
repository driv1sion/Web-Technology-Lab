import React, { Component } from 'react';
import axios from 'axios';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      newTodo: '',
      newDeadline: '',
      newUrgent: false,
      selectedIds: [],
      isBatchMode: false
    };
  }

  componentDidMount() {
    axios.get('http://localhost:5000/api/todos')
      .then(res => this.setState({ todos: res.data }))
      .catch(err => console.log('Error fetching todos:', err));
  }

  handleInputChange = (e) => this.setState({ newTodo: e.target.value });
  handleDeadlineChange = (e) => this.setState({ newDeadline: e.target.value });
  handleUrgentChange = (e) => this.setState({ newUrgent: e.target.checked });

  // Add new task
  handleSubmit = (e) => {
    e.preventDefault();
    if (!this.state.newTodo.trim()) return;

    const newTask = {
      task: this.state.newTodo,
      completed: false,
      deadline: this.state.newDeadline,
      urgent: this.state.newUrgent
    };

    axios.post('http://localhost:5000/api/todos', newTask)
      .then(res => {
        this.setState(prevState => ({
          todos: [...prevState.todos, res.data],
          newTodo: '',
          newDeadline: '',
          newUrgent: false
        }));
      })
      .catch(err => console.log('Error adding todo:', err));
  };

  // Toggle completed status (Done / Not Done)
  handleToggleCompleted = (id, currentCompleted) => {
    axios.put(`http://localhost:5000/api/todos/${id}`, { completed: !currentCompleted })
      .then(res => {
        this.setState(prevState => ({
          todos: prevState.todos.map(todo => todo._id === id ? res.data : todo)
        }));
      })
      .catch(err => console.log('Error updating todo:', err));
  };

  // Delete a single task directly
  handleDeleteSingle = (id) => {
    axios.delete(`http://localhost:5000/api/todos/${id}`)
      .then(() => {
        this.setState(prevState => ({
          todos: prevState.todos.filter(todo => todo._id !== id),
          selectedIds: prevState.selectedIds.filter(selectedId => selectedId !== id)
        }));
      })
      .catch(err => console.log('Error deleting todo:', err));
  };

  // Handle individual row batch-selection checkbox
  handleSelectRow = (id) => {
    this.setState(prevState => {
      const isSelected = prevState.selectedIds.includes(id);
      return {
        selectedIds: isSelected 
          ? prevState.selectedIds.filter(itemId => itemId !== id)
          : [...prevState.selectedIds, id]
      };
    });
  };

  // Toggle Batch Select Mode on/off
  toggleBatchMode = () => {
    this.setState(prevState => ({
      isBatchMode: !prevState.isBatchMode,
      selectedIds: []
    }));
  };

  // Select or Unselect all visible rows
  handleSelectAll = () => {
    this.setState(prevState => {
      if (prevState.selectedIds.length === prevState.todos.length) {
        return { selectedIds: [] };
      } else {
        return { selectedIds: prevState.todos.map(todo => todo._id) };
      }
    });
  };

  // Global Delete button action for selected tasks
  handleDeleteSelected = () => {
    if (this.state.selectedIds.length === 0) return;

    axios.post('http://localhost:5000/api/todos/delete-batch', { ids: this.state.selectedIds })
      .then(() => {
        this.setState(prevState => ({
          todos: prevState.todos.filter(todo => !prevState.selectedIds.includes(todo._id)),
          selectedIds: [],
          isBatchMode: false
        }));
      })
      .catch(err => console.log('Error deleting selected todos:', err));
  };

  // Helper to calculate time remaining or overdue status
  getTimeRemaining = (deadlineStr) => {
    if (!deadlineStr) return null;
    const now = new Date();
    const due = new Date(deadlineStr);
    const diffMs = due - now;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMs < 0) {
      const absDays = Math.abs(diffDay);
      const absHours = Math.abs(diffHour);
      if (absDays > 0) return { text: `Overdue by ${absDays}d`, isOverdue: true };
      if (absHours > 0) return { text: `Overdue by ${absHours}h`, isOverdue: true };
      return { text: `Overdue`, isOverdue: true };
    }

    if (diffDay > 0) return { text: `Due in ${diffDay}d`, isOverdue: false };
    if (diffHour > 0) return { text: `Due in ${diffHour}h`, isOverdue: false };
    if (diffMin > 0) return { text: `Due in ${diffMin}m`, isOverdue: false };
    return { text: `Due soon`, isOverdue: false };
  };

  render() {
    const sortedTodos = [...this.state.todos].sort((a, b) => {
      if (a.urgent === b.urgent) return 0;
      return a.urgent ? -1 : 1;
    });

    const allSelected = this.state.todos.length > 0 && this.state.selectedIds.length === this.state.todos.length;

    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Task Manager</h2>

        {/* Task Form */}
        <form onSubmit={this.handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Add a new task..."
            value={this.state.newTodo}
            onChange={this.handleInputChange}
            style={{ padding: '8px', flex: '1 1 200px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
          <input
            type="datetime-local"
            value={this.state.newDeadline}
            onChange={this.handleDeadlineChange}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.9em' }}>
            <input
              type="checkbox"
              checked={this.state.newUrgent}
              onChange={this.handleUrgentChange}
            />
            Urgent
          </label>
          <button type="submit" style={{ padding: '8px 15px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Task</button>
        </form>

        {/* Toolbar controls */}
        {this.state.todos.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button
              onClick={this.toggleBatchMode}
              style={{
                background: this.state.isBatchMode ? '#475569' : '#e2e8f0',
                color: this.state.isBatchMode ? '#fff' : '#1e293b',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85em'
              }}
            >
              {this.state.isBatchMode ? 'Cancel Batch Select' : 'Multi-Select Mode'}
            </button>

            {this.state.isBatchMode && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85em' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={this.handleSelectAll}
                  />
                  Select All ({this.state.selectedIds.length})
                </label>
                <button
                  onClick={this.handleDeleteSelected}
                  disabled={this.state.selectedIds.length === 0}
                  style={{
                    background: this.state.selectedIds.length > 0 ? '#ef4444' : '#cbd5e1',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: this.state.selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '0.85em'
                  }}
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        )}

        {/* Task List */}
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {sortedTodos.map(todo => {
            const isSelected = this.state.selectedIds.includes(todo._id);
            const timeInfo = this.getTimeRemaining(todo.deadline);

            return (
              <li 
                key={todo._id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px', 
                  marginBottom: '8px',
                  border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: isSelected ? '#e0f2fe' : (todo.completed ? '#f1f5f9' : (todo.urgent ? '#fef2f2' : '#ffffff')),
                  borderLeft: todo.urgent ? '4px solid #ef4444' : '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                  
                  {this.state.isBatchMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => this.handleSelectRow(todo._id)}
                      style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                    />
                  )}

                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => this.handleToggleCompleted(todo._id, todo.completed)}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    title="Mark task complete"
                  />

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#94a3b8' : '#1e293b' }}>
                      <strong>{todo.task}</strong> 
                      {todo.urgent && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.75em', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 'bold' }}>
                          URGENT
                        </span>
                      )}
                    </span>

                    {/* Deadline & Time Remaining Display */}
                    {todo.deadline && (
                      <div style={{ fontSize: '0.8em', display: 'flex', gap: '8px', alignItems: 'center', color: '#64748b' }}>
                        <span>Due: {new Date(todo.deadline).toLocaleString()}</span>
                        {timeInfo && (
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: timeInfo.isOverdue ? '#ef4444' : '#0284c7',
                            background: timeInfo.isOverdue ? '#fee2e2' : '#e0f2fe',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.9em'
                          }}>
                            {timeInfo.text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => this.handleDeleteSingle(todo._id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '1.2em',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                    title="Delete task"
                    onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >
                    ×
                  </button>

                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

export default App;