document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();
    let selectedDate = new Date();
    
    // DOM Elements
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('monthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const selectedDateLabel = document.getElementById('selectedDateLabel');
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    
    // Forms & Lists
    const workoutForm = document.getElementById('workoutForm');
    const workoutList = document.getElementById('workoutList');
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');

    // Initial Setup
    currentDateDisplay.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    renderCalendar();
    loadDataForDate(selectedDate);

    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    workoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            date: formatDate(selectedDate),
            exercise_name: document.getElementById('exerciseName').value,
            sets: document.getElementById('sets').value,
            reps: document.getElementById('reps').value,
            weight: document.getElementById('weight').value
        };

        const res = await fetch('/api/workouts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            workoutForm.reset();
            loadWorkouts(selectedDate);
        }
    });

    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    async function addTodo() {
        const task = todoInput.value.trim();
        if (!task) return;

        const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: formatDate(selectedDate),
                task: task
            })
        });

        if (res.ok) {
            todoInput.value = '';
            loadTodos(selectedDate);
        }
    }

    // Calendar Logic
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        monthYearDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            calendarGrid.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = i;
            
            if (isSameDate(new Date(year, month, i), selectedDate)) {
                dayEl.classList.add('active');
            }

            dayEl.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                renderCalendar(); // Re-render to update active state
                loadDataForDate(selectedDate);
            });

            calendarGrid.appendChild(dayEl);
        }
    }

    // Data Loading
    function loadDataForDate(date) {
        selectedDateLabel.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        loadWorkouts(date);
        loadTodos(date);
    }

    async function loadWorkouts(date) {
        const res = await fetch(`/api/workouts?date=${formatDate(date)}`);
        const workouts = await res.json();
        
        workoutList.innerHTML = workouts.map(w => `
            <div class="workout-item">
                <div class="workout-info">
                    <h3>${w.exercise_name}</h3>
                    <div class="workout-stats">
                        ${w.sets} sets × ${w.reps} reps @ ${w.weight}kg
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteWorkout(${w.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    async function loadTodos(date) {
        const res = await fetch(`/api/todos?date=${formatDate(date)}`);
        const todos = await res.json();
        
        todoList.innerHTML = todos.map(t => `
            <li class="todo-item ${t.completed ? 'completed' : ''}">
                <div style="display:flex; align-items:center;">
                    <i class="fa-${t.completed ? 'solid fa-circle-check' : 'regular fa-circle'} todo-check" 
                       onclick="toggleTodo(${t.id}, ${!t.completed})"></i>
                    <span>${t.task}</span>
                </div>
                <button class="delete-btn" onclick="deleteTodo(${t.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </li>
        `).join('');
    }

    // Helpers
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // Global functions for inline onclicks
    window.deleteWorkout = async (id) => {
        if(confirm('Delete this workout?')) {
            await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
            loadWorkouts(selectedDate);
        }
    };

    window.deleteTodo = async (id) => {
        await fetch(`/api/todos/${id}`, { method: 'DELETE' });
        loadTodos(selectedDate);
    };

    window.toggleTodo = async (id, status) => {
        await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: status })
        });
        loadTodos(selectedDate);
    };
});
