/**
 * Mock Sewio-like RTLS WebSocket feed
 * Usage:
 *   npm i ws express
 *   node server/mock-ws.js
 */
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const app = express();
const portHttp = 8080;
const portWs = 8081;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/..'));
app.listen(portHttp, ()=>console.log(`[HTTP] http://localhost:${portHttp}`));

const wss = new WebSocketServer({ port: portWs, path: '/positions' });
console.log(`[WS] ws://localhost:${portWs}/positions`);

let assets = [
  { id:'FORK-001', type:'forklift', pos:[30,30], vel:[1,0.4] },
  { id:'FORK-002', type:'forklift', pos:[110,40], vel:[-1,0.3] },
  { id:'LIFT-101', type:'lifter', pos:[80,120], vel:[-0.5,-0.7] },
  { id:'LIFT-102', type:'lifter', pos:[140,90], vel:[0.2,-0.9] },
  { id:'EXT-01', type:'extinguisher', pos:[200,70], vel:[0,0] },
];

setInterval(()=>{
  for(const a of assets){
    a.pos[0]+=a.vel[0]; a.pos[1]+=a.vel[1];
    if(a.pos[0]<0||a.pos[0]>250) a.vel[0]*=-1;
    if(a.pos[1]<0||a.pos[1]>150) a.vel[1]*=-1;
    a.battery = Math.max(20, Math.min(100, (a.battery||100) - Math.random()*0.1));
    a.rssi = -40 - Math.random()*30;
    a.anchorId = 'ANCH-'+(1+Math.floor(Math.random()*4));
  }
  const payload = JSON.stringify({ assets });
  wss.clients.forEach(c=>{ try{ c.send(payload); }catch(e){} });
}, 1000);

// REST endpoints
app.get('/api/assets', (req,res)=>res.json({ assets }));
let workorders = [{ id:'WO-1001', asset_id:'FORK-001', title:'Schimbă roata stânga', status:'Nouă' }];
app.get('/api/workorders', (req,res)=>res.json({ workorders }));
app.post('/api/workorders', (req,res)=>{ const w=req.body; if(!w.id) w.id='WO-'+Math.random().toString(36).slice(2,7).toUpperCase(); workorders.push(w); res.json(w); });
