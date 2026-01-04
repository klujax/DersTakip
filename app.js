// Global Constants
const dayKeys = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];
const dayNameMap = {
    'pazartesi': 'Pazartesi',
    'sali': 'Salı',
    'carsamba': 'Çarşamba',
    'persembe': 'Perşembe',
    'cuma': 'Cuma',
    'cumartesi': 'Cumartesi',
    'pazar': 'Pazar'
};

// Data Management
let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let trash = JSON.parse(localStorage.getItem('trash')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || {};
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;

// Ensure tasks object has all days
dayKeys.forEach(day => {
    if (!tasks[day]) tasks[day] = [];
});

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const appSections = document.querySelectorAll('.app-section');
const pageTitle = document.getElementById('pageTitle');
const currentDateEl = document.getElementById('currentDate');
const statTotalLessons = document.getElementById('statTotalLessons');
const statTotalAbsence = document.getElementById('statTotalAbsence');
const statTotalNotes = document.getElementById('statTotalNotes');
const quickSummary = document.getElementById('quickSummary');

// Modal Elements
const lessonModal = document.getElementById('lessonModal');
const noteModal = document.getElementById('noteModal');
const welcomeModal = document.getElementById('welcomeModal');
const subLessonsContainer = document.getElementById('subLessonsContainer');
const hasSubLessonsCheckbox = document.getElementById('hasSubLessons');

// --- Functions ---

function saveData() {
    localStorage.setItem('lessons', JSON.stringify(lessons));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('trash', JSON.stringify(trash));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Navigation Logic
function navigateTo(sectionId) {
    navItems.forEach(nav => {
        nav.classList.remove('active');
        if (nav.dataset.section === sectionId) nav.classList.add('active');
    });

    appSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        }
    });

    const activeNav = Array.from(navItems).find(nav => nav.dataset.section === sectionId);
    if (activeNav) {
        const sectionName = activeNav.querySelector('span:last-child').textContent;
        pageTitle.textContent = sectionName === 'Anasayfa' ? 'Anasayfa Özet' : sectionName;
    }

    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    if (sectionId === 'home') updateDashboard();
    if (sectionId === 'profil') updateProfileStats();
    if (sectionId === 'copkovasi') renderTrash();
    if (sectionId === 'haftalikplan') renderWeeklyTasks();
    if (sectionId === 'notlar') renderNotes();
    if (sectionId === 'devamsizlik') renderLessons();
    if (sectionId === 'dersprogrami') loadSchedule();
}

// Sidebar/Mobile Events
navItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.section));
});

document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
});

document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
});

// Modal close buttons
document.getElementById('closeLessonModal')?.addEventListener('click', () => {
    lessonModal.classList.remove('active');
});

document.getElementById('closeNoteModal')?.addEventListener('click', () => {
    noteModal.classList.remove('active');
});

document.getElementById('addLessonBtn')?.addEventListener('click', () => {
    lessonModal.classList.add('active');
});

document.getElementById('addNoteBtn')?.addEventListener('click', () => {
    noteModal.classList.add('active');
});

// --- Dashboard Logic ---

function updateDashboard() {
    statTotalLessons.textContent = lessons.length;
    statTotalNotes.textContent = notes.length;

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

    statTotalAbsence.textContent = totalAbsence;

    if (lessons.length === 0) {
        quickSummary.innerHTML = '<p class="text-muted">Görünürde henüz bir ders yok...</p>';
    } else {
        quickSummary.innerHTML = lessons.slice(0, 3).map(l => `
            <div class="summary-item">
                <span style="font-weight:700">${l.name}</span>
                <span style="font-size:0.85rem; color:var(--text-dim)">${l.hasSubLessons ? l.subLessons.length + ' Bölüm' : l.currentAbsence + ' sa. Devamsızlık'}</span>
            </div>
        `).join('');
    }

    renderHomeSchedule();
    renderTodayFocus();
}

