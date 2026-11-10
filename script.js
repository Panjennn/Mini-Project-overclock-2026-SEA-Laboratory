// Jalankan semua fitur pas halaman udah siap
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initTodo();
    initFaq();
    initForm();
    initBubbles();
    initGame();
    initSticker();
    initTrail();
    initReveal();
    initProgress();
    initTyper();
    initEvents();
    initTilt();
    initFaqSearch();
    initFocus();
    initPalette();
    initKonami();
});

// Kumpulan ekspresi maskot
const STICKERS = {
    idle: 'assets/sticker.png',
    happy: 'assets/sticker-happy.png',
    think: 'assets/sticker-think.png',
    wow: 'assets/sticker-wow.png'
};

// Buat ngobrol lewat maskot
function hubSay(text, mood) {
    document.dispatchEvent(new CustomEvent('hub:say', { detail: { text: text, mood: mood || 'idle' } }));
}

function setContactMood(mood) {
    const el = document.getElementById('contact-sticker');
    if (el) el.src = STICKERS[mood] || STICKERS.happy;
}

// Menu navigasi HP dan sorot menu aktif
function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');

    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    }));

    const anchors = [...links.querySelectorAll('a')];
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));
}

// Fitur daftar tugas
function initTodo() {
    const KEY = 'campusHubTodos';
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const count = document.getElementById('todo-count');
    const error = document.getElementById('todo-error');

    let todos = load();
    let filter = 'all';

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(todos)); } catch (e) {}
    }

    function render() {
        list.innerHTML = '';
        const visible = todos.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
        if (visible.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'todo-empty';
            const emptyMsg = todos.length ? 'Tidak ada tugas pada filter ini.' : 'Belum ada tugas. Tulis tugas pertamamu di kolom di atas.';
            empty.innerHTML = '<img alt="" src="' + (todos.length ? STICKERS.think : STICKERS.happy) + '"><span></span>';
            empty.querySelector('span').textContent = emptyMsg;
            list.appendChild(empty);
        }
        visible.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.done ? ' done' : '');

            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = todo.done;
            check.setAttribute('aria-label', 'Tandai selesai: ' + todo.text);
            check.addEventListener('change', () => {
                todo.done = check.checked;
                save(); render();
                if (todos.length && todos.every(t => t.done)) {
                    hubSay('Semua tugas selesai. Keren banget!', 'happy');
                    launchConfetti();
                }
            });

            const text = document.createElement('span');
            text.textContent = todo.text;

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'todo-delete';
            del.textContent = 'Hapus';
            del.setAttribute('aria-label', 'Hapus tugas: ' + todo.text);
            del.addEventListener('click', () => {
                todos = todos.filter(t => t.id !== todo.id);
                save(); render();
            });

            li.append(check, text, del);
            list.appendChild(li);
        });

        const remaining = todos.filter(t => !t.done).length;
        count.textContent = todos.length
            ? `${remaining} dari ${todos.length} tugas belum selesai`
            : '';
        document.getElementById('todo-bar').style.width =
            todos.length ? Math.round((todos.length - remaining) / todos.length * 100) + '%' : '0%';
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) {
            error.textContent = 'Tugas tidak boleh kosong. Tulis dulu apa yang perlu dikerjakan.';
            hubSay('Hmm, tulis dulu tugasnya ya.', 'think');
            input.focus();
            return;
        }
        error.textContent = '';
        todos.push({ id: Date.now(), text: value, done: false });
        input.value = '';
        save(); render();
        hubSay('Tugas dicatat. Semangat ya!', 'happy');
    });
    input.addEventListener('input', () => { error.textContent = ''; });

    const filterBtns = document.querySelectorAll('.todo-filter');
    filterBtns.forEach(b => b.addEventListener('click', () => {
        filter = b.dataset.filter;
        filterBtns.forEach(x => x.setAttribute('aria-pressed', x === b));
        render();
    }));
    document.getElementById('todo-clear').addEventListener('click', () => {
        const n = todos.filter(t => t.done).length;
        if (!n) { toast('Belum ada tugas yang selesai.'); return; }
        todos = todos.filter(t => !t.done);
        save(); render();
        toast(n + ' tugas selesai dihapus.');
    });

    render();
}

// Buka tutup FAQ
function initFaq() {
    const items = document.querySelectorAll('.faq-item');

    function setOpen(item, open) {
        const header = item.querySelector('.faq-header');
        const content = item.querySelector('.faq-content');
        header.setAttribute('aria-expanded', open);
        content.style.maxHeight = open ? content.scrollHeight + 'px' : '0';
    }

    items.forEach(item => {
        item.querySelector('.faq-header').addEventListener('click', () => {
            const isOpen = item.querySelector('.faq-header').getAttribute('aria-expanded') === 'true';
            items.forEach(other => setOpen(other, false));
            if (!isOpen) setOpen(item, true);
        });
    });
}

