const sundayAssignments=['1st Sunday','2nd Sunday','3rd Sunday','4th Sunday','5th Sunday'];
const groupAssignments={
1:{label:'Groups 1 and 6',assignment:'Dong and Rod'},
2:{label:'Groups 2 and 3',assignment:'Jude and Alpo'},
3:{label:'Groups 4 and 5',assignment:'Mike and Ariel'},
7:{label:'Group 7',assignment:'Mark'}
};
const storageKeyBase='drawlots-state';
let currentSessionId=new URLSearchParams(window.location.search).get('session') || '1st session';
let remainingSundays=[...sundayAssignments];
let drawnGroups=[];
let drawResults={};
let sharedChannel=null;

const hand=document.getElementById('hand');
const bowl=document.getElementById('bowl');
const btn=document.getElementById('drawBtn');
const result=document.getElementById('result');
const resultLabel=document.getElementById('resultLabel');
const drawResultPanel=document.getElementById('drawResultPanel');
const groupSelect=document.getElementById('groupSelect');
const sessionSelect=document.getElementById('sessionSelect');

function getActiveSessions(){
  const sessions=[];
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key && key.startsWith(storageKeyBase+':')){
      const sessionName=key.slice(storageKeyBase.length+1);
      if(!sessions.includes(sessionName)){
        sessions.push(sessionName);
      }
    }
  }
  if(!sessions.includes('1st session')){
    sessions.unshift('1st session');
  }
  return sessions.sort((a,b)=>a.localeCompare(b, undefined, {numeric:true, sensitivity:'base'}));
}

function populateSessionSelect(){
  if(!sessionSelect){
    return;
  }
  const sessions=getActiveSessions();
  sessionSelect.innerHTML=sessions.map((name)=>`<option value="${name}">${name}</option>`).join('');
  if(!sessions.includes(currentSessionId)){
    currentSessionId=sessions[0] || '1st session';
  }
  sessionSelect.value=currentSessionId;
}

function getStorageKey(){
return storageKeyBase+':'+currentSessionId;
}

function getNextSunday(){
if(remainingSundays.length===0){
remainingSundays=[...sundayAssignments];
}
const randomIndex=Math.floor(Math.random()*remainingSundays.length);
const sunday=remainingSundays.splice(randomIndex,1)[0];
return sunday;
}

function refreshGroupOptions(){
const options=[...groupSelect.options];
options.forEach((option)=>{
if(option.value===''){return;}
const value=option.value;
option.hidden=drawnGroups.includes(value);
});
}

function renderDrawResults(){
const entries=Object.keys(groupAssignments)
.map((key)=>Number(key))
.sort((a,b)=>a-b)
.map((groupKey)=>{
const assignment=groupAssignments[groupKey];
const sunday=drawResults[groupKey] || 'Not drawn yet';
return '<div class="draw-entry"><strong>'+assignment.label+'</strong><br>'+assignment.assignment+'<br><span class="draw-status">'+sunday+'</span></div>';
})
.join('');

drawResultPanel.innerHTML=entries;
}

function persistState(){
const state={remainingSundays,drawnGroups,drawResults};
localStorage.setItem(getStorageKey(), JSON.stringify(state));
if(sharedChannel){
sharedChannel.postMessage({type:'state-update',sessionId:currentSessionId,state});
}
}

function loadState(){
try{
const saved=localStorage.getItem(getStorageKey());
if(saved){
const parsed=JSON.parse(saved);
remainingSundays=parsed.remainingSundays && parsed.remainingSundays.length ? parsed.remainingSundays : [...sundayAssignments];
drawnGroups=parsed.drawnGroups || [];
drawResults=parsed.drawResults || {};
}
else{
remainingSundays=[...sundayAssignments];
drawnGroups=[];
drawResults={};
}
}
catch(error){
remainingSundays=[...sundayAssignments];
drawnGroups=[];
drawResults={};
}
}

function applySession(sessionName){
currentSessionId=(sessionName||'1st session').trim() || '1st session';
history.replaceState({},'',window.location.pathname+'?session='+encodeURIComponent(currentSessionId));
if(sessionSelect){
sessionSelect.value=currentSessionId;
}
loadState();
refreshGroupOptions();
renderDrawResults();
persistState();
}

function resetSession(){
remainingSundays=[...sundayAssignments];
drawnGroups=[];
drawResults={};
refreshGroupOptions();
renderDrawResults();
persistState();
}

if('BroadcastChannel' in window){
sharedChannel=new BroadcastChannel('drawlots-shared');
sharedChannel.onmessage=(event)=>{
if(event.data && event.data.type==='state-update' && event.data.sessionId===currentSessionId){
remainingSundays=event.data.state.remainingSundays || [...sundayAssignments];
drawnGroups=event.data.state.drawnGroups || [];
drawResults=event.data.state.drawResults || {};
refreshGroupOptions();
renderDrawResults();
}
};
}

window.addEventListener('storage',(event)=>{
if(event.key===getStorageKey()){
loadState();
refreshGroupOptions();
renderDrawResults();
}
});

const params=new URLSearchParams(window.location.search);
populateSessionSelect();
if(params.get('session')){
applySession(params.get('session'));
}else{
applySession(currentSessionId);
}

if(sessionSelect){
sessionSelect.onchange=()=>applySession(sessionSelect.value);
}

btn.onclick=()=>{
const selectedGroup=groupSelect.value;
if(!selectedGroup){
resultLabel.textContent='Current G-group';
result.className='result show';
result.innerHTML='Please select a G-group number.';
return;
}

if(drawnGroups.includes(selectedGroup)){
resultLabel.textContent='Current G-group';
result.className='result show';
result.innerHTML='This group has already been drawn.';
return;
}

btn.disabled=true;resultLabel.textContent='Current G-group';result.className='result';result.innerHTML='';
hand.classList.add('animate');bowl.classList.add('shuffle');
setTimeout(()=>bowl.classList.remove('shuffle'),2200);
setTimeout(()=>hand.style.top='-80px',2600);
setTimeout(()=>{
const assignment=groupAssignments[selectedGroup];
const sunday=getNextSunday();
drawnGroups.push(selectedGroup);
drawResults[selectedGroup]=sunday;
refreshGroupOptions();
renderDrawResults();
drawResults[selectedGroup]=sunday;
persistState();
result.innerHTML='🎉<br><strong>'+assignment.label+'</strong><br>'+assignment.assignment+'<br>'+sunday;
result.classList.add('show');
hand.classList.remove('animate');hand.style.top='-120px';
btn.disabled=false;
},3500);
};