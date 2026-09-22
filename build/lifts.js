
/* ===== Weight used per exercise: { exercise name: { "YYYY-MM-DD": kg } } ===== */
let lifts=load("mf-lifts",{});
const kgFmt=v=>(Math.round(v*10)/10).toString();
function liftPrev(name,day){ // most recent weight before `day`, and best before `day`
  const h=lifts[name]||{};const ks=Object.keys(h).filter(k=>k<day).sort();
  return {last:ks.length?h[ks[ks.length-1]]:null,best:ks.length?Math.max(...ks.map(k=>h[k])):null};
}
function kgHint(name){
  const t=todayIso(),now=(lifts[name]||{})[t],p=liftPrev(name,t);
  if(now!=null&&p.best!=null&&now>p.best)return `<span class="kgh up">PR · +${kgFmt(now-p.best)}</span>`;
  if(now!=null&&p.last!=null&&now!==p.last)return `<span class="kgh">${now>p.last?"↑":"↓"} last ${kgFmt(p.last)}</span>`;
  return p.last!=null?`<span class="kgh">last ${kgFmt(p.last)} kg</span>`:"";
}
function kgInput(e){
  const v=(lifts[e[0]]||{})[todayIso()];
  return `<label class="kgbox"><input class="kg" type="number" inputmode="decimal" min="0" max="500" step="0.5" placeholder="kg" value="${v!=null?v:""}" data-ex="${esc(e[0])}" aria-label="Weight used today for ${esc(e[0])} in kg"><span>kg</span></label>${kgHint(e[0])}`;
}
document.addEventListener("change",ev=>{
  const el=ev.target;if(!el.matches||!el.matches("input.kg"))return;
  const name=el.dataset.ex,t=todayIso(),v=parseFloat(el.value);
  if(!lifts[name])lifts[name]={};
  if(v>0&&v<=500)lifts[name][t]=Math.round(v*10)/10;else{delete lifts[name][t];el.value="";if(!Object.keys(lifts[name]).length)delete lifts[name]}
  save("mf-lifts",lifts);
  const td=el.closest("td"),old=td.querySelector(".kgh"),html=kgHint(name);
  if(old)old.outerHTML=html||"";else if(html)td.insertAdjacentHTML("beforeend",html);
  renderP();
});

function strengthChart(name){
  const h=lifts[name],ks=Object.keys(h).sort(),vals=ks.map(k=>h[k]);
  const VW=640,VH=210,L=38,R=14,T=16,B=24,pw=VW-L-R,ph=VH-T-B;
  const d0=parse(ks[0]),span=Math.max(1,(parse(ks[ks.length-1])-d0)/864e5);
  let lo=Math.min(...vals),hi=Math.max(...vals);const pad=Math.max(2.5,(hi-lo)*.15);lo=Math.max(0,Math.floor((lo-pad)/2.5)*2.5);hi=Math.ceil((hi+pad)/2.5)*2.5;
  const step=[1,2.5,5,10,20,25,50].find(s=>(hi-lo)/s<=6)||100;
  const X=k=>ks.length===1?L+pw/2:L+(parse(k)-d0)/864e5/span*pw,Y=v=>T+ph-(v-lo)/(hi-lo)*ph;
  let g="";
  for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)g+=`<line class="grid" x1="${L}" x2="${VW-R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end">${kgFmt(v)}</text>`;
  const every=Math.max(1,Math.ceil(ks.length/6));
  ks.forEach((k,i)=>{if(i%every===0||i===ks.length-1)g+=`<text x="${X(k)}" y="${VH-6}" text-anchor="middle">${fd(parse(k))}</text>`});
  if(ks.length>1)g+=`<polyline points="${ks.map(k=>`${X(k)},${Y(h[k])}`).join(" ")}" style="fill:none;stroke:var(--chest);stroke-width:2.5;stroke-linejoin:round"/>`;
  const best=Math.max(...vals);
  ks.forEach((k,i)=>{const v=h[k],prev=i?h[ks[i-1]]:null;
    g+=`<circle cx="${X(k)}" cy="${Y(v)}" r="${v===best?6:4.5}" style="fill:var(--chest);stroke:var(--paper);stroke-width:2"/>
      <circle class="hit" cx="${X(k)}" cy="${Y(v)}" r="13" ${tipAttr(`<b>${fd(parse(k))}</b><br>${kgFmt(v)} kg${prev!=null&&v!==prev?` (${v>prev?"+":""}${kgFmt(v-prev)})`:""}${v===best?"<br>Best so far":""}`)}/>`});
  const lk=ks[ks.length-1];
  g+=`<text class="v" x="${Math.min(X(lk)+8,VW-R)}" y="${Y(h[lk])-10}" text-anchor="${ks.length===1?"middle":"end"}">${kgFmt(h[lk])} kg</text>`;
  return `<svg class="chart" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Weight used for ${esc(name)} over time">${g}</svg>`;
}
function renderStrength(){
  const el=document.getElementById("strength");if(!el)return;
  const names=Object.keys(lifts).filter(n=>Object.keys(lifts[n]).length);
  if(!names.length){el.innerHTML=`<div class="card"><h2>Strength progress</h2><p class="cap">Type the weight you lift in the kg box next to each exercise in Training. Your progress for every exercise shows up here.</p></div>`;return}
  const lastDay=n=>Object.keys(lifts[n]).sort().pop();
  names.sort((a,b)=>lastDay(b).localeCompare(lastDay(a))||a.localeCompare(b));
  let sel=load("mf-liftsel",names[0]);if(!lifts[sel])sel=names[0];
  const rows=names.map(n=>{const h=lifts[n],ks=Object.keys(h).sort(),first=h[ks[0]],last=h[ks[ks.length-1]],best=Math.max(...ks.map(k=>h[k])),ch=last-first;
    return `<tr class="${n===sel?"sel":""}" data-lift="${esc(n)}"><td><b>${esc(n)}</b><span class="hex">${ks.length} session${ks.length===1?"":"s"} · last ${fd(parse(ks[ks.length-1]))}</span></td>
      <td class="n">${kgFmt(first)}</td><td class="n">${kgFmt(last)}</td><td class="n">${kgFmt(best)}</td>
      <td class="n">${ch>0?"↑ +"+kgFmt(ch):ch<0?"↓ "+kgFmt(ch):"–"}</td></tr>`}).join("");
  el.innerHTML=`<div class="card"><h2>Strength progress</h2><p class="cap">The weight you've used for each exercise. Pick one to see its chart.</p>
    <label class="liftsel">Exercise <select id="lift-sel">${names.map(n=>`<option${n===sel?" selected":""}>${esc(n)}</option>`).join("")}</select></label>
    ${strengthChart(sel)}
    <div class="tbl"><table class="lifts"><thead><tr><th>Exercise</th><th class="n">First kg</th><th class="n">Latest kg</th><th class="n">Best kg</th><th class="n">Change</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  const pick=n=>{save("mf-liftsel",n);renderStrength()};
  document.getElementById("lift-sel").onchange=e=>pick(e.target.value);
  el.querySelectorAll("tr[data-lift]").forEach(r=>r.onclick=()=>pick(r.dataset.lift));
}
