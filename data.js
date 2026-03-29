// GANTI DENGAN URL APPS SCRIPT ANDA!
const APP_URL = 'https://script.google.com/macros/s/AKfycbyh6pQznYSWmz1f4snVmwYmAJyVPglybMDZDpUcDdPQ1WVnOU4FwLDWiTfPz2_rOC_m/exec';

const PINS = { "KASIR 01": "1212", "KASIR 02": "2323", "KASIR 03": "3434", "OWNER": "9999" };
const KASIR_NAMES = ["KASIR 01", "KASIR 02", "KASIR 03"];

let db = JSON.parse(localStorage.getItem('alfaza_db')) || {};
KASIR_NAMES.forEach(k => {
    if (!db[k]) db[k] = { bank:0, cash:0, tarik:0, aks:0, admin:0, tr:[], ts:[], attendance: {} };
});
if (!db.OWNER) db.OWNER = { bank:0, cash:0, tarik:0, aks:0, admin:0, tr:[], ts:[], attendance: {} };

let currentUser = "", currentKasir = null, currentData = null, userRole = "";
let activeCategory = "BANK";
let editId = null;
let transFilter = "all", saldoFilter = "all";

// Queue system untuk sync
let syncQueue = [];
let isSyncing = false;
let lastSyncTime = 0;
let bgSyncInterval = null;
let deviceId = null;

function getDeviceId() {
    if (deviceId) return deviceId;
    deviceId = localStorage.getItem('alfaza_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('alfaza_device_id', deviceId);
    }
    return deviceId;
}

