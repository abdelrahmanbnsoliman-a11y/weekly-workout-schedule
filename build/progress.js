
/* ===== Progress & goal ===== */
let goal=load("mf-goal",null);
let weights=load("mf-weights",{});
const fd=d=>d.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const isDone=e=>!!e&&(e.m===true||(e.m!==false&&e.t>0&&e.n/e.t>=0.5));
const isPartial=e=>!!e&&!isDone(e)&&e.m!==false&&e.n>0;

function goalDays(){
  const s=parse(goal.start),week=PLANS[goal.plan].week;
  return Array.from({length:goal.weeks*7},(_,k)=>{const d=addDays(s,k),key=iso(d);return {k,d,key,planned:week[dIdx(d)],e:log[key]}});
}
function barPath(x,y,w,h,r){
  if(h<=0)return "";r=Math.min(r,h,w/2);
  return `M${x},${y+h}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h}Z`;
}
const tipAttr=s=>`data-tip="${esc(s)}"`;

function weekChart(days){
  const t=todayIso(),weeks=[];
  for(let k=0;k<goal.weeks;k++){const sl=days.slice(k*7,k*7+7);
    weeks.push({p:sl.filter(x=>x.planned).length,d:sl.filter(x=>x.key<=t&&isDone(x.e)).length,from:sl[0].d,to:sl[6].d,started:sl[0].key<=t})}
  const VW=640,VH=210,L=26,R=6,T=18,B=24,pw=VW-L-R,ph=VH-T-B;
  const max=Math.max(1,...weeks.map(w=>Math.max(w.p,w.d)));
  const y=v=>T+ph-v/max*ph,slot=pw/weeks.length,bw=Math.min(54,slot*.62);
  let g="";
  for(let v=0;v<=max;v++)g+=`<line class="grid" x1="${L}" x2="${VW-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  weeks.forEach((w,k)=>{
    const cx=L+slot*k+slot/2,base=T+ph;
    g+=`<path d="${barPath(cx-bw/2,y(w.p),bw,base-y(w.p),4)}" style="fill:var(--line)"/>`;
    const iw=bw*.56;
    if(w.d>0)g+=`<path d="${barPath(cx-iw/2,y(w.d),iw,base-y(w.d),4)}" style="fill:var(--legs)"/>`;
    if(w.started)g+=`<text class="v" x="${cx}" y="${y(Math.max(w.p,w.d))-5}" text-anchor="middle">${w.d}/${w.p}</text>`;
    g+=`<text x="${cx}" y="${VH-6}" text-anchor="middle">W${k+1}</text>`;
    g+=`<rect class="hit" x="${L+slot*k}" y="${T}" width="${slot}" height="${ph}" ${tipAttr(`<b>Week ${k+1}</b> · ${fd(w.from)} – ${fd(w.to)}<br>${w.started?`${w.d} of ${w.p} workouts done`:`${w.p} workouts planned`}`)}/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Workouts done each week compared with planned">${g}</svg>
    <div class="lg"><span><i style="background:var(--legs)"></i>Done</span><span><i style="background:var(--line)"></i>Planned</span></div>`;
}

function paceChart(days){
  const t=todayIso(),N=days.length;let cp=0,ca=0;
  const pts=days.map(x=>{if(x.planned)cp++;const past=x.key<=t;if(past&&isDone(x.e))ca++;return {x,cp,ca:past?ca:null}});
  const VW=640,VH=220,L=26,R=10,T=14,B=24,pw=VW-L-R,ph=VH-T-B;
  const max=Math.max(1,cp,ca),step=max>12?Math.ceil(max/6):max>6?2:1;
  const X=k=>L+(N>1?k/(N-1):0)*pw,Y=v=>T+ph-v/max*ph;
  let g="";
  for(let v=0;v<=max;v+=step)g+=`<line class="grid" x1="${L}" x2="${VW-R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`;
  for(let k=0;k<N;k+=7)g+=`<text x="${X(k)}" y="${VH-6}" text-anchor="${k===0?"start":"middle"}">${fd(days[k].d)}</text>`;
  const ti=days.findIndex(x=>x.key===t);
  if(ti>=0)g+=`<line x1="${X(ti)}" x2="${X(ti)}" y1="${T}" y2="${T+ph}" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3"/><text x="${X(ti)+4}" y="${T+10}">today</text>`;
  g+=`<polyline points="${pts.map((p,k)=>`${X(k)},${Y(p.cp)}`).join(" ")}" style="fill:none;stroke:var(--muted);stroke-width:2;stroke-dasharray:5 4"/>`;
  const act=pts.map((p,k)=>p.ca==null?null:`${X(k)},${Y(p.ca)}`).filter(Boolean);
  if(act.length){
    g+=`<polyline points="${act.join(" ")}" style="fill:none;stroke:var(--back);stroke-width:2.5;stroke-linejoin:round"/>`;
    const li=act.length-1;
    g+=`<circle cx="${X(li)}" cy="${Y(pts[li].ca)}" r="5" style="fill:var(--back);stroke:var(--paper);stroke-width:2"/>`;
  }
  const hw=pw/Math.max(1,N-1);
  pts.forEach((p,k)=>{g+=`<rect class="hit" x="${X(k)-hw/2}" y="${T}" width="${hw}" height="${ph}" ${tipAttr(`<b>${fd(p.x.d)}</b><br>Planned by now: ${p.cp}${p.ca!=null?`<br>Done by now: ${p.ca}`:""}`)}/>`});
  return `<svg class="chart" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Workouts done so far against the planned pace">${g}</svg>
    <div class="lg"><span><i class="ln" style="color:var(--back)"></i>Your workouts</span><span><i class="dash" style="color:var(--muted)"></i>Planned pace</span></div>`;
}

