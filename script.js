const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="my_recipes_magazine";
const seed=[
 {id:1,title:"Salade de quinoa aux légumes grillés",category:"Déjeuner",time:"25 min",difficulty:"Facile",art:"🥗",ingredients:["100 g de quinoa","1 courgette","1 poivron rouge","10 tomates cerises","1 c. à soupe d’huile d’olive","Jus d’1/2 citron","Sel, poivre, herbes de Provence"],prep:["Cuire le quinoa selon les indications du paquet.","Laver et couper les légumes en petits morceaux.","Faire griller les légumes avec l’huile d’olive.","Mélanger avec le quinoa et assaisonner."],favorite:true,scheduledDate:todayISO()},
 {id:2,title:"Soupe de lentilles corail",category:"Dîner",time:"20 min",difficulty:"Facile",art:"🍲",ingredients:["150 g de lentilles corail","1 carotte","1 oignon","400 ml de bouillon","1 c. à café de curry"],prep:["Faire revenir l’oignon et la carotte.","Ajouter les lentilles, le curry et le bouillon.","Cuire 18 à 20 minutes puis mixer."],favorite:false,scheduledDate:dateOffset(1)},
 {id:3,title:"Smoothie bowl fruits rouges",category:"Petit-déjeuner",time:"10 min",difficulty:"Très facile",art:"🍓",ingredients:["150 g de fruits rouges","1 yaourt nature","1 c. à soupe de graines de chia","Quelques amandes"],prep:["Mixer les fruits rouges et le yaourt.","Verser dans un bol.","Ajouter chia, amandes et fruits frais."],favorite:true,scheduledDate:""},
 {id:4,title:"Saumon aux herbes vapeur",category:"Dîner",time:"30 min",difficulty:"Moyen",art:"🐟",ingredients:["1 pavé de saumon","Citron","Herbes fraîches","Courgette"],prep:["Déposer le saumon avec les herbes et le citron.","Cuire à la vapeur 12 à 15 minutes.","Servir avec la courgette."],favorite:false,scheduledDate:""}
];
let recipes=JSON.parse(localStorage.getItem(KEY)||"null")||seed;
let currentCategory="Toutes", selectedDate=todayISO(), calDate=new Date();
let scheduleId=null, editId=null, pendingNewPhoto="", pendingEditPhoto="";

function imageToDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",0.82))};img.onerror=reject;img.src=reader.result};reader.onerror=reject;reader.readAsDataURL(file)})}
function setPhotoPreview(id,data){const el=$("#"+id);if(el)el.innerHTML=data?`<img src="${data}" alt="Photo de recette">`:""}

function pad(n){return String(n).padStart(2,"0")}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function dateOffset(n){const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function save(){localStorage.setItem(KEY,JSON.stringify(recipes));renderAll()}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function nav(name){
 $$(".screen").forEach(x=>x.classList.remove("active")); const id=name+"Screen"; const el=$("#"+id); if(el)el.classList.add("active");
 $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===name)); window.scrollTo({top:0,behavior:"smooth"}); 
