const GAME_ORIGIN="https://www.simcompanies.com";
const SIMCOMPASS_ORIGIN="https://darubotol.github.io";
if(location.origin===GAME_ORIGIN){
 window.addEventListener("message",event=>{
  if(event.source!==window||event.origin!==GAME_ORIGIN)return;
  const m=event.data;if(m?.source!=="SIMCOMPASS_READONLY_CAPTURE")return;
  if(m.type==="BUILDINGS_RESPONSE"&&Array.isArray(m.data)){
   chrome.runtime.sendMessage({type:"SIMCOMPASS_STORE_CAPTURE",data:m.data,capturedAt:m.capturedAt}).catch(()=>{});
  }else if(m.type==="API_SCHEMA_DISCOVERY"&&typeof m.endpoint==="string"&&m.endpoint.startsWith("/api/")){
   chrome.runtime.sendMessage({type:"SIMCOMPASS_STORE_API_SCHEMA",schema:{endpoint:m.endpoint,status:m.status,capturedAt:m.capturedAt,topLevelType:m.topLevelType,topLevelKeys:m.topLevelKeys,shape:m.shape}}).catch(()=>{});
  }else if(m.type==="GAME_DATA_RESPONSE"&&typeof m.endpoint==="string"&&m.endpoint.startsWith("/api/")){
   chrome.runtime.sendMessage({type:"SIMCOMPASS_STORE_GAME_DATA",record:{endpoint:m.endpoint,capturedAt:m.capturedAt,data:m.data}}).catch(()=>{});
  }
 });
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
 if(sender.id!==chrome.runtime.id)return;
 if(message?.type==="SIMCOMPASS_SAVE_BUILDINGS"){
  if(location.origin!==SIMCOMPASS_ORIGIN||!location.pathname.startsWith("/SIMCOMPASS/")||!Array.isArray(message.data)){sendResponse({ok:false,reason:"wrong-page-or-invalid-data"});return}
  try{const record={id:"challenge-buildings-"+Date.now(),realmAssignment:"challenge",endpoint:"/api/v2/companies/me/buildings/",capturedAt:message.capturedAt,source:"Captured from the game's successful in-page response",count:message.data.length,payload:message.data};localStorage.setItem("simcompass.api.challenge.buildings.v1",JSON.stringify(record));sendResponse({ok:true,count:message.data.length})}catch(e){sendResponse({ok:false,reason:String(e?.message||e)})}
  return;
 }
 if(message?.type==="SIMCOMPASS_SAVE_GAME_DATA"){
  if(location.origin!==SIMCOMPASS_ORIGIN||!location.pathname.startsWith("/SIMCOMPASS/")||!Array.isArray(message.records)){sendResponse({ok:false,reason:"wrong-page-or-invalid-data"});return}
  try{const key="simcompass.api.challenge.data.v1";const old=JSON.parse(localStorage.getItem(key)||"[]");const map=new Map(old.map(x=>[x.endpoint,x]));message.records.forEach(x=>{if(typeof x.endpoint==="string"&&x.endpoint.startsWith("/api/"))map.set(x.endpoint,x)});const records=[...map.values()].slice(-30);localStorage.setItem(key,JSON.stringify(records));sendResponse({ok:true,count:records.length})}catch(e){sendResponse({ok:false,reason:String(e?.message||e)})}
  return;
 }
 if(message?.type==="SIMCOMPASS_SAVE_API_DISCOVERY"){
  if(location.origin!==SIMCOMPASS_ORIGIN||!location.pathname.startsWith("/SIMCOMPASS/")||!Array.isArray(message.schemas)){sendResponse({ok:false,reason:"wrong-page-or-invalid-data"});return}
  try{const key="simcompass.api.discovery.v1";const old=JSON.parse(localStorage.getItem(key)||"[]");const map=new Map(old.map(x=>[x.endpoint,x]));message.schemas.forEach(x=>{if(typeof x.endpoint==="string"&&x.endpoint.startsWith("/api/"))map.set(x.endpoint,x)});const records=[...map.values()].slice(-100);localStorage.setItem(key,JSON.stringify(records));sendResponse({ok:true,count:records.length})}catch(e){sendResponse({ok:false,reason:String(e?.message||e)})}
 }
});