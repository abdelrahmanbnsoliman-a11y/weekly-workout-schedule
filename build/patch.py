"""Builds index.html = original page + Progress tab (goal, calendar, charts)."""
import pathlib

here = pathlib.Path(__file__).parent
src = (here / "index.original.html").read_text(encoding="utf-8")
css = (here / "progress.css").read_text(encoding="utf-8")
html = (here / "progress.html").read_text(encoding="utf-8")
js = (here / "progress.js").read_text(encoding="utf-8")

HELPERS = r'''
const pad=n=>String(n).padStart(2,"0");
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const todayIso=()=>iso(new Date());
const dIdx=d=>(d.getDay()+1)%7; // Saturday = 0, matching DAYS
let log=load("mf-log",{});
// Ticks start fresh each week (week starts Saturday); finished days live on in the log.
{const wk=iso(addDays(new Date(),-dIdx(new Date())));const last=load("mf-tickweek",null);
 if(last&&last!==wk){store={};save("mf-ticks",store)} save("mf-tickweek",wk);}
function logToday(i){
  const w=PLANS[plan].week[i],rows=exList(w),t=rows.length,x=[];
  for(let j=0;j<t;j++)if(store[`${tp()}-${i}-${j}`])x.push(rows[j][0]);
  const n=x.length,k=todayIso(),prev=log[k]||{};
  if(n===0&&prev.m!==true)delete log[k];else log[k]={w,n,t,m:prev.m,x,eq};
  save("mf-log",log);renderP();
}
'''

EQ_RENDER = r'''function render(){
  const es=document.getElementById("eqswitch");
  es.innerHTML=[["gym","Gym","machines + cables"],["home","Home","bar, EZ bar, dumbbells, bench"]].map(([k,l,s])=>`<button type="button" data-e="${k}" aria-pressed="${k===eq}">${l}<small>${s}</small></button>`).join("");
  es.querySelectorAll("button").forEach(b=>b.onclick=()=>{eq=b.dataset.e;save("mf-eq",eq);render()});
  document.getElementById("eqnote").hidden=eq!=="home";
'''
EQ_HTML = '''<div class="switch" role="group" aria-label="Where you train" id="eqswitch"></div>
  <p class="fine" id="eqnote" hidden style="margin:-10px 0 20px">Home version for your 150 cm bar, 100 cm EZ bar, dumbbells and bench. Machine and cable exercises are swapped for free-weight ones, and each day gets extra exercises (marked <b>Extra</b>). With no rack, heavy squats and bench presses become dumbbell versions.</p>
  '''

def sub(s, old, new):
    assert s.count(old) == 1, old
    return s.replace(old, new)

out = src
out = sub(out, "</style>", css + "</style>")
out = sub(out, '<button type="button" role="tab" id="tab-nutrition" aria-controls="view-nutrition">Nutrition</button>',
          '<button type="button" role="tab" id="tab-nutrition" aria-controls="view-nutrition">Nutrition</button>\n'
          '    <button type="button" role="tab" id="tab-progress" aria-controls="view-progress">Progress</button>')
out = sub(out, "</section>\n</div>\n\n<script>", "</section>\n" + html + "</div>\n\n<script>")
anchor = 'let plan=String(load("mf-plan","3"));if(!PLANS[plan])plan="3";'
home = (here / "home.js").read_text(encoding="utf-8")
out = sub(out, anchor, anchor + home + HELPERS)
out = sub(out, '<div class="switch" role="group" aria-label="Days per week" id="switch"></div>',
          EQ_HTML + '<div class="switch" role="group" aria-label="Days per week" id="switch"></div>')
out = sub(out, 'function render(){\n', EQ_RENDER)
out = sub(out, 'const rows=s.ex.map((e,j)=>{', 'const rows=exList(w).map((e,j)=>{')
out = sub(out, 'const key=`${plan}-${i}-${j}`;', 'const key=`${tp()}-${i}-${j}`;')
out = sub(out, '<img class="th" src="${IMG[w][j]}" alt="${esc(e[0])} demonstration" width="92" height="64" loading="lazy">', '${thumb(e)}')
out = sub(out, '<span class="ar" dir="rtl" lang="ar">${esc(e[1])}</span></div></div>', '<span class="ar" dir="rtl" lang="ar">${esc(e[1])}</span>${eqLine(e)}</div></div>')
out = sub(out, 'k.startsWith(plan+"-")', 'k.startsWith(tp()+"-")')
out = sub(out, 'save("mf-ticks",store); c.closest("tr").classList.toggle("done",c.checked);',
          'save("mf-ticks",store); c.closest("tr").classList.toggle("done",c.checked); logToday(+c.dataset.k.split("-")[1]);')
