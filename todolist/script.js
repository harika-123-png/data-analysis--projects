/* To-Do List App - script.js
   - Stores todos in localStorage
   - Supports add, edit (prompt), delete, complete toggle, filters, clear completed
*/

(() => {
  const taskInput = document.getElementById('taskText');
  const addBtn = document.getElementById('addBtn');
  const todoList = document.getElementById('todoList');
  const remainingEl = document.getElementById('remaining');
  const clearCompletedBtn = document.getElementById('clearCompleted');
  const filterButtons = document.querySelectorAll('.filter-btn');

  const STORAGE_KEY = 'todo_app_v1';
  let todos = []; // { id, text, completed }
  let filter = 'all';

  // ---------- Storage ----------
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }
  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        todos = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse todos from storage', e);
        todos = [];
      }
    }
  }

  // ---------- Helpers ----------
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Rendering ----------
  function render() {
    // apply filter
    let list = todos;
    if (filter === 'active') list = todos.filter(t => !t.completed);
    if (filter === 'completed') list = todos.filter(t => t.completed);

    todoList.innerHTML = '';
    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.innerHTML = `<div class="left"><div class="todo-text muted">No tasks — add one above</div></div>`;
      todoList.appendChild(li);
    } else {
      list.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.dataset.id = todo.id;

        li.innerHTML = `
          <div class="left">
            <label>
              <input type="checkbox" class="toggle" ${todo.completed ? 'checked' : ''} />
              <div class="todo-text ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">${escapeHtml(todo.text)}</div>
            </label>
          </div>
          <div class="btns">
            <button class="icon-btn edit" title="Edit">✏️</button>
            <button class="icon-btn delete" title="Delete">🗑️</button>
          </div>
        `;

        // event bindings:
        const checkbox = li.querySelector('.toggle');
        checkbox.addEventListener('change', () => toggleComplete(todo.id));

        const editBtn = li.querySelector('.edit');
        editBtn.addEventListener('click', () => editTodoPrompt(todo.id));

        const delBtn = li.querySelector('.delete');
        delBtn.addEventListener('click', () => {
          if (confirm('Delete this task?')) deleteTodo(todo.id);
        });

        todoList.appendChild(li);
      });
    }

    const remaining = todos.filter(t => !t.completed).length;
    remainingEl.textContent = remaining;
  }

  // ---------- CRUD ----------
  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      alert('Please enter a non-empty task.');
      return;
    }
    todos.unshift({ id: uid(), text: trimmed, completed: false });
    save();
    render();
    taskInput.value = '';
    taskInput.focus();
  }

  function toggleComplete(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    render();
  }

  function editTodoPrompt(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    const newText = prompt('Edit task', t.text);
    if (newText === null) return; // cancel
    if (!newText.trim()) {
      alert('Task cannot be empty.');
      return;
    }
    t.text = newText.trim();
    save();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter(x => x.id !== id);
    save();
    render();
  }

  function clearCompleted() {
    const hasCompleted = todos.some(t => t.completed);
    if (!hasCompleted) return alert('No completed tasks to clear.');
    if (!confirm('Remove all completed tasks?')) return;
    todos = todos.filter(t => !t.completed);
    save();
    render();
  }

  // ---------- Filter ----------
  function setFilter(newFilter) {
    filter = newFilter;
    filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    render();
  }

  // ---------- Utilities ----------
  function escapeHtml(text) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // ---------- Init & event listeners ----------
  function init() {
    load();
    render();

    addBtn.addEventListener('click', () => addTodo(taskInput.value));
    taskInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addTodo(taskInput.value);
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // keyboard accessibility: focus input on load
    taskInput.focus();
  }

  init();
})();
