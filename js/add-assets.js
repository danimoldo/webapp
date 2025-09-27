// js/add-assets.js — Stage 1 engine
const SPEED_MPS = 5 * 1000 / 3600;
const DEFAULT_SCALE = 2.0;

const state = { machines: [], extinguishers: [], running: true, scale: DEFAULT_SCALE,
  draggingExt: null, dragOffset:{x:0,y:0}, lastT: performance.now() };

const stage = document.getElementById('stage') || document.body;
stage.style.position = stage.style.position || 'relative';

function el(t,cls,html){const e=document.createElement(t);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function uid(p){return p+'-'+Math.random().toString(36).slice(2,6).toUpperCase();}
function tagFromCount(type,count){return (type==='forklift'?'F':'L')+'-'+String(count+1).padStart(3,'0');}
function rand(a,b){return Math.random()*(b-a)+a;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

const api={
 addForklift(x,y){const id=uid('M'),tag=tagFromCount('forklift',state.machines.filter(m=>m.type==='forklift').length);
  const m={id,type:'forklift',tag,x:x??rand(40,500),y:y??rand(40,500)};state.machines.push(m);drawMachine(m);return m;},
 addLifter(x,y){const id=uid('M'),tag=tagFromCount('lifter',state.machines.filter(m=>m.type==='lifter').length);
  const m={id,type:'lifter',tag,x:x??rand(40,500),y:y??rand(40,500)};state.machines.push(m);drawMachine(m);return m;},
 addExtinguisher(x,y,expiresDays=120){const id=uid('X'),tag=`X-${String(state.extinguishers.length+1).padStart(3,'0')}`;
  const ex={id,tag,x:x??rand(20,520),y:y??rand(20,520),expiresAt:Date.now()+expiresDays*86400000};
  state.extinguishers.push(ex);drawExtinguisher(ex);return ex;},
 setScale(px){state.scale=px;}, start(){state.running=true;}, stop(){state.running=false;}, getState(){return state;}
};

function drawMachine(m){let node=document.getElementById(m.id);
 if(!node){node=el('div','asset machine '+m.type);node.id=m.id;node.title=(m.type==='forklift'?'Stivuitor':'Lifter')+' '+m.tag;
  node.append(el('div','glyph',m.type==='forklift'?'🚜':'🤖'));node.append(el('span','label',m.tag));stage.append(node);}
 node.style.transform=`translate(${m.x}px,${m.y}px)`;}

function drawExtinguisher(x){let node=document.getElementById(x.id);
 if(!node){node=el('div','asset ext');node.id=x.id;node.title='Extinctor '+x.tag;
  node.append(el('div','glyph','🧯'));node.append(el('span','label',x.tag));
  node.addEventListener('mousedown',e=>beginDragExt(e,x.id));stage.append(node);}
 node.style.transform=`translate(${x.x}px,${x.y}px)`;node.classList.toggle('expired',Date.now()>x.expiresAt);}

function beginDragExt(e,id){const ex=state.extinguishers.find(a=>a.id===id);if(!ex)return;
 const node=document.getElementById(id);const r=node.getBoundingClientRect();const rect=stage.getBoundingClientRect();
 state.draggingExt=ex;state.dragOffset.x=e.clientX-r.left;state.dragOffset.y=e.clientY-r.top;
 window.addEventListener('mousemove',onDragExt);window.addEventListener('mouseup',endDragExt);e.preventDefault();}
function onDragExt(e){if(!state.draggingExt)return;const rect=stage.getBoundingClientRect();
 const x=e.clientX-rect.left-state.dragOffset.x,y=e.clientY-rect.top-state.dragOffset.y;
 state.draggingExt.x=clamp(x,0,rect.width-24);state.draggingExt.y=clamp(y,0,rect.height-24);drawExtinguisher(state.draggingExt);}
function endDragExt(){state.draggingExt=null;window.removeEventListener('mousemove',onDragExt);window.removeEventListener('mouseup',endDragExt);}

function ensureTargets(){for(const m of state.machines){if(!m.tx||Math.hypot(m.tx-m.x,m.ty-m.y)<8){const r=stage.getBoundingClientRect();
 m.tx=Math.random()*(r.width-32)+16;m.ty=Math.random()*(r.height-32)+16;}}}
function tick(dt){ensureTargets();const pxps=SPEED_MPS*state.scale;const maxStep=pxps*(dt/1000);
 for(const m of state.machines){const dx=m.tx-m.x,dy=m.ty-m.y,dist=Math.hypot(dx,dy)||1;const step=Math.min(maxStep,dist);
 m.x+=dx/dist*step;m.y+=dy/dist*step;drawMachine(m);}for(const x of state.extinguishers)drawExtinguisher(x);} 
function loop(t){const dt=t-state.lastT;state.lastT=t;if(state.running)tick(dt);requestAnimationFrame(loop);}requestAnimationFrame(loop);

const tb=document.getElementById('add-toolbar');if(tb){const mk=(cls,txt)=>{const b=el('button','btn '+cls,txt);tb.append(b);return b;};
 mk('add-f','Adaugă stivuitor').addEventListener('click',()=>api.addForklift());
 mk('add-l','Adaugă lifter').addEventListener('click',()=>api.addLifter());
 mk('add-x','Adaugă extinctor').addEventListener('click',()=>api.addExtinguisher());}

window.AssetsAdd=api;export default api;
