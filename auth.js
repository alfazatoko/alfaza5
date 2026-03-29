function doLogin() {
    let u = document.getElementById('user-name').value;
    let p = document.getElementById('user-pin').value;
    
    if (PINS[u] === p) {
        currentUser = u;
        userRole = (u === "OWNER") ? "owner" : "kasir";
        
        if (userRole === "owner") {
            currentKasir = null;
            currentData = db.OWNER;
            document.getElementById('ownerPanel').style.display = 'block';
            document.getElementById('navSaldo').style.display = 'none';
            document.getElementById('navGraph').style.display = 'block';
            document.getElementById('userName').innerHTML = currentUser + ' OWNER';
            document.getElementById('attendanceTime').innerHTML = '-';
            loadAttendanceHistory();
        } else {
            currentKasir = u;
            currentData = db[u];
            document.getElementById('ownerPanel').style.display = 'none';
            document.getElementById('navSaldo').style.display = 'block';
            document.getElementById('navGraph').style.display = 'none';
            document.getElementById('userName').innerHTML = currentUser;
            
            loadPendingSync();
            startBackgroundSync();
            syncFromServer(currentKasir, true);
            
            let absen = recordAttendance(currentKasir);
            document.getElementById('attendanceTime').innerHTML = absen;
            queueSync('recordAttendance', { tanggal: getToday(), jam: getCurrentTime() });
        }
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        let now = new Date();
        document.getElementById('loginTime').innerHTML = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
        let jam = now.getHours();
        document.getElementById('userShift').innerHTML = (jam >= 6 && jam < 15) ? "🌅 Pagi" : "🌙 Malam";
        
        let today = getToday();
        document.getElementById('dateStart').value = today;
        document.getElementById('dateEnd').value = today;
        document.getElementById('reportDate').value = today;
        document.getElementById('graphStart').value = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
        document.getElementById('graphEnd').value = today;
        
        updateUI();
        refreshHistory();
        updateLiveClock();
        updateDateDisplay();
        startQuoteRotator();
        initKeyboardNav();
    } else {
        alert("PIN SALAH!");
    }
}

function selectKasir(kasir, el) {
    document.querySelectorAll('#kasirSelector .filter-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    currentKasir = kasir;
    currentData = db[kasir];
    document.getElementById('userName').innerHTML = kasir;
    updateUI();
    refreshHistory();
    let absen = recordAttendance(currentKasir);
    document.getElementById('attendanceTime').innerHTML = absen;
    if (document.getElementById('page-report').classList.contains('active')) showReport();
    if (document.getElementById('page-graph').classList.contains('active')) refreshGraph();
}

function logout() {
    if (syncQueue.length > 0 && navigator.onLine) {
        showToast('📤 Menyimpan data...', false);
        processSyncQueue().finally(() => {
            stopBackgroundSync();
            if (confirm('Keluar?')) {
                document.getElementById('login-screen').style.display = 'flex';
                document.getElementById('main-app').style.display = 'none';
                document.getElementById('user-pin').value = '';
            }
        });
    } else {
        stopBackgroundSync();
        if (confirm('Keluar?')) {
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('main-app').style.display = 'none';
            document.getElementById('user-pin').value = '';
        }
    }
}