// Form kontak dan cek isian
function initForm() {
    const form = document.getElementById('feedback-form');
    const success = document.getElementById('form-success');

    const rules = {
        name: v => {
            if (!v) return 'Nama lengkap wajib diisi.';
            if (v.length < 3) return 'Nama minimal 3 karakter.';
            if (!/^[\p{L}\s.'-]+$/u.test(v)) return 'Nama hanya boleh berisi huruf dan spasi.';
            return '';
        },
        category: v => (v ? '' : 'Pilih salah satu kategori.'),
        message: v => {
            if (!v) return 'Pesan wajib diisi.';
            if (v.length < 10) return 'Pesan minimal 10 karakter agar kami paham maksudmu.';
            return '';
        }
    };

    function validateField(name) {
        const field = form.elements[name];
        const msg = rules[name](field.value.trim());
        document.getElementById(name + '-error').textContent = msg;
        field.closest('.form-group').classList.toggle('invalid', Boolean(msg));
        field.setAttribute('aria-invalid', Boolean(msg));
        return !msg;
    }

    Object.keys(rules).forEach(name => {
        form.elements[name].addEventListener('blur', () => validateField(name));
        form.elements[name].addEventListener('input', () => {
            success.textContent = '';
            if (form.elements[name].closest('.form-group').classList.contains('invalid')) validateField(name);
        });
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const results = Object.keys(rules).map(validateField);
        if (results.includes(false)) {
            setContactMood('think');
            hubSay('Ada kolom yang belum benar. Cek pesan merah ya.', 'think');
            const firstInvalid = form.querySelector('.invalid input, .invalid select, .invalid textarea');
            if (firstInvalid) firstInvalid.focus();
            success.textContent = '';
            return;
        }
        const name = form.elements.name.value.trim();
        form.reset();
        success.textContent = `Terima kasih, ${name}! Pesanmu sudah terkirim.`;
        setContactMood('happy');
        hubSay('Pesanmu terkirim. Terima kasih!', 'happy');
    });
}

// Efek gelembung melayang
function initBubbles() {
    const hero = document.querySelector('.hero-section');
    const wrap = document.getElementById('hero-bubbles');
    if (!hero || !wrap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const setRise = () => wrap.style.setProperty('--rise', (hero.offsetHeight + 100) + 'px');
    setRise();
    window.addEventListener('resize', setRise);

    const count = window.innerWidth < 700 ? 10 : 18;
    for (let i = 0; i < count; i++) {
        const b = document.createElement('span');
        const size = 12 + Math.random() * 52;
        b.className = 'bubble';
        b.style.width = b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + '%';
        b.style.setProperty('--sway', (Math.random() * 80 - 40) + 'px');
        b.style.animationDuration = (9 + Math.random() * 11) + 's';
        b.style.animationDelay = '-' + (Math.random() * 20) + 's';
        wrap.appendChild(b);
    }
}

// Data buah buat mini game
const FRUITS = ['🍎', '🍌', '🍇', '🍉', '🍊', '🍓', '🍍', '🥝', '🍒', '🍑'];
const FRUIT_NAMES = { '🍎': 'apel', '🍌': 'pisang', '🍇': 'anggur', '🍉': 'semangka', '🍊': 'jeruk', '🍓': 'stroberi', '🍍': 'nanas', '🥝': 'kiwi', '🍒': 'ceri', '🍑': 'persik' };

const GAMES = {
    bubble: { label: 'Bubble Pop', duration: 30, run: runBubble,
        hint: 'Klik atau tap gelembung untuk memecahkannya. Gelembung kecil bernilai lebih besar. Gelembung tengkorak = minus 3 poin.' },
    slice: { label: 'Fruit Slice', duration: 30, run: runSlice,
        hint: 'Tekan lalu geser untuk membelah buah yang melompat. Setiap buah 2 poin. Jangan kena bom (minus 5).' },
    match: { label: 'Fruit Match', duration: 45, run: runMatch,
        hint: 'Buka dua kartu untuk mencari pasangan buah yang sama. Tiap pasangan 10 poin, sisa waktu jadi bonus.' }
};

// Game 1: Pecahin gelembung
function runBubble(ctx) {
    const arena = ctx.arena;
    let timer;
    function spawn() {
        const elapsed = ctx.elapsed();
        const bad = Math.random() < 0.2;
        const size = bad ? 58 : 36 + Math.floor(Math.random() * 44);
        const pts = bad ? -3 : size < 50 ? 3 : size < 65 ? 2 : 1;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'g-bubble' + (bad ? ' bug' : '');
        el.textContent = bad ? '💀' : '';
        el.setAttribute('aria-label', bad ? 'Tengkorak, jangan diklik' : 'Gelembung ' + pts + ' poin');
        el.style.width = el.style.height = size + 'px';
        el.style.left = Math.random() * Math.max(1, arena.clientWidth - size) + 'px';
        el.style.setProperty('--rise', (arena.clientHeight + size + 20) + 'px');
        el.style.setProperty('--sway', (Math.random() * 70 - 35) + 'px');
        el.style.animationDuration = Math.max(2.2, 5.2 - elapsed * 0.06 - Math.random()) + 's';
        el.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (el.classList.contains('popped')) return;
            const a = arena.getBoundingClientRect(), r = el.getBoundingClientRect();
            el.style.transform = getComputedStyle(el).transform;
            el.style.animation = 'none';
            el.classList.add('popped');
            ctx.points(r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, pts);
            if (bad) ctx.penalty('Awas, itu tengkorak!');
            setTimeout(() => el.remove(), 220);
        });
        el.addEventListener('animationend', () => el.remove());
        arena.appendChild(el);
        timer = setTimeout(spawn, Math.max(380, 800 - elapsed * 14));
    }
    spawn();
    return () => clearTimeout(timer);
}

// Game 2: Tebas buah
function runSlice(ctx) {
    const arena = ctx.arena;
    const SIZE = 46, G = 760;
    const items = [];
    let last = performance.now(), raf, spawnTimer, pressed = false, prev = null;

    function launch() {
        const W = arena.clientWidth, H = arena.clientHeight;
        const bomb = Math.random() < 0.18;
        const el = document.createElement('span');
        el.className = 'fruit';
        el.textContent = bomb ? '💣' : FRUITS[Math.floor(Math.random() * FRUITS.length)];
        const x = SIZE + Math.random() * Math.max(1, W - SIZE * 3);
        const rise = H * (0.7 + Math.random() * 0.22);
        items.push({
            el, x, y: H, bomb, dead: false, rot: 0,
            vy: -Math.sqrt(2 * G * rise),
            vx: ((W / 2 - x) / W) * 160 + (Math.random() * 80 - 40),
            vr: (Math.random() * 2 - 1) * 240
        });
        arena.appendChild(el);
    }
    function loopSpawn() {
        launch();
        if (Math.random() < 0.3) launch();
        spawnTimer = setTimeout(loopSpawn, Math.max(450, 950 - ctx.elapsed() * 15));
    }
    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const H = arena.clientHeight;
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
            it.el.style.transform = 'translate(' + it.x + 'px,' + it.y + 'px) rotate(' + it.rot + 'deg)';
            if (it.y > H + 10 && it.vy > 0) { it.el.remove(); items.splice(i, 1); }
        }
        raf = requestAnimationFrame(frame);
    }
    function distSeg(px, py, a, b) {
        const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
        let t = l2 ? ((px - a.x) * dx + (py - a.y) * dy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
    }
    function cut(a, b) {
        for (const it of items) {
            if (it.dead) continue;
            const cx = it.x + SIZE / 2, cy = it.y + SIZE / 2;
            if (distSeg(cx, cy, a, b) <= SIZE / 2 + 6) {
                it.dead = true;
                it.el.classList.add('sliced');
                ctx.points(cx, cy, it.bomb ? -5 : 2);
                if (it.bomb) {
                    arena.classList.add('boom');
                    ctx.penalty('Waduh, kena bom!');
                    setTimeout(() => arena.classList.remove('boom'), 250);
                }
                setTimeout(() => {
                    it.el.remove();
                    const k = items.indexOf(it);
                    if (k > -1) items.splice(k, 1);
                }, 300);
            }
        }
    }
    const pos = e => {
        const r = arena.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = e => { pressed = true; prev = pos(e); cut(prev, prev); };
    const move = e => {
        if (!pressed) return;
        const cur = pos(e);
        cut(prev, cur);
        prev = cur;
    };
    const up = () => { pressed = false; };

    arena.addEventListener('pointerdown', down);
    arena.addEventListener('pointermove', move);
    arena.addEventListener('pointerup', up);
    arena.addEventListener('pointercancel', up);
    arena.addEventListener('pointerleave', up);
    loopSpawn();
    raf = requestAnimationFrame(frame);

    return () => {
        cancelAnimationFrame(raf);
        clearTimeout(spawnTimer);
        arena.removeEventListener('pointerdown', down);
        arena.removeEventListener('pointermove', move);
        arena.removeEventListener('pointerup', up);
        arena.removeEventListener('pointercancel', up);
        arena.removeEventListener('pointerleave', up);
        arena.classList.remove('boom');
    };
}

// Game 3: Cocokin kartu
function runMatch(ctx) {
    const arena = ctx.arena;
    const pool = FRUITS.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    const deck = pool.concat(pool).sort(() => Math.random() - 0.5);
    const grid = document.createElement('div');
    grid.className = 'm-grid';
    const timers = [];
    let first = null, lock = false, found = 0;

    deck.forEach(fruit => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'm-card';
        card.setAttribute('aria-label', 'Kartu tertutup');
        card.innerHTML = '<span class="m-front">?</span><span class="m-back"></span>';
        card.querySelector('.m-back').textContent = fruit;

        card.addEventListener('click', () => {
            if (lock || card.classList.contains('open') || card.classList.contains('done')) return;
            card.classList.add('open');
            card.setAttribute('aria-label', 'Kartu ' + FRUIT_NAMES[fruit]);
            if (!first) { first = { card, fruit }; return; }

            const a = first;
            first = null;
            if (a.fruit === fruit) {
                a.card.classList.add('done');
                card.classList.add('done');
                found++;
                const ar = arena.getBoundingClientRect(), r = card.getBoundingClientRect();
                ctx.points(r.left - ar.left + r.width / 2, r.top - ar.top + r.height / 2, 10);
                if (found === pool.length) {
                    const bonus = ctx.timeLeft();
                    ctx.addScore(bonus);
                    ctx.finish('Semua pasangan ketemu! Bonus sisa waktu +' + bonus + '.');
                }
            } else {
                lock = true;
                timers.push(setTimeout(() => {
                    [a.card, card].forEach(c => {
                        c.classList.remove('open');
                        c.setAttribute('aria-label', 'Kartu tertutup');
                    });
                    lock = false;
                }, 650));
            }
        });
        grid.appendChild(card);
    });
    arena.appendChild(grid);
    return () => timers.forEach(clearTimeout);
}

