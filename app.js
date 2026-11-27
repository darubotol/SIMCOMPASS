(()=>{"use strict";
const KEY="simcompass.data.v1",REALM_KEY="simcompass.realms.v2",blank=()=>({schemaVersion:2,products:[],recipes:[],buildings:[],boosts:[],inventory:[],challenge:null});
const REALMS={challenge:{label:"Challenge Realm",short:"CHALLENGE",primary:true},magnates:{label:"Magnates Realm",short:"MAGNATES"},entrepreneurs:{label:"Entrepreneurs Realm",short:"ENTREPRENEURS"}};
let realmStore,activeRealm="challenge",db,catalogCache=null;
try{
  realmStore=JSON.parse(localStorage.getItem(REALM_KEY)||"null");
  if(!realmStore||!realmStore.workspaces)throw new Error("No realm store");
}catch{
  let legacy=blank();try{legacy=Object.assign(blank(),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch{}
  realmStore={schemaVersion:2,activeRealm:"challenge",workspaces:{challenge:legacy,magnates:blank(),entrepreneurs:blank()}};
}
activeRealm=REALMS[realmStore.activeRealm]?realmStore.activeRealm:"challenge";
Object.keys(REALMS).forEach(k=>{if(!realmStore.workspaces[k])realmStore.workspaces[k]=blank()});
db=Object.assign(blank(),realmStore.workspaces[activeRealm]);
function persist(){realmStore.activeRealm=activeRealm;realmStore.workspaces[activeRealm]=db;localStorage.setItem(REALM_KEY,JSON.stringify(realmStore));localStorage.setItem(KEY,JSON.stringify(db))}
function applyCatalog(target){if(!catalogCache)return;const productNames=new Set(target.products.map(x=>String(x.name).toLowerCase()));catalogCache.products.forEach(p=>{if(!productNames.has(String(p.name).toLowerCase()))target.products.push({...p})});const recipeKeys=new Set(target.recipes.map(x=>(x.output+"|"+x.building).toLowerCase()));catalogCache.recipes.forEach(x=>{if(!recipeKeys.has((x.output+"|"+x.building).toLowerCase()))target.recipes.push({...x})});catalogCache.buildings.forEach(x=>{const b=target.buildings.find(v=>v.name.toLowerCase()===x.name.toLowerCase());if(b)Object.assign(b,{gameId:x.gameId,constructionTimeMinutes:x.constructionTimeMinutes,constructionTimeSource:x.constructionTimeSource,constructionMaterials:x.constructionMaterials,produces:x.produces,encyclopediaUrl:x.encyclopediaUrl,source:x.source});else target.buildings.push({...x})});target.catalogMeta={realm:catalogCache.realm,fetchedAt:catalogCache.fetchedAt,source:catalogCache.source,counts:catalogCache.counts}}
function updateRealmNotice(){const n=$("realmModeNotice");if(!n)return;if(activeRealm==="challenge"){n.innerHTML="<strong>Challenge Realm · primary workspace</strong> Join a challenge in the game first, then enter or import its actual starting conditions. Challenge availability and challenge-specific rules are not inferred.";n.classList.remove("realm-secondary")}else{n.innerHTML="<strong>"+REALMS[activeRealm].label+" · separate company workspace</strong> Your cash, inventory, buildings and progress are isolated from Challenge Realm. This workspace is ready for its own data, but its realm-specific optimisation engine and automatic account sync are not yet implemented.";n.classList.add("realm-secondary")}}
function loadChallengeForm(){if(!$("challengeForm"))return;const c=db.challenge||{};$("target").value=c.target||"";$("quantity").value=c.qty||750;$("budget").value=c.budget??"";$("challengeTitle").value=c.title||"";$("objectiveType").value=c.type||"deliver";$("goalDescription").value=c.description||"";$("goalAmount").value=c.amount??"";$("goalUnit").value=c.unit||"";$("challengeRules").value=c.rules||"";$("extraObjectives").value=(c.extraObjectives||[]).join("\n");$("deadline").value=c.timeLimitHours??"";$("freePlots").value=c.freePlots??0;$("objective").value=c.priority||c.objective||"time";$("deliverFields").hidden=$("objectiveType").value!=="deliver";$("genericFields").hidden=$("objectiveType").value==="deliver";$("resultTitle").textContent=c.title?"Saved challenge · "+c.title:"Your strategy will appear here";$("result").innerHTML=c.title?'<div class="empty strategy-empty"><b>Saved realm workspace</b><p>Your saved challenge inputs are restored. Recalculate after reviewing this realm’s current starting conditions.</p></div>':'<div class="empty strategy-empty"><div class="empty-icon">✳</div><b>Ready when you are.</b><p>Enter a challenge to build a strategy from this realm’s separate data.</p></div>'}
function switchRealm(next){if(!REALMS[next]||next===activeRealm)return;persist();activeRealm=next;db=Object.assign(blank(),realmStore.workspaces[next]);applyCatalog(db);persist();document.querySelectorAll("[data-realm]").forEach(b=>b.classList.toggle("active",b.dataset.realm===activeRealm));$("activeRealmLabel").textContent=REALMS[activeRealm].short;$("bridgeRealmName").textContent=REALMS[activeRealm].label;$("realmBridgeTitle").textContent=REALMS[activeRealm].label+" data";document.querySelector(".brand small").textContent=REALMS[activeRealm].short.toUpperCase()+" WORKSPACE";$("crumb").textContent=activeRealm==="challenge"?"OPTIMIZER":REALMS[activeRealm].short+" PLANNER";$("resultTitle").textContent=activeRealm==="challenge"?"Your strategy will appear here":REALMS[activeRealm].label+" workspace";$("saved").textContent="● SAVED";updateRealmNotice();loadChallengeForm();render();renderOwnedBuildings();toast(REALMS[activeRealm].label+" selected")}
document.querySelectorAll("[data-realm]").forEach(b=>b.addEventListener("click",()=>switchRealm(b.dataset.realm)));
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){persist();$("saved").textContent="● SAVED";render()}
function toast(s){const e=$("toast");e.textContent=s;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function nav(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll(".nav[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));$("crumb").textContent=p.toUpperCase();$("sidebar").classList.remove("open");scrollTo(0,0)}
document.querySelectorAll(".nav[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>nav(b.dataset.go));$("menu").onclick=()=>$("sidebar").classList.toggle("open");
const defs={
products:{title:"Add product",fields:[["name","Product name","text",1],["category","Category","text"],["unit","Unit (e.g. units, tonnes)","text"]]},
recipes:{title:"Add recipe",fields:[["output","Output product","text",1],["building","Required building","text",1],["quantity","Output quantity per run","number",1],["minutes","Production time (minutes)","number",1],["inputs","Inputs as Product:quantity, comma separated","text"]]},
buildings:{title:"Add building",fields:[["name","Building name","text",1],["level","Building level","number",1],["slots","Available parallel slots","number",1],["notes","Notes","text"]]},
boosts:{title:"Add boost",fields:[["name","Boost name","text",1],["bonus","Production speed bonus (%)","number",1],["duration","Duration (hours)","number",1],["stacking","Stacking mode","select",1]]},
inventory:{title:"Add inventory / market row",fields:[["product","Product name","text",1],["stock","On-hand quantity","number",1],["price","Market price per unit","number"]]}
};
let currentType=null;
function openModal(type){currentType=type;const d=defs[type];$("modalTitle").textContent=d.title;$("fields").innerHTML=d.fields.map(f=>{const id=f[0],label=f[1],kind=f[2],req=f[3];return "<label>"+esc(label)+(kind==="select"?"<select name='"+id+"' required><option value='add'>Additive</option><option value='max'>Highest bonus only</option><option value='independent'>Independent / multiply</option></select>":"<input name='"+id+"' type='"+kind+"' "+(kind==="number"?'min="0" step="any"':"")+(req?" required":"")+"></label>")}).join("")}
function closeModal(){$("overlay").classList.remove("open");$("recordForm").reset()}
document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{openModal(b.dataset.add);$("overlay").classList.add("open")});$("close").onclick=$("cancel").onclick=closeModal;$("overlay").onclick=e=>{if(e.target===$("overlay"))closeModal()};
function parseInputs(raw){if(!raw.trim())return[];return raw.split(",").map(x=>{const m=x.trim().match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)$/);if(!m)throw Error("Inputs must use Product:quantity format.");return {product:m[1].trim(),quantity:Number(m[2])}})}
$("recordForm").onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target)),type=currentType;try{
if(type==="products"){if(db.products.some(x=>x.name.toLowerCase()===o.name.trim().toLowerCase()))throw Error("That product already exists.");db.products.push({id:crypto.randomUUID(),name:o.name.trim(),category:o.category,unit:o.unit})}
if(type==="recipes"){if(!(Number(o.quantity)>0&&Number(o.minutes)>0))throw Error("Output quantity and duration must be positive.");db.recipes.push({id:crypto.randomUUID(),output:o.output.trim(),building:o.building.trim(),quantity:+o.quantity,minutes:+o.minutes,inputs:parseInputs(o.inputs||"")})}
if(type==="buildings"){if(!(Number(o.level)>0&&Number(o.slots)>=0))throw Error("Building level must be positive and slots cannot be negative.");const existing=db.buildings.find(x=>x.name.toLowerCase()===o.name.trim().toLowerCase());if(existing){existing.level=+o.level;existing.slots=+o.slots;existing.notes=o.notes||existing.notes}else db.buildings.push({id:crypto.randomUUID(),name:o.name.trim(),level:+o.level,slots:+o.slots,notes:o.notes})}
if(type==="boosts")db.boosts.push({id:crypto.randomUUID(),name:o.name.trim(),bonus:+o.bonus,duration:+o.duration,stacking:o.stacking});
if(type==="inventory"){const old=db.inventory.find(x=>x.product.toLowerCase()===o.product.trim().toLowerCase());const row={id:old?old.id:crypto.randomUUID(),product:o.product.trim(),stock:+o.stock||0,price:o.price===""?null:+o.price};if(old)Object.assign(old,row);else db.inventory.push(row)}
closeModal();save();toast("Record saved")}catch(err){toast(err.message)}};
function remove(type,id){if(!confirm("Delete this record?"))return;db[type]=db[type].filter(x=>x.id!==id);save();toast("Record deleted")}
function action(type,id){return '<button class="delete" data-del="'+type+'" data-id="'+id+'">DELETE</button>'}
function table(id,rows,cols,empty){$(id).innerHTML=rows.length?rows.map(r=>"<tr>"+cols(r)+"</tr>").join(""):'<tr><td class="emptycell" colspan="9">'+empty+"</td></tr>";$(id).querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>remove(b.dataset.del,b.dataset.id))}
function render(){
$("nProducts").textContent=db.products.length;$("nRecipes").textContent=db.recipes.length;$("nBuildings").textContent=db.buildings.reduce((n,b)=>n+(Number(b.ownedCount)||Number(b.slots)||0),0);$("nBoosts").textContent=db.boosts.length;
const checks=[["Products",db.products.length>0],["Recipes",db.recipes.length>0],["Buildings",db.buildings.length>0],["Inventory",db.inventory.length>0]],n=checks.filter(x=>x[1]).length;$("progress").style.width=(n/4*100)+"%";$("checklist").innerHTML=checks.map(x=>'<div class="check '+(x[1]?"done":"")+'"><i></i><span>'+x[0]+' '+(x[0]==="Products"?"catalogue populated":x[0]==="Recipes"?"entered":x[0]==="Buildings"?"configured":"entered")+'</span><small>'+(x[1]?"READY":"PENDING")+"</small></div>").join("");
$("productNames").innerHTML=db.products.map(p=>'<option value="'+esc(p.name)+'"></option>').join("");
table("productsTable",db.products,r=>'<td><span class="product-cell">'+(r.image&&r.image.startsWith("http")?'<img class="game-icon" src="'+esc(r.image)+'" alt="">':'<span class="game-icon fallback">◇</span>')+'<b>'+esc(r.name)+'</b></span></td><td>'+esc(r.category||"—")+'</td><td>'+esc(r.unit||"—")+'</td><td>'+(r.source?"GAME DATA":"USER ENTERED")+'</td><td>'+action("products",r.id)+"</td>","No products yet. Add a verified product.");
table("recipesTable",db.recipes,r=>'<td><b>'+esc(r.output)+'</b></td><td>'+esc(r.building)+'</td><td>'+r.quantity+'</td><td>'+r.minutes+' min</td><td>'+r.inputs.map(i=>esc(i.product)+": "+i.quantity).join(", ")+'</td><td>'+action("recipes",r.id)+"</td>","No production recipes configured.");
table("buildingsTable",db.buildings,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+((r.constructionTimeMinutes!==null&&r.constructionTimeMinutes!==undefined)?(r.constructionTimeMinutes/60).toFixed(2)+' hr':'Not verified')+'</td><td><input class="building-edit" type="number" min="1" step="1" value="'+(Number(r.level)||1)+'" data-building-id="'+r.id+'" data-building-field="level" aria-label="Owned level for '+esc(r.name)+'"></td><td><input class="building-edit" type="number" min="0" step="1" value="'+(Number(r.slots)||0)+'" data-building-id="'+r.id+'" data-building-field="slots" aria-label="Owned slots for '+esc(r.name)+'"></td><td>'+esc((r.produces||[]).join(", ")||r.notes||"—")+'</td><td>'+(r.encyclopediaUrl?'<a href="'+esc(r.encyclopediaUrl)+'" target="_blank" rel="noopener">Encyclopedia</a>':'—')+'</td><td>'+action("buildings",r.id)+"</td>","No buildings configured.");
table("boostsTable",db.boosts,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+r.bonus+'%</td><td>'+r.duration+' hr</td><td>'+esc(r.stacking)+'</td><td>'+action("boosts",r.id)+"</td>","No boosts configured.");
table("inventoryTable",db.inventory,r=>'<td><b>'+esc(r.product)+'</b></td><td>'+Number(r.stock||0).toLocaleString("en-IN",{maximumFractionDigits:2})+'</td><td>'+(r.price===null||r.price===undefined?"—":Number(r.price).toLocaleString("en-IN",{maximumFractionDigits:2}))+"</td><td>"+action("inventory",r.id)+"</td>","No inventory or market rows entered.");
$("buildingsTable").querySelectorAll("[data-building-field]").forEach(input=>input.onchange=()=>{const b=db.buildings.find(x=>x.id===input.dataset.buildingId),v=Number(input.value);if(!b||!Number.isInteger(v)||v<(input.dataset.buildingField==="level"?1:0)){toast("Enter a valid whole-number building level or slot count.");render();return}b[input.dataset.buildingField]=v;if(input.dataset.buildingField==="slots"&&v>0&&Number(b.level)<1)b.level=1;persist();$("saved").textContent="● SAVED";render();toast("Owned building capacity updated")});$("productCount").textContent=db.products.length+" records";
}
$("searchProducts").oninput=e=>{const q=e.target.value.toLowerCase(),rows=db.products.filter(p=>p.name.toLowerCase().includes(q)||String(p.category).toLowerCase().includes(q));table("productsTable",rows,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+esc(r.category||"—")+'</td><td>'+esc(r.unit||"—")+'</td><td>USER ENTERED</td><td>'+action("products",r.id)+"</td>","No matching products.")};
function getBoostedDuration(workMinutes,startOffset=0,effect="production"){
 let rules=[];try{rules=JSON.parse(localStorage.getItem("simcompass.advanced.v1")||"{}").boostRules||[]}catch{}
 rules=rules.filter(r=>r?.effects?.[effect]&&Number(r.multiplier)>0);
 let remaining=Math.max(0,Number(workMinutes)||0),elapsed=0,clock=Date.now()+Math.max(0,startOffset)*60000;
 if(!remaining)return 0;
 const multiplierAt=t=>{
  const active=rules.filter(r=>(!r.start||new Date(r.start).getTime()<=t)&&(!r.end||new Date(r.end).getTime()>t));
  const groups={multiply:1,independent:1,add:0,highest:1};
  for(const r of active){const m=Number(r.multiplier)||1,mode=r.stacking||"multiply";if(mode==="multiply")groups.multiply*=m;else if(mode==="independent")groups.independent*=m;else if(mode==="add")groups.add+=Math.max(0,m-1);else if(mode==="highest")groups.highest=Math.max(groups.highest,m)}
  return Math.max(.01,groups.multiply*groups.independent*(1+groups.add)*groups.highest);
 };
 for(let guard=0;guard<100&&remaining>1e-7;guard++){
  const speed=multiplierAt(clock);
  const boundaries=rules.flatMap(r=>[r.start,r.end]).filter(Boolean).map(v=>new Date(v).getTime()).filter(t=>Number.isFinite(t)&&t>clock).sort((x,y)=>x-y);
  if(!boundaries.length)return elapsed+remaining/speed;
  const interval=(boundaries[0]-clock)/60000;
  if(interval*speed>=remaining)return elapsed+remaining/speed;
  remaining-=interval*speed;elapsed+=interval;clock=boundaries[0];
 }
 return elapsed+remaining/multiplierAt(clock);
}
function plan(target,qty,objective,budget=null,freePlots=0){
 const initial={__freePlots:{value:Math.max(0,Math.floor(Number(freePlots)||0))},__scrapped:{},__scrappedIds:[],__setupSteps:[]};
 db.inventory.forEach(x=>initial[String(x.product).toLowerCase()]={product:x.product,stock:Math.max(0,Number(x.stock)||0),price:x.price===null||x.price===undefined?null:Number(x.price)});
 const clone=state=>Object.fromEntries(Object.entries(state).map(([k,v])=>[k,Array.isArray(v)?[...v]:v&&typeof v==="object"?{...v}:v]));
 const choicesFor=(product,amount,state,stack,depth)=>{
  if(amount<=1e-8)return[{time:0,cash:0,state,steps:[],issues:[]}];
  const key=String(product).toLowerCase();
  if(depth>30||stack.includes(key))return[];
  const inv=state[key]||{product,stock:0,price:null},used=Math.min(amount,inv.stock||0),need=amount-used;
  const base=clone(state);base[key]={...inv,stock:(inv.stock||0)-used};
  const stockStep=used?[{kind:"stock",product,qty:used,time:0,cash:0}]:[];
  if(need<=1e-8)return[{time:0,cash:0,state:base,steps:stockStep,issues:[]}];
  const choices=[];
  if(inv.price!==null&&Number.isFinite(inv.price)&&inv.price>=0){
   choices.push({time:0,cash:need*inv.price,state:clone(base),steps:[...stockStep,{kind:"market",product,qty:need,time:0,cash:need*inv.price}],issues:["Market purchases are treated as immediately available at the entered price; unobserved order-book depth is not guaranteed."]});
  }
  const recipes=db.recipes.filter(x=>String(x.output).toLowerCase()===key).slice(0,12);
  for(const recipe of recipes){
   const building=db.buildings.find(x=>String(x.name).toLowerCase()===String(recipe.building).toLowerCase());
   if(!building)continue;
   const rawCapacity=Number(building.ownedCapacity)||((Number(building.ownedCount)||0)*(Number(building.level)||1))||(activeRealm!=="challenge"?Number(building.slots)||0:0);
   const ownedCapacity=Math.max(0,rawCapacity-(Number(state.__scrapped?.[String(building.name).toLowerCase()])||0));
   const options=[];
   if(ownedCapacity>0)options.push({capacity:ownedCapacity,build:null});
   const plots=Number(state.__freePlots?.value)||0;
   const constructionTime=Number(building.constructionTimeMinutes);
   const materials=building.constructionMaterials&&typeof building.constructionMaterials==="object"?building.constructionMaterials:null;
   if(Number.isFinite(constructionTime)&&constructionTime>0&&materials&&Object.keys(materials).length){
    if(ownedCapacity>0){const excluded=new Set(state.__scrappedIds||[]);const remaining=(db.challengeOwnedBuildings||[]).filter(x=>String(x.name).toLowerCase()===String(building.name).toLowerCase()&&!excluded.has(String(x.gameId))).map(x=>Number(x.level)||1);const level=remaining.length?Math.max(...remaining):Math.max(1,Number(building.level)||1);const upgradeMaterials=Object.fromEntries(Object.entries(materials).map(([k,v])=>[k,Number(v)*level]));options.push({capacity:ownedCapacity+1,build:{kind:"upgrade",building,constructionTime:constructionTime*level,materials:upgradeMaterials}})}
    if(plots>0)options.push({capacity:ownedCapacity+1,build:{kind:"build",building,constructionTime,materials}});
   }
   for(const option of options){
    const outputPerRun=Math.max(1e-8,Number(recipe.quantity)||1);
    const runs=Math.ceil(need/(outputPerRun*option.capacity));
    let ownTime=0;
    let branch=clone(base),targetInputTime=0,buildMaterialTime=0,depCash=0,steps=[...stockStep],issues=[],valid=true;
    if(option.build){
     if(option.build.kind==="build")branch.__freePlots={value:Math.max(0,(Number(branch.__freePlots?.value)||0)-1)};
     for(const [material,materialQty] of Object.entries(option.build.materials)){
      const child=choicesFor(material,Number(materialQty),branch,[...stack,key],depth+1).sort((a,b)=>objective==="cost"?(a.cash-b.cash||a.time-b.time):(a.time-b.time||a.cash-b.cash))[0];
      if(!child){valid=false;break}
      branch=child.state;buildMaterialTime=Math.max(buildMaterialTime,child.time);depCash+=child.cash;steps.push(...child.steps);issues.push(...child.issues);
     }
    }
    if(!valid)continue;
    for(const input of recipe.inputs||[]){
     const child=choicesFor(input.product,Number(input.quantity)*runs*option.capacity,branch,[...stack,key],depth+1).sort((a,b)=>objective==="cost"?(a.cash-b.cash||a.time-b.time):(a.time-b.time||a.cash-b.cash))[0];
     if(!child){valid=false;break}
     branch=child.state;targetInputTime=Math.max(targetInputTime,child.time);depCash+=child.cash;steps.push(...child.steps);issues.push(...child.issues);
    }
    if(!valid)continue;
    let buildTime=0,buildCash=0;
    if(option.build){
     buildTime=getBoostedDuration(option.build.constructionTime,buildMaterialTime,"construction");
     buildCash=0;
     steps.push({kind:option.build.kind,product:option.build.building.name,qty:1,time:buildTime,cash:0,building:option.build.building.name,startOffset:buildMaterialTime,endOffset:buildMaterialTime+buildTime});
    }
    const ownStart=Math.max(targetInputTime,buildMaterialTime+buildTime);
    ownTime=getBoostedDuration(runs*Number(recipe.minutes||0),ownStart,"production");
    const totalTime=ownStart+ownTime;
    choices.push({time:totalTime,cash:depCash+buildCash,state:branch,steps:[...steps,{kind:"make",product,qty:runs*outputPerRun*option.capacity,time:ownTime,cash:0,building:recipe.building,level:option.build?(option.build.kind==="upgrade"?(Number(building.level)||1)+1:1):building.level,buildingCapacity:option.capacity,runs,startOffset:ownStart,endOffset:ownStart+ownTime}],issues});
   }
  }
  return choices;
 };
 const scrapable=(activeRealm==="challenge"?(db.challengeOwnedBuildings||[]):[]).filter(x=>x.scrapAllowed);
 const variants=[initial];
 if(scrapable.length&&scrapable.length<=6){for(let mask=1;mask<(1<<scrapable.length);mask++){const v=clone(initial);for(let i=0;i<scrapable.length;i++){if(!(mask&(1<<i)))continue;const item=scrapable[i],building=db.buildings.find(b=>String(b.name).toLowerCase()===String(item.name).toLowerCase());if(!building?.constructionMaterials)continue;const level=Math.max(1,Number(item.level)||1),name=String(item.name).toLowerCase();v.__scrapped[name]=(Number(v.__scrapped[name])||0)+level;v.__scrappedIds.push(String(item.gameId));v.__freePlots.value++;v.__setupSteps.push({kind:"scrap",product:item.name,qty:1,time:0,cash:0,building:item.name});for(const [material,baseQty] of Object.entries(building.constructionMaterials)){const key=material.toLowerCase(),row=v[key]||{product:material,stock:0,price:null};row.stock=(Number(row.stock)||0)+Number(baseQty)*level;v[key]=row}}if(v.__scrappedIds.length)variants.push(v)}}
 else if(scrapable.length>6){for(const item of scrapable){const v=clone(initial),building=db.buildings.find(b=>String(b.name).toLowerCase()===String(item.name).toLowerCase());if(!building?.constructionMaterials)continue;const level=Math.max(1,Number(item.level)||1),name=String(item.name).toLowerCase();v.__scrapped[name]=level;v.__scrappedIds=[String(item.gameId)];v.__freePlots.value++;v.__setupSteps=[{kind:"scrap",product:item.name,qty:1,time:0,cash:0,building:item.name}];for(const [material,baseQty] of Object.entries(building.constructionMaterials)){const key=material.toLowerCase(),row=v[key]||{product:material,stock:0,price:null};row.stock=(Number(row.stock)||0)+Number(baseQty)*level;v[key]=row}variants.push(v)}}
 const candidates=variants.flatMap(v=>choicesFor(target,qty,v,[],0).map(c=>({...c,steps:[...(v.__setupSteps||[]),...c.steps]})));
 if(!candidates.length)return{result:null,missing:[target],issues:["No complete route found. Check recipes, ingredient prices, owned building counts/levels and available empty plots. New construction is considered only when its construction time and material list are verified in the bundled data."],steps:[]};
 candidates.sort((x,y)=>objective==="cost"?(x.cash-y.cash||x.time-y.time):(x.time-y.time||x.cash-y.cash));
 const best=candidates[0],issues=[...new Set(best.issues)];
 if(budget!==null&&best.cash>budget)issues.push("Required procurement cash exceeds starting cash by "+(best.cash-budget).toFixed(2)+".");
 if(best.steps.some(x=>x.kind==="build"||x.kind==="upgrade"))issues.push("Building construction/upgrades are included using verified base time and material records. Shared construction-queue contention and challenge-specific construction modifiers still need in-game validation.");
 if(best.steps.some(x=>x.kind==="scrap"))issues.push("Scrapping is modelled from the published FAQ salvage rule (base construction materials × building level). Confirm that the game permits scrapping each selected building and verify the in-game refund before acting.");
 if(scrapable.length>6)issues.push("More than six buildings were marked scrap-eligible; the planner tested each individual scrap and the no-scrap route, not every combination.");
 if(!Number(freePlots))issues.push("No free building plots were entered; new-building construction alternatives were not considered (upgrades remain eligible).");
 return{result:{minutes:best.time,cost:best.cash,endingCash:budget===null?null:budget-best.cash},missing:[],issues,steps:best.steps};
}
function syncCapturedChallengeFeeds(){
 if(activeRealm!=="challenge")return;
 let feeds=[];try{feeds=JSON.parse(localStorage.getItem("simcompass.api.challenge.data.v1")||"[]")}catch{return}
 if(!Array.isArray(feeds)||!feeds.length)return;
 const byPath=new Map(feeds.map(x=>[x.endpoint,x.data]));
 const challengeFeed=byPath.get("/api/v1/challenges/current/");
 const resourceCapture=feeds.filter(x=>/^\/api\/v3\/resources\/\d+\/$/.test(x.endpoint)).sort((a,b)=>String(b.capturedAt).localeCompare(String(a.capturedAt)))[0];
 const resourceFeed=resourceCapture?.data;
 const tickerFeed=feeds.filter(x=>/^\/api\/v3\/market-ticker\/\d+\/$/.test(x.endpoint)).sort((a,b)=>String(b.capturedAt).localeCompare(String(a.capturedAt)))[0]?.data;
 const resources=Array.isArray(resourceFeed)?resourceFeed:[];
 const ticker=Array.isArray(tickerFeed)?tickerFeed:[];
 const productsById=new Map((catalogCache?.products||db.products).map(p=>[Number(p.gameId??String(p.id||"").replace("game-","")),p]));
 const upsert=(name,patch)=>{if(!name)return;let row=db.inventory.find(x=>String(x.product).toLowerCase()===String(name).toLowerCase());if(!row){row={id:"live-"+String(name).toLowerCase().replace(/[^a-z0-9]+/g,"-"),product:name,stock:0,price:null,marketQty:0,lead:0};db.inventory.push(row)}Object.assign(row,patch,{source:"Challenge Realm live capture"})};
 for(const item of resources){const p=productsById.get(Number(item.kind));if(!p)continue;upsert(p.name,{stock:Math.max(0,Number(item.amount)||0),gameId:Number(item.kind),inventoryCapturedAt:resourceCapture?.capturedAt||null})}
 for(const item of ticker){const p=productsById.get(Number(item.kind));if(!p||!Number.isFinite(Number(item.price)))continue;upsert(p.name,{price:Number(item.price),gameId:Number(item.kind),marketCapturedAt:feeds.filter(x=>Array.isArray(x.data)&&x.data===tickerFeed)[0]?.capturedAt||null})}
 if(challengeFeed?.challenge){
  const c=challengeFeed.challenge,g=c.goal||{},p=productsById.get(Number(g.resourceKind));
  db.liveChallengeData={challengeId:c.id,title:c.narrativeTitle||c.id,goalKind:g.kind,goalProduct:p?.name||null,resourceKind:g.resourceKind,target:Number(g.target)||null,progress:Number(challengeFeed.attempt?.goalProgress)||0,start:c.start||null,end:c.end||null,rules:c.rules||[],details:c.details||[],productionModifier:Number(c.productionModifier)||1,salesModifier:Number(c.salesModifier)||1,timeAcceleration:Number(c.timeAcceleration)||1,simBoostsStarting:Number(challengeFeed.simBoostsPool?.starting)||0,simBoostsPurchased:Number(challengeFeed.simBoostsPool?.purchased)||0,capturedAt:feeds.find(x=>x.endpoint==="/api/v1/challenges/current/")?.capturedAt||null};
  const live=db.liveChallengeData;
  db.challenge={...(db.challenge||{}),title:live.title,target:live.goalProduct||db.challenge?.target||"",qty:live.target||db.challenge?.qty||750,type:g.kind==="p"?"deliver":"custom",description:g.kind==="p"?"Deliver "+(live.target||"")+" "+(live.goalProduct||"units")+".":("Game objective type: "+String(g.kind||"unknown")+". Enter the exact success condition from the challenge screen."),objective:"time",timeLimitHours:db.challenge?.timeLimitHours??null,liveProgress:live.progress,liveTarget:live.target,liveChallengeId:live.challengeId};
 }
 // Preserve a first-observed snapshot per challenge attempt. Never overwrite it when later captures arrive.
 const attempt=challengeFeed?.attempt||{};
 const challenge=challengeFeed?.challenge||{};
 const attemptKey=String(challenge.id||"unknown")+":"+String(attempt.started||"unknown");
 if(!db.challengeInitialSnapshot||db.challengeInitialSnapshot.attemptKey!==attemptKey){
  const copy=v=>v==null?null:JSON.parse(JSON.stringify(v));
  db.challengeInitialSnapshot={
   version:1,attemptKey,challengeId:challenge.id||null,attemptStarted:attempt.started||null,
   capturedAt:new Date().toISOString(),captureType:"first-observed-after-connector-import",
   challenge:copy(challengeFeed),products:copy(catalogCache?.products||db.products),
   recipes:copy(catalogCache?.recipes||db.recipes),buildingCatalogue:copy(catalogCache?.buildings||db.buildings),
   startingInventory:copy(resources),marketPrices:copy(ticker),
   firstObservedBuildings:Array.isArray(db.challengeOwnedBuildings)?copy(db.challengeOwnedBuildings):null,
   completeness:{catalogueProducts:(catalogCache?.products||db.products).length,recipes:(catalogCache?.recipes||db.recipes).length,buildingTypes:(catalogCache?.buildings||db.buildings).length,inventoryRecords:resources.length,marketPriceRecords:ticker.length,buildingsObserved:Array.isArray(db.challengeOwnedBuildings)}
  };
 }
 db.liveFeedStatus={feedCount:feeds.length,inventoryCount:resources.length,marketCount:ticker.length,updatedAt:new Date().toISOString(),cashAvailable:false,snapshotAttemptKey:attemptKey};
 persist();
 const notice=$("realmModeNotice");
 if(notice&&db.liveChallengeData){
  let status=notice.querySelector(".live-feed-status");if(!status){status=document.createElement("div");status.className="snapshot-status live-feed-status";notice.appendChild(status)}
  const live=db.liveChallengeData;
  status.innerHTML="<strong>Live Challenge Realm data mapped:</strong> "+esc(live.title)+" · progress "+live.progress+" / "+live.target+" "+esc(live.goalProduct||"units")+". Inventory: "+resources.length+" resource records; market: "+ticker.length+" captured price records. First-observed snapshot: "+(db.challengeInitialSnapshot?esc(db.challengeInitialSnapshot.capturedAt):"pending")+". Cash balance is not present in the safely captured feeds.";
 }
 loadChallengeForm();
 render();
}
function challengeBuildingsSnapshot(){try{const s=JSON.parse(localStorage.getItem("simcompass.api.challenge.buildings.v1")||"null");return s&&Array.isArray(s.payload)?s:null}catch{return null}}
function syncChallengeBuildingsSnapshot(){
 if(activeRealm!=="challenge")return;
 const snapshot=challengeBuildingsSnapshot();if(!snapshot)return;
 if(db.challengeBuildingSnapshot?.id===snapshot.id&&Array.isArray(db.challengeOwnedBuildings)){renderOwnedBuildings();return}
 const records=snapshot.payload;
 const slug=s=>String(s||"").toLowerCase().replace(/\.[a-z0-9]+$/i,"").replace(/_tier\d+/g,"").replace(/[^a-z0-9]+/g," ").trim();
 const title=s=>s.replace(/\b\w/g,ch=>ch.toUpperCase());
 const previous=Array.isArray(db.challengeOwnedBuildings)?db.challengeOwnedBuildings:[];
 const oldById=new Map(previous.map(x=>[String(x.gameId),x]));
 const owned=[];
 for(let i=0;i<records.length;i++){
  const record=records[i]||{};
  const image=String(record.image||record.imageUrl||record.image_url||"");
  const file=image.split("/").pop()||"";
  const stem=file.replace(/\.[a-z0-9]+$/i,"").replace(/_tier\d+/g,"");
  const rawName=record.name||record.buildingName||record.building_name||title(stem);
  if(!rawName)continue;
  const gameId=String(record.id??record.buildingId??record.building_id??(record.position!==undefined?"position-"+record.position:"record-"+i));
  const prior=oldById.get(gameId);
  const tierMatch=image.match(/tier[_-]?(\d+)/i);
  const candidates=[tierMatch?.[1],record.buildingLevel,record.building_level,record.level,record.tier,prior?.level];
  const level=candidates.map(v=>Number(v)).find(v=>Number.isFinite(v)&&Number.isInteger(v)&&v>0)||1;
  const catalogue=db.buildings.find(x=>slug(x.name)===slug(rawName));
  owned.push({gameId,name:catalogue?.name||rawName,level,image,position:record.position??null,scrapAllowed:prior?.scrapAllowed===true});
 }
 db.challengeOwnedBuildings=owned;
 if(db.challengeInitialSnapshot&&db.challengeInitialSnapshot.firstObservedBuildings===null){db.challengeInitialSnapshot.firstObservedBuildings=JSON.parse(JSON.stringify(owned));db.challengeInitialSnapshot.completeness.buildingsObserved=true;db.challengeInitialSnapshot.firstObservedBuildingsCapturedAt=snapshot.capturedAt||new Date().toISOString()}
 const groups=new Map();
 for(const item of owned){const key=slug(item.name);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item)}
 for(const [key,items] of groups){
  let building=db.buildings.find(x=>slug(x.name)===key);
  if(!building){building={id:"challenge-api-"+key.replace(/ /g,"-"),name:items[0].name,level:1,owned:true};db.buildings.push(building)}
  building.owned=true;
  building.ownedCount=items.length;
  building.level=Math.max(...items.map(x=>x.level));
  building.ownedCapacity=items.reduce((sum,x)=>sum+Math.max(1,Number(x.level)||1),0);
  building.apiSnapshotId=snapshot.id;
 }
 db.challengeBuildingSnapshot={id:snapshot.id,capturedAt:snapshot.capturedAt,recordCount:owned.length,buildingTypes:groups.size,mappedRecords:owned.length};
 persist();renderOwnedBuildings();
 const notice=$("realmModeNotice");
 if(notice&&activeRealm==="challenge"){
  const old=notice.querySelector(".snapshot-status");if(old)old.remove();
  const status=document.createElement("div");status.className="snapshot-status";
  status.innerHTML="<strong>Game snapshot imported:</strong> "+owned.length+" buildings across "+groups.size+" types. Buildings are grouped by type and level; counts and levels are editable.";
  notice.appendChild(status);
 }
}
function renderOwnedBuildings(){
 const host=$("ownedBuildingList");if(!host)return;
 const individual=activeRealm==="challenge"&&Array.isArray(db.challengeOwnedBuildings)?db.challengeOwnedBuildings:null;
 $("buildingNames").innerHTML=db.buildings.map(x=>'<option value="'+esc(x.name)+'"></option>').join("");
 if(individual){
  const groups=new Map();
  individual.forEach(x=>{
   const key=String(x.name).toLowerCase()+"|"+(Number(x.level)||1);
   if(!groups.has(key))groups.set(key,{name:x.name,level:Number(x.level)||1,items:[]});
   groups.get(key).items.push(x);
  });
  const rows=[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.level-b.level);
  host.innerHTML=rows.length?'<div class="owned-building-groups">'+rows.map(g=>'<div class="owned-building-row"><b>'+esc(g.name)+'</b><label>Level<input type="number" min="1" step="1" value="'+g.level+'" data-group-key="'+esc(g.name.toLowerCase()+"|"+g.level)+'" data-group-level></label><label>Count<input type="number" min="0" step="1" value="'+g.items.length+'" data-group-key="'+esc(g.name.toLowerCase()+"|"+g.level)+'" data-group-count></label><label class="scrap-option"><input type="checkbox" data-group-key="'+esc(g.name.toLowerCase()+"|"+g.level)+'" data-group-scrap '+(g.items.every(x=>x.scrapAllowed)?"checked":"")+' > Allow scrap</label></div>').join("")+'</div>':'<p class="empty">No Challenge Realm building records imported yet.</p>';
  const saveGroup=(input,field)=>{
   const group=groups.get(input.dataset.groupKey),n=Number(input.value);
   if(!group||!Number.isInteger(n)||n<(field==="level"?1:0)){toast(field==="level"?"Level must be a positive whole number":"Count cannot be negative");renderOwnedBuildings();return}
   if(field==="level"){
    group.items.forEach(x=>x.level=n);
   }else{
    const current=group.items.length;
    if(n<current){
     const removeIds=new Set(group.items.slice(n).map(x=>String(x.gameId)));
     db.challengeOwnedBuildings=db.challengeOwnedBuildings.filter(x=>!removeIds.has(String(x.gameId)));
    }else if(n>current){
     const template=group.items[0];
     for(let i=current;i<n;i++)db.challengeOwnedBuildings.push({gameId:"manual-"+crypto.randomUUID(),name:group.name,level:group.level,image:template?.image||"",position:null,manual:true,scrapAllowed:template?.scrapAllowed===true});
    }
   }
   const all=db.challengeOwnedBuildings;
   const sameName=all.filter(x=>x.name===group.name);
   let b=db.buildings.find(v=>v.name===group.name);
   if(!b){b={id:"challenge-api-"+group.name.toLowerCase().replace(/[^a-z0-9]+/g,"-"),name:group.name,owned:true};db.buildings.push(b)}
   b.owned=true;b.ownedCount=sameName.length;b.level=Math.max(1,...sameName.map(x=>Number(x.level)||1));b.ownedCapacity=sameName.reduce((sum,x)=>sum+Math.max(1,Number(x.level)||1),0);
   db.challengeBuildingSnapshot={...(db.challengeBuildingSnapshot||{}),recordCount:all.length};
   persist();renderOwnedBuildings();$("saved").textContent="● SAVED";toast("Building group updated");
  };
  host.querySelectorAll("[data-group-level]").forEach(input=>input.onchange=()=>saveGroup(input,"level"));
  host.querySelectorAll("[data-group-count]").forEach(input=>input.onchange=()=>saveGroup(input,"count"));
  host.querySelectorAll("[data-group-scrap]").forEach(input=>input.onchange=()=>{const group=groups.get(input.dataset.groupKey);if(!group)return;group.items.forEach(x=>x.scrapAllowed=input.checked);persist();$("saved").textContent="● SAVED";toast(input.checked?"Marked as optional scrap candidates":"Scrap option disabled")});
  return;
 }
 const rows=db.buildings.filter(x=>Number(x.ownedCount)>0||Number(x.slots)>0||x.owned===true);
 host.innerHTML=rows.length?rows.map(x=>'<div class="owned-building-row"><b>'+esc(x.name)+'</b><label>Level<input type="number" min="1" step="1" value="'+(Number(x.level)||1)+'" data-owned-id="'+esc(x.id)+'" data-owned-field="level"></label><label>Count<input type="number" min="0" step="1" value="'+(Number(x.ownedCount)||Number(x.slots)||0)+'" data-owned-id="'+esc(x.id)+'" data-owned-field="ownedCount"></label><button class="secondary" type="button" data-owned-remove="'+esc(x.id)+'">REMOVE</button></div>').join(""):'<p class="empty">No starting buildings configured yet.</p>';
 host.querySelectorAll("[data-owned-field]").forEach(input=>input.onchange=()=>{const x=db.buildings.find(v=>String(v.id)===input.dataset.ownedId),n=Number(input.value);if(!x||!Number.isInteger(n)||n<(input.dataset.ownedField==="level"?1:0)){toast("Enter a valid level or slot count");renderOwnedBuildings();return}x[input.dataset.ownedField]=n;x.ownedCount=Number(x.ownedCount)||0;x.ownedCapacity=x.ownedCount*(Number(x.level)||1);x.owned=x.ownedCount>0;persist();renderOwnedBuildings();$("saved").textContent="● SAVED"});
 host.querySelectorAll("[data-owned-remove]").forEach(btn=>btn.onclick=()=>{const x=db.buildings.find(v=>String(v.id)===btn.dataset.ownedRemove);if(x){x.ownedCount=0;x.ownedCapacity=0;x.slots=0;x.owned=false;persist();renderOwnedBuildings();$("saved").textContent="● SAVED"}});
}
$("addOwnedBuilding").onclick=()=>{const name=$("ownedBuildingName").value.trim(),level=Number($("ownedBuildingLevel").value),count=Number($("ownedBuildingCount").value),x=db.buildings.find(v=>v.name.toLowerCase()===name.toLowerCase());if(!x){toast("Choose a building from the game catalogue");return}if(!Number.isInteger(level)||level<1||!Number.isInteger(count)||count<0){toast("Check building level and building count");return}x.level=level;x.ownedCount=count;x.ownedCapacity=level*count;x.owned=true;persist();$("ownedBuildingName").value="";renderOwnedBuildings();$("saved").textContent="● SAVED";toast("Starting building saved")};
$("objectiveType").onchange=()=>{const deliver=$("objectiveType").value==="deliver";$("deliverFields").hidden=!deliver;$("genericFields").hidden=deliver};
$("challengeForm").onsubmit=e=>{
 e.preventDefault();
 const type=$("objectiveType").value,title=$("challengeTitle").value.trim(),budget=$("budget").value===""?null:Number($("budget").value),priority=$("objective").value;
 const challenge={title,type,description:$("goalDescription").value.trim(),amount:$("goalAmount").value===""?null:Number($("goalAmount").value),unit:$("goalUnit").value.trim(),rules:$("challengeRules").value.trim(),extraObjectives:$("extraObjectives").value.split("\\n").map(x=>x.trim()).filter(Boolean),timeLimitHours:$("deadline").value.trim()===""?null:Number($("deadline").value),freePlots:Math.max(0,Math.floor(Number($("freePlots").value)||0)),priority,budget,updatedAt:new Date().toISOString()};
 if(challenge.timeLimitHours!==null&&(!(challenge.timeLimitHours>0)||!Number.isFinite(challenge.timeLimitHours))){toast("Enter a valid positive time limit in hours, or leave it blank for fastest possible.");return}
 let p=null,html="";
 if(type==="deliver"){
  const target=$("target").value.trim(),qty=Number($("quantity").value);
  if(!target||!(qty>0)){toast("Enter a valid product and target quantity");return}
  challenge.target=target;challenge.qty=qty;challenge.objective=priority;
  const remainingQty=(db.liveChallengeData&&String(db.liveChallengeData.goalProduct||"").toLowerCase()===target.toLowerCase()&&Number(db.liveChallengeData.target)===qty)?Math.max(0,qty-(Number(db.liveChallengeData.progress)||0)):qty;
  p=plan(target,remainingQty,priority==="profit"?"cost":priority,budget,challenge.freePlots);
  $("resultTitle").textContent=p.result?"Production route found":"More starting data required";
  if(p.result){
   html='<div class="stats"><article><label>ESTIMATED COMPLETION TIME</label><strong>'+(p.result.minutes/60).toFixed(2)+'h</strong></article><article><label>ESTIMATED PROCUREMENT COST</label><strong>'+p.result.cost.toFixed(2)+'</strong></article></div>';
   html+='<p class="muted">This is the production/procurement component of the challenge, not a complete profit or retail-sale forecast.</p>';
   if(challenge.timeLimitHours!==null){const fits=p.result.minutes/60<=challenge.timeLimitHours;html+='<p class="' +(fits?"muted":"amber") +'"><b>'+(fits?"Within your time limit: ":"Exceeds your time limit: ")+ (p.result.minutes/60).toFixed(2)+"h required / "+challenge.timeLimitHours+"h allowed</b></p>";}else html+='<p class="muted">Fastest-mode estimate: no user time limit was set.</p>';
   html+='<h4>Execution timeline · relative to start</h4><div class="tablewrap"><table><thead><tr><th>STEP</th><th>ACTION / RESOURCE</th><th>QUANTITY</th><th>START</th><th>FINISH</th><th>DURATION</th><th>CASH</th><th>BUILDING</th></tr></thead><tbody>'+[...p.steps].sort((a,b)=>(Number(a.startOffset)||0)-(Number(b.startOffset)||0)).map((x,i)=>'<tr><td>'+(i+1)+' · '+x.kind.toUpperCase()+'</td><td>'+esc(x.product)+'</td><td>'+Number(x.qty.toFixed(3))+'</td><td>T+'+((Number(x.startOffset)||0)/60).toFixed(2)+'h</td><td>T+'+((Number(x.endOffset??((Number(x.startOffset)||0)+Number(x.time||0)))||0)/60).toFixed(2)+'h</td><td>'+(Number(x.time)||0).toFixed(2)+' min</td><td>'+(Number(x.cash)||0).toFixed(2)+'</td><td>'+esc(x.building||"—")+'</td></tr>').join("")+'</tbody></table></div>';
  }else html='<p class="muted">SIMCOMPASS could not find a complete route using the current inventory, market and owned-building setup.</p>';
  if(p?.issues?.length)html+='<ul class="muted">'+p.issues.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
  if(p?.missing?.length)html+='<p class="amber">Unresolved: '+p.missing.map(esc).join(", ")+'</p>';
  html+='<p class="engine-disclaimer">LIMITATION: this estimate models building-level output capacity, one additional construction or upgrade per production route, and entered production/construction boost windows. It does not yet globally schedule shared buildings across simultaneous product chains, model scrapping/demolition refunds, simulate retail cashflow or verify every Challenge Realm-specific modifier. Treat it as a planning estimate, not a proven global optimum.</p>';
 }else{
  $("resultTitle").textContent="Challenge captured · specialised solver required";
  html='<div class="objective-summary"><span class="eyebrow">OBJECTIVE TYPE</span><h2>'+esc(type.replace("_"," ").toUpperCase())+'</h2><p>'+esc(challenge.description||"No detailed success condition entered.")+'</p></div>';
  html+='<div class="kv"><span>Your planning time limit</span><b>'+esc(challenge.timeLimitHours??"Fastest possible")+'</b></div><div class="kv"><span>Starting cash</span><b>'+(budget===null?"Not entered":budget.toLocaleString())+'</b></div>';
  if(challenge.extraObjectives.length)html+='<h4>Additional objectives</h4><ol>'+challenge.extraObjectives.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ol>';
  html+='<p class="muted">This objective has been saved in a structured format. A valid optimiser needs the exact in-game rules, scoring formula, prerequisites and completion conditions for this objective type. SIMCOMPASS will not substitute a product-production plan or invent those mechanics.</p>';
  html+='<p class="engine-disclaimer">Next engine modules: objective-specific rule models, dependency graph, feasibility checks, action scheduler, cashflow simulation and multi-objective scoring.</p>';
 }
 db.challenge=challenge;persist();$("result").innerHTML=html;toast("Challenge details saved");
};
$("export").onclick=()=>{const blob=new Blob([JSON.stringify({schemaVersion:2,activeRealm,realm:REALMS[activeRealm].label,workspace:db},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="simcompass-"+activeRealm+"-backup.json";a.click();URL.revokeObjectURL(a.href);toast(REALMS[activeRealm].label+" backup exported")};
$("import").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text()),workspace=data.workspace||data;["products","recipes","buildings","boosts","inventory"].forEach(k=>{if(!Array.isArray(workspace[k]))throw Error("Backup missing "+k)});db=Object.assign(blank(),workspace);applyCatalog(db);save();toast(REALMS[activeRealm].label+" backup imported")}catch(err){alert("Import failed: "+err.message)}e.target.value=""};
$("realmImport").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text()),workspace=data.workspace||data;["products","recipes","buildings","boosts","inventory"].forEach(k=>{if(!Array.isArray(workspace[k]))throw Error("The selected file is not a SIMCOMPASS/game-data JSON export with products, recipes, buildings, boosts and inventory arrays." )});db=Object.assign(blank(),workspace);applyCatalog(db);save();loadChallengeForm();renderOwnedBuildings();toast(REALMS[activeRealm].label+" data imported")}catch(err){alert("Realm import failed: "+err.message)}e.target.value=""};
try{const schemas=JSON.parse(localStorage.getItem("simcompass.api.discovery.v1")||"[]");const captured=JSON.parse(localStorage.getItem("simcompass.api.challenge.data.v1")||"[]");const box=$("apiDiscoverySummary");if(box){const schemaHtml=schemas.length?"<strong>"+schemas.length+" API endpoints observed.</strong><br>"+schemas.map(x=>"<code>"+esc(x.endpoint)+"</code> — "+esc((x.topLevelKeys||[]).join(", ")||x.topLevelType||"unknown shape")).join("<br>"):"No endpoint map imported yet.";const dataHtml=captured.length?"<br><br><strong>"+captured.length+" live data feeds captured:</strong><br>"+captured.map(x=>"<code>"+esc(x.endpoint)+"</code> — "+esc(Array.isArray(x.data)?"array ("+x.data.length+" items)":Object.keys(x.data||{}).join(", ")||typeof x.data)).join("<br>"):"<br><br>No live resource, market or challenge values imported yet.";box.innerHTML=schemaHtml+dataHtml}}catch(e){};$("exportCapturedFeeds").onclick=async()=>{try{const feeds=JSON.parse(localStorage.getItem("simcompass.api.challenge.data.v1")||"[]");const schemas=JSON.parse(localStorage.getItem("simcompass.api.discovery.v1")||"[]");const buildings=JSON.parse(localStorage.getItem("simcompass.api.challenge.buildings.v1")||"null");if(!feeds.length&&!buildings)throw Error("No captured feeds found. Import the connector data first.");const clean=(v,d=0)=>{if(d>14)return null;if(Array.isArray(v))return v.slice(0,5000).map(x=>clean(x,d+1));if(v&&typeof v==="object"){const o={};for(const [k,x] of Object.entries(v)){if(/csrf|token|cookie|enc.?key|password|authorization|session|secret|email/i.test(k))continue;o[k]=clean(x,d+1)}return o}return v};const bundle={format:"SIMCOMPASS_CAPTURED_FEEDS_V1",exportedAt:new Date().toISOString(),realm:"Challenge Realm",feeds:clean(feeds),endpointStructures:clean(schemas),buildings:clean(buildings)};const json=JSON.stringify(bundle);try{await navigator.clipboard.writeText(json)}catch{const area=document.createElement("textarea");area.value=json;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();const ok=document.execCommand("copy");area.remove();if(!ok)throw Error("Clipboard access was blocked. Try allowing clipboard permission for this site.")}toast("Captured data copied. Paste it directly into this chat.")}catch(err){toast(err.message)}};$("analyzeApiJson").onclick=()=>{const raw=$("apiJsonInput").value.trim();if(!raw){toast("Paste a JSON response first");return}try{const payload=JSON.parse(raw);if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("Expected a JSON object at the top level.");const inspect=(value,depth=0,path="$")=>{if(depth>2||!value||typeof value!=="object")return[];return Object.entries(value).slice(0,80).flatMap(([key,v])=>{const p=path+"."+key;const row=[{path:p,type:Array.isArray(v)?"array":v===null?"null":typeof v,count:Array.isArray(v)?v.length:undefined}];return row.concat(depth<2&&v&&typeof v==="object"&&!Array.isArray(v)?inspect(v,depth+1,p):[])})};const fields=inspect(payload);db.apiSnapshots=Array.isArray(db.apiSnapshots)?db.apiSnapshots:[];const snapshot={id:"api-"+Date.now(),realm:activeRealm,realmLabel:REALMS[activeRealm].label,capturedAt:new Date().toISOString(),topLevelKeys:Object.keys(payload),fieldIndex:fields,payload};db.apiSnapshots.push(snapshot);persist();const arrays=fields.filter(x=>x.type==="array").map(x=>x.path+" ("+x.count+" items)");$("apiJsonResult").innerHTML="<strong>Snapshot saved locally.</strong><br>Realm: "+esc(REALMS[activeRealm].label)+"<br>Top-level fields: "+esc(Object.keys(payload).join(", ")||"none")+"<br>Nested arrays: "+esc(arrays.join("; ")||"none detected")+"<br><small>Snapshot "+db.apiSnapshots.length+" for this realm. No fields have been mapped into the optimiser yet.</small>";$("saved").textContent="● SAVED";toast("Read-only API snapshot saved")}catch(err){$("apiJsonResult").textContent="Could not parse response: "+err.message;toast("Invalid JSON response")}};
$("reset").onclick=()=>{if(confirm("This will delete all SIMCOMPASS data saved in this browser. Export a backup first if needed.")){db=blank();save();$("result").textContent="Workspace reset.";toast("Workspace reset")}};
if(db.challenge){$("target").value=db.challenge.target||"";$("quantity").value=db.challenge.qty||750;$("objective").value=db.challenge.objective||"time";$("budget").value=db.challenge.budget??""}
document.querySelectorAll("[data-realm]").forEach(b=>b.classList.toggle("active",b.dataset.realm===activeRealm));$("activeRealmLabel").textContent=REALMS[activeRealm].short;$("bridgeRealmName").textContent=REALMS[activeRealm].label;$("realmBridgeTitle").textContent=REALMS[activeRealm].label+" data";document.querySelector(".brand small").textContent=REALMS[activeRealm].short+" WORKSPACE";
render();
renderOwnedBuildings();
updateRealmNotice();
loadChallengeForm();
async function loadGameCatalog(){
  try{
    const response=await fetch("data/game-database.json?updated="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error("Preloaded catalogue has not been published yet.");
    const catalog=await response.json();
    if(!catalog||!Array.isArray(catalog.products)||!Array.isArray(catalog.recipes)||!Array.isArray(catalog.buildings))throw new Error("Catalogue format is invalid.");
    catalogCache=catalog;
    syncCapturedChallengeFeeds();
    syncChallengeBuildingsSnapshot();
    applyCatalog(db);
    persist();
    render();
    renderOwnedBuildings();
    toast("Game catalogue loaded: "+catalog.products.length+" products");
  }catch(error){console.warn("SIMCOMPASS catalogue load:",error.message);}
}
loadGameCatalog();
})();