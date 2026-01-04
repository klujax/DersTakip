// Data Management
let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let trash = JSON.parse(localStorage.getItem('trash')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || {};
let weeklyPlan = JSON.parse(localStorage.getItem('weeklyPlan')) || {};
let scheduleImage = localStorage.getItem('scheduleImage') || null;
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
let notebooks = JSON.parse(localStorage.getItem('notebooks')) || [];

// DOM Elements - Navigation
const navItems = document.querySelectorAll('.nav-item');
const appSections = document.querySelectorAll('.app-section');
const pageTitle = document.getElementById('pageTitle');
const currentDateEl = document.getElementById('currentDate');

// DOM Elements - Home Section
const statTotalLessons = document.getElementById('statTotalLessons');
const statTotalAbsence = document.getElementById('statTotalAbsence');
const statTotalNotes = document.getElementById('statTotalNotes');
const quickSummary = document.getElementById('quickSummary');

// Modal Elements
const lessonModal = document.getElementById('lessonModal');
const noteModal = document.getElementById('noteModal');
const lessonForm = document.getElementById('lessonForm');
const noteForm = document.getElementById('noteForm');
const subLessonsContainer = document.getElementById('subLessonsContainer');
const hasSubLessonsCheckbox = document.getElementById('hasSubLessons');

// Sidebar Navigation Logic
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const sectionId = item.dataset.section;

        // Update UI
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        appSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
            }
        });

        // Update Header Title
        const sectionName = item.querySelector('span:last-child').textContent;
        pageTitle.textContent = sectionName === 'Anasayfa' ? 'Anasayfa Özet' : sectionName;

        // Refresh section data if needed
        if (sectionId === 'home') updateDashboard();
        if (sectionId === 'profil') updateProfileStats();
        if (sectionId === 'copkovasi') renderTrash();

        // Close sidebar on mobile after clicking
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    });
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebar = document.querySelector('.sidebar');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
}

// Update Dashboard Summary
function updateDashboard() {
    statTotalLessons.textContent = lessons.length;
    statTotalNotes.textContent = notes.length;

    let totalAbsence = 0;
    let criticalLessons = 0;

    lessons.forEach(l => {
        if (l.hasSubLessons) {
            l.subLessons.forEach(s => {
                totalAbsence += s.currentAbsence;
                if ((s.currentAbsence / s.maxAbsenceHours) >= 0.8) criticalLessons++;
            });
        } else {
            totalAbsence += l.currentAbsence;
            if ((l.currentAbsence / l.maxAbsenceHours) >= 0.8) criticalLessons++;
        }
    });

    statTotalAbsence.textContent = totalAbsence;

    // Quick Summary List
    if (lessons.length === 0) {
        quickSummary.innerHTML = '<p class="text-muted">Görünürde henüz bir ders yok...</p>';
    } else {
        quickSummary.innerHTML = lessons.slice(0, 3).map(l => `
            <div class="summary-item" style="border-left-color: var(--brand-${l.hasSubLessons ? 'primary' : 'secondary'})">
                <span style="font-weight:700">${l.name}</span>
                <span style="font-size:0.85rem; color:var(--text-dim); background:rgba(0,0,0,0.02); padding:4px 10px; border-radius:10px">${l.hasSubLessons ? l.subLessons.length + ' Bölüm' : l.currentAbsence + ' sa. Devamsızlık'}</span>
            </div>
        `).join('');
    }

    // Render Home Schedule
    renderHomeSchedule();

    // Render Today's Plan
    renderTodayPlan();
}