// Pengatur jalannya game
function initGame() {
    const arena = document.getElementById('game-arena');
    const overlay = document.getElementById('game-overlay');
    const startBtn = document.getElementById('game-start');
    const title = document.getElementById('game-title');
    const msg = document.getElementById('game-msg');
    const scoreEl = document.getElementById('game-score');
    const timeEl = document.getElementById('game-time');
    const bestEl = document.getElementById('game-best');
    const gameSticker = document.getElementById('game-sticker');
    const tabs = [...document.querySelectorAll('.game-tab')];

    const keyOf = id => (id === 'bubble' ? 'campusHubBubbleBest' : 'campusHubBest_' + id);
    const bests = {};
    Object.keys(GAMES).forEach(id => {
        try { bests[id] = Number(localStorage.getItem(keyOf(id))) || 0; } catch (e) { bests[id] = 0; }
    });

    let current = 'bubble', score = 0, timeLeft = 0, running = false, tick = null, stop = null;

    function clearArena() {
        [...arena.children].forEach(n => { if (n !== overlay) n.remove(); });
    }
    function addScore(p) {
        score = Math.max(0, score + p);
        scoreEl.textContent = score;
    }
    let lastPenalty = 0;
    const ctx = {
        arena, addScore,
        penalty: text => {
            if (Date.now() - lastPenalty > 5000) { lastPenalty = Date.now(); hubSay(text, 'wow'); }
        },
        timeLeft: () => timeLeft,
        elapsed: () => GAMES[current].duration - timeLeft,
        finish: note => end(note),
        points(x, y, p) {
            addScore(p);
            const s = document.createElement('span');
            s.className = 'g-pts' + (p < 0 ? ' neg' : '');
            s.textContent = (p > 0 ? '+' : '') + p;
            s.style.left = (x - 10) + 'px';
            s.style.top = (y - 10) + 'px';
            arena.appendChild(s);
            s.addEventListener('animationend', () => s.remove());
        }
    };

    function select(id) {
        if (running) return;
        current = id;
        tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.game === id));
        title.textContent = GAMES[id].label;
        gameSticker.src = STICKERS.happy;
        msg.textContent = GAMES[id].hint;
        startBtn.textContent = 'Mulai';
        scoreEl.textContent = 0;
        timeEl.textContent = GAMES[id].duration;
        bestEl.textContent = bests[id];
        overlay.hidden = false;
    }

    function start() {
        const g = GAMES[current];
        score = 0; timeLeft = g.duration; running = true;
        scoreEl.textContent = 0; timeEl.textContent = timeLeft;
        clearArena();
        overlay.hidden = true;
        arena.classList.add('playing');
        tabs.forEach(t => { t.disabled = true; });
        stop = g.run(ctx);
        tick = setInterval(() => {
            timeLeft--;
            timeEl.textContent = timeLeft;
            if (timeLeft <= 0) end();
        }, 1000);
    }

    function end(note) {
        if (!running) return;
        running = false;
        clearInterval(tick);
        if (stop) stop();
        stop = null;
        clearArena();
        arena.classList.remove('playing');
        tabs.forEach(t => { t.disabled = false; });

        const record = score > bests[current];
        if (record) {
            bests[current] = score;
            bestEl.textContent = score;
            try { localStorage.setItem(keyOf(current), String(score)); } catch (e) {}
        }
        title.textContent = record ? 'Rekor baru!' : 'Waktu habis!';
        gameSticker.src = record ? STICKERS.happy : STICKERS.think;
        msg.textContent = (note ? note + ' ' : '') + 'Skormu ' + score + '. ' +
            (record ? 'Itu skor tertinggimu di ' + GAMES[current].label + '.' : 'Rekormu ' + bests[current] + '. Coba lagi?');
        startBtn.textContent = 'Main lagi';
        overlay.hidden = false;
        if (record && score > 0) launchConfetti();
        hubSay(record && score > 0 ? 'Rekor baru di ' + GAMES[current].label + ': ' + score + ' poin!' : 'Skormu ' + score + '. Ayo coba lagi!', record && score > 0 ? 'happy' : 'think');
    }

    tabs.forEach(t => t.addEventListener('click', () => select(t.dataset.game)));
    startBtn.addEventListener('click', start);
    select('bubble');
}