function renderHomeSchedule() {
    const container = document.getElementById('homeScheduleView');
    if (!container) return;

    const relevantDays = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
    const hasSchedule = relevantDays.some(d => schedule[d] && schedule[d].trim());

    if (!hasSchedule) {
        container.innerHTML = `<div class="empty-state"><p>Henüz program eklenmedi</p></div>`;
        return;
    }

    container.innerHTML = `
        <div class="home-schedule-grid">
            ${relevantDays.map(d => `
                <div class="home-day-pill">
                    <h4>${dayNameMap[d]}</h4>
                    <p>${schedule[d] || '-'}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTodayFocus() {
    const container = document.getElementById('homeTodayPlan');
    if (!container) return;

    const dayNums = { 0: 'pazar', 1: 'pazartesi', 2: 'sali', 3: 'carsamba', 4: 'persembe', 5: 'cuma', 6: 'cumartesi' };
    const todayKey = dayNums[new Date().getDay()];
    const todayTasks = tasks[todayKey] || [];

    if (todayTasks.length === 0) {
        container.innerHTML = `<p class="no-plan">Bugün için görev yok.</p>`;
        return;
    }

    const completed = todayTasks.filter(t => t.completed).length;
    container.innerHTML = `
        <div class="today-focus-header">
            <span>${dayNameMap[todayKey]}</span>
            <span>${completed}/${todayTasks.length}</span>
        </div>
        <div class="today-task-list">
            ${todayTasks.map(t => `
                <div class="today-task-item ${t.completed ? 'completed' : ''}" onclick="toggleTask('${todayKey}', ${t.id})">
                    <div class="task-checkbox ${t.completed ? 'checked' : ''}">${t.completed ? '✓' : ''}</div>
                    <span class="task-text">${t.text}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// --- Lessons Logic ---

function renderLessons() {
    const container = document.getElementById('lessonsGrid');
    if (!container) return;

    if (lessons.length === 0) {
        container.innerHTML = `<div class="empty-state">Henüz ders eklenmedi.</div>`;
        return;
    }

    container.innerHTML = lessons.map(l => `
        <div class="lesson-card">
            <div class="lesson-header">
                <h3>${l.name}</h3>
                <button onclick="deleteLesson(${l.id})" class="task-delete">×</button>
            </div>
            ${l.hasSubLessons ?
            l.subLessons.map(s => `
                    <div class="attendance-item">
                        <span>${s.name}</span>
                        <div class="counter">
                            <button onclick="updateSubAbsence(${l.id}, ${s.id}, -1)">-</button>
                            <strong>${s.currentAbsence}/${s.maxAbsenceHours}</strong>
                            <button onclick="updateSubAbsence(${l.id}, ${s.id}, 1)">+</button>
                        </div>
                    </div>
                `).join('')
            :
            `<div class="attendance-item">
                    <span>Devamsızlık</span>
                    <div class="counter">
                        <button onclick="updateAbsence(${l.id}, -1)">-</button>
                        <strong>${l.currentAbsence}/${l.maxAbsenceHours}</strong>
                        <button onclick="updateAbsence(${l.id}, 1)">+</button>
                    </div>
                 </div>`
        }
        </div>
    `).join('');
}

// --- Tasks Logic ---

window.toggleTask = (day, id) => {
    const task = tasks[day].find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderWeeklyTasks();
        updateDashboard();
    }
};

window.deleteTask = (day, id) => {
    tasks[day] = tasks[day].filter(t => t.id !== id);
    saveData();
    renderWeeklyTasks();
    updateDashboard();
};

function renderWeeklyTasks() {
    const container = document.getElementById('weeklyTasksGrid');
    if (!container) return;

    container.innerHTML = dayKeys.map(day => {
        const dayTasks = tasks[day] || [];
        return `
            <div class="day-task-card">
                <div class="day-task-header">
                    <span>${dayNameMap[day]}</span>
                    <span class="task-count">${dayTasks.filter(t => t.completed).length}/${dayTasks.length}</span>
                </div>
                <div class="day-task-list">
                    ${dayTasks.map(t => `
                        <div class="task-item ${t.completed ? 'completed' : ''}">
                            <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="toggleTask('${day}', ${t.id})">
                                ${t.completed ? '✓' : ''}
                            </div>
                            <span class="task-text">${t.text}</span>
                            <button onclick="deleteTask('${day}', ${t.id})" class="task-delete">×</button>
                        </div>
                    `).join('')}
                    ${dayTasks.length === 0 ? '<p class="no-tasks">Görev yok</p>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('addTaskBtn')?.addEventListener('click', () => {
    const text = document.getElementById('newTaskText').value.trim();
    const day = document.getElementById('newTaskDay').value;
    if (!text) return;

    tasks[day].push({ id: Date.now(), text, completed: false });
    document.getElementById('newTaskText').value = '';
    saveData();
    renderWeeklyTasks();
    updateDashboard();
});

// --- Notes Logic ---

function renderNotes() {
    const container = document.getElementById('notesGrid');
    if (!container) return;

    if (notes.length === 0) {
        container.innerHTML = `<div class="empty-state">Not yok.</div>`;
        return;
    }

    container.innerHTML = notes.map(n => `
        <div class="note-card note-${n.color}">
            <div class="note-header">
                <h4>${n.title}</h4>
                <button onclick="deleteNote(${n.id})" class="task-delete">×</button>
            </div>
            <p>${n.content}</p>
            <small>${n.date}</small>
        </div>
    `).join('');
}

// --- Profile & Photo ---

function handleProfilePhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!userProfile) userProfile = {};
            userProfile.photo = e.target.result;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            loadProfileDisplay();
        };
        reader.readAsDataURL(file);
    }
}

function loadProfileDisplay() {
    if (!userProfile) return;

    document.getElementById('profileName').textContent = userProfile.name || 'Öğrenci';
    const info = (userProfile.school || '') +
        (userProfile.department ? ' - ' + userProfile.department : '') +
        (userProfile.grade ? ' (' + userProfile.grade + ')' : '');
    document.getElementById('profileSchool').textContent = info || 'Okul Bilgisi Yok';

    if (document.getElementById('editName')) {
        document.getElementById('editName').value = userProfile.name || '';
        document.getElementById('editSchool').value = userProfile.school || '';
        document.getElementById('editDepartment').value = userProfile.department || '';
        document.getElementById('editGrade').value = userProfile.grade || 'Hazırlık';
    }

    const photo = document.getElementById('profilePhoto');
    const initials = document.getElementById('profileInitials');
    const headerAvatar = document.getElementById('headerAvatar');

    if (userProfile.photo) {
        photo.src = userProfile.photo;
        photo.style.display = 'block';
        initials.style.display = 'none';
        headerAvatar.src = userProfile.photo;
    } else {
        photo.style.display = 'none';
        initials.style.display = 'flex';
        const name = userProfile.name || 'User';
        const initialText = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        initials.textContent = initialText;
        headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ec4899&color=fff&bold=true`;
    }
}

function updateProfileStats() {
    loadProfileDisplay();
    document.getElementById('p-lessons').textContent = lessons.length;
    document.getElementById('p-notes').textContent = notes.length;

    let totalAbsence = 0;
    let critical = 0;
    lessons.forEach(l => {
        if (l.hasSubLessons) {
            l.subLessons.forEach(s => {
                totalAbsence += s.currentAbsence;
                if ((s.currentAbsence / s.maxAbsenceHours) >= 0.8) critical++;
            });
        } else {
            totalAbsence += l.currentAbsence;
            if ((l.currentAbsence / l.maxAbsenceHours) >= 0.8) critical++;
        }
    });
    document.getElementById('p-absence').textContent = totalAbsence + ' Saat';
    document.getElementById('p-critical').textContent = critical;
}

window.saveProfile = () => {
    const name = document.getElementById('editName').value;
    const school = document.getElementById('editSchool').value;
    const department = document.getElementById('editDepartment').value;
    const grade = document.getElementById('editGrade').value;

    userProfile = { ...userProfile, name, school, department, grade };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    loadProfileDisplay();
    alert('Profil kaydedildi!');
};

// --- Schedule ---

function loadSchedule() {
    document.querySelectorAll('.day-input').forEach(input => {
        input.value = schedule[input.dataset.day] || '';
        autoResizeTextarea(input);
    });
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 40) + 'px';
}

document.getElementById('saveScheduleBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.day-input').forEach(input => {
        schedule[input.dataset.day] = input.value;
    });
    saveData();
    updateDashboard();
    alert('Program kaydedildi!');
});

