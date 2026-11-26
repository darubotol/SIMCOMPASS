const button=document.getElementById("connect"),status=document.getElementById("status");
button.addEventListener("click",async()=>{
 button.disabled=true;status.textContent="Checking captured game data…";
 try{
  const tabs=await chrome.tabs.query({active:true,currentWindow:true}),tab=tabs[0];
  if(!tab?.id||!tab.url?.startsWith("https://darubotol.github.io/SIMCOMPASS/")){status.textContent="Open SIMCOMPASS and make that tab active before importing.";return}
  const result=await chrome.runtime.sendMessage({type:"SIMCOMPASS_GET_PENDING_CAPTURE"});
  if(!result?.ok){status.textContent="No game data detected yet. Keep the extension enabled, reload the signed-in Sim Companies page, wait for it to finish loading, then return here.";return}
  let buildingCount=0,schemaCount=0;
  if(result.snapshot?.data){
   const saved=await chrome.tabs.sendMessage(tab.id,{type:"SIMCOMPASS_SAVE_BUILDINGS",data:result.snapshot.data,capturedAt:result.snapshot.capturedAt});
   if(saved?.ok)buildingCount=saved.count;
  }
  if(Array.isArray(result.schemas)&&result.schemas.length){
   const saved=await chrome.tabs.sendMessage(tab.id,{type:"SIMCOMPASS_SAVE_API_DISCOVERY",schemas:result.schemas});
   if(saved?.ok)schemaCount=saved.count;
  }
  let dataCount=0;
  if(Array.isArray(result.gameData)&&result.gameData.length){
   const saved=await chrome.tabs.sendMessage(tab.id,{type:"SIMCOMPASS_SAVE_GAME_DATA",records:result.gameData});
   if(saved?.ok)dataCount=saved.count;
  }
  await chrome.runtime.sendMessage({type:"SIMCOMPASS_CLEAR_PENDING_CAPTURE"});
  status.textContent=(buildingCount?"Imported "+buildingCount+" Challenge Realm building records. ":"")+(dataCount?"Imported "+dataCount+" Challenge Realm data feeds (challenge, resources, market and company summary). ":"")+(schemaCount?"Saved "+schemaCount+" API endpoint structures. ":"")||"No supported data was found.";
  if(!buildingCount&&!schemaCount)status.textContent="The game page loaded, but no matching API data was detected. Reload Sim Companies and wait for the dashboard.";
 }catch(_){status.textContent="Could not communicate with SIMCOMPASS. Reload its tab and try again."}
 finally{button.disabled=false}
});