// Bintang kelap-kelip ngikutin kursor
function initTrail() {
    const btn = document.getElementById('trail-toggle');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!btn) return;
    if (reduce || !fine) { btn.hidden = true; return; }

    const KEY = 'campusHubTrail';
    let on = true;
    try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

    function paint() {
        btn.setAttribute('aria-pressed', on);
        btn.textContent = 'Jejak kursor: ' + (on ? 'ON' : 'OFF');
    }
    paint();
    btn.addEventListener('click', () => {
        on = !on;
        try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
        paint();
    });

    let lx = -100, ly = -100;
    document.addEventListener('pointermove', e => {
        if (!on || e.pointerType === 'touch') return;
        if (Math.hypot(e.clientX - lx, e.clientY - ly) < 14) return;
        lx = e.clientX; ly = e.clientY;
        const d = document.createElement('span');
        const size = 7 + Math.random() * 9;
        d.className = 'trail-dot';
        d.style.width = d.style.height = size + 'px';
        d.style.left = (lx - size / 2) + 'px';
        d.style.top = (ly - size / 2) + 'px';
        d.style.setProperty('--dx', (Math.random() * 24 - 12) + 'px');
        document.body.appendChild(d);
        d.addEventListener('animationend', () => d.remove());
    });
}

// Maskot interaktif di pojok
function initSticker() {
    const sticker = document.getElementById('sticker');
    const btn = document.getElementById('sticker-btn');
    const bubble = document.getElementById('sticker-bubble');
    const close = document.getElementById('sticker-close');
    const img = btn.querySelector('img');
    Object.values(STICKERS).forEach(src => { const p = new Image(); p.src = src; });

    const tips = [
        'Halo! Aku maskot Campus Hub. Klik aku untuk dapat tips.',
        'Tekan Ctrl+K untuk membuka palet perintah. Cepat banget!',
        'PKKMB 1 September: kemeja putih dan celana hitam tidak ketat ya.',
        'Open House Lab pada 3 September di Gedung TULT 14.05 SEA Laboratory.',
        'Jadwal kuliah lengkap ada di Sirama dan MyTelU.',
        'Catat tugasmu di To-Do List. Datanya tetap ada walau halaman di-refresh.',
        'Fokus 25 menit lalu istirahat 5 menit. Itu teknik Pomodoro.',
        'Bosan? Ada 3 mini game seru di bagian Mini Game!'
    ];
    const hints = {
        'jadwal': ['Klik "Tambah ke kalender" supaya jadwalnya tidak terlewat.', 'idle'],
        'lab-org': ['Tertarik SEA Lab? Datang ke Open House dan tanya langsung.', 'happy'],
        'todo': ['Coba Fokus Timer di samping daftar tugas.', 'idle'],
        'game': ['Fruit Slice: tekan lalu geser untuk membelah buah.', 'happy'],
        'faq': ['Bingung? Ketik kata kunci di kolom pencarian.', 'think'],
        'contact': ['Punya saran atau kendala? Tulis di sini ya.', 'happy']
    };
    let i = 1, hideTimer, lastSay = 0;

    function say(text, mood) {
        img.src = STICKERS[mood] || STICKERS.idle;
        bubble.textContent = text;
        bubble.hidden = false;
        lastSay = Date.now();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { bubble.hidden = true; img.src = STICKERS.idle; }, 6000);
    }

    btn.addEventListener('click', () => {
        say(tips[i], 'idle');
        i = (i + 1) % tips.length;
        btn.classList.remove('wiggle');
        void btn.offsetWidth;
        btn.classList.add('wiggle');
    });
    close.addEventListener('click', () => { sticker.hidden = true; });
    document.addEventListener('hub:say', e => {
        if (sticker.hidden) return;
        const d = typeof e.detail === 'string' ? { text: e.detail } : e.detail;
        say(d.text, d.mood);
    });

    const hour = new Date().getHours();
    const greet = hour < 11 ? 'Selamat pagi!' : hour < 15 ? 'Selamat siang!' : hour < 18 ? 'Selamat sore!' : 'Selamat malam!';
    setTimeout(() => say(greet + ' Aku maskot Campus Hub. Klik aku untuk tips.', 'happy'), 1500);

    if ('IntersectionObserver' in window) {
        const seen = new Set();
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                const id = en.target.id;
                if (!en.isIntersecting || seen.has(id) || sticker.hidden) return;
                if (Date.now() - lastSay < 8000) return;
                seen.add(id);
                say(hints[id][0], hints[id][1]);
            });
        }, { threshold: 0.5 });
        Object.keys(hints).forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
}

