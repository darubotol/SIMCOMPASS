(()=>{
"use strict";
const $=id=>document.getElementById(id),KEY="simcompass.advanced.v1";
let state={retailTests:[],actions:[]};
try{state=Object.assign(state,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch{}
const persist=()=>localStorage.setItem(KEY,JSON.stringify(state));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
const form=$("retailForm");
if(form){
form.addEventListener("submit",e=>{
e.preventDefault();
const v=id=>$(id).value===""?null:Number($(id).value);
const product=$("retailProduct").value.trim(),avg=v("avgPrice"),cost=v("unitCost"),stock=v("retailStock"),reserved=v("reservedQty")||0,mult=v("retailMultiplier")||1;
if(!product||avg<=0||cost<0||stock<0||reserved>stock||mult<=0){alert("Check product, prices and quantities. Reserved stock cannot exceed available stock.");return}
const available=stock-reserved;
const options=[["A",v("priceA"),v("rateA")],["B",v("priceB"),v("rateB")],["C",v("priceC"),v("rateC")]].filter(x=>x[1]!==null||x[2]!==null);
if(options.length<2||options.some(x=>x[1]===null||x[2]===null||x[1]<=0||x[2]<0)){alert("Enter at least two complete price and observed sales-rate options.");return}if(options.some(x=>x[1]>=avg)){alert("Each tested retail price must be below the Challenge Realm average price.");return}
const rows=options.map(([label,price,rate])=>{
const units=available,boostedRate=rate*mult,hours=boostedRate>0?units/boostedRate:null,revenue=units*price,contribution=units*(price-cost),cashPerHour=price*boostedRate,profitPerHour=(price-cost)*boostedRate,below=price<avg;
return {label,price,rate,boostedRate,hours,revenue,contribution,cashPerHour,profitPerHour,below,units};
}).sort((a,b)=>b.contribution-a.contribution);
const result={id:crypto.randomUUID(),product,avg,cost,stock,reserved,available,mult,rows,created:new Date().toISOString()};
state.retailTests.unshift(result);state.retailTests=state.retailTests.slice(0,30);persist();renderRetail(result);
});
}
function renderRetail(r){
if(!r)return;
$("retailResultTitle").textContent="Price comparison · "+r.product;
const bestCash=[...r.rows].sort((a,b)=>b.cashPerHour-a.cashPerHour)[0],bestMargin=[...r.rows].sort((a,b)=>b.contribution-b.contribution)[0],bestHourly=[...r.rows].sort((a,b)=>b.profitPerHour-a.profitPerHour)[0];
$("retailResults").innerHTML='<div class="retail-summary"><div><small>AVAILABLE TO RETAIL</small><b>'+money(r.available)+'</b></div><div><small>RETAIL BOOST RATE</small><b>'+r.mult+'×</b></div><div><small>CHALLENGE RESERVED</small><b>'+money(r.reserved)+'</b></div></div><div class="tablewrap"><table><thead><tr><th>PRICE TEST</th><th>PRICE</th><th>OBSERVED / HR</th><th>SELL-THROUGH</th><th>GROSS CASH</th><th>CONTRIBUTION</th><th>CASH / HR</th><th>PROFIT / HR</th></tr></thead><tbody>'+r.rows.map(x=>'<tr><td>Option '+x.label+(x.below?' · below avg':'')+'</td><td>'+money(x.price)+'</td><td>'+money(x.rate)+'</td><td>'+(x.hours===null?'No sales estimate':x.hours.toFixed(2)+' h')+'</td><td>'+money(x.revenue)+'</td><td>'+money(x.contribution)+'</td></tr>').join("")+'</tbody></table></div><div class="recommendation"><b>Best tested unit contribution price: '+money(bestMargin.price)+'</b><p>Option '+bestMargin.label+' yields '+money(bestMargin.contribution)+' contribution on the available stock. '+(bestCash?'Highest hourly cash generation is '+money(bestCash.cashPerHour)+' / hour at Option '+bestCash.label+'. Best hourly contribution is '+money(bestHourly.profitPerHour)+' / hour at Option '+bestHourly.label+'.':'')+'</p><small>These are scenario calculations, not a demand forecast. Sales-rate inputs are user observations. A zero rate means the sell-through time is unknown.</small></div>';
}
const actionForm=$("actionForm");
if(actionForm)actionForm.addEventListener("submit",e=>{
e.preventDefault();const item={id:crypto.randomUUID(),time:$("actionTime").value,type:$("actionType").value,detail:$("actionDetail").value.trim(),done:false};
if(!item.time||!item.detail)return;state.actions.push(item);state.actions.sort((a,b)=>a.time.localeCompare(b.time));persist();renderActions();actionForm.reset();
});
function renderActions(){
const host=$("actionList");if(!host)return;
if(!state.actions.length){host.innerHTML='<div class="empty">No actions scheduled yet. Add your first action.</div>';return}
host.innerHTML=state.actions.map(a=>'<div class="action-row '+(a.done?'done':'')+'"><button class="action-check" data-toggle="'+a.id+'" aria-label="Toggle completion">'+(a.done?'✓':'○')+'</button><div class="action-when">'+new Date(a.time).toLocaleString()+'</div><div class="action-main"><b>'+esc(a.type)+'</b><span>'+esc(a.detail)+'</span></div><button class="delete" data-remove="'+a.id+'">DELETE</button></div>').join("");
host.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const a=state.actions.find(x=>x.id===b.dataset.toggle);if(a){a.done=!a.done;persist();renderActions()}});
host.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{state.actions=state.actions.filter(x=>x.id!==b.dataset.remove);persist();renderActions()});
}
renderActions();

const boostForm=$("boostRulesForm");
if(boostForm)boostForm.addEventListener("submit",e=>{
e.preventDefault();
const start=$("boostRuleStart").value,end=$("boostRuleEnd").value,mult=Number($("boostRuleMultiplier").value);
if(!(mult>0)|| (start&&end&&new Date(end)<=new Date(start))){alert("Enter a positive multiplier and an end time after the start time.");return}
const effects={production:$("boostProduction").checked,retail:$("boostRetail").checked,construction:$("boostConstruction").checked,upgrades:$("boostUpgrades").checked,market:$("boostMarket").checked};
if(!Object.values(effects).some(Boolean)){alert("Select at least one affected system.");return}
state.boostRules=state.boostRules||[];
state.boostRules.push({id:crypto.randomUUID(),name:$("boostRuleName").value.trim(),multiplier:mult,stacking:$("boostRuleStack").value,start,end,effects});
persist();renderBoostRules();boostForm.reset();$("boostRuleMultiplier").value="2";$("boostProduction").checked=true;$("boostRetail").checked=true;
});
function renderBoostRules(){
const host=$("boostRulesList");if(!host)return;
const rules=state.boostRules||[];
host.innerHTML=rules.length?rules.map(b=>'<div class="boost-rule"><div><b>'+esc(b.name)+'</b><span>'+b.multiplier+'× · '+esc(b.stacking)+' · '+Object.keys(b.effects).filter(k=>b.effects[k]).join(", ")+'</span><small>'+(b.start?new Date(b.start).toLocaleString():"Start not set")+' → '+(b.end?new Date(b.end).toLocaleString():"End not set")+'</small></div><button class="delete" data-boost-remove="'+b.id+'">DELETE</button></div>').join(""):'<p class="empty">No effect-specific boost rules saved.</p>';
host.querySelectorAll("[data-boost-remove]").forEach(b=>b.onclick=()=>{state.boostRules=rules.filter(x=>x.id!==b.dataset.boostRemove);persist();renderBoostRules()});
}
renderBoostRules();

if(state.retailTests?.length)renderRetail(state.retailTests[0]);
})();