function weightChart(days){
  const s=days[0].key,e=days[days.length-1].key,N=days.length;
  const pts=Object.keys(weights).filter(k=>k>=s&&k<=e).sort().map(k=>({k,v:weights[k],i:Math.round((parse(k)-parse(s))/864e5)}));
  const hasGoal=goal.w0&&goal.w1;
  if(!pts.length&&!hasGoal)return `<p class="empty-note">Log your weight to see it charted here.</p>`;
  const vals=pts.map(p=>p.v).concat(hasGoal?[goal.w0,goal.w1]:[]);
  let lo=Math.floor(Math.min(...vals)-1),hi=Math.ceil(Math.max(...vals)+1);
  const VW=640,VH=200,L=34,R=10,T=14,B=24,pw=VW-L-R,ph=VH-T-B;
  const X=i=>L+(N>1?i/(N-1):0)*pw,Y=v=>T+ph-(v-lo)/(hi-lo)*ph,step=Math.max(1,Math.ceil((hi-lo)/5));
  let g="";
  for(let v=lo;v<=hi;v+=step)g+=`<line class="grid" x1="${L}" x2="${VW-R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`;
  for(let k=0;k<N;k+=7)g+=`<text x="${X(k)}" y="${VH-6}" text-anchor="${k===0?"start":"middle"}">${fd(days[k].d)}</text>`;
  if(hasGoal)g+=`<line x1="${X(0)}" y1="${Y(goal.w0)}" x2="${X(N-1)}" y2="${Y(goal.w1)}" style="stroke:var(--muted);stroke-width:2;stroke-dasharray:5 4"/>
    <text x="${X(N-1)}" y="${Y(goal.w1)-8}" text-anchor="end">target ${goal.w1} kg</text>`;
  if(pts.length>1)g+=`<polyline points="${pts.map(p=>`${X(p.i)},${Y(p.v)}`).join(" ")}" style="fill:none;stroke:var(--arms);stroke-width:2.5;stroke-linejoin:round"/>`;
  pts.forEach(p=>{g+=`<circle cx="${X(p.i)}" cy="${Y(p.v)}" r="4.5" style="fill:var(--arms);stroke:var(--paper);stroke-width:2"/>
    <circle class="hit" cx="${X(p.i)}" cy="${Y(p.v)}" r="12" ${tipAttr(`<b>${fd(parse(p.k))}</b><br>${p.v} kg`)}/>`});
  return `<svg class="chart" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Body weight over the goal">${g}</svg>
    <div class="lg"><span><i class="ln" style="color:var(--arms)"></i>Your weight</span>${hasGoal?`<span><i class="dash" style="color:var(--muted)"></i>Target path</span>`:""}</div>`;
}

