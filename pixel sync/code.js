const STATE = {
    score: 0,
    time: 0,
    active: false,
    currentTarget: "",
    baseDecayRate: 0.35,
    difficultyMultiplier: 1,
    streak: 0 // BONUS: Hot Streak Tracker
};

// Machine Data Setup mapped to the HTML IDs
const machines = {
    stack: { id: 'stack', health: 100, el: document.getElementById('machine-stack'), bar: document.getElementById('health-stack'), vis: document.getElementById('vis-stack'), items: 3 },
    queue: { id: 'queue', health: 100, el: document.getElementById('machine-queue'), bar: document.getElementById('health-queue'), vis: document.getElementById('vis-queue'), items: 4 },
    tree:  { id: 'tree', health: 100, el: document.getElementById('machine-tree'), bar: document.getElementById('health-tree'), vis: document.getElementById('vis-tree'), items: 5 },
    graph: { id: 'graph', health: 100, el: document.getElementById('machine-graph'), bar: document.getElementById('health-graph'), vis: document.getElementById('vis-graph'), items: 7 }
};

const commandsList = [
    { text: "PUSH_DATA(0xFF)", target: "stack" },
    { text: "POP_STACK()", target: "stack" },
    { text: "ENQUEUE_PROC()", target: "queue" },
    { text: "DEQUEUE_PROC()", target: "queue" },
    { text: "INSERT_BST_NODE()", target: "tree" },
    { text: "PRUNE_LEAF()", target: "tree" },
    { text: "ADD_EDGE(V1, V2)", target: "graph" },
    { text: "TRAVERSE_BFS()", target: "graph" }
];

let gameInterval, timerInterval, typeTimeout;

// --- INITIALIZATION ---
function bootSystem() {
    STATE.score = 0;
    STATE.time = 0;
    STATE.difficultyMultiplier = 1;
    STATE.streak = 0;
    STATE.active = true;
    
    updateScore(0);
    document.body.classList.remove('hot-streak-active');
    document.getElementById('game-over-screen').style.display = 'none';

    Object.values(machines).forEach(m => {
        m.health = 100;
        updateHealthUI(m);
        renderInitialVisuals(m);
    });

    issueCommand();

    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    gameInterval = setInterval(systemTick, 100); 
    timerInterval = setInterval(updateUptime, 1000); 
}

// --- MAIN LOOP ---
function systemTick() {
    if (!STATE.active) return;

    let currentDecay = STATE.baseDecayRate * STATE.difficultyMultiplier;

    Object.values(machines).forEach(m => {
        m.health -= currentDecay;
        updateHealthUI(m);

        if (m.health <= 0) {
            triggerCrash();
        }
    });

    // BONUS: Speed Up (Difficulty)
    // Every 10 seconds, the drain rate increases aggressively!
    if (STATE.time > 0 && STATE.time % 100 === 0) { 
        STATE.difficultyMultiplier += 0.25; 
    }
}

// --- UI UPDATES ---
function updateUptime() {
    if(!STATE.active) return;
    STATE.time += 10;
    let totalSecs = Math.floor(STATE.time / 10);
    let m = Math.floor(totalSecs / 60);
    let s = totalSecs % 60;
    document.getElementById('timer').innerText = ${m}:${s.toString().padStart(2, '0')};
}

function updateScore(points) {
    STATE.score += points;
    document.getElementById('score').innerText = Math.max(0, STATE.score).toString().padStart(4, '0');
}

function updateHealthUI(m) {
    m.bar.style.width = ${Math.max(0, m.health)}%;
    
    if (m.health < 25) {
        m.bar.style.backgroundColor = 'var(--color-danger)';
        m.bar.style.boxShadow = '0 0 8px var(--color-danger)';
    } else if (m.health < 50) {
        m.bar.style.backgroundColor = 'var(--color-warning)';
        m.bar.style.boxShadow = '0 0 8px var(--color-warning)';
    } else {
        m.bar.style.backgroundColor = 'var(--color-success)';
        m.bar.style.boxShadow = '0 0 8px var(--color-success)';
    }
}

