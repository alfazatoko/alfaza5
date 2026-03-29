let graphType = "daily", graphChart = null;

function setGraphType(type, el) {
    graphType = type;
    document.querySelectorAll('#page-graph .filter-buttons .filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    refreshGraph();
}

function refreshGraph() {
    if (userRole !== 'owner') return;
    let start = document.getElementById('graphStart').value || new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
    let end = document.getElementById('graphEnd').value || getToday();
    let allTrans = [];
    if (currentKasir) allTrans = db[currentKasir].tr.filter(t => t.tgl >= start && t.tgl <= end);
    else KASIR_NAMES.forEach(k => allTrans = allTrans.concat(db[k].tr.filter(t => t.tgl >= start && t.tgl <= end)));
    let total = allTrans.filter(t => t.kat !== 'TARIK TUNAI' && t.kat !== 'AKSESORIS').reduce((s,t) => s + t.nom, 0);
    document.getElementById('graphTotalValue').innerHTML = `Rp ${formatNumber(total)}`;
    
    if (graphType === 'daily') {
        let daily = {};
        for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate()+1)) daily[d.toISOString().split('T')[0]] = 0;
        allTrans.forEach(t => { if (t.kat !== 'TARIK TUNAI' && t.kat !== 'AKSESORIS') daily[t.tgl] = (daily[t.tgl] || 0) + t.nom; });
        let labels = Object.keys(daily).sort();
        let data = labels.map(l => daily[l]);
        if (graphChart) graphChart.destroy();
        graphChart = new Chart(document.getElementById('salesChart'), { type:'bar', data:{ labels, datasets:[{ label:'Penjualan', data, backgroundColor:'rgba(43,103,246,0.7)' }] }, options:{ responsive:true } });
    } else if (graphType === 'category') {
        let cat = { BANK:0, FLIP:0, 'APP PULSA':0, DANA:0 };
        allTrans.forEach(t => { if (cat[t.kat] !== undefined) cat[t.kat] += t.nom; });
        if (graphChart) graphChart.destroy();
        graphChart = new Chart(document.getElementById('salesChart'), { type:'pie', data:{ labels:Object.keys(cat), datasets:[{ data:Object.values(cat), backgroundColor:['#2b67f6','#a29bfe','#55efc4','#74b9ff'] }] }, options:{ responsive:true } });
    } else if (graphType === 'kasir') {
        let kasirData = { 'KASIR 01':0, 'KASIR 02':0, 'KASIR 03':0 };
        KASIR_NAMES.forEach(k => {
            let tr = db[k].tr.filter(t => t.tgl >= start && t.tgl <= end && t.kat !== 'TARIK TUNAI' && t.kat !== 'AKSESORIS');
            kasirData[k] = tr.reduce((s,t) => s + t.nom, 0);
        });
        if (graphChart) graphChart.destroy();
        graphChart = new Chart(document.getElementById('salesChart'), { type:'bar', data:{ labels:Object.keys(kasirData), datasets:[{ label:'Penjualan', data:Object.values(kasirData), backgroundColor:['#2b67f6','#f39c12','#7cc386'] }] }, options:{ responsive:true } });
    }
}