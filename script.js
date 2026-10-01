// جلب عناصر واجهة المستخدم
const arrowEl = document.getElementById('arrow-icon');
const circleBg = document.querySelector('.circle-bg');
const scoreEl = document.getElementById('score-val');
const timeEl = document.getElementById('time-val');
const mistakesEl = document.getElementById('mistakes-val');
const playerNameInput = document.getElementById('player-name');
const playerDisplay = document.getElementById('player-display');
const summaryPlayerName = document.getElementById('summary-player-name');
const nameError = document.getElementById('name-error');
const finalScoreEl = document.getElementById('final-score');
const finalMistakesEl = document.getElementById('final-mistakes');
const touchZone = document.getElementById('touch-zone');
const newRecordMsg = document.getElementById('new-record-msg');
const gameLevelTag = document.getElementById('game-level-tag');

// الشاشات والأزرار
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const quitToMenuBtn = document.getElementById('quit-to-menu-btn');
const changeSettingsBtn = document.getElementById('change-settings-btn');
const lvlButtons = document.querySelectorAll('.lvl-btn');

// القائمة الجانبية والأزرار
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const menuSidebarBtn = document.getElementById('menu-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const resetDataBtn = document.getElementById('reset-data-btn');

// عناصر نصوص القائمة
const sidePlayerName = document.getElementById('side-player-name');
const sideCurrentLevel = document.getElementById('side-current-level');
const statEasyAttempts = document.getElementById('stat-easy-attempts');
const statEasyBest = document.getElementById('stat-easy-best');
const statMedAttempts = document.getElementById('stat-med-attempts');
const statMedBest = document.getElementById('stat-med-best');
const statHardAttempts = document.getElementById('stat-hard-attempts');
const statHardBest = document.getElementById('stat-hard-best');

// بيانات الإحصائيات المحفوظة
let stats = {
    easy: { attempts: 0, bestScore: 0 },
    medium: { attempts: 0, bestScore: 0 },
    hard: { attempts: 0, bestScore: 0 }
};

function loadStats() {
    const saved = localStorage.getItem('arrowGameStats');
    if (saved) {
        try {
            stats = JSON.parse(saved);
        } catch(e) {}
    }
    const savedName = localStorage.getItem('arrowGamePlayerName');
    if (savedName) {
        playerNameInput.value = savedName;
        playerName = savedName;
        playerDisplay.innerText = savedName;
        sidePlayerName.innerText = savedName;
    }
    renderStats();
}

function saveStats() {
    localStorage.setItem('arrowGameStats', JSON.stringify(stats));
    if (playerName) {
        localStorage.setItem('arrowGamePlayerName', playerName);
    }
}

function renderStats() {
    statEasyAttempts.innerText = stats.easy.attempts;
    statEasyBest.innerText = stats.easy.bestScore;
    statMedAttempts.innerText = stats.medium.attempts;
    statMedBest.innerText = stats.medium.bestScore;
    statHardAttempts.innerText = stats.hard.attempts;
    statHardBest.innerText = stats.hard.bestScore;
}

// متغيرات الدور الحالي
let score = 0;
let mistakes = 0;
let timeLeft = 40;
let initialTime = 40;
let currentLevel = 'easy';
let timerInterval = null;
let currentDir = '';
let currentColor = '';
let isGameActive = false;
let isPaused = false;
let playerName = 'لاعب';

const levelNamesArabic = {
    easy: 'مبتدئ',
    medium: 'متوسط',
    hard: 'متقدم'
};

const directions = ['up', 'right', 'down', 'left'];
const colors = ['white', 'lime'];

// اختيار المستوى
lvlButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        lvlButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = btn.dataset.level;
        initialTime = parseInt(btn.dataset.time);
        gameLevelTag.innerText = `المستوى: ${levelNamesArabic[currentLevel]}`;
        sideCurrentLevel.innerText = `المستوى: ${levelNamesArabic[currentLevel]}`;
    });
});

// فتح وإغلاق القائمة الجانبية
function toggleSidebar(open) {
    if (open) {
        if (isGameActive && !isPaused) pauseGame();
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    } else {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }
}

openSidebarBtn.addEventListener('click', () => toggleSidebar(true));
menuSidebarBtn.addEventListener('click', () => toggleSidebar(true));
closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));
sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

resetDataBtn.addEventListener('click', () => {
    if (confirm('هل ترغب حقاً بإعادة ضبط كل الإحصائيات والأرقام القياسية؟')) {
        stats = {
            easy: { attempts: 0, bestScore: 0 },
            medium: { attempts: 0, bestScore: 0 },
            hard: { attempts: 0, bestScore: 0 }
        };
        saveStats();
        renderStats();
    }
});

