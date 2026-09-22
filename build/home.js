
/* ===== Home equipment: 150 cm barbell, 100 cm EZ bar, dumbbells, bench ===== */
const EQ_NAME={db:"Dumbbells",bar:"150 cm bar",ez:"EZ bar",bench:"Bench",bw:"Body weight"};
const noRack="No rack at home, so this replaces the heavy barbell version. Only load a bar on your back or over your chest if you have a rack or a spotter.";
const incl="Set the bench to an incline. If it only goes flat, do it flat.";
// Swaps for machine / cable / rack exercises. Key "session|name" overrides plain "name".
const HOME={
 "Butterfly machine (pec deck)":{n:"Dumbbell fly",ar:"تفتيح بالدمبل",t:"Whole chest",g:"chest",eq:["db","bench"],note:"Slight bend in the elbows; lower until you feel a stretch."},
 "Flat barbell bench press":{n:"Dumbbell bench press",ar:"ضغط دمبل مستوي",t:"Middle chest",g:"chest",eq:["db","bench"],note:noRack},
 "Chest press machine":{n:"Dumbbell squeeze press",ar:"ضغط دمبل ملتصق",t:"Inner chest",g:"chest",eq:["db","bench"],note:"Press the dumbbells together the whole way up."},
 "Cable fly (high to low)":{n:"Dumbbell pullover",ar:"بلوفر بالدمبل",t:"Lower chest + lats",g:"chest",eq:["db","bench"]},
 "Incline press machine":{n:"Incline dumbbell fly",ar:"تفتيح دمبل مائل",t:"Upper chest",g:"chest",eq:["db","bench"],note:incl},
 "Incline dumbbell press":{n:"Incline dumbbell press",ar:"تجميع بالدمبل",t:"Upper chest",g:"chest",eq:["db","bench"],img:true,note:incl},
 "upB|Incline dumbbell press":{n:"Incline dumbbell press",ar:"تجميع بالدمبل",t:"Upper chest",g:"chest",eq:["db","bench"],img:true,note:incl},
 "Skull crushers":{n:"EZ-bar skull crushers",ar:"تراي بالبار المتعرج",t:"Triceps (inner / long head)",g:"arms",eq:["ez","bench"],img:true},
 "Rope pushdown":{n:"Dumbbell kickback",ar:"ركلة خلفية بالدمبل",t:"Triceps (outer / lateral head)",g:"arms",eq:["db","bench"],note:"One hand and knee on the bench, upper arm still."},
 "Overhead cable triceps extension":{n:"Seated EZ-bar overhead extension",ar:"تمديد تراي خلف الرأس بالبار المتعرج",t:"Whole triceps",g:"arms",eq:["ez","bench"]},
 "Lat pulldown":{n:"Single-arm dumbbell row",ar:"سحب دمبل بيد واحدة على البنش",t:"Lats",g:"back",eq:["db","bench"]},
 "Seated cable row (close grip)":{n:"Chest-supported dumbbell row",ar:"سحب دمبل على بنش مائل",t:"Lats + mid back",g:"back",eq:["db","bench"],note:"Lie face down on the incline bench and row both dumbbells."},
 "Reverse-grip lat pulldown":{n:"Underhand barbell row",ar:"سحب بالبار قبضة معكوسة",t:"Lats",g:"back",eq:["bar"]},
 "Close-grip lat pulldown":{n:"Dumbbell pullover",ar:"بلوفر بالدمبل",t:"Lats",g:"back",eq:["db","bench"]},
 "T-bar / landmine row":{n:"Landmine row",ar:"سحب بالبار في الزاوية",t:"Lats + upper back",g:"back",eq:["bar"],img:true,note:"Wedge one end of the 150 cm bar into a corner (wrap it in a towel) and row the loaded end."},
 "Single-arm cable row":{n:"Single-arm dumbbell row",ar:"سحب دمبل بيد واحدة على البنش",t:"Lats",g:"back",eq:["db","bench"]},
 "Rear delt machine":{n:"Chest-supported rear delt raise",ar:"رفرفة خلفي على البنش",t:"Rear shoulders",g:"shoulders",eq:["db","bench"],note:"Lie face down on the incline bench, raise the dumbbells out to the sides."},
 "Cable rope rear delt pull":{n:"Bent-over rear delt fly",ar:"رفرفة خلفي منحني",t:"Rear shoulders",g:"shoulders",eq:["db"]},
 "Cable rear delt pull":{n:"Bent-over rear delt fly",ar:"رفرفة خلفي منحني",t:"Rear shoulders",g:"shoulders",eq:["db"]},
 "Single-arm cable lateral raise":{n:"Leaning single-arm lateral raise",ar:"رفرفة جانبي مائل بيد واحدة",t:"Side shoulders",g:"shoulders",eq:["db"],note:"Hold a door frame and lean away to keep tension at the bottom."},
 "Squat":{n:"Dumbbell goblet squat",ar:"اسكوات جوبلت بالدمبل",t:"Quads (front thigh)",g:"legs",eq:["db"],note:noRack},
 "Leg extension":{n:"Bulgarian split squat",ar:"اسكوات بلغاري",t:"Quads (front thigh)",g:"legs",eq:["db","bench"],note:"Back foot on the bench, dumbbells in hand. Sets are per leg."},
 "Leg press":{n:"Dumbbell step-up",ar:"صعود على البنش بالدمبل",t:"Whole leg, mainly quads",g:"legs",eq:["db","bench"],note:"Sets are per leg."},
 "Leg curl":{n:"Barbell Romanian deadlift",ar:"ديدليفت روماني بالبار",t:"Hamstrings (back thigh)",g:"legs",eq:["bar"]},
 "loA|Leg curl":{n:"Barbell hip thrust",ar:"دفع الورك بالبار",t:"Glutes + hamstrings",g:"legs",eq:["bar","bench"],note:"Upper back on the bench, pad the bar with a towel."},
 "Adductor machine":{n:"Dumbbell sumo squat",ar:"اسكوات سومو بالدمبل",t:"Inner thigh",g:"legs",eq:["db"]},
 "Seated calf raise":{n:"Seated dumbbell calf raise",ar:"سمانة جالس بالدمبل",t:"Calves (inner)",g:"legs",eq:["db","bench"],note:"Sit on the bench with dumbbells on your knees."},
 "Standing calf raise":{n:"Single-leg dumbbell calf raise",ar:"سمانة واقف رجل واحدة بالدمبل",t:"Calves (outer)",g:"legs",eq:["db"],note:"Stand on a step for a full stretch. Sets are per leg."}
};
// Exercises that already fit home kit: just tag the equipment.
const KEEP_EQ={"Lateral raise":["db"],"Front raise":["db"],"Barbell row":["bar"],"Barbell row (upper back)":["bar"],"Dumbbell shrugs":["db"],
 "Incline dumbbell curl":["db","bench"],"Dumbbell shoulder press":["db","bench"],"Deadlift":["bar"],"Barbell curl":["bar"],
 "Dumbbell hammer curl":["db"],"Lying dumbbell triceps extension":["db","bench"],"Single-arm concentration curl":["db","bench"],"Dumbbell curl":["db"]};
