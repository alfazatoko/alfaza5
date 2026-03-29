function updateUI() {
    if (!currentData) return;
    document.getElementById('saldoBank').innerHTML = "Rp " + formatNumber(currentData.bank);
    document.getElementById('saldoCash').innerHTML = "Rp " + formatNumber(currentData.cash);
    document.getElementById('statTarik').innerHTML = formatNumber(currentData.tarik);
    document.getElementById('statAks').innerHTML = formatNumber(currentData.aks);
    document.getElementById('statAdmin').innerHTML = formatNumber(currentData.admin);
}

function refreshHistory() {
    if (!currentData) return;
    let start = document.getElementById('dateStart').value || getToday();
    let end = document.getElementById('dateEnd').value || getToday();
    let search = document.getElementById('searchHistory')?.value.toLowerCase() || '';
    
    let filtered = currentData.tr.filter(t => t.tgl >= start && t.tgl <= end);
    if (transFilter !== 'all') filtered = filtered.filter(t => t.kat === transFilter);
    if (search) filtered = filtered.filter(t => (t.ket || '').toLowerCase().includes(search) || t.nom.toString().includes(search));
    filtered.sort((a,b) => (b.waktu || '').localeCompare(a.waktu || ''));
    
    let html = '';
    filtered.forEach((t, i) => {
        let editBtn = (userRole === 'owner') ? `<button class="edit-icon" onclick="openEditModal('${t.id}')"><i class="fa-solid fa-pen"></i></button>` : '';
        let delBtn = (userRole === 'owner') ? `<button class="delete-icon" onclick="deleteTransaction('${t.id}')"><i class="fa-solid fa-trash"></i></button>` : '';
        html += `<tr>
            <td style="text-align:center;">${i+1}</td>
            <td>${t.jam}</td>
            <td>${t.kat === 'TARIK TUNAI' ? 'Tarik' : (t.kat === 'AKSESORIS' ? 'Aks' : t.kat)}</td>
            <td style="text-align:right;">Rp ${formatNumber(t.nom)}</td>
            <td style="text-align:right;">${t.adm ? formatNumber(t.adm) : '-'}</td>
            <td>${t.ket || '-'}</td>
            <td style="text-align:center;">${editBtn}${delBtn}</td>
        </tr>`;
    });
    document.getElementById('historyList').innerHTML = html || '<tr><td colspan="7" class="empty">Tidak ada transaksi</td></tr>';
    
    let saldoData = currentData.ts.filter(s => s.tgl >= start && s.tgl <= end);
    if (saldoFilter !== 'all') saldoData = saldoData.filter(s => s.jenis === saldoFilter);
    saldoData.sort((a,b) => (b.waktu || '').localeCompare(a.waktu || ''));
    let saldoHtml = '';
    saldoData.forEach((s, i) => {
        saldoHtml += `<tr>
            <td style="text-align:center;">${i+1}</td>
            <td>${s.jam}</td>
            <td>${s.jenis}</td>
            <td style="text-align:right;">Rp ${formatNumber(s.nom)}</td>
            <td>${s.ket || '-'}</td>
        </tr>`;
    });
    document.getElementById('saldoHistoryList').innerHTML = saldoHtml || '<tr><td colspan="5" class="empty">Tidak ada riwayat</td></tr>';
}

function changePage(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    if (el) el.classList.add('active');
    if (page === 'history') refreshHistory();
    if (page === 'report') showReport();
    if (page === 'graph' && userRole === 'owner') refreshGraph();
}

function updateLiveClock() {
    document.getElementById('liveClock').innerHTML = new Date().toLocaleTimeString('id-ID');
}

function updateDateDisplay() {
    let now = new Date();
    document.getElementById('todayDate').innerHTML = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

const quotes = [
    "Pedagang jujur membawa berkah, pelanggan puas datang kembali melimpah.",
    "Bukan sekadar menjual barang, tapi memberikan solusi bagi pelanggan.",
    "Senyum ramah adalah modal utama, kepercayaan adalah harta berharga.",
    "Rezeki sudah diatur Tuhan, tugas kita menjemput dengan pelayanan.",
    "Kualitas produk bicara sendiri, integritas pedagang menjaga hati pembeli."
];
let quoteIndex = 0;

function startQuoteRotator() {
    document.getElementById('dailyQuote').innerHTML = quotes[0];
    setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        document.getElementById('dailyQuote').innerHTML = quotes[quoteIndex];
    }, 30000);
}