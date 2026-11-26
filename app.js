(()=>{"use strict";
const KEY="simcompass.data.v1",blank=()=>({schemaVersion:1,products:[],recipes:[],buildings:[],boosts:[],inventory:[],challenge:null});
let db;try{db=Object.assign(blank(),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch{db=blank()}
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){localStorage.setItem(KEY,JSON.stringify(db));$("saved").textContent="● SAVED";render()}
function toast(s){const e=$("toast");e.textContent=s;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function nav(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll(".nav[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));$("crumb").textContent=p.toUpperCase();$("sidebar").classList.remove("open");scrollTo(0,0)}
document.querySelectorAll(".nav[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>nav(b.dataset.go));$("menu").onclick=()=>$("sidebar").classList.toggle("open");
const defs={
products:{title:"Add product",fields:[["name","Product name","text",1],["category","Category","text"],["unit","Unit (e.g. units, tonnes)","text"]]},
recipes:{title:"Add recipe",fields:[["output","Output product","text",1],["building","Required building","text",1],["quantity","Output quantity per run","number",1],["minutes","Production time (minutes)","number",1],["inputs","Inputs as Product:quantity, comma separated","text"]]},
buildings:{title:"Add building",fields:[["name","Building name","text",1],["level","Building level","number",1],["slots","Available parallel slots","number",1],["notes","Notes","text"]]},
boosts:{title:"Add boost",fields:[["name","Boost name","text",1],["bonus","Production speed bonus (%)","number",1],["duration","Duration (hours)","number",1],["stacking","Stacking mode","select",1]]},
inventory:{title:"Add inventory / market row",fields:[["product","Product name","text",1],["stock","On-hand quantity","number",1],["price","Market price per unit","number"],["marketQty","Market quantity available","number"],["lead","Market purchase lead time (minutes)","number"]]}
};
let currentType=null;
function openModal(type){currentType=type;const d=defs[type];$("modalTitle").textContent=d.title;$("fields").innerHTML=d.fields.map(f=>{const id=f[0],label=f[1],kind=f[2],req=f[3];return "<label>"+esc(label)+(kind==="select"?"<select name='"+id+"' required><option value='add'>Additive</option><option value='max'>Highest bonus only</option><option value='independent'>Independent / multiply</option></select>":"<input name='"+id+"' type='"+kind+"' "+(kind==="number"?'min="0" step="any"':"")+(req?" required":"")+"></label>")}).join("")}
function closeModal(){$("overlay").classList.remove("open");$("recordForm").reset()}
document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{openModal(b.dataset.add);$("overlay").classList.add("open")});$("close").onclick=$("cancel").onclick=closeModal;$("overlay").onclick=e=>{if(e.target===$("overlay"))closeModal()};
function parseInputs(raw){if(!raw.trim())return[];return raw.split(",").map(x=>{const m=x.trim().match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)$/);if(!m)throw Error("Inputs must use Product:quantity format.");return {product:m[1].trim(),quantity:Number(m[2])}})}
$("recordForm").onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target)),type=currentType;try{
if(type==="products"){if(db.products.some(x=>x.name.toLowerCase()===o.name.trim().toLowerCase()))throw Error("That product already exists.");db.products.push({id:crypto.randomUUID(),name:o.name.trim(),category:o.category,unit:o.unit})}
if(type==="recipes"){if(!(Number(o.quantity)>0&&Number(o.minutes)>0))throw Error("Output quantity and duration must be positive.");db.recipes.push({id:crypto.randomUUID(),output:o.output.trim(),building:o.building.trim(),quantity:+o.quantity,minutes:+o.minutes,inputs:parseInputs(o.inputs||"")})}
if(type==="buildings"){if(!(Number(o.level)>0&&Number(o.slots)>0))throw Error("Building level and slots must be positive.");db.buildings.push({id:crypto.randomUUID(),name:o.name.trim(),level:+o.level,slots:+o.slots,notes:o.notes})}
if(type==="boosts")db.boosts.push({id:crypto.randomUUID(),name:o.name.trim(),bonus:+o.bonus,duration:+o.duration,stacking:o.stacking});
if(type==="inventory"){const old=db.inventory.find(x=>x.product.toLowerCase()===o.product.trim().toLowerCase());const row={id:old?old.id:crypto.randomUUID(),product:o.product.trim(),stock:+o.stock||0,price:o.price===""?null:+o.price,marketQty:+o.marketQty||0,lead:+o.lead||0};if(old)Object.assign(old,row);else db.inventory.push(row)}
closeModal();save();toast("Record saved")}catch(err){toast(err.message)}};
function remove(type,id){if(!confirm("Delete this record?"))return;db[type]=db[type].filter(x=>x.id!==id);save();toast("Record deleted")}
function action(type,id){return '<button class="delete" data-del="'+type+'" data-id="'+id+'">DELETE</button>'}
function table(id,rows,cols,empty){$(id).innerHTML=rows.length?rows.map(r=>"<tr>"+cols(r)+"</tr>").join(""):'<tr><td class="emptycell" colspan="9">'+empty+"</td></tr>";$(id).querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>remove(b.dataset.del,b.dataset.id))}
function render(){
$("nProducts").textContent=db.products.length;$("nRecipes").textContent=db.recipes.length;$("nBuildings").textContent=db.buildings.reduce((n,b)=>n+(+b.slots||0),0);$("nBoosts").textContent=db.boosts.length;
const checks=[["Products",db.products.length>0],["Recipes",db.recipes.length>0],["Buildings",db.buildings.length>0],["Inventory",db.inventory.length>0]],n=checks.filter(x=>x[1]).length;$("progress").style.width=(n/4*100)+"%";$("checklist").innerHTML=checks.map(x=>'<div class="check '+(x[1]?"done":"")+'"><i></i><span>'+x[0]+' '+(x[0]==="Products"?"catalogue populated":x[0]==="Recipes"?"entered":x[0]==="Buildings"?"configured":"entered")+'</span><small>'+(x[1]?"READY":"PENDING")+"</small></div>").join("");
$("productNames").innerHTML=db.products.map(p=>'<option value="'+esc(p.name)+'"></option>').join("");
table("productsTable",db.products,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+esc(r.category||"—")+'</td><td>'+esc(r.unit||"—")+'</td><td>USER ENTERED</td><td>'+action("products",r.id)+"</td>","No products yet. Add a verified product.");
table("recipesTable",db.recipes,r=>'<td><b>'+esc(r.output)+'</b></td><td>'+esc(r.building)+'</td><td>'+r.quantity+'</td><td>'+r.minutes+' min</td><td>'+r.inputs.map(i=>esc(i.product)+": "+i.quantity).join(", ")+'</td><td>'+action("recipes",r.id)+"</td>","No production recipes configured.");
table("buildingsTable",db.buildings,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+r.level+'</td><td>'+r.slots+'</td><td>'+esc(r.notes||"—")+'</td><td>'+action("buildings",r.id)+"</td>","No buildings configured.");
table("boostsTable",db.boosts,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+r.bonus+'%</td><td>'+r.duration+' hr</td><td>'+esc(r.stacking)+'</td><td>'+action("boosts",r.id)+"</td>","No boosts configured.");
table("inventoryTable",db.inventory,r=>'<td><b>'+esc(r.product)+'</b></td><td>'+r.stock+'</td><td>'+(r.price??"—")+'</td><td>'+r.marketQty+'</td><td>'+r.lead+'</td><td>'+action("inventory",r.id)+"</td>","No inventory or market rows entered.");
$("productCount").textContent=db.products.length+" records";
}
$("searchProducts").oninput=e=>{const q=e.target.value.toLowerCase(),rows=db.products.filter(p=>p.name.toLowerCase().includes(q)||String(p.category).toLowerCase().includes(q));table("productsTable",rows,r=>'<td><b>'+esc(r.name)+'</b></td><td>'+esc(r.category||"—")+'</td><td>'+esc(r.unit||"—")+'</td><td>USER ENTERED</td><td>'+action("products",r.id)+"</td>","No matching products.")};
function plan(target,qty,objective){
const stock={};db.inventory.forEach(x=>stock[x.product.toLowerCase()]={stock:+x.stock||0,marketQty:+x.marketQty||0,price:x.price,lead:+x.lead||0});
const missing=new Set(),issues=[],steps=[],visiting=new Set();
function source(product,amount,depth){if(amount<=1e-8)return{minutes:0,cost:0};const key=product.toLowerCase();if(depth>25||visiting.has(key)){missing.add(product);return null}
const inv=stock[key]||{stock:0,marketQty:0,price:null,lead:0};let need=amount,stockUsed=Math.min(need,inv.stock);inv.stock-=stockUsed;need-=stockUsed;if(need<=1e-8){steps.push({kind:"stock",product,qty:stockUsed,minutes:0,cost:0});return{minutes:0,cost:0}}
const recipes=db.recipes.filter(r=>r.output.toLowerCase()===key).sort((a,b)=>a.minutes/a.quantity-b.minutes/b.quantity);let best=null;
if(recipes.length){const r=recipes[0];visiting.add(key);let chainTime=0,chainCost=0,valid=true;for(const i of r.inputs){const x=source(i.product,i.quantity*need/r.quantity,depth+1);if(!x){valid=false;break}chainTime=Math.max(chainTime,x.minutes);chainCost+=x.cost}visiting.delete(key);if(valid){const runs=Math.ceil(need/r.quantity);best={kind:"make",minutes:chainTime+runs*r.minutes,cost:chainCost,recipe:r,qty:need}}}
const market=inv.price!==null&&Number.isFinite(+inv.price)&&inv.marketQty>=need?{kind:"market",minutes:inv.lead,cost:need*inv.price,qty:need}:null;
if(market&&(!best||(objective==="cost"?market.cost<best.cost:market.minutes<best.minutes)))best=market;
if(!best){missing.add(product);if(!recipes.length&&!market)issues.push("No recipe or complete market listing for "+product);else if(recipes.length)issues.push("Missing ingredient data for "+product);return null}
if(best.kind==="market"){inv.marketQty-=need;steps.push({kind:"market",product,qty:need,minutes:best.minutes,cost:best.cost})}else{const b=db.buildings.find(x=>x.name.toLowerCase()===best.recipe.building.toLowerCase());if(!b)issues.push("No owned building configured for "+best.recipe.building);steps.push({kind:"make",product,qty:need,minutes:best.minutes,cost:best.cost,building:best.recipe.building})}
return{minutes:best.minutes,cost:best.cost}}
const result=source(target,qty,0);return{result,missing:[...missing],issues:[...new Set(issues)],steps}}
$("challengeForm").onsubmit=e=>{e.preventDefault();const target=$("target").value.trim(),qty=+$("quantity").value,budget=$("budget").value===""?null:+$("budget").value,obj=$("objective").value;if(!target||qty<=0)return;const p=plan(target,qty,obj);$("resultTitle").textContent=p.result?"Plan generated":"Data incomplete";let html="";
if(p.result){html='<div class="stats"><article><label>ESTIMATED ELAPSED TIME</label><strong>'+(p.result.minutes/60).toFixed(2)+'h</strong></article><article><label>ESTIMATED COST</label><strong>'+p.result.cost.toFixed(2)+'</strong></article></div>';if(budget!==null&&p.result.cost>budget)html+='<p class="amber">Estimated cost exceeds the budget entered.</p>';html+='<p class="muted">Sequential dependency estimate only. It does not yet model parallel factory scheduling, construction queues, boosts, taxes or selling time.</p>'}
if(p.steps.length)html+='<h4>Plan breakdown</h4><div class="tablewrap"><table><thead><tr><th>ACTION</th><th>PRODUCT</th><th>QUANTITY</th><th>TIME (MIN)</th><th>EST. COST</th></tr></thead><tbody>'+p.steps.map(s=>'<tr><td>'+s.kind.toUpperCase()+'</td><td>'+esc(s.product)+'</td><td>'+s.qty+'</td><td>'+s.minutes+'</td><td>'+s.cost.toFixed(2)+'</td></tr>').join("")+'</tbody></table></div>';
if(p.missing.length)html+='<p class="amber">Missing / unresolved: '+p.missing.map(esc).join(", ")+'</p>';if(p.issues.length)html+='<ul class="muted">'+p.issues.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul>";if(!p.result)html+='<p class="muted">Add complete recipes and market rows for missing products. Ensure the required building is configured.</p>';$("result").innerHTML=html||"No plan could be generated.";db.challenge={target:target,qty:qty,objective:obj,budget:budget};localStorage.setItem(KEY,JSON.stringify(db))};
$("export").onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="simcompass-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exported")};
$("import").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());["products","recipes","buildings","boosts","inventory"].forEach(k=>{if(!Array.isArray(data[k]))throw Error("Backup missing "+k)});db=Object.assign(blank(),data);save();toast("Backup imported")}catch(err){alert("Import failed: "+err.message)}e.target.value=""};
$("reset").onclick=()=>{if(confirm("This will delete all SIMCOMPASS data saved in this browser. Export a backup first if needed.")){db=blank();save();$("result").textContent="Workspace reset.";toast("Workspace reset")}};
if(db.challenge){$("target").value=db.challenge.target||"";$("quantity").value=db.challenge.qty||750;$("objective").value=db.challenge.objective||"time";$("budget").value=db.challenge.budget??""}
render();
async function loadGameCatalog(){
  try{
    const response=await fetch("data/game-database.json?updated="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error("Preloaded catalogue has not been published yet.");
    const catalog=await response.json();
    if(!catalog||!Array.isArray(catalog.products)||!Array.isArray(catalog.recipes)||!Array.isArray(catalog.buildings))throw new Error("Catalogue format is invalid.");
    const productNames=new Set(db.products.map(x=>x.name.toLowerCase()));
    catalog.products.forEach(p=>{if(!productNames.has(p.name.toLowerCase()))db.products.push({...p});});
    const recipeKeys=new Set(db.recipes.map(x=>(x.output+"|"+x.building).toLowerCase()));
    catalog.recipes.forEach(x=>{if(!recipeKeys.has((x.output+"|"+x.building).toLowerCase()))db.recipes.push({...x});});
    const buildingNames=new Set(db.buildings.map(x=>x.name.toLowerCase()));
    catalog.buildings.forEach(x=>{if(!buildingNames.has(x.name.toLowerCase()))db.buildings.push({...x});});
    db.catalogMeta={realm:catalog.realm,fetchedAt:catalog.fetchedAt,source:catalog.source,counts:catalog.counts};
    localStorage.setItem(KEY,JSON.stringify(db));
    render();
    toast("Game catalogue loaded: "+catalog.products.length+" products");
  }catch(error){console.warn("SIMCOMPASS catalogue load:",error.message);}
}
loadGameCatalog();
})();