function generateUniqueId() {
    const timestamp = Date.now();
    const kasirCode = currentKasir ? 
        (currentKasir === 'KASIR 01' ? '01' : 
         currentKasir === 'KASIR 02' ? '02' : 
         currentKasir === 'KASIR 03' ? '03' : '99') : '00';
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${timestamp}-${kasirCode}-${random}`;
}

function queueSync(type, data) {
    if (!currentKasir) return;
    syncQueue.push({ type, data: { ...data, kasir: currentKasir, deviceId: getDeviceId() }, timestamp: Date.now(), retry: 0 });
    updateSyncStatus();
    if (!isSyncing) setTimeout(processSyncQueue, 3000);
}

async function processSyncQueue() {
    if (isSyncing || syncQueue.length === 0 || !navigator.onLine) return;
    isSyncing = true;
    updateSyncStatus();
    
    const itemsToSync = [...syncQueue];
    syncQueue = [];
    
    for (const item of itemsToSync) {
        try {
            const response = await fetch(APP_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: item.type, ...item.data })
            });
            const result = await response.json();
            if (!result.success) {
                item.retry++;
                if (item.retry < 5) syncQueue.push(item);
            }
        } catch (error) {
            item.retry++;
            if (item.retry < 5) syncQueue.push(item);
        }
    }
    
    isSyncing = false;
    updateSyncStatus();
    if (syncQueue.length > 0) setTimeout(processSyncQueue, 10000);
}

async function syncFromServer(kasirName, force = false) {
    if (!kasirName) return false;
    const now = Date.now();
    if (!force && (now - lastSyncTime) < 30000) return false;
    if (isSyncing) return false;
    
    isSyncing = true;
    try {
        const response = await fetch(`${APP_URL}?action=getData&kasir=${kasirName}&_=${now}&device=${getDeviceId()}`);
        const result = await response.json();
        if (result.success && result.data) {
            let hasChanges = false;
            if (result.data.kasirInfo) {
                currentData.bank = result.data.kasirInfo.bank;
                currentData.cash = result.data.kasirInfo.cash;
                currentData.tarik = result.data.kasirInfo.tarik;
                currentData.aks = result.data.kasirInfo.aks;
                currentData.admin = result.data.kasirInfo.admin;
                hasChanges = true;
            }
            if (result.data.transactions) {
                const existingIds = new Set(currentData.tr.map(t => t.id));
                const newFromServer = result.data.transactions.filter(t => !existingIds.has(t.id));
                if (newFromServer.length > 0) {
                    currentData.tr = [...newFromServer, ...currentData.tr];
                    hasChanges = true;
                    showToast(`📥 ${newFromServer.length} transaksi baru`, false);
                }
            }
            if (result.data.saldoHistory) {
                const existingIds = new Set(currentData.ts.map(s => s.id));
                const newSaldo = result.data.saldoHistory.filter(s => !existingIds.has(s.id));
                if (newSaldo.length > 0) {
                    currentData.ts = [...newSaldo, ...currentData.ts];
                    hasChanges = true;
                }
            }
            if (result.data.attendance) {
                currentData.attendance = { ...currentData.attendance, ...result.data.attendance };
            }
            if (hasChanges) {
                localStorage.setItem('alfaza_db', JSON.stringify(db));
                updateUI();
                refreshHistory();
                if (document.getElementById('page-report').classList.contains('active')) showReport();
                if (document.getElementById('page-graph').classList.contains('active') && userRole === 'owner') refreshGraph();
            }
            lastSyncTime = now;
            return true;
        }
        return false;
    } catch (error) {
        return false;
    } finally {
        isSyncing = false;
    }
}

function updateSyncStatus() {
    const syncText = document.getElementById('sync-text');
    if (!syncText) return;
    if (!navigator.onLine) {
        syncText.innerHTML = '📡 OFFLINE';
        syncText.parentElement.style.background = '#fee2e2';
    } else if (syncQueue.length > 0) {
        syncText.innerHTML = `⏳ SYNC (${syncQueue.length})`;
        syncText.parentElement.style.background = '#fef3c7';
    } else if (isSyncing) {
        syncText.innerHTML = '🔄 SYNC...';
        syncText.parentElement.style.background = '#e0e7ff';
    } else {
        syncText.innerHTML = '☁️ SYNCED';
        syncText.parentElement.style.background = '#eef2ff';
    }
}

function startBackgroundSync() {
    if (bgSyncInterval) clearInterval(bgSyncInterval);
    bgSyncInterval = setInterval(() => {
        if (currentKasir && navigator.onLine && !document.hidden) {
            const activeEl = document.activeElement;
            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            if (!isTyping && !isSyncing) syncFromServer(currentKasir);
        }
    }, 60000);
}

function stopBackgroundSync() {
    if (bgSyncInterval) { clearInterval(bgSyncInterval); bgSyncInterval = null; }
}

function loadPendingSync() {
    const pending = localStorage.getItem('alfaza_pending_sync');
    if (pending) {
        try {
            const oldQueue = JSON.parse(pending);
            if (Array.isArray(oldQueue) && oldQueue.length > 0) {
                syncQueue = [...oldQueue, ...syncQueue];
                localStorage.removeItem('alfaza_pending_sync');
                setTimeout(processSyncQueue, 5000);
            }
        } catch(e) {}
    }
}

window.addEventListener('online', () => {
    showToast('📶 Online, menyinkronkan...', false);
    updateSyncStatus();
    processSyncQueue();
    if (currentKasir) syncFromServer(currentKasir, true);
});

window.addEventListener('offline', () => {
    showToast('⚠️ Offline mode', true);
    updateSyncStatus();
});

window.addEventListener('beforeunload', () => {
    if (syncQueue.length > 0) {
        localStorage.setItem('alfaza_pending_sync', JSON.stringify(syncQueue));
    }
});

function recordAttendance(kasirName) {
    let today = getToday();
    if (!db[kasirName].attendance) db[kasirName].attendance = {};
    if (!db[kasirName].attendance[today]) {
        db[kasirName].attendance[today] = getCurrentTime();
        localStorage.setItem('alfaza_db', JSON.stringify(db));
        return db[kasirName].attendance[today];
    }
    return db[kasirName].attendance[today];
}

function loadAttendanceHistory() {
    let list = [];
    KASIR_NAMES.forEach(k => {
        if (db[k].attendance) {
            Object.entries(db[k].attendance).forEach(([date, time]) => {
                list.push({ date, kasir: k, time });
            });
        }
    });
    list.sort((a,b) => b.date.localeCompare(a.date));
    let html = '';
    list.forEach(item => { html += `<tr><td>${item.date}</td><td>${item.kasir}</td><td>${item.time}</td></tr>`; });
    document.getElementById('attendanceList').innerHTML = html || '<tr><td colspan="3" class="empty">Belum ada data</td></tr>';
}

async function manualSync() {
    if (!currentKasir) { showToast('❌ Tidak ada kasir', true); return; }
    if (!navigator.onLine) { showToast('⚠️ Tidak ada koneksi', true); return; }
    showToast('🔄 Menyinkronkan...', false);
    if (syncQueue.length > 0) await processSyncQueue();
    const success = await syncFromServer(currentKasir, true);
    showToast(success ? '✅ Sinkronisasi selesai' : '⚠️ Gagal sync', !success);
    updateSyncStatus();
}