// Munculin notifikasi melayang
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;

function toast(text) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

// Mode terang dan gelap
function initTheme() {
    const btn = document.getElementById('theme-btn');
    const root = document.documentElement;
    const paint = () => {
        const dark = root.getAttribute('data-theme') === 'dark';
        btn.textContent = dark ? '\u2600' : '\u263E';
        btn.setAttribute('aria-label', dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
    };
    window.toggleTheme = () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('campusHubTheme', next); } catch (e) {}
        paint();
    };
    btn.addEventListener('click', window.toggleTheme);
    paint();
}

// Garis progres saat scroll layar
function initProgress() {
    const bar = document.getElementById('scroll-progress');
    const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
}

// Muncul perlahan pas di-scroll
function initReveal() {
    if (REDUCE_MOTION || !('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll(
        '.content-section > h2, .contact-info, .events-grid, .lab-grid, .todo-layout, .game-tabs, .game-hud, .game-arena, .accordion, .faq-search, #feedback-form');
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
    }, { threshold: 0.1 });
    targets.forEach(t => { t.classList.add('reveal'); io.observe(t); });
}

// Teks ngetik sendiri
function initTyper() {
    const el = document.getElementById('typed');
    if (!el) return;
    const words = ['jadwal kegiatan', 'info lab & organisasi', 'catatan tugasmu', 'fokus belajar', 'istirahat dengan mini game'];
    if (REDUCE_MOTION) { el.textContent = words[0]; return; }
    let w = 0, i = 0, del = false;
    (function tick() {
        const word = words[w];
        el.textContent = word.slice(0, i);
        let delay = del ? 35 : 70;
        if (!del && i === word.length) { del = true; delay = 1400; }
        else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 300; }
        else i += del ? -1 : 1;
        setTimeout(tick, delay);
    })();
}

