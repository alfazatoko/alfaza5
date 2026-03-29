async function backupAllKasir() {
    let all = {};
    KASIR_NAMES.forEach(k => all[k] = { transactions: db[k].tr, saldoAdjusts: db[k].ts });
    await fetch(APP_URL, { method:'POST', mode:'no-cors', body:JSON.stringify({ action:'backupAll', data:all }) });
    showToast('✅ Backup semua kasir');
}

async function syncAllKasir() {
    for (let k of KASIR_NAMES) {
        try {
            let res = await fetch(APP_URL + '?action=getData&kasir=' + k);
            let result = await res.json();
            if (result.success) {
                let newTr = result.data.transactions.filter(t => !db[k].tr.some(ot => ot.id === t.id));
                if (newTr.length) db[k].tr = [...newTr, ...db[k].tr];
            }
        } catch(e) {}
    }
    localStorage.setItem('alfaza_db', JSON.stringify(db));
    showToast('✅ Sync semua kasir');
}

let catBtns = [], catIndex = 0;

function initKeyboardNav() {
    catBtns = document.querySelectorAll('#categoryGrid .category-btn');
    if (!catBtns.length) return;
    for (let i = 0; i < catBtns.length; i++) if (catBtns[i].classList.contains('active')) catIndex = i;
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
    let activePage = document.querySelector('.page.active');
    if (!activePage || activePage.id !== 'page-home') return;
    let activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        catIndex = (catIndex + 1) % catBtns.length;
        updateCatFocus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        catIndex = (catIndex - 1 + catBtns.length) % catBtns.length;
        updateCatFocus();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        let btn = catBtns[catIndex];
        if (btn) selectCategory(btn.getAttribute('data-cat'), btn);
    }
}

function updateCatFocus() {
    catBtns.forEach(btn => btn.classList.remove('keyboard-focus'));
    catBtns[catIndex].classList.add('keyboard-focus');
    catBtns[catIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

setInterval(() => { updateLiveClock(); updateDateDisplay(); }, 1000);
setTimeout(() => { initKeyboardNav(); }, 100);
updateLiveClock();
updateDateDisplay();