// Auto-resize textareas
document.querySelectorAll('.day-input').forEach(textarea => {
    textarea.addEventListener('input', function () {
        autoResizeTextarea(this);
    });
});

// --- Trash Logic ---

function renderTrash() {
    const container = document.getElementById('trashGrid');
    if (!container) return;

    if (trash.length === 0) {
        container.innerHTML = `<div class="empty-state">Çöp kutusu boş.</div>`;
        return;
    }

    container.innerHTML = trash.map((t, i) => `
        <div class="lesson-card">
            <h4>${t.type === 'lesson' ? t.data.name : t.data.title}</h4>
            <div style="display:flex; gap:10px; margin-top:15px">
                <button onclick="restoreItem(${i})" class="secondary-btn">Kurtar</button>
                <button onclick="permanentDelete(${i})" class="secondary-btn">Sil</button>
            </div>
        </div>
    `).join('');
}

window.restoreItem = (index) => {
    const item = trash[index];
    if (item.type === 'lesson') lessons.push(item.data);
    else notes.push(item.data);
    trash.splice(index, 1);
    saveData();
    renderTrash();
    renderLessons();
    renderNotes();
    updateDashboard();
};

window.permanentDelete = (index) => {
    trash.splice(index, 1);
    saveData();
    renderTrash();
};