// Hitung mundur jadwal dan simpan ke kalender
function initEvents() {
    const cards = [...document.querySelectorAll('.event-card[data-start]')];
    const next = document.getElementById('next-event');
    const fmt = ms => {
        const m = Math.max(1, Math.round(ms / 60000));
        if (m < 60) return m + ' menit';
        const h = Math.round(m / 60);
        return h < 48 ? h + ' jam' : Math.round(h / 24) + ' hari';
    };
    const ics = s => String(s).replace(/([,;])/g, '\\$1');
    const stamp = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    function update() {
        const now = Date.now();
        let upcoming = null, live = null;
        cards.forEach(c => {
            const s = new Date(c.dataset.start).getTime(), e = new Date(c.dataset.end).getTime();
            const badge = c.querySelector('.status-badge');
            if (now < s) {
                badge.className = 'status-badge soon';
                badge.textContent = 'Mulai dalam ' + fmt(s - now);
                if (!upcoming || s < upcoming.s) upcoming = { s, t: c.dataset.title };
            } else if (now <= e) {
                badge.className = 'status-badge live';
                badge.textContent = 'Sedang berlangsung';
                live = c.dataset.title;
            } else {
                badge.className = 'status-badge done';
                badge.textContent = 'Selesai';
            }
        });
        next.textContent = live ? 'Sedang berlangsung: ' + live + '.'
            : upcoming ? 'Kegiatan berikutnya: ' + upcoming.t + ', ' + fmt(upcoming.s - now) + ' lagi.'
            : 'Semua kegiatan pada jadwal ini sudah selesai.';
    }

    cards.forEach(c => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const dateBox = document.createElement('div');
        dateBox.className = 'event-date';
        dateBox.setAttribute('aria-hidden', 'true');
        dateBox.innerHTML = '<strong></strong><span></span>';
        dateBox.children[0].textContent = c.dataset.start.slice(8, 10);
        dateBox.children[1].textContent = months[Number(c.dataset.start.slice(5, 7)) - 1];
        c.prepend(dateBox);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-cal';
        btn.textContent = 'Tambah ke kalender';
        btn.addEventListener('click', () => {
            const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Campus Hub//ID', 'BEGIN:VEVENT',
                'UID:' + stamp(c.dataset.start) + '@campushub', 'DTSTAMP:' + stamp(Date.now()),
                'DTSTART:' + stamp(c.dataset.start), 'DTEND:' + stamp(c.dataset.end),
                'SUMMARY:' + ics(c.dataset.title), 'LOCATION:' + ics(c.dataset.loc), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
            const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
            const a = document.createElement('a');
            a.href = url; a.download = 'campus-hub-' + c.dataset.start.slice(0, 10) + '.ics';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast('File kalender (.ics) diunduh.');
        });
        c.appendChild(btn);
    });
    update();
    setInterval(update, 60000);
}