// Render Schedule on Home Page
function renderHomeSchedule() {
    const container = document.getElementById('homeScheduleView');
    if (!container) return;

    // If there's an uploaded image, show it
    if (scheduleImage) {
        container.innerHTML = `<img src="${scheduleImage}" alt="Ders Programı">`;
        return;
    }

    // Otherwise show manual schedule if exists
    const days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

    const hasSchedule = days.some(d => schedule[d] && schedule[d].trim());

    if (!hasSchedule) {
        container.innerHTML = `
            <div class="empty-state" style="padding:40px">
                <div class="empty-state-icon">📅</div>
                <p>Henüz ders programı eklenmedi</p>
                <small style="color:var(--text-muted)">Ders Programı sayfasından ekleyebilirsin</small>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="home-schedule-grid" style="grid-template-columns: repeat(5, 1fr); gap:12px">
            ${days.map((d, i) => `
                <div class="home-day-pill">
                    <h4>${dayNames[i]}</h4>
                    <p>${schedule[d] || '-'}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// Render Today's Plan on Home Page
function renderTodayPlan() {
    const container = document.getElementById('homeTodayPlan');
    if (!container) return;

    const dayMap = {
        0: 'pazar',
        1: 'pazartesi',
        2: 'sali',
        3: 'carsamba',
        4: 'persembe',
        5: 'cuma',
        6: 'cumartesi'
    };

    const dayNameMap = {
        0: 'Pazar',
        1: 'Pazartesi',
        2: 'Salı',
        3: 'Çarşamba',
        4: 'Perşembe',
        5: 'Cuma',
        6: 'Cumartesi'
    };

    const today = new Date().getDay();
    const todayKey = dayMap[today];
    const todayName = dayNameMap[today];
    const todayPlan = weeklyPlan[todayKey];

    if (todayPlan && todayPlan.trim()) {
        container.innerHTML = `
            <h4>📌 ${todayName}</h4>
            <p>${todayPlan}</p>
        `;
    } else {
        container.innerHTML = `
            <h4>📌 ${todayName}</h4>
            <p class="no-plan">Bugün için plan eklenmedi. Haftalık Plan sayfasından ekleyebilirsin.</p>
        `;
    }
}

// Profile Stats
function updateProfileStats() {
    let totalAbsence = 0;
    let totalMax = 0;
    let critical = 0;

    lessons.forEach(l => {
        if (l.hasSubLessons) {
            l.subLessons.forEach(s => {
                totalAbsence += s.currentAbsence;
                totalMax += s.maxAbsenceHours;
                if ((s.currentAbsence / s.maxAbsenceHours) >= 0.8) critical++;
            });
        } else {
            totalAbsence += l.currentAbsence;
            totalMax += l.maxAbsenceHours;
            if ((l.currentAbsence / l.maxAbsenceHours) >= 0.8) critical++;
        }
    });

    document.getElementById('p-critical').textContent = critical;
    const avg = totalMax > 0 ? ((totalAbsence / totalMax) * 100).toFixed(1) : 0;
    document.getElementById('p-avg').textContent = '%' + avg;
}

// Modal Toggle Helpers
document.getElementById('addLessonBtn').addEventListener('click', () => lessonModal.classList.add('active'));
document.getElementById('addNoteBtn').addEventListener('click', () => noteModal.classList.add('active'));
document.getElementById('closeLessonModal').addEventListener('click', () => lessonModal.classList.remove('active'));
document.getElementById('closeNoteModal').addEventListener('click', () => noteModal.classList.remove('active'));

// Handle Sub Lessons Toggle
hasSubLessonsCheckbox.addEventListener('change', (e) => {
    document.getElementById('singleLessonFields').style.display = e.target.checked ? 'none' : 'block';
    document.getElementById('subLessonsFields').style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked && subLessonsContainer.innerHTML === '') {
        addSubLesson('Teori');
        addSubLesson('Uygulama');
    }
});

function addSubLesson(name = '') {
    const div = document.createElement('div');
    div.className = 'sub-lesson-card-form';
    div.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <input type="text" class="sub-name" placeholder="Bölüm Adı (Örn: Teori)" value="${name}" style="flex:2; min-width:120px">
            <input type="number" class="sub-hours" placeholder="Saat" style="flex:1; min-width:70px">
            <input type="number" class="sub-rate" placeholder="%" value="30" style="flex:1; min-width:60px">
            <button type="button" onclick="this.closest('.sub-lesson-card-form').remove()">×</button>
        </div>
    `;
    subLessonsContainer.appendChild(div);
}

document.getElementById('addSubLessonBtn').addEventListener('click', () => addSubLesson());

// Form Submissions
lessonForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('lessonName').value;
    const isSub = hasSubLessonsCheckbox.checked;

    let lesson = { id: Date.now(), name, hasSubLessons: isSub };

    if (isSub) {
        const subDivs = subLessonsContainer.querySelectorAll('.sub-lesson-card-form');
        lesson.subLessons = Array.from(subDivs).map(div => ({
            id: Math.random(),
            name: div.querySelector('.sub-name').value,
            totalHours: parseInt(div.querySelector('.sub-hours').value),
            maxAbsenceHours: Math.floor(parseInt(div.querySelector('.sub-hours').value) * (parseInt(div.querySelector('.sub-rate').value) / 100)),
            currentAbsence: 0
        }));
    } else {
        const h = parseInt(document.getElementById('totalHours').value);
        const r = parseInt(document.getElementById('absenceRate').value);
        lesson.totalHours = h;
        lesson.maxAbsenceHours = Math.floor(h * (r / 100));
        lesson.currentAbsence = 0;
        lesson.absenceRate = r;
    }

    lessons.push(lesson);
    saveData();
    renderLessons();
    updateDashboard();
    lessonModal.classList.remove('active');
    lessonForm.reset();
    subLessonsContainer.innerHTML = '';
});

noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = {
        id: Date.now(),
        title: document.getElementById('noteTitle').value,
        content: document.getElementById('noteContent').value,
        color: document.querySelector('input[name="noteColor"]:checked').value,
        date: new Date().toLocaleDateString('tr-TR')
    };
    notes.push(note);
    saveData();
    renderNotes();
    updateDashboard();
    noteModal.classList.remove('active');
    noteForm.reset();
});

// Render Functions
// Render Functions
function renderLessons() {
    const container = document.getElementById('lessonsGrid');
    if (lessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1">
                <div class="empty-state-icon">📚</div>
                <p>Henüz ders eklenmedi. Yeni bir başlangıç yap!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lessons.map(l => {
        if (l.hasSubLessons) {
            return `
                <div class="lesson-card">
                    <div style="display:flex; justify-content:space-between; align-items:start">
                        <h4>${l.name}</h4>
                        <button class="task-delete" onclick="deleteLesson(${l.id})">🗑️</button>
                    </div>
                    ${l.subLessons.map(s => {
                const perc = (s.currentAbsence / s.maxAbsenceHours) * 100;
                const status = perc >= 90 ? 'danger' : perc >= 70 ? 'warning' : 'safe';
                return `
                            <div class="sub-lesson-box" style="margin-top:15px; padding:15px; background:rgba(0,0,0,0.02); border-radius:16px; border:1px solid rgba(0,0,0,0.03)">
                                <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                                    <span style="font-weight:700; font-size:0.9rem">${s.name}</span>
                                    <span style="font-size:0.85rem; color:var(--text-dim)">${s.currentAbsence}/${s.maxAbsenceHours} sa.</span>
                                </div>
                                <div style="height:8px; background:rgba(0,0,0,0.05); border-radius:10px; overflow:hidden">
                                    <div style="height:100%; width:${perc}%; background:var(--brand-${status === 'safe' ? 'accent' : 'primary'}); border-radius:10px; transition:width 0.5s ease"></div>
                                </div>
                                <div style="display:flex; gap:8px; margin-top:12px">
                                    <button class="secondary-btn" style="flex:1; padding:10px; font-size:0.85rem" onclick="updateSubAbsence(${l.id}, ${s.id}, -1)">➖</button>
                                    <button class="secondary-btn" style="flex:1; padding:10px; font-size:0.85rem; background:rgba(236, 72, 153, 0.1); color:var(--brand-primary)" onclick="updateSubAbsence(${l.id}, ${s.id}, 1)">➕</button>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        } else {
            const perc = (l.currentAbsence / l.maxAbsenceHours) * 100;
            const status = perc >= 90 ? 'danger' : perc >= 70 ? 'warning' : 'safe';
            const remaining = l.maxAbsenceHours - l.currentAbsence;
            return `
                <div class="lesson-card">
                    <div style="display:flex; justify-content:space-between; align-items:start">
                        <h4>${l.name}</h4>
                        <button class="task-delete" onclick="deleteLesson(${l.id})">🗑️</button>
                    </div>
                    <div style="margin: 10px 0">
                        <span style="font-size:0.9rem; color:var(--text-dim)">Kalan Hak:</span>
                        <span style="font-weight:800; color:var(--brand-${status === 'safe' ? 'accent' : 'primary'})">${remaining} Saat</span>
                    </div>
                    <div style="height:10px; background:rgba(0,0,0,0.05); border-radius:10px; overflow:hidden">
                        <div style="height:100%; width:${perc}%; background: var(--brand-${status === 'safe' ? 'accent' : 'primary'}); border-radius:10px; transition:width 0.5s ease"></div>
                    </div>
                    <div style="display:flex; gap:12px; margin-top:10px">
                        <button class="secondary-btn" style="flex:1" onclick="updateAbsence(${l.id}, -1)">➖ Azalt</button>
                        <button class="add-btn" style="flex:1.5; padding:14px; font-size:0.85rem; background:var(--brand-accent)" onclick="updateAbsence(${l.id}, 1)">➕ Devamsızlık</button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function renderNotes() {
    const container = document.getElementById('notesGrid');
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1">
                <div class="empty-state-icon">📝</div>
                <p>Henüz not eklenmedi. Aklındakileri buraya dök!</p>
            </div>
        `;
        return;
    }
    container.innerHTML = notes.map(n => `
        <div class="note-card" style="border-top: 5px solid var(--brand-${n.color === 'pink' ? 'primary' : 'accent'})">
            <div style="display:flex; justify-content:space-between; align-items:start">
                <h4 style="font-family:'Outfit',sans-serif; font-size:1.2rem; color:var(--brand-${n.color === 'pink' ? 'primary' : 'accent'})">${n.title}</h4>
                <button class="task-delete" onclick="deleteNote(${n.id})">🗑️</button>
            </div>
            <p style="margin:15px 0; font-size:0.95rem; color:var(--text-body); line-height:1.6">${n.content}</p>
            <div style="display:flex; align-items:center; gap:8px; padding-top:15px; border-top:1px solid rgba(0,0,0,0.03)">
                <span style="font-size:0.8rem; color:var(--text-dim); font-weight:600">📅 ${n.date}</span>
            </div>
        </div>
    `).join('');
}

// Update Functions
window.updateAbsence = (id, delta) => {
    const l = lessons.find(lx => lx.id === id);
    if (!l) return;
    l.currentAbsence = Math.max(0, Math.min(l.maxAbsenceHours, l.currentAbsence + delta));
    saveData(); renderLessons(); updateDashboard();
};

window.updateSubAbsence = (lId, sId, delta) => {
    const l = lessons.find(lx => lx.id === lId);
    if (!l) return;
    const s = l.subLessons.find(sx => sx.id === sId);
    if (!s) return;
    s.currentAbsence = Math.max(0, Math.min(s.maxAbsenceHours, s.currentAbsence + delta));
    saveData(); renderLessons(); updateDashboard();
};
// Delete Functions - Move to Trash
window.deleteLesson = (id) => {
    const lesson = lessons.find(l => l.id === id);
    if (lesson) {
        trash.push({ type: 'lesson', data: lesson, deletedAt: Date.now() });
        lessons = lessons.filter(l => l.id !== id);
        saveData();
        renderLessons();
        updateDashboard();
    }
};

window.deleteNote = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) {
        trash.push({ type: 'note', data: note, deletedAt: Date.now() });
        notes = notes.filter(n => n.id !== id);
        saveData();
        renderNotes();
        updateDashboard();
    }
};

// Restore from Trash
window.restoreItem = (index) => {
    const item = trash[index];
    if (item.type === 'lesson') {
        lessons.push(item.data);
    } else if (item.type === 'note') {
        notes.push(item.data);
    }
    trash.splice(index, 1);
    saveData();
    renderTrash();
    renderLessons();
    renderNotes();
    updateDashboard();
};

// Permanently Delete from Trash
window.permanentDelete = (index) => {
    trash.splice(index, 1);
    saveData();
    renderTrash();
};

// Empty Trash
document.getElementById('emptyTrashBtn')?.addEventListener('click', () => {
    if (trash.length === 0) return;
    if (confirm('Çöp kovasını tamamen boşaltmak istediğinize emin misiniz?')) {
        trash = [];
        saveData();
        renderTrash();
    }
});

// Render Trash
function renderTrash() {
    const container = document.getElementById('trashGrid');
    if (!container) return;

    if (trash.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1">
                <div class="empty-state-icon">🗑️</div>
                <p>Çöp kovası şu an tertemiz!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = trash.map((item, index) => {
        const isLesson = item.type === 'lesson';
        const title = isLesson ? item.data.name : item.data.title;
        const icon = isLesson ? '📚' : '📝';
        const typeText = isLesson ? 'Ders' : 'Not';

        return `
            <div class="lesson-card" style="border-top: 4px solid var(--brand-primary)">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <h4 style="font-size:1.1rem">${icon} ${title}</h4>
                    <span style="font-size:0.75rem; background:rgba(236,72,153,0.1); color:var(--brand-primary); padding:4px 10px; border-radius:10px; font-weight:700">${typeText}</span>
                </div>
                <div style="display:flex; gap:12px; margin-top:20px">
                    <button class="secondary-btn" style="flex:1; font-size:0.8rem" onclick="restoreItem(${index})">↩️ Kurtar</button>
                    <button class="secondary-btn" style="flex:1; font-size:0.8rem; border:1px solid rgba(239,68,68,0.2); color: #ef4444" onclick="permanentDelete(${index})">🗑️ Kalıcı Sil</button>
                </div>
            </div>
        `;
    }).join('');
}

function saveData() {
    localStorage.setItem('lessons', JSON.stringify(lessons));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('trash', JSON.stringify(trash));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
}

// Schedule Image Upload
document.getElementById('scheduleFile')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            scheduleImage = event.target.result;
            localStorage.setItem('scheduleImage', scheduleImage);
            renderSchedulePreview();
            updateDashboard();
        };
        reader.readAsDataURL(file);
    }
});

function renderSchedulePreview() {
    const preview = document.getElementById('schedulePreview');
    if (!preview) return;

    if (scheduleImage) {
        preview.innerHTML = `
            <div style="position:relative; display:inline-block">
                <img src="${scheduleImage}" alt="Ders Programı">
                <button onclick="deleteScheduleImage()" style="position:absolute; top:10px; right:10px; background:var(--accent-red); color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer">🗑️ Sil</button>
            </div>
        `;
    } else {
        preview.innerHTML = '';
    }
}

window.deleteScheduleImage = () => {
    scheduleImage = null;
    localStorage.removeItem('scheduleImage');
    renderSchedulePreview();
    updateDashboard();
};

// Save Manual Schedule
document.getElementById('saveScheduleBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.day-input').forEach(input => {
        schedule[input.dataset.day] = input.value;
    });
    localStorage.setItem('schedule', JSON.stringify(schedule));
    updateDashboard();
    alert('Ders programı kaydedildi! ✅');
});

// Load Schedule Data
function loadSchedule() {
    document.querySelectorAll('.day-input').forEach(input => {
        if (schedule[input.dataset.day]) {
            input.value = schedule[input.dataset.day];
        }
    });
    renderSchedulePreview();
}

// Save Weekly Plan
document.getElementById('saveWeeklyPlan')?.addEventListener('click', () => {
    document.querySelectorAll('.planner-input').forEach(input => {
        weeklyPlan[input.dataset.day] = input.value;
    });
    localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
    updateDashboard();
    alert('Haftalık plan kaydedildi! ✅');
});

// Clear Weekly Plan
document.getElementById('clearWeeklyPlan')?.addEventListener('click', () => {
    if (confirm('Haftalık planı temizlemek istediğinize emin misiniz?')) {
        weeklyPlan = {};
        localStorage.setItem('weeklyPlan', JSON.stringify(weeklyPlan));
        document.querySelectorAll('.planner-input').forEach(input => {
            input.value = '';
        });
    }
});

// Task System
const days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];
const dayNames = {
    'pazartesi': 'Pazartesi',
    'sali': 'Salı',
    'carsamba': 'Çarşamba',
    'persembe': 'Perşembe',
    'cuma': 'Cuma',
    'cumartesi': 'Cumartesi',
    'pazar': 'Pazar'
};

// Initialize tasks structure
days.forEach(day => {
    if (!tasks[day]) tasks[day] = [];
});

// Add Task
document.getElementById('addTaskBtn')?.addEventListener('click', () => {
    const text = document.getElementById('newTaskText').value.trim();
    const day = document.getElementById('newTaskDay').value;

    if (!text) {
        alert('Lütfen görev adı girin!');
        return;
    }

    tasks[day].push({
        id: Date.now(),
        text: text,
        completed: false
    });

    saveTasks();
    renderWeeklyTasks();
    updateDashboard();
    document.getElementById('newTaskText').value = '';
});

// Toggle Task Completion
window.toggleTask = (day, taskId) => {
    const task = tasks[day].find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderWeeklyTasks();
        updateDashboard();
    }
};

// Delete Task
window.deleteTask = (day, taskId) => {
    tasks[day] = tasks[day].filter(t => t.id !== taskId);
    saveTasks();
    renderWeeklyTasks();
    updateDashboard();
};

// Save Tasks
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render Weekly Tasks
function renderWeeklyTasks() {
    const container = document.getElementById('weeklyTasksGrid');
    if (!container) return;

    container.innerHTML = days.map(day => {
        const dayTasks = tasks[day] || [];
        const completedCount = dayTasks.filter(t => t.completed).length;

        return `
            <div class="day-task-card">
                <div class="day-task-header">
                    <span>📌 ${dayNames[day]}</span>
                    <span class="task-count">${completedCount}/${dayTasks.length}</span>
                </div>
                <div class="day-task-list">
                    ${dayTasks.length === 0 ?
                '<p class="no-tasks">Henüz görev yok</p>' :
                dayTasks.map(t => `
                            <div class="task-item ${t.completed ? 'completed' : ''}">
                                <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="toggleTask('${day}', ${t.id})">
                                    ${t.completed ? '✓' : ''}
                                </div>
                                <span class="task-text">${t.text}</span>
                                <button class="task-delete" onclick="deleteTask('${day}', ${t.id})">🗑️</button>
                            </div>
                        `).join('')
            }
                </div>
            </div>
        `;
    }).join('');
}

// Update renderTodayPlan for tasks
function renderTodayPlan() {
    const container = document.getElementById('homeTodayPlan');
    if (!container) return;

    const dayMap = {
        0: 'pazar',
        1: 'pazartesi',
        2: 'sali',
        3: 'carsamba',
        4: 'persembe',
        5: 'cuma',
        6: 'cumartesi'
    };

    const dayNameMap = {
        0: 'Pazar',
        1: 'Pazartesi',
        2: 'Salı',
        3: 'Çarşamba',
        4: 'Perşembe',
        5: 'Cuma',
        6: 'Cumartesi'
    };

    const today = new Date().getDay();
    const todayKey = dayMap[today];
    const todayName = dayNameMap[today];
    const todayTasks = tasks[todayKey] || [];

    if (todayTasks.length === 0) {
        container.innerHTML = `
            <h4>📌 ${todayName} - Görevler</h4>
            <p class="no-plan">Bugün için görev eklenmedi. Haftalık Plan sayfasından ekleyebilirsin.</p>
        `;
        return;
    }

    const completedCount = todayTasks.filter(t => t.completed).length;

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
             <span style="font-weight:800; font-size:1.1rem; color:white">📌 ${todayName} Görevleri</span>
             <span style="background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:700">${completedCount}/${todayTasks.length}</span>
        </div>
        <div class="today-task-list">
            ${todayTasks.map(t => `
                <div class="today-task-item ${t.completed ? 'completed' : ''}" onclick="toggleTask('${todayKey}', ${t.id})" style="background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); color:white">
                    <div class="task-checkbox ${t.completed ? 'checked' : ''}" style="border-color:white; background:${t.completed ? 'white' : 'transparent'}; color:${t.completed ? 'var(--brand-primary)' : 'white'}">
                        ${t.completed ? '✓' : ''}
                    </div>
                    <span class="task-text" style="color:white; font-weight:600">${t.text}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Profile Data
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;

// Profile Functions
function handleProfilePhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const photoData = e.target.result;
            if (!userProfile) userProfile = {};
            userProfile.photo = photoData;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            loadProfileDisplay();
        };
        reader.readAsDataURL(file);
    }
}

function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const school = document.getElementById('editSchool').value.trim();
    const department = document.getElementById('editDepartment').value.trim();
    const grade = document.getElementById('editGrade').value;

    if (!name) {
        alert('Lütfen adınızı girin');
        return;
    }

    userProfile = {
        ...userProfile,
        name: name,
        school: school,
        department: department,
        grade: grade
    };

    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    loadProfileDisplay();
    alert('Profil bilgileri kaydedildi! ✨');
}

function loadProfileDisplay() {
    if (!userProfile) return;

    // Profile Page
    document.getElementById('profileName').textContent = userProfile.name || 'Öğrenci';
    document.getElementById('profileSchool').textContent =
        (userProfile.school || '') + (userProfile.department ? ' - ' + userProfile.department : '') + (userProfile.grade ? ' (' + userProfile.grade + ')' : '');

    // Form fields
    document.getElementById('editName').value = userProfile.name || '';
    document.getElementById('editSchool').value = userProfile.school || '';
    document.getElementById('editDepartment').value = userProfile.department || '';
    document.getElementById('editGrade').value = userProfile.grade || '3. Sınıf';

    // Profile Photo
    const profilePhoto = document.getElementById('profilePhoto');
    const profileInitials = document.getElementById('profileInitials');
    const headerAvatar = document.getElementById('headerAvatar');

    if (userProfile.photo) {
        profilePhoto.src = userProfile.photo;
        profilePhoto.style.display = 'block';
        profileInitials.style.display = 'none';
        headerAvatar.src = userProfile.photo;
    } else {
        profilePhoto.style.display = 'none';
        profileInitials.style.display = 'flex';
        const initials = userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '👤';
        profileInitials.textContent = initials;
        headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=ec4899&color=fff&bold=true`;
    }
}

function updateProfileStats() {
    loadProfileDisplay();
    let totalAbsence = 0;
    let criticalCount = 0;
    lessons.forEach(l => {
        if (l.hasSubLessons) {
            l.subLessons.forEach(s => {
                totalAbsence += s.currentAbsence;
                if ((s.currentAbsence / s.maxAbsenceHours) >= 0.8) criticalCount++;
            });
        } else {
            totalAbsence += l.currentAbsence;
            if ((l.currentAbsence / l.maxAbsenceHours) >= 0.8) criticalCount++;
        }
    });
    document.getElementById('p-lessons').textContent = lessons.length;
    document.getElementById('p-absence').textContent = totalAbsence + ' Saat';
    document.getElementById('p-critical').textContent = criticalCount;
    document.getElementById('p-notes').textContent = notes.length;
}

function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        if (nav.dataset.section === section) nav.classList.add('active');
    });
    document.querySelectorAll('.app-section').forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === `${section}-section`) sec.classList.add('active');
    });
    if (section === 'profil') updateProfileStats();
}

// Welcome Modal Logic
function showWelcomeModal() {
    document.getElementById('welcomeModal').classList.add('active');
}

function handleWelcomeForm(e) {
    e.preventDefault();
    const name = document.getElementById('welcomeName').value.trim();
    const school = document.getElementById('welcomeSchool').value.trim();
    const department = document.getElementById('welcomeDepartment').value.trim();
    const grade = document.getElementById('welcomeGrade').value;

    userProfile = { name, school, department, grade, photo: null };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    document.getElementById('welcomeModal').classList.remove('active');
    loadProfileDisplay();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Tarihi güncelle
    currentDateEl.textContent = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Verileri yükle
    renderLessons();
    renderNotes();
    updateDashboard();
    loadSchedule();
    renderWeeklyTasks();

    // Profile Check
    if (!userProfile || !userProfile.name) {
        showWelcomeModal();
    } else {
        loadProfileDisplay();
    }

    // Welcome Form Handler
    document.getElementById('welcomeForm').addEventListener('submit', handleWelcomeForm);
});
