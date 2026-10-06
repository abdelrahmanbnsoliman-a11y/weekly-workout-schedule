
/* ===== Sync between devices =====
   Everything saved under an "mf-" name is mirrored to one private GitHub Gist.
   Each entry remembers when it last changed; where two devices differ, the newer entry wins. */
var SYNC=null;
function syncTouch(){if(SYNC)SYNC.touch()}
function syncReload(){ // re-read what the page keeps in memory once another device's changes have arrived
  store=load("mf-ticks",{});plan=String(load("mf-plan","3"));if(!PLANS[plan])plan="3";
  eq=load("mf-eq","gym")==="home"?"home":"gym";
  const hadGoal=!!goal;
  log=load("mf-log",{});lifts=load("mf-lifts",{});weights=load("mf-weights",{});goal=load("mf-goal",null);
  if(!hadGoal&&goal)document.getElementById("goal-form").hidden=true; // the "set your goal" form was only open because there was none
  kplan=String(load("mf-kplan","2500"));if(!K[kplan])kplan="2500";
  snackOn=load("mf-snacks",{});scaleOn=load("mf-scale",true)!==false;
}
function syncRedraw(){
  const c=load("mf-calc",{});CF.forEach(id=>{if(c[id]!=null)document.getElementById(id).value=c[id]});
  render();calc();renderP();
}
SYNC=(function(){
  const ls=window.localStorage,API="https://api.github.com",FILE="weekly-workout-schedule-data.json",SEP="::";
  const LOCAL=["mf-tab","mf-liftsel","mf-tickweek"];               // stay on each device
  const MAP1=["mf-log","mf-weights","mf-snacks"],MAP2=["mf-lifts"]; // merged entry by entry, not as a whole
  const TICKS="mf-ticks"+SEP,FORGET=180*864e5;                      // deletions are remembered for 180 days
  const put=(k,v)=>{try{ls.setItem(k,JSON.stringify(v))}catch(e){}};
  const curWeek=()=>iso(addDays(new Date(),-dIdx(new Date())));
  const myWeek=()=>load("mf-tickweek",null)||curWeek();
  let first=ls.getItem("mfsync-meta")===null;
  let meta=load("mfsync-meta",{}),cfg=load("mfsync-cfg",null); // meta: { path: [time changed, hash | 0 when deleted] }
  let state=cfg?"idle":"off",msg="",last=null,busy=false,again=false,timer=null;

  function hash(v){const s=JSON.stringify(v);let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))|0;return (h>>>0).toString(36)}

  // One line per entry: "mf-log::2026-10-06", "mf-lifts::Squat::2026-10-06", "mf-ticks::<week>::3-0-1", "mf-plan".
  function flat(){
    const out={},wk=myWeek();
    for(let i=0;i<ls.length;i++){
      const k=ls.key(i);if(!k||k.indexOf("mf-")!==0||LOCAL.includes(k))continue;
      let v;try{v=JSON.parse(ls.getItem(k))}catch(e){continue}
      const obj=v&&typeof v==="object"&&!Array.isArray(v);
      if(k==="mf-ticks"&&obj)Object.keys(v).forEach(a=>{if(v[a])out[TICKS+wk+SEP+a]=true});
      else if(MAP1.includes(k)&&obj)Object.keys(v).forEach(a=>{out[k+SEP+a]=v[a]});
      else if(MAP2.includes(k)&&obj)Object.keys(v).forEach(a=>{const h=v[a];if(h&&typeof h==="object")Object.keys(h).forEach(d=>{out[k+SEP+a+SEP+d]=h[d]})});
      else out[k]=v;
    }
    return out;
  }

  // Stamp whatever changed on this device since the last look.
  function scan(){
    const f=flat(),now=Date.now();let ch=first;
    for(const p in f){const h=hash(f[p]),m=meta[p];
      // data from before sync existed gets time 1, so it never beats a real edit made on another device
      if(!m||m[1]!==h){meta[p]=[first?1:Math.max(now,m?m[0]+1:0),h];ch=true}}
    for(const p in meta){if(p in f||meta[p][1]===0)continue;
      if(p.startsWith(TICKS)&&p.split(SEP)[1]!==myWeek())delete meta[p]; // last week's ticks simply expire
      else meta[p]=[Math.max(now,meta[p][0]+1),0];
      ch=true}
    if(ch)put("mfsync-meta",meta);
    first=false;
    return f;
  }

  // Write the merged result back for every saved name that another device changed.
  function apply(out,keys,wk){
    keys.forEach(k=>{
      if(k!=="mf-ticks"&&!MAP1.includes(k)&&!MAP2.includes(k)){
        const e=out[k];if(e&&e.length>1)put(k,e[1]);else ls.removeItem(k);return}
      const v={},pre=k+SEP;
      for(const p in out){if(!p.startsWith(pre)||out[p].length<2)continue;
        const s=p.split(SEP);
        if(k==="mf-ticks"){if(s[1]===wk)v[s.slice(2).join(SEP)]=out[p][1]}
        else if(MAP2.includes(k)){const d=s.pop(),a=s.slice(1).join(SEP);(v[a]=v[a]||{})[d]=out[p][1]}
        else v[s.slice(1).join(SEP)]=out[p][1]}
      put(k,v);
    });
  }

  // R is the cloud copy: { path: [time, value] } or [time] for a deletion.
  // mode "cloud" / "local" decides who wins every clash the first time a device joins; afterwards the newer entry wins.
  function merge(R,mode){
    const f=scan(),wk=myWeek(),cw=curWeek(),old=Date.now()-FORGET,out={},keys=new Set(),was=JSON.stringify(meta);let push=false;
    new Set(Object.keys(meta).concat(Object.keys(R))).forEach(p=>{
      const m=meta[p],r=Array.isArray(R[p])&&R[p].length?R[p]:null,tw=p.startsWith(TICKS)?p.split(SEP)[1]:null;
      if(!m&&!r)return;
      if(tw&&tw<cw){if(r)push=true;return}                 // ticks from past weeks are dropped everywhere
      let lt=m?m[0]:-1;const rt=r?r[0]:-1;
      if(m&&r&&mode==="cloud")lt=-1;
      if(m&&r&&mode==="local"&&lt<=rt)lt=m[0]=rt+1;
      let w;
      if(m&&lt>rt){w=m[1]===0?[lt]:[lt,f[p]];push=true}
      else{
        w=r;
        if(!tw||tw===wk){                                  // a week this page has not reached yet waits for its reload
          const rh=r.length>1?hash(r[1]):0;
          if(m?m[1]!==rh:rh!==0)keys.add(p.split(SEP)[0]);
          if(m||rh!==0)meta[p]=[rt,rh];
        }
      }
      if(w.length<2&&w[0]<old){delete meta[p];if(r)push=true;return}
      out[p]=w;
    });
    if(keys.size){apply(out,keys,wk);syncReload();redrawSoon()}
    if(JSON.stringify(meta)!==was)put("mfsync-meta",meta);
    return {out,push};
  }

  function redrawSoon(){ // do not redraw under someone who is typing; wait until they leave the box
    const a=document.activeElement;
    if(a&&a.matches&&a.matches("input:not([type=checkbox]),textarea")){
      document.addEventListener("focusout",()=>setTimeout(redrawSoon,0),{once:true});return}
    syncRedraw();
  }

  async function gh(method,path,body){
    const r=await fetch(API+path,{method,cache:"no-store",
      headers:Object.assign({Authorization:"Bearer "+cfg.token,Accept:"application/vnd.github+json"},body?{"Content-Type":"application/json"}:{}),
      body:body?JSON.stringify(body):undefined});
    if(!r.ok){const e=new Error("GitHub answered "+r.status);e.status=r.status;throw e}
    return r.json();
  }
  async function readRemote(){
    const g=await gh("GET","/gists/"+cfg.gist),f=g.files&&g.files[FILE];
    if(g.html_url)cfg.url=g.html_url;
    if(!f)return {};
    const text=f.truncated?await (await fetch(f.raw_url,{cache:"no-store"})).text():f.content;
    if(!text||!text.trim())return {};
    const doc=JSON.parse(text); // a file that cannot be read stops the sync instead of being overwritten
    if(!doc||typeof doc.items!=="object"||!doc.items)throw new Error("The sync file could not be read");
    return doc.items;
  }
  const fileBody=items=>({files:{[FILE]:{content:JSON.stringify({app:"Weekly Workout Schedule",v:1,updated:new Date().toISOString(),items})}}});
  const writeRemote=items=>gh("PATCH","/gists/"+cfg.gist,fileBody(items));

  const hasProgress=o=>Object.keys(o).some(p=>(p==="mf-goal"||/^mf-(log|lifts|weights)::/.test(p))&&(!Array.isArray(o[p])||o[p].length>1));

  // First connection on a device: find the sync file in this GitHub account, or make it.
  async function link(token){
    const before=cfg;cfg={token};
    try{
      let mine=[];
      for(let page=1;page<=5;page++){
        const list=await gh("GET","/gists?per_page=100&page="+page);
        mine=mine.concat(list.filter(g=>g.files&&g.files[FILE]));
        if(list.length<100)break;
      }
      mine.sort((a,b)=>a.created_at<b.created_at?-1:1);
      let res;
      if(mine.length){
        cfg.gist=mine[0].id;
        const R=await readRemote(),f=scan();
        // a device with no progress yet takes the cloud's settings; an empty cloud takes this device's
        res=merge(R,!hasProgress(f)?"cloud":!hasProgress(R)?"local":"");
      }else{
        const g=await gh("POST","/gists",Object.assign({description:"Weekly Workout Schedule: synced progress (written by the app)",public:false},fileBody({})));
        cfg.gist=g.id;cfg.url=g.html_url;
        res=merge({},"local");
      }
      if(res.push)await writeRemote(res.out);
      put("mfsync-cfg",cfg);last=new Date();set("ok");
    }catch(e){cfg=before;throw e}
  }

  async function sync(){
    if(!cfg||!cfg.gist||state==="auth")return;
    if(busy){again=true;return}
    if(navigator.onLine===false){scan();set("offline");return}
    busy=true;set("busy");
    try{
      const res=merge(await readRemote(),"");
      if(res.push)await writeRemote(res.out);
      last=new Date();set("ok");
    }catch(e){
      if(e.status===401)set("auth");
      else if(e.status===404)set("error","the sync file was not found; turn sync off and connect again");
      else if(e.status||!(e instanceof TypeError))set("error",e.message);
      else set("offline");
    }
    busy=false;
    if(again){again=false;sync()}
  }
  function touch(){clearTimeout(timer);timer=setTimeout(()=>{timer=null;if(cfg)sync();else scan()},800)}

  const LABEL={idle:"Sync on",busy:"Syncing…",ok:"Synced",offline:"Offline",error:"Sync problem",auth:"Sync problem"};
  const why=e=>e.status===401?"GitHub did not accept this token. Check that you copied all of it.":
    e.status===403||e.status===404?"This token cannot use Gists. Create it again with the gist box ticked.":
    e.status||!(e instanceof TypeError)?e.message+".":"Could not reach GitHub. Check your connection and try again.";
  function set(s,m){state=s;msg=m||"";draw()}
  function draw(){
    const pill=document.getElementById("sync-pill"),box=document.getElementById("sync");
    if(pill){pill.hidden=!cfg;pill.textContent=LABEL[state]||"";pill.dataset.s=state}
    if(!box)return;
    if(!cfg||state==="auth"){
      box.innerHTML=`<div class="card"><h2>Sync between devices</h2>
        <p class="cap">Keep the computer app and the phone version on the same progress. Both save to one private file in your GitHub account, so what you tick at the gym shows up everywhere.</p>
        <ol class="steps"><li><a href="https://github.com/settings/tokens/new?scopes=gist&description=Weekly%20Workout%20Schedule" target="_blank" rel="noopener">Create a GitHub token</a>. Leave only <b>gist</b> ticked, set Expiration to <b>No expiration</b>, then press Generate token and copy it.</li>
        <li>Paste it here and press Connect. Do the same with the same token on your other device.</li></ol>
        <div class="wlog"><label>GitHub token<input type="password" id="sync-token" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ghp_…"></label>
        <button type="button" class="btn" id="sync-connect">Connect</button></div>
        <p class="sync-msg" id="sync-msg" role="status">${state==="auth"?"GitHub no longer accepts the saved token. Create a new one and paste it here.":""}</p></div>`;
      document.getElementById("sync-connect").onclick=async()=>{
        const btn=document.getElementById("sync-connect"),note=document.getElementById("sync-msg"),token=document.getElementById("sync-token").value.trim();
        if(!token)return;
        btn.disabled=true;note.textContent="Connecting…";
        if(state==="auth")state="idle";
        try{await link(token)}catch(e){btn.disabled=false;note.textContent=why(e)}
      };
      return;
    }
    const line=state==="ok"?`On. Last synced at ${last.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}.`:
      state==="busy"?"Syncing…":
      state==="offline"?"No connection. Your changes are saved on this device and will sync when you are back online.":
      state==="error"?`Could not sync: ${esc(msg)}. It will try again by itself.`:"On.";
    box.innerHTML=`<div class="card"><h2>Sync between devices</h2><p class="cap" role="status">${line}</p>
      <div class="gbtns" style="margin-top:0"><button type="button" class="btn" id="sync-now">Sync now</button><button type="button" class="btn ghost" id="sync-off">Turn off on this device</button></div>
      <p class="fine" style="margin:12px 0 0">Your progress is kept in a private file in your GitHub account${cfg.url?` (<a href="${esc(cfg.url)}" target="_blank" rel="noopener">open it</a>)`:""}. To add another device, open the app there and paste the same token.</p></div>`;
    document.getElementById("sync-now").onclick=sync;
    document.getElementById("sync-off").onclick=()=>{
      if(!confirm("Stop syncing on this device? Your progress stays on this device and in your GitHub file."))return;
      ls.removeItem("mfsync-cfg");cfg=null;set("off");
    };
  }

  const pill=document.getElementById("sync-pill");
  if(pill)pill.onclick=()=>{showTab("progress");document.getElementById("sync").scrollIntoView({block:"center"})};
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){if(timer){clearTimeout(timer);timer=null;sync()}return}
    if(load("mf-tickweek",null)!==curWeek()){location.reload();return} // a new week began while the app stayed open
    sync();
  });
  window.addEventListener("online",sync);
  setInterval(()=>{if(!document.hidden)sync()},120000);
  scan();draw();sync();
  return {touch,sync,link};
})();