out = sub(out, '["training","nutrition"].forEach', '["training","nutrition","progress"].forEach')
out = sub(out, '  save("mf-tab",t);\n}', '  save("mf-tab",t);\n  if(t==="progress")renderP();\n}')
out = sub(out, 'document.getElementById("tab-nutrition").onclick=()=>showTab("nutrition");',
          'document.getElementById("tab-nutrition").onclick=()=>showTab("nutrition");\n'
          'document.getElementById("tab-progress").onclick=()=>showTab("progress");')
out = sub(out, 'showTab(load("mf-tab","training")==="nutrition"?"nutrition":"training");',
          js + '\nshowTab(["nutrition","progress"].includes(load("mf-tab",""))?load("mf-tab",""):"training");')

# Calorie target drives the meals: pick the plan + snack combination closest to the target.
FIT = r'''
function fitTarget(tg){
  let best=null;
  Object.keys(K).forEach(k=>{
    const P=K[k],m=P.meals.reduce((s,[,it])=>s+it.reduce((a,x)=>a+x[2],0),0);
    const sk=P.snacks.map(s=>s[3].reduce((a,x)=>a+x[2],0)),n=sk.length;
    for(let mask=0;mask<(1<<n);mask++){
      let t=m,c=0;for(let i=0;i<n;i++)if(mask>>i&1){t+=sk[i];c++}
      const score=Math.abs(t-tg)+(t>tg?10:0)+c*5; // prefer landing just under, with fewer snacks
      if(!best||score<best.score)best={k,mask,t,n,score};
    }
  });
  return best;
}
function applyFit(fit){
  kplan=fit.k;save("mf-kplan",kplan);
  for(let i=0;i<fit.n;i++)snackOn[kplan+"-"+i]=!!(fit.mask>>i&1);
  save("mf-snacks",snackOn);
}
'''
out = sub(out, "function calc(){", FIT + "function calc(){")
import re
pick_re = re.compile(r'<p class="pick">Best fit: the <button type="button" id="use-plan">\$\{fmt\(best\)\} kcal plan</button>.*?</p>`;')
assert len(pick_re.findall(out)) == 1
out = pick_re.sub(lambda _: '''<p class="pick">${fitText}</p>`;''', out)
out = sub(out, 'document.getElementById("use-plan").onclick=()=>{kplan=best;save("mf-kplan",kplan);renderN();document.getElementById("kswitch").scrollIntoView()};',
  'document.getElementById("use-plan").onclick=()=>{applyFit(fit);renderN();document.getElementById("kswitch").scrollIntoView()};')
out = sub(out, '  out.innerHTML=`<div><span class="lbl">Resting burn (BMR)</span>', r'''  const fit=fitTarget(target);
  if(load("mf-autotarget",null)!==target){applyFit(fit);save("mf-autotarget",target)}
  const picked=K[fit.k].snacks.map((s,i)=>fit.mask>>i&1?`${s[0]} (${s[3].map(x=>F[x[0]][0].toLowerCase()).join(" + ")})`:null).filter(Boolean);
  const fitText=`Your meals are set to match: the <b>${fmt(fit.k)} kcal plan</b>${picked.length?" + "+esc(picked.join(", ")):", no snacks"} = <b>${fmt(fit.t)} kcal</b>. They update by themselves when your target changes. Changed plans or snacks by hand? <button type="button" id="use-plan">Match my target again</button>`;
  out.innerHTML=`<div><span class="lbl">Resting burn (BMR)</span>''')

# Then resize gram-measured foods in the main meals so the whole day lands on the target.
SCALE = r'''
let scaleOn=load("mf-scale",true)!==false;
function scaledPlan(){
  const P=K[kplan];
  if(!target||!scaleOn)return P;
  const snackK=P.snacks.reduce((a,[, ,opt,items],i)=>a+(isOn(i,opt)?items.reduce((s,x)=>s+x[2],0):0),0);
  let mainK=0,G=0;
  P.meals.forEach(([,items])=>items.forEach(x=>{mainK+=x[2];if(/^\d+ g$/.test(x[1]))G+=x[2]}));
  const gap=target-(mainK+snackK);
  if(!G||Math.abs(gap)<15)return P;
  const f=Math.min(1.6,Math.max(0.6,1+gap/G));
  const sc=(v,r)=>typeof v==="number"?Math.round(v*r*10)/10:v;
  return {snacks:P.snacks,meals:P.meals.map(([name,items])=>[name,items.map(x=>{
    const m=/^(\d+) g$/.exec(x[1]);if(!m)return x;
    const g0=+m[1],g1=Math.max(5,Math.round(g0*f/5)*5),r=g1/g0;
    if(g1===g0)return x;
    return [x[0],`${g1} g (was ${g0} g)`,Math.round(x[2]*r),sc(x[3],r),sc(x[4],r),sc(x[5],r)];
  })])};
}
'''
out = sub(out, "function renderN(){", SCALE + "function renderN(){")
out = sub(out, "const P=K[kplan]; const cols=", "const P=scaledPlan(); const cols=")
out = sub(out, "Changed plans or snacks by hand? <button", '''<label class="tog" style="display:inline-flex;margin:6px 0"><input type="checkbox" id="scale-tog" ${scaleOn?"checked":""}> Resize portions (in grams) so the whole day hits ${fmt(target)} kcal</label><br>Changed plans or snacks by hand? <button''')
out = sub(out, 'document.getElementById("use-plan").onclick=', 'document.getElementById("scale-tog").onchange=e=>{scaleOn=e.target.checked;save("mf-scale",scaleOn);renderN()};\n  document.getElementById("use-plan").onclick=')