function calendar(days){
  const t=todayIso();
  let h=DAYS.map(d=>`<div class="hd">${d.slice(0,3)}</div>`).join("");
  h+=`<div class="cell empty"></div>`.repeat(dIdx(days[0].d));
  days.forEach(x=>{
    const w=x.planned||(x.e&&x.e.w),col=w?G[W[w].c]:"var(--rest)",past=x.key<=t;
    let cls="",lb=x.planned?esc(W[x.planned].name):"Rest";
    if(isDone(x.e)){cls="done";lb=x.e.w?esc(W[x.e.w].name):"Workout"}
    else if(past&&isPartial(x.e)){cls="partial";lb=`${x.e.n}/${x.e.t} done`}
    else if(x.key<t&&x.planned){cls="missed";lb="✕ Missed"}
    else if(!x.planned)cls="rest";
    if(x.key===t)cls+=" today";
    const tag=past?"button":"div",extra=past?` type="button" data-day="${x.key}" title="Click to mark as ${isDone(x.e)?"not done":"done"}"`:"";
    h+=`<${tag} class="cell ${cls}" style="--c:${col}"${extra}><span class="dt">${x.d.getDate()===1||x.k===0?fd(x.d):x.d.getDate()}</span><span class="lb">${lb}</span></${tag}>`;
  });
  return `<div class="cal">${h}</div>
    <div class="lg"><span><i style="background:var(--legs)"></i>Done</span><span><i style="background:color-mix(in srgb,var(--legs) 22%,transparent);border:1px solid var(--legs)"></i>Started</span><span><i style="border:2px dashed var(--chest)"></i>Missed</span><span><i style="border:1px solid var(--line)"></i>Planned</span></div>`;
}

function renderHistory(){
  const el=document.getElementById("history");
  const keys=Object.keys(log).filter(k=>isDone(log[k])||isPartial(log[k])).sort().reverse();
  if(!keys.length){el.innerHTML=`<div class="card"><h2>Weekly record</h2><p class="cap">Every week you train will be listed here, with the days you trained and the exercises you ticked.</p></div>`;return}
  const weeks=new Map();
  keys.forEach(k=>{const d=parse(k),ws=iso(addDays(d,-dIdx(d)));if(!weeks.has(ws))weeks.set(ws,[]);weeks.get(ws).push(k)});
  const cur=iso(addDays(new Date(),-dIdx(new Date())));
  let first=true,h="";
  weeks.forEach((ks,ws)=>{
    const s=parse(ws),wo=ks.filter(k=>isDone(log[k])).length,ex=ks.reduce((a,k)=>a+(log[k].n||0),0);
    const rows=ks.slice().reverse().map(k=>{const e=log[k],d=parse(k),nm=e.w&&W[e.w]?W[e.w].name:"Workout";
      const what=e.n?`${e.n} of ${e.t} exercises`:"marked done";
      return `<div class="hrow" style="--c:${e.w&&W[e.w]?G[W[e.w].c]:"var(--rest)"}"><span class="hday">${DAYS[dIdx(d)].slice(0,3)} ${fd(d)}</span>
        <span><b>${esc(nm)}</b>${e.eq==="home"?" · Home":e.eq==="gym"?" · Gym":""} · ${what}${isDone(e)?"":" (not finished)"}
        ${e.x&&e.x.length?`<span class="hex">${e.x.map(n=>esc(n)+(lifts[n]&&lifts[n][k]!=null?` <b>${kgFmt(lifts[n][k])} kg</b>`:"")).join(" · ")}</span>`:""}</span></div>`}).join("");
    h+=`<details class="wk"${first?" open":""}><summary><span><b>${fd(s)} – ${fd(addDays(s,6))}</b>${ws===cur?" · this week":""}</span>
      <span class="wsum">${wo} workout${wo===1?"":"s"} · ${ex} exercise${ex===1?"":"s"}</span></summary>${rows}</details>`;
    first=false;
  });
  el.innerHTML=`<div class="card"><h2>Weekly record</h2><p class="cap">Every week you've trained, newest first. Click a week to open it.</p>${h}</div>`;
}