// Efek miring 3D kartu saat kena kursor
function initTilt() {
    if (REDUCE_MOTION || !window.matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll('.event-card, .lab-card').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = 'perspective(800px) rotateX(' + (-py * 6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
}

// Cari pertanyaan FAQ
function initFaqSearch() {
    const input = document.getElementById('faq-search');
    const none = document.getElementById('faq-none');
    const items = [...document.querySelectorAll('.faq-item')];
    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        items.forEach(it => {
            const ok = !q || it.textContent.toLowerCase().includes(q);
            it.hidden = !ok;
            if (ok) shown++;
            else {
                it.querySelector('.faq-header').setAttribute('aria-expanded', 'false');
                it.querySelector('.faq-content').style.maxHeight = '0';
            }
        });
        const isNone = shown === 0;
        if (isNone && !none.dataset.said) hubSay('Belum ketemu. Coba kata kunci lain, ya.', 'think');
        none.dataset.said = isNone ? '1' : '';
        none.hidden = !isNone;
    });
}

// Stopwatch fokus belajar (Pomodoro)
function initFocus() {
    const KEY = 'campusHubFocusCount';
    const ring = document.getElementById('focus-ring');
    const timeEl = document.getElementById('focus-time');
    const startBtn = document.getElementById('focus-start');
    const resetBtn = document.getElementById('focus-reset');
    const sessEl = document.getElementById('focus-sessions');
    const modes = [...document.querySelectorAll('.focus-mode')];
    const baseTitle = document.title;

    let mode = 25, total = 25 * 60, remaining = total, endAt = 0, timer = null, sessions = 0;
    try { sessions = Number(localStorage.getItem(KEY)) || 0; } catch (e) {}

    const pad = n => String(n).padStart(2, '0');
    const label = () => pad(Math.floor(remaining / 60)) + ':' + pad(remaining % 60);
    function paint() {
        timeEl.textContent = label();
        ring.style.setProperty('--p', ((total - remaining) / total * 100).toFixed(1));
        sessEl.textContent = 'Sesi fokus selesai: ' + sessions;
        modes.forEach(m => { m.disabled = Boolean(timer); });
    }
    function stopTimer() {
        clearInterval(timer); timer = null;
        startBtn.textContent = 'Mulai';
        document.title = baseTitle;
    }
    function finish() {
        stopTimer();
        if (mode === 25) {
            sessions++;
            try { localStorage.setItem(KEY, String(sessions)); } catch (e) {}
            launchConfetti();
            toast('Sesi fokus selesai. Waktunya istirahat sebentar!');
            hubSay('Sesi fokus selesai. Minum dulu, lalu istirahat ya!', 'happy');
        } else {
            toast('Istirahat selesai. Siap fokus lagi?');
        }
        remaining = total;
        paint();
    }
    function tick() {
        remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        document.title = label() + ' - Campus Hub';
        paint();
        if (remaining <= 0) finish();
    }

    startBtn.addEventListener('click', () => {
        if (timer) {
            remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
            stopTimer(); paint();
            return;
        }
        endAt = Date.now() + remaining * 1000;
        timer = setInterval(tick, 250);
        startBtn.textContent = 'Jeda';
        paint();
    });
    resetBtn.addEventListener('click', () => { stopTimer(); remaining = total; paint(); });
    modes.forEach(m => m.addEventListener('click', () => {
        if (timer) return;
        mode = Number(m.dataset.min);
        total = remaining = mode * 60;
        modes.forEach(x => x.setAttribute('aria-pressed', x === m));
        paint();
    }));
    paint();
}