// --- Scanner v3 : assisté par Texte en direct de l’iPhone, sans OCR automatique ---
(function(){
  let scanFile=null, scanObjectUrl=null, scanRecipePhoto="";

  function showPreview(file){
    scanFile=file;
    imageToDataURL(file).then(data=>{scanRecipePhoto=data;setPhotoPreview("scanRecipePhotoPreview",data)});
    if(scanObjectUrl) URL.revokeObjectURL(scanObjectUrl);
    scanObjectUrl=URL.createObjectURL(file);
    $("#scanPreview").innerHTML=`<img src="${scanObjectUrl}" alt="Aperçu de la recette">`;
    $("#liveTextHelp").hidden=false;
  }

  function resetScanner(){
    scanFile=null;
    if(scanObjectUrl){URL.revokeObjectURL(scanObjectUrl);scanObjectUrl=null;}
    $("#scanPhoto").value="";
    $("#scanPreview").innerHTML="";
    $("#liveTextHelp").hidden=true;
    $("#scanRawText").value="";
    $("#scanTitle").value="";
    $("#scanTime").value="";
    $("#scanIngredients").value="";
    $("#scanPrep").value="";
    $("#scanCategory").value="Déjeuner";
  }

  $("#takeScanBtn").onclick=()=>$("#scanPhoto").click();
  $("#chooseScanBtn").onclick=()=>$("#scanPhoto").click();
  $("#scanPhoto").onchange=e=>{
    const f=e.target.files&&e.target.files[0];
    if(f) showPreview(f);
  };

  // We intentionally do not parse the pasted text automatically.
  // The user can paste it, then manually copy the exact pieces into the recipe fields.
  $("#clearScanTextBtn").onclick=()=>{
    $("#scanRawText").value="";
    $("#scanTitle").focus();
  };

  $$("[data-action='scan']").forEach(b=>b.addEventListener("click",()=>{
    resetScanner();
    openModal("scanModal");
  }));

  $("#useScanBtn").onclick=()=>{
    const title=$("#scanTitle").value.trim();
    if(!title){alert("Donne un nom à ta recette 😊");return}
    const ingredients=$("#scanIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);
    const prep=$("#scanPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
    recipes.unshift({
      id:Date.now(),
      title,
      category:$("#scanCategory").value,
      time:$("#scanTime").value.trim()||"—",
      difficulty:"Facile",
      art:"🍽️",
      photo:scanRecipePhoto,
      ingredients:ingredients.length?ingredients:["À compléter"],
      prep:prep.length?prep:["À compléter"],
      favorite:false,
      scheduledDate:""
    });
    save();
    closeModal("scanModal");
    nav("recipes");
    resetScanner();
  };
})();

renderAll();
}
function recipeCard(r){
 const art=r.photo?`<img src="${r.photo}" alt="Photo de ${esc(r.title)}">`:(r.art||"🍽️");
 return `<article class="recipe-card" data-id="${r.id}">
   <div class="food-art ${r.photo?"has-photo":""}">${art}</div>
   <div class="recipe-info"><span class="category-pill">${esc(r.category)}</span><h3>${esc(r.title)}</h3><p>${esc(r.ingredients.slice(0,3).join(" • "))}</p><div class="meta"><span>◷ ${esc(r.time||"—")}</span><span>♨ ${esc(r.difficulty||"Facile")}</span></div><div class="recipe-actions"><button class="mini-action edit-action" data-edit="${r.id}">✏️ Modifier</button><button class="mini-action delete-action" data-delete="${r.id}">🗑️ Supprimer</button></div></div>
   <button class="fav" data-fav="${r.id}">${r.favorite?"♥":"♡"}</button>
 </article>`
}
function renderList(el,arr,empty="Aucune recette pour le moment."){el.innerHTML=arr.length?arr.map(recipeCard).join(""):`<div class="empty">🌷<br><br>${empty}</div>`}
function filtered(q=""){q=q.trim().toLowerCase();return recipes.filter(r=>(currentCategory==="Toutes"||r.category===currentCategory)&&(!q||r.title.toLowerCase().includes(q)||r.ingredients.join(" ").toLowerCase().includes(q)))}
function renderRecipes(){renderList($("#recipeList"),filtered($("#recipeSearch")?.value||""),"Ajoute ta première recette avec le bouton +.");}
function renderHome(){const q=$("#homeSearch")?.value||"";let arr=recipes.filter(r=>!q||r.title.toLowerCase().includes(q)||r.ingredients.join(" ").toLowerCase().includes(q));renderList($("#homeFeatured"),arr.slice(0,4),"Tape un ingrédient pour afficher les recettes correspondantes.")}
function renderFavorites(){renderList($("#favoriteList"),recipes.filter(r=>r.favorite),"Tu n’as pas encore de favori. Appuie sur ♡ sur une recette.")}
function renderStats(){$("#statRecipes").textContent=recipes.length;$("#statFavs").textContent=recipes.filter(r=>r.favorite).length;$("#statCalendar").textContent=recipes.filter(r=>r.scheduledDate).length}
function formatDate(iso){if(!iso)return "";return new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(iso+"T12:00:00"))}
function openDetail(id){const r=recipes.find(x=>x.id==id);if(!r)return;const art=r.photo?`<img src="${r.photo}" alt="Photo de ${esc(r.title)}">`:(r.art||"🍽️");$("#detailContent").innerHTML=`<div class="detail-art ${r.photo?"has-photo":""}">${art}</div><div class="label-row"><span class="info-pill">${esc(r.category)}</span><span class="info-pill">◷ ${esc(r.time||"—")}</span><span class="info-pill">♨ ${esc(r.difficulty||"Facile")}</span></div><h2>${esc(r.title)}</h2>${r.scheduledDate?`<div class="info-pill">🗓️ ${formatDate(r.scheduledDate)}</div>`:""}<h3>🌿 Ingrédients</h3><ul>${r.ingredients.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h3>🥣 Préparation</h3><ol>${r.prep.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><button class="primary-btn" onclick="openSchedule(${r.id});closeModal('detailModal')">🗓️ Ajouter au calendrier</button>`;openModal("detailModal")}
function openSchedule(id){const r=recipes.find(x=>x.id==id);if(!r)return;scheduleId=id;$("#scheduleTitle").textContent=r.title;$("#scheduleDate").value=r.scheduledDate||selectedDate||todayISO();openModal("scheduleModal")}
function openModal(id){$("#"+id).classList.add("open")}
function closeModal(id){$("#"+id).classList.remove("open")}