function renderP(){
  renderStrength();
  renderHistory();
  const out=document.getElementById("progress");
  if(!goal){out.innerHTML="";openForm();return}
  const days=goalDays(),t=todayIso(),end=days[days.length-1];
  const target=days.filter(x=>x.planned).length;
  const done=days.filter(x=>x.key<=t&&isDone(x.e)).length;
  const due=days.filter(x=>x.planned&&(x.key<t||(x.key===t&&isDone(x.e)))).length;
  const commit=due?Math.min(100,Math.round(done/due*100)):null;
  let streak=0;days.forEach(x=>{if(x.key>t)return;if(isDone(x.e))streak++;else if(x.planned&&x.key<t)streak=0});
  const left=Math.max(0,Math.round((parse(end.key)-parse(t))/864e5)+(t<=end.key?1:0));
  const notStarted=t<goal.start,over=t>end.key;
  const pct=Math.min(100,Math.round(done/Math.max(1,target)*100));
  const status=notStarted?`Starts ${fd(parse(goal.start))}`:over?`Finished · you did ${done} of ${target} workouts`:`${left} day${left===1?"":"s"} left`;
  const lw=Object.keys(weights).sort().pop();
  out.innerHTML=`<div class="ghead"><div><h2>${goal.weeks===4?"1-month":goal.weeks===8?"2-month":goal.weeks===12?"3-month":goal.weeks+"-week"} goal</h2>
      <p>${fd(days[0].d)} – ${fd(end.d)} · ${PLANS[goal.plan].label} a week, ${esc(PLANS[goal.plan].tag)} · ${status}</p></div>
      <button type="button" class="btn ghost" id="g-edit">Edit goal</button></div>
    <div class="stats">
      <div class="stat"><span class="lbl">Workouts done</span><span class="big">${done}<small> / ${target}</small></span><div class="meter"><i style="width:${pct}%"></i></div></div>
      <div class="stat"><span class="lbl">Commitment</span><span class="big">${commit==null?"–":commit+"%"}</span><span class="hint">${commit==null?"after your first planned day":`${done} of ${due} planned so far`}</span></div>
      <div class="stat"><span class="lbl">Streak</span><span class="big">${streak}</span><span class="hint">workouts without a miss</span></div>
      <div class="stat"><span class="lbl">${over?"Result":"Still to do"}</span><span class="big">${over?pct+"%":Math.max(0,target-done)}</span><span class="hint">${over?"of your target":"workouts to hit target"}</span></div>
    </div>
    <div class="card"><h2>Calendar</h2><p class="cap">Click any day up to today to mark it done or not done.</p>${calendar(days)}</div>
    <div class="card"><h2>Each week</h2><p class="cap">Workouts done compared with your plan.</p>${weekChart(days)}</div>
    <div class="card"><h2>On pace?</h2><p class="cap">Stay on or above the dashed line to hit your target.</p>${paceChart(days)}</div>
    <div class="card"><h2>Body weight</h2><p class="cap">${goal.w1?`Target: ${goal.w1} kg by ${fd(end.d)}.`:"Optional. Add a target weight in Edit goal."}${lw?` Last logged: ${weights[lw]} kg on ${fd(parse(lw))}.`:""}</p>
      <div class="wlog"><label>Date<input type="date" id="w-date" value="${t}"></label><label>Weight (kg)<input type="number" id="w-val" inputmode="decimal" step="0.1" min="35" max="250"></label>
      <button type="button" class="btn" id="w-save">Log weight</button></div>${weightChart(days)}</div>`;
  document.getElementById("g-edit").onclick=openForm;
  out.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.day,e=log[k]||{w:PLANS[goal.plan].week[dIdx(parse(k))],n:0,t:0};
    e.m=!isDone(e);if(!e.m&&!e.n)delete log[k];else log[k]=e;save("mf-log",log);renderP();
  });
  document.getElementById("w-save").onclick=()=>{
    const d=document.getElementById("w-date").value,v=parseFloat(document.getElementById("w-val").value);
    if(!d||!(v>=35&&v<=250))return;weights[d]=Math.round(v*10)/10;save("mf-weights",weights);renderP();
  };
}

