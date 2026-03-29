function showReport() {
    if (!currentData) return;
    let tgl = document.getElementById('reportDate').value || getToday();
    let tr = currentData.tr.filter(x => x.tgl === tgl);
    let ts = currentData.ts.filter(x => x.tgl === tgl);
    
    let bankIn = ts.filter(x => x.jenis === 'Bank').reduce((a,b) => a+b.nom,0);
    let sBank = tr.filter(x => x.kat === 'BANK').reduce((a,b) => a+b.nom,0);
    let sFlip = tr.filter(x => x.kat === 'FLIP').reduce((a,b) => a+b.nom,0);
    let sDana = tr.filter(x => x.kat === 'DANA').reduce((a,b) => a+b.nom,0);
    let sApp = tr.filter(x => x.kat === 'APP PULSA').reduce((a,b) => a+b.nom,0);
    let sAks = tr.filter(x => x.kat === 'AKSESORIS').reduce((a,b) => a+b.nom,0);
    let sTarik = tr.filter(x => x.kat === 'TARIK TUNAI').reduce((a,b) => a+b.nom,0);
    let totalSales = sBank + sFlip + sDana + sApp;
    let totalAdmin = tr.reduce((a,b) => a+b.adm,0);
    let totalReal = ts.filter(x => x.jenis === 'Saldo Real App').reduce((a,b) => a+b.nom,0);
    let cashTotal = currentData.cash + totalAdmin + sAks;
    let diff = currentData.bank - totalReal;
    let diffText = diff === 0 ? "Sesuai" : (diff > 0 ? "Lebih" : "Kurang");
    
    let html = `<div class="report-card">
        <div class="report-header">📋 LAPORAN HARIAN</div>
        <div class="report-sub">${tgl} | Kasir: ${currentKasir || currentUser}</div>
        <div class="report-row"><span>🏦 Saldo Bank Masuk</span><b>Rp ${formatNumber(bankIn)}</b></div>
        <div class="report-row"><span>🏦 Bank</span><b>Rp ${formatNumber(sBank)}</b></div>
        <div class="report-row"><span>🔄 Flip</span><b>Rp ${formatNumber(sFlip)}</b></div>
        <div class="report-row"><span>💎 Dana</span><b>Rp ${formatNumber(sDana)}</b></div>
        <div class="report-row"><span>📱 App Pulsa</span><b>Rp ${formatNumber(sApp)}</b></div>
        <div class="report-row" style="background:#eef2ff;"><span>TOTAL PENJUALAN</span><b>Rp ${formatNumber(totalSales)}</b></div>
        <div class="report-row"><span>💸 Tarik Tunai</span><b>-Rp ${formatNumber(sTarik)}</b></div>
        <div class="report-row"><span>💰 Sisa Cash Penjualan</span><b>Rp ${formatNumber(currentData.cash)}</b></div>
        <div class="report-row"><span>🧾 Admin</span><b>Rp ${formatNumber(totalAdmin)}</b></div>
        <div class="report-row"><span>🎧 Aksesoris</span><b>Rp ${formatNumber(sAks)}</b></div>
        <div class="report-total"><div class="report-row" style="color:white;"><span>SISA CASH TOTAL</span><span>Rp ${formatNumber(cashTotal)}</span></div></div>
        <div style="margin-top:16px; padding:10px; background:#f8faff; border-radius:20px;">
            <div><strong>🏦 Saldo Bank Catatan:</strong> Rp ${formatNumber(currentData.bank)}</div>
            <div><strong>📊 Total Saldo Real:</strong> Rp ${formatNumber(totalReal)}</div>
            <div><strong>⚖️ Selisih:</strong> ${diffText} (Rp ${formatNumber(Math.abs(diff))})</div>
        </div>
        <div class="action-buttons">
            <button class="action-btn-sm btn-orange" onclick="resetSaldo()">Reset Saldo</button>
            <button class="action-btn-sm btn-green" onclick="shareReport()">Share</button>
            <button class="action-btn-sm btn-blue" onclick="openSaldoRealModal()">Saldo Real</button>
            <button class="action-btn-sm btn-purple" onclick="exportReportPDF()">PDF</button>
        </div>
    </div>`;
    document.getElementById('reportArea').innerHTML = html;
}

async function shareReport() {
    let tgl = document.getElementById('reportDate').value || getToday();
    let text = `📱 ALFAZA CELL\n📅 ${tgl}\nKasir: ${currentKasir || currentUser}\n${new Date().toLocaleString()}`;
    if (navigator.share) try { await navigator.share({ text }); return; } catch(e) {}
    try { await navigator.clipboard.writeText(text); showToast('📋 Teks disalin'); } catch(e) { alert(text); }
}

function exportReportPDF() {
    let el = document.querySelector('#reportArea .report-card');
    if (!el) return;
    showToast('Membuat PDF...');
    let btns = el.querySelector('.action-buttons');
    let old = btns?.style.display;
    if (btns) btns.style.display = 'none';
    html2canvas(el, { scale: 2 }).then(canvas => {
        if (btns) btns.style.display = old || 'flex';
        let img = canvas.toDataURL('image/png');
        let { jsPDF } = window.jspdf;
        let pdf = new jsPDF();
        let w = 190, h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, 'PNG', 10, 10, w, h);
        pdf.save(`Laporan_${currentKasir || currentUser}_${getToday()}.pdf`);
        showToast('✅ PDF selesai');
    }).catch(() => showToast('Gagal buat PDF', true));
}

function resetSaldo() {
    if (confirm('Reset semua saldo ke 0?')) {
        currentData.bank = 0; currentData.cash = 0; currentData.tarik = 0; currentData.aks = 0; currentData.admin = 0;
        localStorage.setItem('alfaza_db', JSON.stringify(db));
        updateUI();
        showToast('Saldo direset');
        if (document.getElementById('page-report').classList.contains('active')) showReport();
    }
}