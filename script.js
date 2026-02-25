class Todo {
  constructor(title, description, dueDate, priority, notes = '') {
    this.id = Date.now().toString();
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.notes = notes;
    this.completed = false;
  }

  toggleComplete() {
    this.completed = !this.completed;
  }
}

class Project {
  constructor(name) {
    this.id = Date.now().toString();
    this.name = name;
    this.todos = [];
  }

  addTodo(todo) {
    this.todos.push(todo);
  }

  removeTodo(todoId) {
    this.todos = this.todos.filter(todo => todo.id !== todoId);
  }

  getTodo(todoId) {
    return this.todos.find(todo => todo.id === todoId);
  }
}

class App {
  constructor() {
    this.projects = this.loadProjects();
    this.currentProjectId = this.projects[0]?.id || null;
    
    this.initElements();
    this.initEventListeners();
    this.render();
  }

  loadProjects() {
    const data = localStorage.getItem('todoApp');
    if (!data) {
      const defaultProject = new Project('Default');
      return [defaultProject];
    }

    try {
      const projects = JSON.parse(data);
      return projects.map(p => {
        const project = new Project(p.name);
        project.id = p.id;
        project.todos = p.todos.map(t => {
          const todo = new Todo(t.title, t.description, t.dueDate, t.priority, t.notes);
          todo.id = t.id;
          todo.completed = t.completed;
          return todo;
        });
        return project;
      });
    } catch (e) {
      console.error('Error loading data:', e);
      return [new Project('Default')];
    }
  }

  saveProjects() {
    localStorage.setItem('todoApp', JSON.stringify(this.projects));
  }

  initElements() {
    this.projectsList = document.getElementById('projects-list');
    this.todosList = document.getElementById('todos-list');
    this.currentProjectTitle = document.getElementById('current-project-title');
    this.todoModal = document.getElementById('todo-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.todoForm = document.getElementById('todo-form');
    
    document.getElementById('add-todo-btn').addEventListener('click', () => this.showAddTodoModal());
    document.getElementById('add-project-btn').addEventListener('click', () => this.showAddProjectModal());
    
    document.querySelectorAll('.close').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
    
    document.getElementById('cancel-modal').addEventListener('click', () => this.closeModal());
    
    this.todoForm.addEventListener('submit', (e) => this.handleTodoSubmit(e));
    
    window.addEventListener('click', (e) => {
      if (e.target === this.todoModal) {
        this.closeModal();
      }
    });
  }

  initEventListeners() {}

  render() {
    this.renderProjects();
    this.renderTodos();
  }

  renderProjects() {
    this.projectsList.innerHTML = '';
    
    this.projects.forEach(project => {
      const li = document.createElement('li');
      li.className = `project-item ${project.id === this.currentProjectId ? 'active' : ''}`;
      li.innerHTML = `
        <span>${project.name}</span>
        ${project.name !== 'Default' ? 
          `<button class="project-delete" data-project-delete="${project.id}">×</button>` : 
          ''}
      `;
      
      li.addEventListener('click', (e) => {
        if (!e.target.matches('[data-project-delete]')) {
          this.switchProject(project.id);
        }
      });
      
      const deleteBtn = li.querySelector('[data-project-delete]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteProject(project.id);
        });
      }
      
      this.projectsList.appendChild(li);
    });
  }

  renderTodos() {
    const project = this.getCurrentProject();
    if (!project) return;
    
    this.currentProjectTitle.textContent = project.name;
    this.todosList.innerHTML = '';
    
    if (project.todos.length === 0) {
      this.todosList.innerHTML = '<div class="empty-state">No todos yet. Click "+ Add Todo" to create one!</div>';
      return;
    }
    
    project.todos.forEach(todo => {
      const todoEl = document.createElement('div');
      todoEl.className = 'todo-item';
      
      const dueDate = new Date(todo.dueDate).toLocaleDateString();
      
      todoEl.innerHTML = `
        <div class="todo-info">
          <div class="todo-title ${todo.completed ? 'completed' : ''}">${todo.title}</div>
          <div class="todo-meta">
            <span>Due: ${dueDate}</span>
            <span class="todo-priority priority-${todo.priority}">${todo.priority}</span>
          </div>
        </div>
        <div class="todo-actions">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
          <button class="btn-delete" data-todo-delete="${todo.id}">Delete</button>
        </div>
      `;
      
      todoEl.querySelector('.todo-checkbox').addEventListener('click', (e) => {
        e.stopPropagation();
        todo.toggleComplete();
        this.saveProjects();
        this.renderTodos();
      });
      
      todoEl.querySelector('[data-todo-delete]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTodo(todo.id);
      });
      
      todoEl.querySelector('.todo-info').addEventListener('click', () => {
        this.showEditTodoModal(todo);
      });
      
      this.todosList.appendChild(todoEl);
    });
  }

  getCurrentProject() {
    return this.projects.find(p => p.id === this.currentProjectId);
  }

  switchProject(projectId) {
    this.currentProjectId = projectId;
    this.render();
  }

  showAddTodoModal() {
    this.modalTitle.textContent = 'Add New Todo';
    this.todoForm.reset();
    document.getElementById('todo-id').value = '';
    this.todoModal.style.display = 'block';
  }

  showEditTodoModal(todo) {
    this.modalTitle.textContent = 'Edit Todo';
    document.getElementById('todo-id').value = todo.id;
    document.getElementById('todo-title').value = todo.title;
    document.getElementById('todo-description').value = todo.description;
    document.getElementById('todo-due').value = todo.dueDate;
    document.getElementById('todo-priority').value = todo.priority;
    document.getElementById('todo-notes').value = todo.notes;
    this.todoModal.style.display = 'block';
  }

  showAddProjectModal() {
    const projectName = prompt('Enter project name:');
    if (projectName && projectName.trim()) {
      const newProject = new Project(projectName.trim());
      this.projects.push(newProject);
      this.saveProjects();
      this.render();
    }
  }

  closeModal() {
    this.todoModal.style.display = 'none';
  }

  handleTodoSubmit(e) {
    e.preventDefault();
    
    const todoId = document.getElementById('todo-id').value;
    const title = document.getElementById('todo-title').value;
    const description = document.getElementById('todo-description').value;
    const dueDate = document.getElementById('todo-due').value;
    const priority = document.getElementById('todo-priority').value;
    const notes = document.getElementById('todo-notes').value;
    
    const project = this.getCurrentProject();
    
    if (todoId) {
      const todo = project.getTodo(todoId);
      if (todo) {
        todo.title = title;
        todo.description = description;
        todo.dueDate = dueDate;
        todo.priority = priority;
        todo.notes = notes;
      }
    } else {
      const newTodo = new Todo(title, description, dueDate, priority, notes);
      project.addTodo(newTodo);
    }
    
    this.saveProjects();
    this.renderTodos();
    this.closeModal();
  }

  deleteTodo(todoId) {
    const project = this.getCurrentProject();
    project.removeTodo(todoId);
    this.saveProjects();
    this.renderTodos();
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    if (this.currentProjectId === projectId) {
      this.currentProjectId = this.projects[0]?.id || null;
    }
    this.saveProjects();
    this.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});