function openForm(){
  const f=document.getElementById("goal-form"),g=goal||{start:todayIso(),weeks:4,plan};
  document.getElementById("g-plan").innerHTML=Object.entries(PLANS).map(([k,p])=>`<option value="${k}">${p.label} a week · ${esc(p.tag)}</option>`).join("");
  document.getElementById("g-start").value=g.start;document.getElementById("g-weeks").value=g.weeks;document.getElementById("g-plan").value=g.plan;
  document.getElementById("g-w0").value=g.w0||"";document.getElementById("g-w1").value=g.w1||"";
  document.getElementById("g-cancel").hidden=!goal;document.getElementById("g-save").textContent=goal?"Save goal":"Start goal";
  f.hidden=false;previewGoal();f.scrollIntoView({block:"nearest"});
}
function previewGoal(){
  const s=document.getElementById("g-start").value,wk=+document.getElementById("g-weeks").value,p=document.getElementById("g-plan").value;
  if(!s||!PLANS[p])return;
  let n=0;for(let k=0;k<wk*7;k++)if(PLANS[p].week[dIdx(addDays(parse(s),k))])n++;
  document.getElementById("g-preview").innerHTML=`Target: <b>${n} workouts</b> from ${fd(parse(s))} to ${fd(addDays(parse(s),wk*7-1))}.`;
}
["g-start","g-weeks","g-plan"].forEach(id=>document.getElementById(id).addEventListener("input",previewGoal));
document.getElementById("g-cancel").onclick=()=>{document.getElementById("goal-form").hidden=true};
document.getElementById("g-save").onclick=()=>{
  const s=document.getElementById("g-start").value;if(!s)return;
  const w0=parseFloat(document.getElementById("g-w0").value),w1=parseFloat(document.getElementById("g-w1").value);
  goal={start:s,weeks:+document.getElementById("g-weeks").value,plan:document.getElementById("g-plan").value,w0:w0>=35?w0:null,w1:w1>=35?w1:null};
  if(goal.w0&&!(s in weights)){weights[s]=goal.w0;save("mf-weights",weights)}
  save("mf-goal",goal);document.getElementById("goal-form").hidden=true;renderP();
};

const tip=document.getElementById("tip");
document.addEventListener("mousemove",ev=>{
  const el=ev.target.closest&&ev.target.closest("[data-tip]");
  if(!el){tip.style.display="none";return}
  tip.innerHTML=el.dataset.tip;tip.style.display="block";
  const r=tip.getBoundingClientRect();let x=ev.clientX+14,y=ev.clientY+14;
  if(x+r.width>innerWidth-8)x=ev.clientX-r.width-14;if(y+r.height>innerHeight-8)y=ev.clientY-r.height-14;
  tip.style.left=x+"px";tip.style.top=y+"px";
});
document.getElementById("data-note").textContent=window.__dataFile
  ?`Everything you enter is saved to ${window.__dataFile}. Updating the app keeps this file; copy it to back up or move your data.`
  :"Everything you enter is saved in this browser on this device.";
renderP();
