/* Campus Hub - script.js */
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initTodo();
    initFaq();
    initForm();
});

/* ---------- Navigasi mobile + highlight section aktif ---------- */
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

/* ---------- To-Do List (Local Storage) ---------- */
function initTodo() {
    const KEY = 'campusHubTodos';
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const count = document.getElementById('todo-count');
    const error = document.getElementById('todo-error');

    let todos = load();

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(todos)); } catch (e) { /* storage penuh/diblokir */ }
    }

    function render() {
        list.innerHTML = '';
        if (todos.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'todo-empty';
            empty.textContent = 'Belum ada tugas. Tulis tugas pertamamu di kolom di atas.';
            list.appendChild(empty);
        }
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.done ? ' done' : '');

            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = todo.done;
            check.setAttribute('aria-label', 'Tandai selesai: ' + todo.text);
            check.addEventListener('change', () => {
                todo.done = check.checked;
                save(); render();
            });

            const text = document.createElement('span');
            text.textContent = todo.text; // textContent mencegah injeksi HTML

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
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) {
            error.textContent = 'Tugas tidak boleh kosong. Tulis dulu apa yang perlu dikerjakan.';
            input.focus();
            return;
        }
        error.textContent = '';
        todos.push({ id: Date.now(), text: value, done: false });
        input.value = '';
        save(); render();
    });
    input.addEventListener('input', () => { error.textContent = ''; });

    render();
}

/* ---------- FAQ Accordion ---------- */
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
            items.forEach(other => setOpen(other, false)); // hanya satu terbuka
            if (!isOpen) setOpen(item, true);
        });
    });
}

/* ---------- Form Contact / Feedback ---------- */
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
            if (v.length < 10) return 'Pesan minimal 10 karakter.';
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
            const firstInvalid = form.querySelector('.invalid input, .invalid select, .invalid textarea');
            if (firstInvalid) firstInvalid.focus();
            success.textContent = '';
            return;
        }
        // Tidak ada pengiriman ke server (sesuai ketentuan tugas)
        const name = form.elements.name.value.trim();
        form.reset();
        success.textContent = `Terima kasih, ${name}! Pesanmu sudah terkirim.`;
    });
}