// بدء اللعبة
startBtn.addEventListener('click', () => {
    const entered = playerNameInput.value.trim();
    if (!entered) {
        nameError.style.display = 'block';
        playerNameInput.focus();
        return;
    }
    nameError.style.display = 'none';
    playerName = entered;
    playerDisplay.innerText = playerName;
    summaryPlayerName.innerText = playerName;
    sidePlayerName.innerText = playerName;
    saveStats();
    startGame();
});

restartBtn.addEventListener('click', startGame);

changeSettingsBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

// الإيقاف المؤقت والمتابعة
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);

quitToMenuBtn.addEventListener('click', () => {
    pauseScreen.style.display = 'none';
    pauseBtn.style.display = 'none';
    isGameActive = false;
    isPaused = false;
    clearInterval(timerInterval);
    arrowEl.className = 'arrow';
    startScreen.style.display = 'flex';
});

function pauseGame() {
    if (!isGameActive || isPaused) return;
    isPaused = true;
    clearInterval(timerInterval);
    pauseScreen.style.display = 'flex';
}

function resumeGame() {
    if (!isGameActive || !isPaused) return;
    isPaused = false;
    pauseScreen.style.display = 'none';
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function startGame() {
    score = 0;
    mistakes = 0;
    timeLeft = initialTime;
    isPaused = false;

    scoreEl.innerText = score;
    mistakesEl.innerText = mistakes;
    timeEl.innerText = timeLeft;
    newRecordMsg.style.display = 'none';
    pauseBtn.style.display = 'inline-flex';

    stats[currentLevel].attempts++;
    saveStats();
    renderStats();

    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    isGameActive = true;

    startTimer();
    nextTurn();
}

function endGame() {
    isGameActive = false;
    isPaused = false;
    clearInterval(timerInterval);
    pauseBtn.style.display = 'none';
    arrowEl.className = 'arrow';

    finalScoreEl.innerText = score;
    finalMistakesEl.innerText = mistakes;

    if (score > stats[currentLevel].bestScore) {
        stats[currentLevel].bestScore = score;
        newRecordMsg.style.display = 'block';
        saveStats();
        renderStats();
    }

    gameOverScreen.style.display = 'flex';
}

function nextTurn() {
    arrowEl.classList.remove('show');

    const delay = currentLevel === 'hard' ? 70 : (currentLevel === 'medium' ? 90 : 120);

    setTimeout(() => {
        if (!isGameActive || isPaused) return;

        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        currentDir = randomDir;
        currentColor = randomColor;

        arrowEl.className = `arrow show ${randomColor} ${randomDir}`;
    }, delay);
}

function evaluateDirection(playerDirection) {
    if (!isGameActive || isPaused) return;

    let targetDirection = currentDir;
    if (currentColor === 'lime') {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        targetDirection = opposites[currentDir];
    }

    if (playerDirection === targetDirection) {
        score++;
        scoreEl.innerText = score;
        nextTurn();
    } else {
        mistakes++;
        mistakesEl.innerText = mistakes;
        circleBg.classList.add('shake');
        setTimeout(() => {
            circleBg.classList.remove('shake');
            nextTurn();
        }, 300);
    }
}

/* التحكم بلوحة المفاتيح */
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyP') {
        if (isGameActive) {
            e.preventDefault();
            isPaused ? resumeGame() : pauseGame();
            return;
        }
    }

    if (!isGameActive || isPaused) {
        if (e.key === 'Enter' && startScreen.style.display !== 'none') {
            startBtn.click();
        }
        return;
    }

    const keyMap = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right'
    };

    if (keyMap[e.code]) {
        e.preventDefault();
        evaluateDirection(keyMap[e.code]);
    }
});

/* التحكم بالسحب */
let startX = 0, startY = 0, isPointerDown = false;

touchZone.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].clientX; startY = e.changedTouches[0].clientY; }, { passive: true });
touchZone.addEventListener('touchend', (e) => { calculateSwipe(startX, startY, e.changedTouches[0].clientX, e.changedTouches[0].clientY); }, { passive: true });
touchZone.addEventListener('mousedown', (e) => { isPointerDown = true; startX = e.clientX; startY = e.clientY; });
touchZone.addEventListener('mouseup', (e) => { if (!isPointerDown) return; isPointerDown = false; calculateSwipe(startX, startY, e.clientX, e.clientY); });
touchZone.addEventListener('mouseleave', () => { isPointerDown = false; });

function calculateSwipe(x1, y1, x2, y2) {
    if (!isGameActive || isPaused) return;
    const diffX = x2 - x1, diffY = y2 - y1;
    if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 30) return;
    evaluateDirection(Math.abs(diffX) > Math.abs(diffY) ? (diffX > 0 ? 'right' : 'left') : (diffY > 0 ? 'down' : 'up'));
}

loadStats();