out = sub(out, '${Math.abs(d)<100?"On target":', '${Math.abs(d)<100?"✓ On":')
# Exercise notes in Arabic
out = sub(out, '${e[5]?`<span class="note">${esc(e[5])}</span>`:""}', '${noteHtml(e[5])}')
out = sub(out, "</style>", '.note[lang="ar"]{font-family:"Cairo",system-ui,sans-serif;font-size:.84rem;line-height:1.6}\n</style>')

# How-to steps (offline) + video link per exercise
how = (here / "how.js").read_text(encoding="utf-8")
out = sub(out, anchor + home, anchor + home + how)
out = sub(out, '${esc(e[1])}</span>${eqLine(e)}</div>', '${esc(e[1])}</span>${eqLine(e)}${howBtns(e,key)}</div>')
out = sub(out, '<td class="sr">${e[4]}</td></tr>', '<td class="sr">${e[4]}</td></tr>${HOW[e[0]]?`<tr class="howrow" hidden data-for="${key}"><td></td><td colspan="3">${howHtml(e)}</td></tr>`:""}')
out = sub(out, "</style>", '''.howbar{display:flex;gap:14px;margin-top:6px;font-family:"Cairo",system-ui,sans-serif;font-size:.82rem}
.howbtn{font:inherit;background:none;border:0;padding:0;color:var(--back);cursor:pointer;font-weight:600}
.vidlink{color:var(--muted);text-decoration:none}.vidlink:hover{text-decoration:underline}
tr.howrow td{border-top:0;padding-top:0}
.how-steps{margin:0 0 4px;padding:10px 30px 10px 14px;background:var(--bg);border-radius:8px;font-family:"Cairo",system-ui,sans-serif;font-size:.9rem;line-height:1.8}
</style>''')

# Weight used per exercise
lifts = (here / "lifts.js").read_text(encoding="utf-8")
out = sub(out, anchor + home + how, anchor + home + how + lifts)
out = sub(out, '<td class="sr">${e[4]}</td>', '<td class="sr">${e[4]}${kgInput(e)}</td>')
out = sub(out, '<th style="text-align:right">Sets × reps</th>', '<th style="text-align:right">Sets × reps · kg</th>')
out = sub(out, "</style>", '''td.sr{width:118px}
.kgbox{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:6px;font-family:"Barlow",sans-serif;font-size:.8rem;font-weight:500;color:var(--muted)}
.kgbox input{width:68px;font:inherit;font-size:.95rem;font-weight:600;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:5px 6px;text-align:right}
.kgh{display:block;font-family:"Barlow",sans-serif;font-size:.74rem;font-weight:500;color:var(--muted);margin-top:3px;white-space:nowrap}
.kgh.up{color:var(--legs);font-weight:700}
.liftsel{display:flex;align-items:center;gap:8px;font-size:.85rem;font-weight:600;color:var(--muted);margin-bottom:8px}
.liftsel select{font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px 8px;max-width:100%}
table.lifts{min-width:480px;margin-top:10px}
table.lifts .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
table.lifts tr[data-lift]{cursor:pointer}
table.lifts tr.sel td{background:color-mix(in srgb,var(--chest) 10%,transparent)}
</style>''')

# Fonts stored inside the page so it looks the same offline (fonts.css is made by get_fonts.py)
fonts = here / "fonts.css"
if fonts.exists():
    out = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', out)
    out = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>', lambda _: "<style>" + fonts.read_text(encoding="utf-8") + "</style>", out, count=1)
    assert "fonts.googleapis" not in out

(here / "index.html").write_text(out, encoding="utf-8")
print("ok", len(out))
