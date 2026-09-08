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
let scheduleId=null, editId=null;

function pad(n){return String(n).padStart(2,"0")}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function dateOffset(n){const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function save(){localStorage.setItem(KEY,JSON.stringify(recipes));renderAll()}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function nav(name){
 $$(".screen").forEach(x=>x.classList.remove("active")); const id=name+"Screen"; const el=$("#"+id); if(el)el.classList.add("active");
 $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===name)); window.scrollTo({top:0,behavior:"smooth"}); renderAll();
}

function fileToDataURL(file,maxSize=1200){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>{const img=new Image();img.onload=()=>{
   const scale=Math.min(1,maxSize/Math.max(img.width,img.height));
   const c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
   c.getContext("2d").drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",.82));
  };img.onerror=reject;img.src=reader.result};reader.onerror=reject;reader.readAsDataURL(file);
 });
}
let pendingNewPhoto="", pendingEditPhoto="";
function setPreview(input,preview,assign){
 const f=input.files?.[0]; if(!f)return;
 fileToDataURL(f).then(data=>{assign(data);preview.src=data;preview.hidden=false}).catch(()=>alert("Je n’arrive pas à lire cette photo."));
}

function recipeCard(r){
 return `<article class="recipe-card" data-id="${r.id}">
   <div class="food-art">${r.photo?`<img src="${r.photo}" alt="">`:(r.art||"🍽️")}</div>
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
function openDetail(id){const r=recipes.find(x=>x.id==id);if(!r)return;$("#detailContent").innerHTML=`<div class="detail-art">${r.photo?`<img src="${r.photo}" alt="">`:(r.art||"🍽️")}</div><div class="label-row"><span class="info-pill">${esc(r.category)}</span><span class="info-pill">◷ ${esc(r.time||"—")}</span><span class="info-pill">♨ ${esc(r.difficulty||"Facile")}</span></div><h2>${esc(r.title)}</h2>${r.scheduledDate?`<div class="info-pill">🗓️ ${formatDate(r.scheduledDate)}</div>`:""}<h3>🌿 Ingrédients</h3><ul>${r.ingredients.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h3>🥣 Préparation</h3><ol>${r.prep.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><button class="primary-btn" onclick="openSchedule(${r.id});closeModal('detailModal')">🗓️ Ajouter au calendrier</button>`;openModal("detailModal")}
function openSchedule(id){const r=recipes.find(x=>x.id==id);if(!r)return;scheduleId=id;$("#scheduleTitle").textContent=r.title;$("#scheduleDate").value=r.scheduledDate||selectedDate||todayISO();openModal("scheduleModal")}
function openModal(id){$("#"+id).classList.add("open")}
function closeModal(id){$("#"+id).classList.remove("open")}

function openEdit(id){
 const r=recipes.find(x=>x.id==id); if(!r)return;
 editId=id; pendingEditPhoto=r.photo||""; $("#editTitle").value=r.title; $("#editCategory").value=r.category||"Déjeuner"; $("#editPhotoPreview").src=r.photo||""; $("#editPhotoPreview").hidden=!r.photo; $("#editTime").value=r.time||""; $("#editIngredients").value=(r.ingredients||[]).join("\n"); $("#editPrep").value=(r.prep||[]).join("\n"); openModal("editModal");
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
function addRecipe(){
 const title=$("#newTitle").value.trim();if(!title){alert("Donne un nom à ta recette 😊");return}
 const ingredients=$("#newIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);const prep=$("#newPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
 recipes.unshift({id:Date.now(),title,category:$("#newCategory").value,time:$("#newTime").value.trim()||"—",difficulty:"Facile",art:["🥗","🍲","🍓","🥑","🧁"][Math.floor(Math.random()*5)],ingredients:ingredients.length?ingredients:["À compléter"],prep:prep.length?prep:["À compléter"],favorite:false,scheduledDate:"",photo:pendingNewPhoto});
 localStorage.setItem(KEY,JSON.stringify(recipes));["newTitle","newTime","newIngredients","newPrep"].forEach(id=>$("#"+id).value="");pendingNewPhoto="";$("#newPhotoPreview").hidden=true;$("#newPhoto").value="";closeModal("addModal");nav("recipes")
}
$$("[data-nav]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.nav)));
$$("[data-action='add']").forEach(b=>b.addEventListener("click",()=>openModal("addModal")));$$("[data-action='scan']").forEach(b=>b.addEventListener("click",()=>openModal("scanModal")));
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

$("#saveEditBtn").onclick=()=>{
 const r=recipes.find(x=>x.id==editId); if(!r)return;
 const title=$("#editTitle").value.trim(); if(!title){alert("Donne un nom à ta recette 😊");return}
 r.title=title; r.category=$("#editCategory").value; r.time=$("#editTime").value.trim()||"—";
 r.photo=pendingEditPhoto; r.ingredients=$("#editIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);
 r.prep=$("#editPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
 if(!r.ingredients.length)r.ingredients=["À compléter"]; if(!r.prep.length)r.prep=["À compléter"];
 localStorage.setItem(KEY,JSON.stringify(recipes)); closeModal("editModal"); renderAll();
};


$("#newPhotoBtn").onclick=()=>$("#newPhoto").click();
$("#newPhoto").onchange=()=>setPreview($("#newPhoto"),$("#newPhotoPreview"),v=>pendingNewPhoto=v);
$("#editPhotoBtn").onclick=()=>$("#editPhoto").click();
$("#editPhoto").onchange=()=>setPreview($("#editPhoto"),$("#editPhotoPreview"),v=>pendingEditPhoto=v);

$("#scanPhotoBtn").onclick=()=>$("#scanPhoto").click();
$("#scanPhoto").onchange=async()=>{
 const f=$("#scanPhoto").files?.[0]; if(!f)return;
 $("#scanPreview").src=await fileToDataURL(f); $("#scanPreview").hidden=false;
 $("#scanStatus").textContent="Lecture du texte en cours… ⏳";
 $("#scanText").value="";
 try{
   if(!window.Tesseract) throw new Error("OCR indisponible");
   const result=await Tesseract.recognize(f,"fra",{logger:m=>{
     if(m.status==="recognizing text" && m.progress) $("#scanStatus").textContent=`Lecture du texte… ${Math.round(m.progress*100)} %`;
   }});
   $("#scanText").value=result.data.text.trim();
   $("#scanStatus").textContent="Texte reconnu. Vérifie-le avant de l’ajouter. ✨";
 }catch(e){
   $("#scanStatus").textContent="La lecture automatique n’a pas pu se faire. Tu peux tout de même saisir ou corriger le texte ci-dessous.";
 }
};
$("#useScanBtn").onclick=()=>{
 const text=$("#scanText").value.trim(); if(!text){alert("Prends d’abord une photo ou saisis le texte de la recette.");return}
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const title=lines[0]||"Ma recette";
 const ingIndex=lines.findIndex(x=>/ingr[eé]dients?/i.test(x));
 const prepIndex=lines.findIndex(x=>/pr[ée]paration|pr[ée]parez|instructions?/i.test(x));
 let ingredients=ingIndex>=0?(lines.slice(ingIndex+1,prepIndex>ingIndex?prepIndex:lines.length)):lines.slice(1,Math.min(6,lines.length));
 let prep=prepIndex>=0?lines.slice(prepIndex+1):lines.slice(Math.max(1,ingredients.length+1));
 $("#newTitle").value=title;
 $("#newIngredients").value=ingredients.join("\n");
 $("#newPrep").value=prep.join("\n");
 closeModal("scanModal"); openModal("addModal");
};

$("#addRecipeBtn").onclick=addRecipe;
$("#clearData").onclick=()=>{if(confirm("Réinitialiser les recettes de démonstration ?")){recipes=JSON.parse(JSON.stringify(seed));save()}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
renderAll();