// Extra exercises added to each session at home.
const X={
 dips:{n:"Bench dips",ar:"غطس على البنش",t:"Whole triceps",g:"arms",eq:["bench","bw"],sr:"3×12"},
 ezCurl:{n:"EZ-bar curl",ar:"باي بالبار المتعرج",t:"Whole biceps",g:"arms",eq:["ez"],sr:"3×12"},
 ezRev:{n:"EZ-bar reverse curl",ar:"باي عكسي بالبار المتعرج",t:"Forearms + brachialis",g:"arms",eq:["ez"],sr:"3×12"},
 upright:{n:"EZ-bar upright row",ar:"سحب عمودي بالبار المتعرج",t:"Side shoulders + traps",g:"shoulders",eq:["ez"],sr:"3×12",note:"Pull to chest height only; stop if your shoulders pinch."},
 thrust:{n:"Barbell hip thrust",ar:"دفع الورك بالبار",t:"Glutes + hamstrings",g:"legs",eq:["bar","bench"],sr:"3×12",note:"Upper back on the bench, pad the bar with a towel."},
 closePress:{n:"Close-grip dumbbell press",ar:"ضغط دمبل قبضة ضيقة",t:"Triceps + inner chest",g:"arms",eq:["db","bench"],sr:"3×12"},
 floorPress:{n:"Barbell floor press",ar:"ضغط بالبار على الأرض",t:"Chest + triceps",g:"chest",eq:["bar"],sr:"3×10",note:"Lying on the floor makes a heavy bar press safe without a rack."}
};
const HOME_EXTRA={push:[X.floorPress,X.dips],pull:[X.ezCurl],legs:[X.thrust],upA:[X.upright,X.ezCurl],loA:[],upB:[X.closePress],loB:[X.thrust],
 d1:[X.floorPress,X.dips],d2:[X.ezCurl],d3:[X.upright],d4:[X.ezRev],d5:[X.thrust]};