// --- COMMAND SYSTEM ---
function issueCommand() {
    const cmd = commandsList[Math.floor(Math.random() * commandsList.length)];
    STATE.currentTarget = cmd.target;
    
    const displayElement = document.getElementById('command-text');
    displayElement.innerText = "";
    clearTimeout(typeTimeout);
    
    let i = 0;
    function type() {
        if (i < cmd.text.length) {
            displayElement.innerText += cmd.text.charAt(i);
            i++;
            // Type faster if the game is speeding up!
            let typingSpeed = Math.max(5, 15 - (STATE.difficultyMultiplier * 2));
            typeTimeout = setTimeout(type, typingSpeed);
        }
    }
    type();
}

// --- INTERACTION LOGIC ---
function handleInput(targetId) {
    if (!STATE.active) return;

    const m = machines[targetId];
    
    if (targetId === STATE.currentTarget) {
        // RIGHT MOVE
        STATE.streak++;
        let pointsEarned = 10;

        // BONUS: Hot Streak Check
        if (STATE.streak >= 5) {
            pointsEarned = 20; // Double points
            document.body.classList.add('hot-streak-active'); // Screen Glow
        }

        updateScore(pointsEarned);
        m.health = Math.min(100, m.health + 12); 
        
        m.el.classList.add('state-success');
        document.body.classList.add('flash-green'); 
        
        setTimeout(() => {
            m.el.classList.remove('state-success');
            document.body.classList.remove('flash-green');
        }, 200);
        
        animateDataStructure(m);
        issueCommand();
    } else {
        // WRONG MOVE
        STATE.streak = 0; // Reset streak
        document.body.classList.remove('hot-streak-active');

        updateScore(-5);
        m.health -= 15; 
        
        m.el.classList.add('state-damage');
        document.body.classList.add('flash-red', 'shake-screen');
        
        setTimeout(() => {
            m.el.classList.remove('state-damage');
            document.body.classList.remove('flash-red', 'shake-screen');
        }, 300);
    }
    updateHealthUI(m);
}

// --- VISUAL MOVEMENT ENGINE ---
function renderInitialVisuals(m) {
    m.vis.innerHTML = ''; 
    for(let i=0; i < m.items; i++) generateVisualElement(m, false);
}

function animateDataStructure(m) {
    if (m.vis.children.length > 2) {
        if(m.id === 'stack') m.vis.lastElementChild.remove();
        else m.vis.firstElementChild.remove();
    }
    generateVisualElement(m, true);
}

function generateVisualElement(m, animate) {
    const el = document.createElement('div');
    
    if (m.id === 'stack' || m.id === 'queue') {
        el.className = 'data-block';
        el.innerText = '0x' + Math.floor(Math.random()*90 + 10);
        if(animate) el.classList.add(m.id === 'stack' ? 'anim-stack' : 'anim-queue');
        m.vis.appendChild(el);
    } else {
        el.className = 'data-node';
        el.style.left = ${20 + Math.random() * 60}%;
        el.style.top = ${20 + Math.random() * 60}%;
        if(animate) el.classList.add('anim-node');
        m.vis.appendChild(el);
    }
}

// --- END GAME ---
function triggerCrash() {
    STATE.active = false;
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    
    document.getElementById('final-score').innerText = document.getElementById('score').innerText;
    document.getElementById('final-time').innerText = document.getElementById('timer').innerText;
    document.getElementById('game-over-screen').style.display = 'flex';
}

// --- EVENT LISTENERS ---
document.querySelectorAll('.machine').forEach(el => {
    el.addEventListener('pointerdown', function(e) {
        e.preventDefault(); 
        handleInput(this.getAttribute('data-target'));
    });
});

document.getElementById('skip-btn').addEventListener('pointerdown', () => {
    if(!STATE.active) return;
    STATE.streak = 0; // Skipping breaks the streak
    document.body.classList.remove('hot-streak-active');
    updateScore(-5);
    issueCommand();
});

document.getElementById('hint-btn').addEventListener('pointerdown', () => {
    if(!STATE.active) return;
    // Hints cost points, but we'll be nice and not break the streak
    updateScore(-2);
    const targetEl = machines[STATE.currentTarget].el;
    targetEl.classList.add('state-hint');
    setTimeout(() => targetEl.classList.remove('state-hint'), 400);
});

document.getElementById('restart-btn').addEventListener('pointerdown', bootSystem);

// START SYSTEM
window.onload = bootSystem;