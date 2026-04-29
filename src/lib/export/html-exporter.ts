// ─── HTML Exporter ───────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { NormalizedFlow } from "@/lib/parsers/types";

export async function generateHTML(
  flowId: string,
  versionId: string,
  userId: string,
  expiresInDays?: number
): Promise<{ html: string; token: string; embedUrl: string }> {
  const version = await prisma.flowVersion.findUniqueOrThrow({
    where: { id: versionId },
    include: { flow: true },
  });
  const flow = version.normalizedJson as unknown as NormalizedFlow;
  const token = crypto.randomBytes(16).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const embedUrl = `${appUrl}/api/embed/${token}`;
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : null;

  await prisma.sharedEmbed.create({
    data: { flowId, versionId, token, createdBy: userId, expiresAt, isActive: true },
  });

  const html = buildHTML(flow, version.flow.name, version.versionNumber);
  return { html, token, embedUrl };
}

function buildHTML(flow: NormalizedFlow, name: string, ver: number): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${name} v${ver} | FlowTrace</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,-apple-system,sans-serif;background:#0a0a0f;color:#e2e8f0;overflow:hidden;height:100vh}
.hdr{position:fixed;top:0;left:0;right:0;height:52px;background:rgba(15,15,25,.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;z-index:100}
.hdr h1{font-size:15px;font-weight:600}.hdr h1 span{color:#818cf8}
.badge{font-size:10px;padding:3px 8px;border-radius:99px;background:rgba(129,140,248,.1);border:1px solid rgba(129,140,248,.2);color:#a5b4fc}
#cc{position:absolute;top:52px;left:0;right:0;bottom:36px;overflow:hidden;cursor:grab}
#cc:active{cursor:grabbing}canvas{display:block}
.ftr{position:fixed;bottom:0;left:0;right:0;height:36px;background:rgba(15,15,25,.95);border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.3)}
.ftr a{color:#818cf8;text-decoration:none;margin-left:4px}
</style></head><body>
<div class="hdr"><h1>Flow<span>Trace</span> — ${name} v${ver}</h1><span class="badge">${flow.nodes.length} nodes</span></div>
<div id="cc"><canvas id="cv"></canvas></div>
<div class="ftr">Powered by <a href="https://flowtrace.io" target="_blank">FlowTrace</a></div>
<script>
const N=${JSON.stringify(flow.nodes)},E=${JSON.stringify(flow.edges)};
const cv=document.getElementById('cv'),cx=cv.getContext('2d'),cc=document.getElementById('cc');
let ox=0,oy=0,sc=1,dr=false,sx=0,sy=0;const np=new Map(),W=170,H=55,GX=55,GY=80;
const tc={START:'#22c55e',MENU:'#3b82f6',PROMPT:'#64748b',CONDITION:'#f59e0b',TRANSFER:'#a855f7',API_CALL:'#f97316',QUEUE:'#0d9488',HANGUP:'#ef4444',VOICEMAIL:'#6366f1',UNKNOWN:'#71717a'};
function layout(){const a=new Map,d=new Map;N.forEach(n=>{a.set(n.id,[]);d.set(n.id,0)});E.forEach(e=>{a.get(e.source)?.push(e.target);d.set(e.target,(d.get(e.target)||0)+1)});
const ls=[],v=new Set,q=[];N.forEach(n=>{if((d.get(n.id)||0)===0)q.push(n.id)});if(!q.length&&N.length)q.push(N[0].id);
while(q.length){const l=[...q];ls.push(l);q.length=0;for(const id of l){v.add(id);for(const t of(a.get(id)||[])){d.set(t,(d.get(t)||0)-1);if(d.get(t)<=0&&!v.has(t))q.push(t)}}}
N.forEach(n=>{if(!v.has(n.id)){ls.push([n.id]);v.add(n.id)}});
ls.forEach((l,li)=>{const tw=l.length*W+(l.length-1)*GX;const sx=-tw/2;l.forEach((id,ni)=>{np.set(id,{x:sx+ni*(W+GX),y:li*(H+GY)})})});}
function rs(){cv.width=cc.clientWidth*devicePixelRatio;cv.height=cc.clientHeight*devicePixelRatio;cv.style.width=cc.clientWidth+'px';cv.style.height=cc.clientHeight+'px';cx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);dw();}
function ts(x,y){return{x:x*sc+ox+cc.clientWidth/2,y:y*sc+oy+60}}
function dw(){cx.clearRect(0,0,cv.width/devicePixelRatio,cv.height/devicePixelRatio);
E.forEach(e=>{const f=np.get(e.source),t=np.get(e.target);if(!f||!t)return;const a=ts(f.x+W/2,f.y+H),b=ts(t.x+W/2,t.y);cx.beginPath();cx.moveTo(a.x,a.y);cx.bezierCurveTo(a.x,a.y+25*sc,b.x,b.y-25*sc,b.x,b.y);cx.strokeStyle='rgba(100,116,139,.4)';cx.lineWidth=1.5;cx.stroke();
if(e.label){const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};cx.font=(8*sc)+'px sans-serif';cx.fillStyle='rgba(148,163,184,.6)';cx.textAlign='center';cx.fillText(e.label,m.x,m.y)}});
N.forEach(n=>{const p=np.get(n.id);if(!p)return;const s=ts(p.x,p.y),w=W*sc,h=H*sc,c=tc[n.type]||'#71717a';cx.beginPath();cx.roundRect(s.x,s.y,w,h,6*sc);cx.fillStyle=c+'18';cx.fill();cx.strokeStyle=c+'60';cx.lineWidth=1;cx.stroke();
cx.font='600 '+(10*sc)+'px sans-serif';cx.fillStyle='#e2e8f0';cx.textAlign='center';const lb=n.label.length>20?n.label.slice(0,19)+'…':n.label;cx.fillText(lb,s.x+w/2,s.y+h/2-3*sc);
cx.font=(8*sc)+'px sans-serif';cx.fillStyle=c;cx.fillText(n.type,s.x+w/2,s.y+h/2+10*sc)});}
cc.addEventListener('mousedown',e=>{dr=true;sx=e.clientX-ox;sy=e.clientY-oy});
window.addEventListener('mousemove',e=>{if(dr){ox=e.clientX-sx;oy=e.clientY-sy;dw()}});
window.addEventListener('mouseup',()=>{dr=false});
cc.addEventListener('wheel',e=>{e.preventDefault();sc=Math.max(.2,Math.min(3,sc*(e.deltaY>0?.9:1.1)));dw()},{passive:false});
layout();rs();window.addEventListener('resize',rs);
</script></body></html>`;
}