let eq=load("mf-eq","gym")==="home"?"home":"gym";
const tp=()=>eq==="home"?plan+"h":plan; // tick keys are separate for each version
// Rows: [name, arabic, target, group, sets, note, image|null, equipment[]|null]
function exList(w){
  const rows=W[w].ex.map((e,j)=>{
    if(eq!=="home")return [e[0],e[1],e[2],e[3],e[4],e[5],IMG[w][j],null];
    const h=HOME[w+"|"+e[0]]||HOME[e[0]];
    if(!h)return [e[0],e[1],e[2],e[3],e[4],e[5],IMG[w][j],KEEP_EQ[e[0]]||null];
    return [h.n,h.ar,h.t,h.g,e[4],h.note,h.img?IMG[w][j]:null,h.eq];
  });
  if(eq==="home")(HOME_EXTRA[w]||[]).forEach(x=>rows.push([x.n,x.ar,x.t,x.g,x.sr||"3×12",x.note,null,x.eq,true]));
  return rows;
}
const ICON={
 db:'<rect x="18" y="22" width="8" height="20" rx="2"/><rect x="66" y="22" width="8" height="20" rx="2"/><rect x="12" y="26" width="6" height="12" rx="2"/><rect x="74" y="26" width="6" height="12" rx="2"/><rect x="26" y="30" width="40" height="4" rx="1"/>',
 bar:'<rect x="4" y="30" width="84" height="4" rx="1"/><rect x="12" y="18" width="7" height="28" rx="2"/><rect x="73" y="18" width="7" height="28" rx="2"/>',
 ez:'<polyline points="8,32 30,32 36,26 42,38 50,26 56,38 62,32 84,32" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><rect x="14" y="20" width="7" height="24" rx="2"/><rect x="71" y="20" width="7" height="24" rx="2"/>',
 bench:'<rect x="10" y="26" width="72" height="8" rx="3"/><rect x="18" y="34" width="5" height="16"/><rect x="69" y="34" width="5" height="16"/>',
 bw:'<circle cx="46" cy="16" r="6"/><rect x="42" y="24" width="8" height="20" rx="3"/><rect x="30" y="26" width="32" height="4" rx="2"/>'
};
function thumb(e){
  if(e[6])return `<img class="th" src="${e[6]}" alt="${esc(e[0])} demonstration" width="92" height="64" loading="lazy">`;
  const k=(e[7]||["db"])[0];
  return `<svg class="th ph" viewBox="0 0 92 64" role="img" aria-label="${esc(EQ_NAME[k])}"><g>${ICON[k]}</g></svg>`;
}
// Arabic versions of every exercise note (shown under the target label).
const NOTE_AR={
 [flatNote]:"الكتاب يسمّي هذا التمرين بشكل مختلف في كل خطة؛ الضغط على البنش المستوي يشغّل منتصف الصدر في الغالب.",
 [incNote]:"كما هو مكتوب في الكتاب. الضغط على البنش المائل يشغّل أعلى الصدر عادةً.",
 "The book doesn’t name a target for this one.":"الكتاب لا يحدد العضلة المستهدفة لهذا التمرين.",
 [noRack]:"لا يوجد حامل للبار في البيت، لذلك هذا بديل للنسخة الثقيلة بالبار. لا تحمل البار على ظهرك أو فوق صدرك إلا إذا كان عندك حامل أو شخص يساعدك.",
 [incl]:"اضبط البنش على وضع مائل. إذا كان البنش مستويًا فقط، نفّذ التمرين وهو مستوٍ.",
 "Slight bend in the elbows; lower until you feel a stretch.":"اثنِ المرفقين قليلًا، وانزل حتى تشعر بشدّ في الصدر.",
 "Press the dumbbells together the whole way up.":"اضغط الدمبلين على بعض طوال الحركة لأعلى.",
 "One hand and knee on the bench, upper arm still.":"ضع يدًا وركبة على البنش، وثبّت أعلى الذراع.",
 "Lie face down on the incline bench and row both dumbbells.":"استلقِ على بطنك على البنش المائل واسحب الدمبلين معًا.",
 "Wedge one end of the 150 cm bar into a corner (wrap it in a towel) and row the loaded end.":"ثبّت طرف البار (150 سم) في زاوية الحائط (لفّه بفوطة) واسحب الطرف المحمّل بالأوزان.",
 "Lie face down on the incline bench, raise the dumbbells out to the sides.":"استلقِ على بطنك على البنش المائل وارفع الدمبلين للجانبين.",
 "Hold a door frame and lean away to keep tension at the bottom.":"امسك إطار الباب ومِل بجسمك بعيدًا ليبقى الشد على العضلة في أسفل الحركة.",
 "Back foot on the bench, dumbbells in hand. Sets are per leg.":"القدم الخلفية على البنش والدمبل في يديك. المجموعات لكل رجل.",
 "Sets are per leg.":"المجموعات لكل رجل.",
 "Upper back on the bench, pad the bar with a towel.":"أعلى الظهر على البنش، وضع فوطة تحت البار.",
 "Sit on the bench with dumbbells on your knees.":"اجلس على البنش وضع الدمبل على ركبتيك.",
 "Stand on a step for a full stretch. Sets are per leg.":"قف على درجة سلم لتحصل على مدى حركة كامل. المجموعات لكل رجل.",
 "Pull to chest height only; stop if your shoulders pinch.":"اسحب حتى مستوى الصدر فقط، وتوقف إذا شعرت بألم في الكتف.",
 "Lying on the floor makes a heavy bar press safe without a rack.":"الاستلقاء على الأرض يجعل الضغط بالبار الثقيل آمنًا بدون حامل."
};
const noteHtml=s=>s?`<span class="note" dir="rtl" lang="ar">${esc(NOTE_AR[s]||s)}</span>`:"";
const eqLine=e=>e[7]?`<span class="eqt">${e[8]?"<b class=\"new\">Extra</b> ":""}${e[7].map(k=>EQ_NAME[k]).join(" + ")}</span>`:"";
