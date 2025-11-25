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
    const setsContainer = document.getElementById('setsContainer');
    const addSetBtn = document.getElementById('addSetBtn');
    const workoutList = document.getElementById('workoutList');
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');

    // Initial Setup
    currentDateDisplay.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    renderCalendar();
    loadDataForDate(selectedDate);
    addSetRow(); // Add initial set row

    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    addSetBtn.addEventListener('click', addSetRow);

    workoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveWorkout();
    });

    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // --- LocalStorage Logic ---
    function getStorageData() {
        return JSON.parse(localStorage.getItem('fitTrackData')) || {};
    }

    function saveStorageData(data) {
        localStorage.setItem('fitTrackData', JSON.stringify(data));
    }

    function getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // --- Dynamic Sets Logic ---
    function addSetRow() {
        const setNum = setsContainer.children.length + 1;
        const row = document.createElement('div');
        row.classList.add('set-row');
        row.innerHTML = `
            <span class="set-number">Set ${setNum}</span>
            <input type="number" class="reps-input" placeholder="Reps" required>
            <input type="number" class="weight-input" placeholder="kg" step="0.5">
            <label class="bw-toggle">
                <input type="checkbox" class="bw-checkbox"> BW
            </label>
            ${setNum > 1 ? '<button type="button" class="remove-set-btn"><i class="fa-solid fa-xmark"></i></button>' : ''}
        `;

        // Handle Bodyweight Toggle
        const bwCheckbox = row.querySelector('.bw-checkbox');
        const weightInput = row.querySelector('.weight-input');

        bwCheckbox.addEventListener('change', () => {
            if (bwCheckbox.checked) {
                weightInput.value = '';
                weightInput.disabled = true;
                weightInput.placeholder = 'BW';
            } else {
                weightInput.disabled = false;
                weightInput.placeholder = 'kg';
            }
        });

        // Handle Remove
        if (setNum > 1) {
            row.querySelector('.remove-set-btn').addEventListener('click', () => {
                row.remove();
                updateSetNumbers();
            });
        }

        setsContainer.appendChild(row);
    }

    function updateSetNumbers() {
        Array.from(setsContainer.children).forEach((row, index) => {
            row.querySelector('.set-number').textContent = `Set ${index + 1}`;
        });
    }

    // --- Workout Logic ---
    function saveWorkout() {
        const dateKey = getDateKey(selectedDate);
        const exerciseName = document.getElementById('exerciseName').value;
        const setRows = Array.from(setsContainer.children);

        const sets = setRows.map(row => ({
            reps: row.querySelector('.reps-input').value,
            weight: row.querySelector('.bw-checkbox').checked ? 'BW' : row.querySelector('.weight-input').value,
            isBodyweight: row.querySelector('.bw-checkbox').checked
        }));

        const newWorkout = {
            id: Date.now(),
            exercise_name: exerciseName,
            sets: sets
        };

        const data = getStorageData();
        if (!data[dateKey]) data[dateKey] = { workouts: [], todos: [] };
        if (!data[dateKey].workouts) data[dateKey].workouts = [];

        data[dateKey].workouts.push(newWorkout);
        saveStorageData(data);

        // Reset Form
        document.getElementById('exerciseName').value = '';
        setsContainer.innerHTML = '';
        addSetRow();
        loadWorkouts(selectedDate);
        renderCalendar(); // Update dots
    }

    function loadWorkouts(date) {
        const dateKey = getDateKey(date);
        const data = getStorageData();
        const workouts = data[dateKey]?.workouts || [];

        workoutList.innerHTML = workouts.map(w => {
            const setsDisplay = w.sets.map(s =>
                `${s.reps}x${s.isBodyweight ? 'BW' : s.weight + 'kg'}`
            ).join(', ');

            return `
            <div class="workout-item">
                <div class="workout-info">
                    <h3>${w.exercise_name}</h3>
                    <div class="workout-stats">
                        ${setsDisplay}
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteWorkout(${w.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `}).join('');
    }

    window.deleteWorkout = (id) => {
        if (!confirm('Delete this workout?')) return;

        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (data[dateKey]?.workouts) {
            data[dateKey].workouts = data[dateKey].workouts.filter(w => w.id !== id);
            saveStorageData(data);
            loadWorkouts(selectedDate);
            renderCalendar();
        }
    };

    // --- To-Do Logic ---
    function addTodo() {
        const task = todoInput.value.trim();
        if (!task) return;

        const dateKey = getDateKey(selectedDate);
        const newTodo = {
            id: Date.now(),
            task: task,
            completed: false
        };

        const data = getStorageData();
        if (!data[dateKey]) data[dateKey] = { workouts: [], todos: [] };
        if (!data[dateKey].todos) data[dateKey].todos = [];

        data[dateKey].todos.push(newTodo);
        saveStorageData(data);

        todoInput.value = '';
        loadTodos(selectedDate);
        renderCalendar();
    }

    function loadTodos(date) {
        const dateKey = getDateKey(date);
        const data = getStorageData();
        const todos = data[dateKey]?.todos || [];

        todoList.innerHTML = todos.map(t => `
            <li class="todo-item ${t.completed ? 'completed' : ''}">
                <div style="display:flex; align-items:center;">
                    <i class="fa-${t.completed ? 'solid fa-circle-check' : 'regular fa-circle'} todo-check" 
                       onclick="toggleTodo(${t.id})"></i>
                    <span>${t.task}</span>
                </div>
                <button class="delete-btn" onclick="deleteTodo(${t.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </li>
        `).join('');
    }

    window.deleteTodo = (id) => {
        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (data[dateKey]?.todos) {
            data[dateKey].todos = data[dateKey].todos.filter(t => t.id !== id);
            saveStorageData(data);
            loadTodos(selectedDate);
            renderCalendar();
        }
    };

    window.toggleTodo = (id) => {
        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (data[dateKey]?.todos) {
            const todo = data[dateKey].todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                saveStorageData(data);
                loadTodos(selectedDate);
            }
        }
    };

    // --- Calendar Logic ---
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const data = getStorageData();

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            calendarGrid.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = i;

            const dateKey = getDateKey(new Date(year, month, i));
            const hasData = data[dateKey] && (
                (data[dateKey].workouts && data[dateKey].workouts.length > 0) ||
                (data[dateKey].todos && data[dateKey].todos.length > 0)
            );

            if (hasData) {
                dayEl.classList.add('has-data');
            }

            if (isSameDate(new Date(year, month, i), selectedDate)) {
                dayEl.classList.add('active');
            }

            dayEl.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                renderCalendar();
                loadDataForDate(selectedDate);
            });

            calendarGrid.appendChild(dayEl);
        }
    }

    function loadDataForDate(date) {
        selectedDateLabel.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        loadWorkouts(date);
        loadTodos(date);
    }

    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }
});