window.deleteLesson = (id) => {
    const lesson = lessons.find(l => l.id === id);
    if (lesson) {
        trash.push({ type: 'lesson', data: lesson });
        lessons = lessons.filter(l => l.id !== id);
        saveData();
        renderLessons();
        updateDashboard();
    }
};

window.deleteNote = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) {
        trash.push({ type: 'note', data: note });
        notes = notes.filter(n => n.id !== id);
        saveData();
        renderNotes();
        updateDashboard();
    }
};

window.updateAbsence = (id, delta) => {
    const l = lessons.find(lx => lx.id === id);
    if (l) {
        l.currentAbsence = Math.max(0, Math.min(l.maxAbsenceHours, l.currentAbsence + delta));
        saveData();
        renderLessons();
        updateDashboard();
    }
};

window.updateSubAbsence = (lId, sId, delta) => {
    const l = lessons.find(lx => lx.id === lId);
    if (l) {
        const s = l.subLessons.find(sx => sx.id === sId);
        if (s) {
            s.currentAbsence = Math.max(0, Math.min(s.maxAbsenceHours, s.currentAbsence + delta));
            saveData();
            renderLessons();
            updateDashboard();
        }
    }
};

document.getElementById('emptyTrashBtn')?.addEventListener('click', () => {
    if (trash.length === 0) return;
    if (confirm('Çöp kovasını tamamen boşaltmak istediğinize emin misiniz?')) {
        trash = [];
        saveData();
        renderTrash();
    }
});

// --- Modals Form Handlers ---

document.getElementById('lessonForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('lessonName').value;
    const hasSub = hasSubLessonsCheckbox.checked;

    let newLesson;
    if (hasSub) {
        const subs = Array.from(subLessonsContainer.querySelectorAll('.sub-lesson-row')).map(row => ({
            id: Date.now() + Math.random(),
            name: row.querySelector('.sub-name').value,
            maxAbsenceHours: parseInt(row.querySelector('.sub-hours').value),
            currentAbsence: 0
        }));
        newLesson = { id: Date.now(), name, hasSubLessons: true, subLessons: subs };
    } else {
        const totalHours = parseInt(document.getElementById('totalHours').value);
        const absenceRate = parseInt(document.getElementById('absenceRate').value);
        const maxHours = Math.floor((totalHours * absenceRate) / 100);
        newLesson = {
            id: Date.now(),
            name,
            hasSubLessons: false,
            maxAbsenceHours: maxHours,
            currentAbsence: 0
        };
    }

    lessons.push(newLesson);
    saveData();
    lessonModal.classList.remove('active');
    document.getElementById('lessonForm').reset();
    renderLessons();
    updateDashboard();
});

document.getElementById('noteForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const color = document.querySelector('input[name="noteColor"]:checked').value;

    notes.push({
        id: Date.now(),
        title, content, color,
        date: new Date().toLocaleDateString('tr-TR')
    });

    saveData();
    noteModal.classList.remove('active');
    document.getElementById('noteForm').reset();
    renderNotes();
    updateDashboard();
});

// Welcome Setup
document.getElementById('welcomeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('welcomeName').value;
    const school = document.getElementById('welcomeSchool').value;
    const department = document.getElementById('welcomeDepartment').value;
    const grade = document.getElementById('welcomeGrade').value;

    userProfile = { name, school, department, grade, photo: null };
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    welcomeModal.classList.remove('active');
    loadProfileDisplay();
});

// Add Sub Lesson Row
document.getElementById('addSubLessonBtn')?.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'sub-lesson-row';
    div.innerHTML = `
        <input type="text" class="sub-name" placeholder="Teorik/Uygulama" required>
        <input type="number" class="sub-hours" placeholder="Saat" required>
        <button type="button" onclick="this.parentElement.remove()">×</button>
    `;
    subLessonsContainer.appendChild(div);
});

hasSubLessonsCheckbox?.addEventListener('change', (e) => {
    document.getElementById('singleLessonFields').style.display = e.target.checked ? 'none' : 'block';
    document.getElementById('subLessonsFields').style.display = e.target.checked ? 'block' : 'none';
});

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    currentDateEl.textContent = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (!userProfile) welcomeModal.classList.add('active');
    else loadProfileDisplay();

    updateDashboard();
    renderLessons();
    renderNotes();
});
