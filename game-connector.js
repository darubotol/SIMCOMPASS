(()=>{"use strict";
const endpoint="https://www.simcompanies.com/api/v2/companies/me/buildings/";
const snapshotKey="simcompass.api.unmapped.v1";
const attemptKey="simcompass.liveApi.lastAttempt";
const button=document.getElementById("testLiveConnection");
const status=document.getElementById("liveConnectionStatus");
if(!button||!status)return;
const show=(message)=>{status.textContent=message};
button.addEventListener("click",async()=>{
  const last=Number(localStorage.getItem(attemptKey)||0);
  const wait=300000-(Date.now()-last);
  if(wait>0){show("To respect the game's API limit, try again in about "+Math.ceil(wait/60000)+" minute(s).");return;}
  button.disabled=true;
  show("Testing one read-only request…");
  localStorage.setItem(attemptKey,String(Date.now()));
  try{
    const response=await fetch(endpoint,{method:"GET",mode:"cors",credentials:"include",cache:"no-store"});
    if(!response.ok)throw new Error("The game returned HTTP "+response.status+".");
    const payload=await response.json();
    if(!Array.isArray(payload))throw new Error("The endpoint response was not the expected buildings list.");
    const snapshots=JSON.parse(localStorage.getItem(snapshotKey)||"[]");
    snapshots.push({
      id:"live-buildings-"+Date.now(),
      realmAssignment:"unverified",
      endpoint:"/api/v2/companies/me/buildings/",
      capturedAt:new Date().toISOString(),
      source:"browser-session GET",
      topLevelKeys:payload.length?Object.keys(payload[0]):[],
      payload
    });
    localStorage.setItem(snapshotKey,JSON.stringify(snapshots));
    show("Connection successful. Received "+payload.length+" building records. Saved an unassigned read-only snapshot in this browser. It has not been assigned to Challenge/Magnates/Entrepreneurs or mapped into the optimiser; we must verify which game workspace this endpoint represents first.");
  }catch(error){
    const message=String(error?.message||error);
    if(error instanceof TypeError||/fetch|network|cors/i.test(message)){
      show("The browser blocked this cross-site request (likely a CORS restriction). SIMCOMPASS cannot read this authenticated endpoint directly from GitHub Pages in this browser. No password, cookie or token was exposed to SIMCOMPASS. The manual response capture remains available.");
    }else{
      show("Connection not completed: "+message+" No game action was performed. The manual response capture remains available.");
    }
  }finally{
    button.disabled=false;
  }
});
})();