function openEdit(id){
 const r=recipes.find(x=>x.id==id); if(!r)return;
 editId=id; pendingEditPhoto=r.photo||""; $("#editTitle").value=r.title; $("#editCategory").value=r.category||"Déjeuner"; $("#editTime").value=r.time||""; $("#editIngredients").value=(r.ingredients||[]).join("\n"); $("#editPrep").value=(r.prep||[]).join("\n"); setPhotoPreview("editPhotoPreview",pendingEditPhoto); openModal("editModal");
}
function deleteRecipe(id){
 const r=recipes.find(x=>x.id==id); if(!r)return;
 if(!confirm(`Supprimer « ${r.title} » de ton carnet ?`))return;
 recipes=recipes.filter(x=>x.id!=id); save();
}
function renderCalendar(){
 const y=calDate.getFullYear(),m=calDate.getMonth();$("#monthLabel").textContent=new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(calDate).replace(/^./,c=>c.toUpperCase());
 const first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate(), prev=new Date(y,m,0).getDate();let html="";
 for(let i=0;i<42;i++){const n=i-start+1;let d=n,mm=m,yy=y,muted=false;if(n<1){d=prev+n;mm=m-1;muted=true}else if(n>days){d=n-days;mm=m+1;muted=true}const iso=`${yyFor(yy,mm)}-${pad(mmDate(mm))}-${pad(d)}`;if(i>=start+days && i>=35)continue;const cls=["cal-day",muted?"muted":"",iso===todayISO()?"today":"",iso===selectedDate?"selected":"",recipes.some(r=>r.scheduledDate===iso)?"has-recipe":""].join(" ");html+=`<button class="${cls}" data-date="${iso}">${d}</button>`}
 $("#calendarGrid").innerHTML=html;renderDay();
}
function yyFor(y,m){return new Date(y,m,1).getFullYear()}
function mmDate(m){return new Date(calDate.getFullYear(),m,1).getMonth()+1}
function renderDay(){const arr=recipes.filter(r=>r.scheduledDate===selectedDate);$("#selectedDateTitle").textContent=`📌 ${formatDate(selectedDate)}`;renderList($("#dayRecipes"),arr,"Aucune recette programmée ce jour.")}
function renderAll(){renderHome();renderRecipes();renderFavorites();renderStats();renderCalendar()}
async function addRecipe(){
 const title=$("#newTitle").value.trim();if(!title){alert("Donne un nom à ta recette 😊");return}
 const ingredients=$("#newIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);const prep=$("#newPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
 recipes.unshift({id:Date.now(),title,category:$("#newCategory").value,time:$("#newTime").value.trim()||"—",difficulty:"Facile",art:["🥗","🍲","🍓","🥑","🧁"][Math.floor(Math.random()*5)],photo:pendingNewPhoto,ingredients:ingredients.length?ingredients:["À compléter"],prep:prep.length?prep:["À compléter"],favorite:false,scheduledDate:""});
 save();["newTitle","newTime","newIngredients","newPrep"].forEach(id=>$("#"+id).value="");$("#newPhoto").value="";pendingNewPhoto="";setPhotoPreview("newPhotoPreview","");closeModal("addModal");nav("recipes")
}
$$("[data-nav]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.nav)));
$$("[data-action='add']").forEach(b=>b.addEventListener("click",()=>openModal("addModal")));
$("#menuBtn").onclick=()=>$("#drawer").classList.add("open");$("#closeDrawer").onclick=()=>$("#drawer").classList.remove("open");
$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.addEventListener("click",e=>{
 const edit=e.target.closest("[data-edit]"); if(edit){e.stopPropagation();openEdit(edit.dataset.edit);return}
 const del=e.target.closest("[data-delete]"); if(del){e.stopPropagation();deleteRecipe(del.dataset.delete);return}
 const fav=e.target.closest("[data-fav]");if(fav){e.stopPropagation();const r=recipes.find(x=>x.id==fav.dataset.fav);r.favorite=!r.favorite;save();return}
 const card=e.target.closest(".recipe-card");if(card)openDetail(card.dataset.id);
 const day=e.target.closest(".cal-day");if(day){selectedDate=day.dataset.date;renderCalendar()}
});
$("#homeSearch").oninput=renderHome;$("#recipeSearch").oninput=renderRecipes;
$$(".chip").forEach(c=>c.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");currentCategory=c.dataset.category;renderRecipes()});
$("#prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$("#nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
$("#saveSchedule").onclick=()=>{const r=recipes.find(x=>x.id==scheduleId);if(r){r.scheduledDate=$("#scheduleDate").value;selectedDate=r.scheduledDate;save();closeModal("scheduleModal");nav("calendar")}};
$("#removeSchedule").onclick=()=>{const r=recipes.find(x=>x.id==scheduleId);if(r){r.scheduledDate="";save();closeModal("scheduleModal");nav("calendar")}};

$("#newPhoto").addEventListener("change",async e=>{
 const f=e.target.files&&e.target.files[0]; if(!f)return;
 try{pendingNewPhoto=await imageToDataURL(f);setPhotoPreview("newPhotoPreview",pendingNewPhoto)}
 catch(err){alert("Je n’ai pas réussi à lire cette photo. Essaie avec une autre image 😊")}
});
$("#editPhoto").addEventListener("change",async e=>{
 const f=e.target.files&&e.target.files[0]; if(!f)return;
 try{pendingEditPhoto=await imageToDataURL(f);setPhotoPreview("editPhotoPreview",pendingEditPhoto)}
 catch(err){alert("Je n’ai pas réussi à lire cette photo. Essaie avec une autre image 😊")}
});
$("#removeEditPhotoBtn").addEventListener("click",e=>{
 e.preventDefault(); e.stopPropagation();
 pendingEditPhoto=""; $("#editPhoto").value=""; setPhotoPreview("editPhotoPreview","");
});

$("#saveEditBtn").addEventListener("click",(e)=>{
 e.preventDefault(); e.stopPropagation();
 const r=recipes.find(x=>x.id==editId); if(!r)return;
 const title=$("#editTitle").value.trim(); if(!title){alert("Donne un nom à ta recette 😊");return}
 r.title=title;
 r.category=$("#editCategory").value;
 r.time=$("#editTime").value.trim()||"—";
 r.ingredients=$("#editIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);
 r.photo=pendingEditPhoto||"";
 r.prep=$("#editPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
 if(!r.ingredients.length)r.ingredients=["À compléter"];
 if(!r.prep.length)r.prep=["À compléter"];
 localStorage.setItem(KEY,JSON.stringify(recipes));
 closeModal("editModal");
 renderAll();
 editId=null;
});

$("#addRecipeBtn").onclick=addRecipe;

$("#addLibrary").addEventListener("click",()=>{
 const existing=new Set(recipes.map(r=>String(r.title||"").trim().toLowerCase()));
 const toAdd=originalLibrary.filter(r=>!existing.has(String(r.title||"").trim().toLowerCase())).map(r=>({...r}));
 if(!toAdd.length){alert("🌷 Ta bibliothèque originale est déjà dans ton carnet !");return}
 if(!confirm(`Ajouter ${toAdd.length} recettes originales à ton carnet ? Tes recettes personnelles resteront bien sûr intactes.`)) return;
 recipes=[...toAdd,...recipes];
 save();
 alert(`💗 ${toAdd.length} recettes originales ont été ajoutées ! Tu peux maintenant les chercher, les modifier et les mettre en favoris.`);
});

$("#exportData").addEventListener("click",()=>{
 try{
   const payload={app:"Les recettes IG bas de Camille",version:1,exportedAt:new Date().toISOString(),recipes};
   const blob=new Blob([JSON.stringify(payload)],{type:"application/json"});
   const url=URL.createObjectURL(blob);
   const a=document.createElement("a");
   a.href=url;
   a.download="mes-recettes-ig-bas-sauvegarde.json";
   document.body.appendChild(a);
   a.click();
   a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(err){alert("Je n’ai pas réussi à créer la sauvegarde. Réessaie 😊");}
});
$("#importDataBtn").addEventListener("click",()=>$("#importData").click());
$("#importData").addEventListener("change",async e=>{
 const f=e.target.files&&e.target.files[0]; if(!f)return;
 try{
   const text=await f.text();
   const data=JSON.parse(text);
   if(!data || !Array.isArray(data.recipes)) throw new Error("format");
   if(!confirm("Restaurer cette sauvegarde remplacera le carnet actuel par celui du fichier. Continuer ?")){e.target.value="";return}
   recipes=data.recipes;
   save();
   renderAll();
   alert("💗 Ton carnet a bien été restauré !");
 }catch(err){alert("Ce fichier n’est pas une sauvegarde valide de ton carnet.")}
 e.target.value="";
});
$("#clearData").onclick=()=>{if(confirm("Réinitialiser les recettes de démonstration ?")){recipes=JSON.parse(JSON.stringify(seed));save()}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
renderAll();
