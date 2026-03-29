// Utility Functions
function formatRupiah(el) { 
    let v = el.value.replace(/\D/g,''); 
    el.value = v ? new Intl.NumberFormat('id-ID').format(v) : ''; 
}

function toNumber(v) { 
    return parseInt(v.toString().replace(/\D/g,'')) || 0; 
}

function formatNumber(v) { 
    return new Intl.NumberFormat('id-ID').format(v); 
}

function showToast(msg, isError=false) { 
    let t=document.getElementById('toast'); 
    t.innerText=msg; 
    t.style.backgroundColor=isError?'#e74c3c':'#2b67f6'; 
    t.style.opacity='1'; 
    setTimeout(()=>t.style.opacity='0',2000); 
}

function getToday() { 
    return new Date().toISOString().split('T')[0]; 
}

function getCurrentTime() { 
    return new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}); 
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}