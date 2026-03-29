function selectCategory(cat, el) {
    activeCategory = cat;
    document.querySelectorAll('#categoryGrid .category-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('inputNominal').focus();
}

async function saveTransaction() {
    if (userRole === 'owner' || !currentKasir) { alert("Owner tidak bisa transaksi"); return; }
    
    let nom = toNumber(document.getElementById('inputNominal').value);
    let adm = toNumber(document.getElementById('inputAdmin').value);
    let ket = document.getElementById('inputNote').value;
    if (!nom) { alert("Masukkan nominal!"); return; }
    
    let now = new Date();
    let data = {
        id: generateUniqueId(),
        waktu: now.toISOString(),
        tgl: getToday(),
        jam: now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}),
        kat: activeCategory,
        nom, adm, ket,
        kasir: currentKasir
    };
    
    if (activeCategory === 'TARIK TUNAI') { currentData.cash -= nom; currentData.tarik += nom; }
    else if (activeCategory === 'AKSESORIS') { currentData.aks += nom; }
    else { currentData.bank -= nom; currentData.cash += nom; }
    currentData.admin += adm;
    currentData.tr.unshift(data);
    
    localStorage.setItem('alfaza_db', JSON.stringify(db));
    updateUI();
    
    document.getElementById('inputNominal').value = '';
    document.getElementById('inputAdmin').value = '';
    document.getElementById('inputNote').value = '';
    showToast('✅ Transaksi tersimpan', false);
    
    queueSync('saveTransaction', data);
    refreshHistory();
}

function openSaldoModal() { document.getElementById('modalSaldo').style.display = 'flex'; document.getElementById('saldoAmount').focus(); }
function openSaldoRealModal() { document.getElementById('modalSaldoReal').style.display = 'flex'; document.getElementById('realAmount').focus(); }

async function saveSaldo() {
    let jenis = document.getElementById('saldoType').value;
    let nom = toNumber(document.getElementById('saldoAmount').value);
    if (!nom) return;
    
    let data = {
        id: generateUniqueId(),
        waktu: new Date().toISOString(),
        tgl: getToday(),
        jam: getCurrentTime(),
        jenis, nom, ket: '',
        kasir: currentKasir
    };
    
    if (jenis === 'Bank') currentData.bank += nom;
    else currentData.cash += nom;
    
    currentData.ts.unshift(data);
    localStorage.setItem('alfaza_db', JSON.stringify(db));
    updateUI();
    closeModal('modalSaldo');
    showToast('✅ Saldo ditambahkan', false);
    
    queueSync('saveSaldoAdjust', data);
    refreshHistory();
}

async function saveSaldoReal() {
    let nom = toNumber(document.getElementById('realAmount').value);
    let ket = document.getElementById('realNote').value;
    if (!nom) return;
    
    let data = {
        id: generateUniqueId(),
        waktu: new Date().toISOString(),
        tgl: getToday(),
        jam: getCurrentTime(),
        jenis: 'Saldo Real App',
        nom, ket,
        kasir: currentKasir
    };
    
    currentData.ts.unshift(data);
    localStorage.setItem('alfaza_db', JSON.stringify(db));
    updateUI();
    closeModal('modalSaldoReal');
    showToast('✅ Saldo Real tersimpan', false);
    
    queueSync('saveSaldoAdjust', data);
    refreshHistory();
}

function openEditModal(id) {
    let tr = currentData.tr.find(t => t.id === id);
    if (!tr) return;
    editId = id;
    document.getElementById('editAmount').value = formatNumber(tr.nom);
    document.getElementById('editAdminFee').value = formatNumber(tr.adm);
    document.getElementById('editNote').value = tr.ket || '';
    document.getElementById('modalEdit').style.display = 'flex';
}

function saveEdit() {
    let tr = currentData.tr.find(t => t.id === editId);
    if (!tr) return;
    
    let newNom = toNumber(document.getElementById('editAmount').value);
    let newAdm = toNumber(document.getElementById('editAdminFee').value);
    let newKet = document.getElementById('editNote').value;
    
    if (tr.kat === 'TARIK TUNAI') { currentData.cash += tr.nom; currentData.tarik -= tr.nom; }
    else if (tr.kat === 'AKSESORIS') { currentData.aks -= tr.nom; }
    else { currentData.bank += tr.nom; currentData.cash -= tr.nom; }
    currentData.admin -= tr.adm;
    
    if (tr.kat === 'TARIK TUNAI') { currentData.cash -= newNom; currentData.tarik += newNom; }
    else if (tr.kat === 'AKSESORIS') { currentData.aks += newNom; }
    else { currentData.bank -= newNom; currentData.cash += newNom; }
    currentData.admin += newAdm;
    
    tr.nom = newNom; tr.adm = newAdm; tr.ket = newKet;
    localStorage.setItem('alfaza_db', JSON.stringify(db));
    updateUI();
    refreshHistory();
    closeModal('modalEdit');
    showToast('✅ Transaksi diupdate');
    queueSync('updateTransaction', tr);
}

function deleteTransaction(id) {
    if (!confirm('Hapus transaksi ini?')) return;
    let tr = currentData.tr.find(t => t.id === id);
    if (!tr) return;
    
    if (tr.kat === 'TARIK TUNAI') { currentData.cash += tr.nom; currentData.tarik -= tr.nom; }
    else if (tr.kat === 'AKSESORIS') { currentData.aks -= tr.nom; }
    else { currentData.bank += tr.nom; currentData.cash -= tr.nom; }
    currentData.admin -= tr.adm;
    currentData.tr = currentData.tr.filter(t => t.id !== id);
    
    localStorage.setItem('alfaza_db', JSON.stringify(db));
    updateUI();
    refreshHistory();
    showToast('✅ Transaksi dihapus');
    queueSync('deleteTransaction', { id: tr.id, kat: tr.kat, nom: tr.nom, adm: tr.adm });
}

function setTransFilter(kat, el) {
    transFilter = kat;
    document.querySelectorAll('#transFilter .filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    refreshHistory();
}

function setSaldoFilter(kat, el) {
    saldoFilter = kat;
    document.querySelectorAll('#saldoFilter .filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    refreshHistory();
}