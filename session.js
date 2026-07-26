const sessionInput=document.getElementById('sessionInput');
const joinSessionBtn=document.getElementById('joinSessionBtn');
const resetSessionBtn=document.getElementById('resetSessionBtn');
const sessionStatus=document.getElementById('sessionStatus');
const storageKeyBase='drawlots-state';

function getCurrentSession(){
return (sessionInput.value || 'shared').trim() || 'shared';
}

function getStorageKey(sessionName){
return storageKeyBase+':'+sessionName;
}

function updateStatus(sessionName){
sessionStatus.textContent='Session: '+sessionName;
history.replaceState({},'',window.location.pathname+'?session='+encodeURIComponent(sessionName));
}

function applySession(){
const sessionName=getCurrentSession();
updateStatus(sessionName);
}

function resetSession(){
const sessionName=getCurrentSession();
localStorage.removeItem(getStorageKey(sessionName));
updateStatus(sessionName);
}

joinSessionBtn.onclick=()=>applySession();
resetSessionBtn.onclick=()=>resetSession();

const params=new URLSearchParams(window.location.search);
if(params.get('session')){
sessionInput.value=params.get('session');
}
applySession();