// Efek kertas pesta bertaburan
let confettiParts = [], confettiRaf = null;
function launchConfetti(x, y) {
    const c = document.getElementById('confetti');
    if (!c || REDUCE_MOTION) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    c.hidden = false;
    const ox = x == null ? c.width / 2 : x, oy = y == null ? c.height / 2.5 : y;
    const colors = ['#28a9e0', '#1b87b8', '#e6f6fc', '#ffffff', '#fbbf24', '#f472b6'];
    for (let i = 0; i < 130; i++) {
        const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
        confettiParts.push({
            x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6,
            w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
            r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)], life: 0
        });
    }
    if (confettiRaf) return;
    const g = c.getContext('2d');
    (function loop() {
        g.clearRect(0, 0, c.width, c.height);
        confettiParts = confettiParts.filter(p => p.life < 170 && p.y < c.height + 20);
        confettiParts.forEach(p => {
            p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
            g.save();
            g.globalAlpha = Math.min(1, (170 - p.life) / 40);
            g.translate(p.x, p.y); g.rotate(p.r);
            g.fillStyle = p.color;
            g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            g.restore();
        });
        if (confettiParts.length) confettiRaf = requestAnimationFrame(loop);
        else { confettiRaf = null; g.clearRect(0, 0, c.width, c.height); c.hidden = true; }
    })();
}

// Easter egg tombol rahasia (Konami Code)
function initKonami() {
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
        if (pos === seq.length) {
            pos = 0;
            const w = window.innerWidth, h = window.innerHeight;
            launchConfetti(w * 0.25, h * 0.4); launchConfetti(w * 0.75, h * 0.4); launchConfetti(w * 0.5, h * 0.3);
            toast('Kode rahasia terbuka! Kamu mahasiswa sejati.');
            hubSay('Wah, kamu menemukan kode rahasia!', 'wow');
        }
    });
}

// Kotak pencarian menu cepat (Ctrl+K)
function initPalette() {
    const box = document.getElementById('palette');
    const input = document.getElementById('palette-input');
    const list = document.getElementById('palette-list');
    const openBtn = document.getElementById('palette-btn');
    const go = id => () => document.getElementById(id).scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    const play = g => () => {
        const tab = document.querySelector('.game-tab[data-game="' + g + '"]');
        if (tab) tab.click();
        go('game')();
    };
    const cmds = [
        { l: 'Beranda', h: 'Navigasi', r: go('home') },
        { l: 'Jadwal Kegiatan', h: 'Navigasi', r: go('jadwal') },
        { l: 'Lab & Organisasi', h: 'Navigasi', r: go('lab-org') },
        { l: 'To-Do List & Fokus Timer', h: 'Navigasi', r: go('todo') },
        { l: 'Mini Game', h: 'Navigasi', r: go('game') },
        { l: 'FAQ', h: 'Navigasi', r: go('faq') },
        { l: 'Kontak / Feedback', h: 'Navigasi', r: go('contact') },
        { l: 'Ganti tema terang / gelap', h: 'Tampilan', r: () => window.toggleTheme() },
        { l: 'Nyalakan / matikan jejak kursor', h: 'Tampilan', r: () => document.getElementById('trail-toggle').click() },
        { l: 'Mainkan Bubble Pop', h: 'Mini Game', r: play('bubble') },
        { l: 'Mainkan Fruit Slice', h: 'Mini Game', r: play('slice') },
        { l: 'Mainkan Fruit Match', h: 'Mini Game', r: play('match') },
        { l: 'Luncurkan konfeti', h: 'Seru-seruan', r: () => launchConfetti() }
    ];
    let shown = cmds, idx = 0, lastFocus = null;

    function render() {
        list.innerHTML = '';
        shown.forEach((c, i) => {
            const li = document.createElement('li');
            li.id = 'pal-' + i;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', i === idx);
            li.innerHTML = '<span></span><small></small>';
            li.children[0].textContent = c.l;
            li.children[1].textContent = c.h;
            li.addEventListener('click', () => run(c));
            li.addEventListener('pointermove', () => { idx = i; mark(); });
            list.appendChild(li);
        });
        if (!shown.length) {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada perintah yang cocok.';
            list.appendChild(li);
        }
        mark();
    }
    function mark() {
        [...list.children].forEach((li, i) => li.setAttribute('aria-selected', i === idx));
        input.setAttribute('aria-activedescendant', 'pal-' + idx);
        const cur = list.children[idx];
        if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    }
    function open() {
        lastFocus = document.activeElement;
        box.hidden = false;
        input.value = ''; shown = cmds; idx = 0;
        render();
        input.focus();
    }
    function close() {
        box.hidden = true;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function run(c) { close(); setTimeout(c.r, 50); }

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        shown = cmds.filter(c => (c.l + ' ' + c.h).toLowerCase().includes(q));
        idx = 0; render();
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (shown.length) { idx = (idx + 1) % shown.length; mark(); } }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) { idx = (idx - 1 + shown.length) % shown.length; mark(); } }
        else if (e.key === 'Enter') { e.preventDefault(); if (shown[idx]) run(shown[idx]); }
        else if (e.key === 'Tab') e.preventDefault();
    });
    box.addEventListener('pointerdown', e => { if (e.target === box) close(); });
    openBtn.addEventListener('click', open);
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close(); }
        else if (e.key === 'Escape' && !box.hidden) close();
        else if (e.key === '/' && box.hidden && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
}
