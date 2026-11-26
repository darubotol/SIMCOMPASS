chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
 if(message?.type==="SIMCOMPASS_STORE_CAPTURE"){
  if(!sender.url?.startsWith("https://www.simcompanies.com/")||!Array.isArray(message.data)){sendResponse({ok:false,reason:"untrusted-source-or-invalid-data"});return}
  chrome.storage.local.set({pendingBuildingsSnapshot:{data:message.data,capturedAt:message.capturedAt||new Date().toISOString(),source:"Sim Companies in-page successful GET response"}}).then(()=>sendResponse({ok:true,count:message.data.length}));return true;
 }
 if(message?.type==="SIMCOMPASS_STORE_API_SCHEMA"){
  if(!sender.url?.startsWith("https://www.simcompanies.com/")||!message.schema||typeof message.schema.endpoint!=="string"||!message.schema.endpoint.startsWith("/api/")){sendResponse({ok:false,reason:"untrusted-source-or-invalid-schema"});return}
  chrome.storage.local.get("pendingApiSchemas").then(({pendingApiSchemas=[]})=>{const map=new Map(pendingApiSchemas.map(x=>[x.endpoint,x]));map.set(message.schema.endpoint,message.schema);return chrome.storage.local.set({pendingApiSchemas:[...map.values()].slice(-100)})}).then(()=>sendResponse({ok:true}));return true;
 }
 if(message?.type==="SIMCOMPASS_STORE_GAME_DATA"){
  if(!sender.url?.startsWith("https://www.simcompanies.com/")||!message.record||typeof message.record.endpoint!=="string"||!message.record.endpoint.startsWith("/api/")){sendResponse({ok:false,reason:"untrusted-source-or-invalid-data"});return}
  chrome.storage.local.get("pendingGameData").then(({pendingGameData=[]})=>{const map=new Map(pendingGameData.map(x=>[x.endpoint,x]));map.set(message.record.endpoint,message.record);return chrome.storage.local.set({pendingGameData:[...map.values()].slice(-30)})}).then(()=>sendResponse({ok:true}));return true;
 }
 if(message?.type==="SIMCOMPASS_GET_PENDING_CAPTURE"){
  chrome.storage.local.get(["pendingBuildingsSnapshot","pendingApiSchemas","pendingGameData"]).then(({pendingBuildingsSnapshot,pendingApiSchemas=[],pendingGameData=[]})=>sendResponse({ok:!!pendingBuildingsSnapshot||pendingApiSchemas.length>0||pendingGameData.length>0,snapshot:pendingBuildingsSnapshot||null,schemas:pendingApiSchemas,gameData:pendingGameData}));return true;
 }
 if(message?.type==="SIMCOMPASS_CLEAR_PENDING_CAPTURE"){
  chrome.storage.local.remove(["pendingBuildingsSnapshot","pendingApiSchemas","pendingGameData"]).then(()=>sendResponse({ok:true}));return true;
 }
});