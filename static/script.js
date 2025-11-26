document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentDate = new Date(); // Tracks the currently displayed month
    let selectedDate = new Date(); // Tracks the selected date for logging

    // --- DOM Elements ---
    const calendarGrid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('monthDisplay');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentDateDisplay = document.getElementById('currentDate'); // For "Nov 26" display

    const exerciseNameInput = document.getElementById('exerciseName');
    const setsContainer = document.getElementById('setsContainer');
    const addSetBtn = document.getElementById('addSetBtn');
    const logWorkoutBtn = document.getElementById('logWorkoutBtn');
    const workoutList = document.getElementById('workoutList');

    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');

    // --- Initialization ---
    renderCalendar();
    loadDataForDate(selectedDate);
    addSetRow(); // Add initial set row
    if (window.lucide) window.lucide.createIcons();

    // --- Event Listeners ---

    // Calendar Navigation
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // Add Set Button
    if (addSetBtn) {
        addSetBtn.addEventListener('click', () => {
            addSetRow();
        });
    }

    // Log Workout Button
    if (logWorkoutBtn) {
        logWorkoutBtn.addEventListener('click', () => {
            saveWorkout();
        });
    }

    // To-Do Input & Button
    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', addTodo);
    }

    if (todoInput) {
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });
    }

    // --- Functions ---

    // 1. Calendar Logic
    function renderCalendar() {
        if (!calendarGrid || !monthDisplay) return;

        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Update Header
        monthDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Empty slots for padding
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            calendarGrid.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('calendar-day');
            dayEl.textContent = i;

            const thisDate = new Date(year, month, i);

            // Highlight Today
            if (isSameDate(thisDate, today)) {
                dayEl.style.border = '1px solid var(--accent)';
                dayEl.style.color = '#fff';
            }

            // Highlight Selected
            if (isSameDate(thisDate, selectedDate)) {
                dayEl.classList.add('active');
            }

            // Check for Data (Dots)
            const dateKey = getDateKey(thisDate);
            const data = getStorageData();
            if (data[dateKey] && ((data[dateKey].workouts && data[dateKey].workouts.length > 0) || (data[dateKey].todos && data[dateKey].todos.length > 0))) {
                dayEl.classList.add('has-data');
            }

            dayEl.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                renderCalendar(); // Re-render to update active class
                loadDataForDate(selectedDate);
            });

            calendarGrid.appendChild(dayEl);
        }
    }

    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // 2. Dynamic Sets Logic
    function addSetRow() {
        if (!setsContainer) return;

        const setNum = setsContainer.children.length + 1;
        const row = document.createElement('div');
        row.classList.add('set-row');
        row.innerHTML = `
            <span class="set-number">Set ${setNum}</span>
            <input type="number" class="reps-input" placeholder="0" min="1">
            <input type="number" class="weight-input" placeholder="kg" step="0.5">
            <label class="bw-toggle">
                <input type="checkbox" class="bw-checkbox">
            </label>
            <button type="button" class="remove-set-btn"><i data-lucide="x"></i></button>
        `;

        // Bodyweight Toggle Logic
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

        // Remove Button Logic
        const removeBtn = row.querySelector('.remove-set-btn');
        removeBtn.addEventListener('click', () => {
            if (setsContainer.children.length > 1) {
                row.remove();
                updateSetNumbers();
            }
        });

        setsContainer.appendChild(row);
        if (window.lucide) window.lucide.createIcons();
    }

    function updateSetNumbers() {
        Array.from(setsContainer.children).forEach((row, index) => {
            row.querySelector('.set-number').textContent = `Set ${index + 1}`;
        });
    }

    // 3. Workout Logic
    function saveWorkout() {
        const exerciseName = exerciseNameInput.value.trim();
        if (!exerciseName) {
            alert('Please enter an exercise name');
            return;
        }

        const setRows = Array.from(setsContainer.children);
        const sets = setRows.map(row => {
            const reps = row.querySelector('.reps-input').value || '0';
            const isBodyweight = row.querySelector('.bw-checkbox').checked;
            const weight = isBodyweight ? 'BW' : (row.querySelector('.weight-input').value || '0');
            return { reps, weight, isBodyweight };
        });

        // Save to LocalStorage
        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (!data[dateKey]) data[dateKey] = { workouts: [], todos: [] };
        if (!data[dateKey].workouts) data[dateKey].workouts = [];

        data[dateKey].workouts.push({
            id: Date.now(),
            exercise_name: exerciseName,
            sets: sets
        });
        saveStorageData(data);

        // Feedback
        const originalText = logWorkoutBtn.textContent;
        logWorkoutBtn.textContent = 'Saved!';
        logWorkoutBtn.style.background = '#059669';
        setTimeout(() => {
            logWorkoutBtn.textContent = originalText;
            logWorkoutBtn.style.background = '';
        }, 2000);

        // Cleanup
        exerciseNameInput.value = '';
        setsContainer.innerHTML = '';
        addSetRow();
        loadDataForDate(selectedDate);
        renderCalendar();
    }

    function loadDataForDate(date) {
        if (currentDateDisplay) {
            currentDateDisplay.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        const dateKey = getDateKey(date);
        const data = getStorageData();

        // Load Workouts
        const workouts = data[dateKey]?.workouts || [];
        workoutList.innerHTML = workouts.map(w => {
            const setsDisplay = w.sets.map(s => `${s.reps}x${s.weight}`).join(', ');
            return `
                <div class="workout-item">
                    <div class="workout-info">
                        <h3>${w.exercise_name}</h3>
                        <div class="workout-stats">${setsDisplay}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteWorkout(${w.id})">
                        <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Load Todos
        const todos = data[dateKey]?.todos || [];
        todoList.innerHTML = todos.map(t => `
            <div class="todo-item ${t.completed ? 'completed' : ''}">
                <div style="display:flex; align-items:center;">
                    <i data-lucide="${t.completed ? 'check-circle' : 'circle'}" 
                       class="todo-check" 
                       onclick="toggleTodo(${t.id})"
                       style="width:20px; height:20px; margin-right:10px; cursor:pointer;"></i>
                    <span>${t.task}</span>
                </div>
                <button class="delete-btn" onclick="deleteTodo(${t.id})" style="background:none; border:none; color:#94a3b8; cursor:pointer;">
                    <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                </button>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    // 4. To-Do Logic
    function addTodo() {
        const task = todoInput.value.trim();
        if (!task) return;

        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (!data[dateKey]) data[dateKey] = { workouts: [], todos: [] };
        if (!data[dateKey].todos) data[dateKey].todos = [];

        data[dateKey].todos.push({
            id: Date.now(),
            task: task,
            completed: false
        });
        saveStorageData(data);

        todoInput.value = '';
        loadDataForDate(selectedDate);
        renderCalendar();
    }

    // --- Global Helpers (Window Scope) ---
    window.deleteWorkout = (id) => {
        if (!confirm('Delete this workout?')) return;
        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (data[dateKey]?.workouts) {
            data[dateKey].workouts = data[dateKey].workouts.filter(w => w.id !== id);
            saveStorageData(data);
            loadDataForDate(selectedDate);
            renderCalendar();
        }
    };

    window.deleteTodo = (id) => {
        const dateKey = getDateKey(selectedDate);
        const data = getStorageData();
        if (data[dateKey]?.todos) {
            data[dateKey].todos = data[dateKey].todos.filter(t => t.id !== id);
            saveStorageData(data);
            loadDataForDate(selectedDate);
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
                loadDataForDate(selectedDate);
            }
        }
    };

    // Storage Helpers
    function getStorageData() {
        return JSON.parse(localStorage.getItem('fitTrackData')) || {};
    }

    function saveStorageData(data) {
        localStorage.setItem('fitTrackData', JSON.stringify(data));
    }
});
