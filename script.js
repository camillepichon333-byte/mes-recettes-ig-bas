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
 $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===name)); window.scrollTo({top:0,behavior:"smooth"}); 
// --- Scanner v2 : OCR amélioré, local, avec pré-traitement photo ---
(function(){
  let scanFile=null, scanObjectUrl=null;

  function setProgress(n,msg){
    $("#scanProgress").hidden=false; $("#scanProgressBar").style.width=n+"%"; $("#scanProgressText").textContent=msg;
  }
  function showPreview(file){
    scanFile=file;
    if(scanObjectUrl) URL.revokeObjectURL(scanObjectUrl);
    scanObjectUrl=URL.createObjectURL(file);
    $("#scanPreview").innerHTML=`<img src="${scanObjectUrl}" alt="Aperçu de la recette">`;
    $("#analyzeScanBtn").disabled=false;
    $("#scanResult").hidden=true;
    $("#scanProgress").hidden=true;
  }

  function preprocess(file){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>{
        const max=2200, scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
        const w=Math.max(1,Math.round(img.naturalWidth*scale)), h=Math.max(1,Math.round(img.naturalHeight*scale));
        const c=document.createElement("canvas"); c.width=w;c.height=h;
        const ctx=c.getContext("2d",{willReadFrequently:true});
        ctx.drawImage(img,0,0,w,h);
        const d=ctx.getImageData(0,0,w,h), a=d.data;
        for(let i=0;i<a.length;i+=4){
          const g=0.299*a[i]+0.587*a[i+1]+0.114*a[i+2];
          const v=Math.max(0,Math.min(255,(g-128)*1.45+128));
          a[i]=a[i+1]=a[i+2]=v;
        }
        ctx.putImageData(d,0,0);
        c.toBlob(b=>b?resolve(b):reject(new Error("Image impossible à préparer")),"image/jpeg",.92);
      };
      img.onerror=()=>reject(new Error("Photo illisible"));
      img.src=URL.createObjectURL(file);
    });
  }

  function cleanText(t){
    return t.replace(/\r/g,"\n")
      .replace(/[ \t]+/g," ")
      .replace(/\n{3,}/g,"\n\n")
      .split("\n").map(x=>x.trim()).filter(Boolean).join("\n");
  }
  function linesBetween(lines,startRx,endRx){
    let s=lines.findIndex(x=>startRx.test(x)), e=-1;
    if(s<0)return [];
    for(let i=s+1;i<lines.length;i++){if(endRx.test(lines[i])){e=i;break}}
    return lines.slice(s+1,e<0?lines.length:e);
  }
  function parseRecipe(raw){
    const text=cleanText(raw), lines=text.split("\n");
    const ingredientRx=/^(ingr[eé]dients?|pour\s+\d|ingredients?)/i;
    const prepRx=/^(pr[eé]paration|préparation|instructions?|étapes?|method|recette)/i;
    const timeRx=/(?:temps|préparation|cuisson)\s*:?\s*(\d+\s*(?:min|minutes?|h|heures?))/i;
    let title=(lines.find(x=>x.length>=5 && !ingredientRx.test(x) && !prepRx.test(x) && !/^\d+$/.test(x))||"Ma nouvelle recette").replace(/^[•·\-–—]\s*/,"");
    let ing=linesBetween(lines,ingredientRx,prepRx);
    let prep=linesBetween(lines,prepRx,/^(notes?|astuce|conseil|nutrition|valeurs?\s+nutritionnelles?)/i);
    if(!ing.length){
      const ix=lines.findIndex(x=>/^(?:•|-|–|—|\d+[.)])\s*/.test(x) && /(?:g|kg|ml|cl|l|c\.?\s*[àa]\s*(?:soupe|café)|cuillère|œuf|oeuf|poivre|sel|farine|huile|sucre|tomate|oignon)/i.test(x));
      if(ix>=0) ing=lines.slice(ix,Math.min(ix+30, lines.length));
    }
    if(!prep.length){
      const ix=lines.findIndex(x=>prepRx.test(x));
      if(ix>=0) prep=lines.slice(ix+1);
    }
    const normalizeItems=a=>a.map(x=>x.replace(/^[•·\-–—]\s*/,"").replace(/^\d+[.)]\s*/,"").trim()).filter(x=>x.length>1);
    ing=normalizeItems(ing); prep=normalizeItems(prep);
    const tm=text.match(timeRx);
    let category="Déjeuner";
    if(/petit.?d[eé]jeuner|breakfast/i.test(text)) category="Petit-déjeuner";
    else if(/d[iî]ner|soupe|velout[eé]/i.test(text)) category="Dîner";
    else if(/dessert|g[aâ]teau|tarte|mousse/i.test(text)) category="Dessert";
    return {title,category,time:tm?tm[1]:"",ingredients:ing,prep};
  }

  async function analyze(){
    if(!scanFile)return;
    try{
      $("#analyzeScanBtn").disabled=true; setProgress(8,"Préparation de la photo…");
      const img=await preprocess(scanFile);
      setProgress(18,"Démarrage de la lecture…");
      if(typeof Tesseract==="undefined") throw new Error("Le moteur de lecture n'est pas disponible. Vérifie ta connexion internet puis réessaie.");
      const result=await Tesseract.recognize(img,"fra",{
        logger:m=>{
          if(m.status==="loading language traineddata") setProgress(25,"Chargement du français…");
          else if(m.status==="recognizing text") setProgress(35+Math.round((m.progress||0)*55),"Lecture du texte…");
        },
        tessedit_pageseg_mode:"6"
      });
      const parsed=parseRecipe(result.data.text||"");
      $("#scanTitle").value=parsed.title;
      $("#scanCategory").value=parsed.category;
      $("#scanTime").value=parsed.time;
      $("#scanIngredients").value=parsed.ingredients.join("\n");
      $("#scanPrep").value=parsed.prep.join("\n");
      $("#scanResult").hidden=false;
      setProgress(100,"Lecture terminée ✨");
      $("#scanResult").scrollIntoView({behavior:"smooth",block:"start"});
    }catch(e){
      alert("Je n’arrive pas à lire correctement cette photo. Essaie avec la page bien droite, sans reflet, et avec une bonne lumière.");
      console.error(e);
      $("#scanProgress").hidden=true;
    }finally{$("#analyzeScanBtn").disabled=false}
  }

  $("#takeScanBtn").onclick=()=>$("#scanPhoto").click();
  $("#chooseScanBtn").onclick=()=>$("#scanPhoto").click();
  $("#scanPhoto").onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)showPreview(f)};
  $("#analyzeScanBtn").onclick=analyze;
  $$("[data-action='scan']").forEach(b=>b.addEventListener("click",()=>{openModal("scanModal");}));
  $("#useScanBtn").onclick=()=>{
    const title=$("#scanTitle").value.trim();
    if(!title){alert("Donne un nom à ta recette 😊");return}
    const ingredients=$("#scanIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);
    const prep=$("#scanPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
    recipes.unshift({id:Date.now(),title,category:$("#scanCategory").value,time:$("#scanTime").value.trim()||"—",difficulty:"Facile",art:"🍽️",ingredients:ingredients.length?ingredients:["À compléter"],prep:prep.length?prep:["À compléter"],favorite:false,scheduledDate:""});
    save();
    closeModal("scanModal"); nav("recipes");
    $("#scanPhoto").value=""; $("#scanPreview").innerHTML=""; $("#scanResult").hidden=true; $("#scanProgress").hidden=true; scanFile=null;
  };
})();

renderAll();
}
function recipeCard(r){
 return `<article class="recipe-card" data-id="${r.id}">
   <div class="food-art">${r.art||"🍽️"}</div>
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
function openDetail(id){const r=recipes.find(x=>x.id==id);if(!r)return;$("#detailContent").innerHTML=`<div class="detail-art">${r.art||"🍽️"}</div><div class="label-row"><span class="info-pill">${esc(r.category)}</span><span class="info-pill">◷ ${esc(r.time||"—")}</span><span class="info-pill">♨ ${esc(r.difficulty||"Facile")}</span></div><h2>${esc(r.title)}</h2>${r.scheduledDate?`<div class="info-pill">🗓️ ${formatDate(r.scheduledDate)}</div>`:""}<h3>🌿 Ingrédients</h3><ul>${r.ingredients.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h3>🥣 Préparation</h3><ol>${r.prep.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><button class="primary-btn" onclick="openSchedule(${r.id});closeModal('detailModal')">🗓️ Ajouter au calendrier</button>`;openModal("detailModal")}
function openSchedule(id){const r=recipes.find(x=>x.id==id);if(!r)return;scheduleId=id;$("#scheduleTitle").textContent=r.title;$("#scheduleDate").value=r.scheduledDate||selectedDate||todayISO();openModal("scheduleModal")}
function openModal(id){$("#"+id).classList.add("open")}
function closeModal(id){$("#"+id).classList.remove("open")}

function openEdit(id){
 const r=recipes.find(x=>x.id==id); if(!r)return;
 editId=id; $("#editTitle").value=r.title; $("#editCategory").value=r.category||"Déjeuner"; $("#editTime").value=r.time||""; $("#editIngredients").value=(r.ingredients||[]).join("\n"); $("#editPrep").value=(r.prep||[]).join("\n"); openModal("editModal");
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
 recipes.unshift({id:Date.now(),title,category:$("#newCategory").value,time:$("#newTime").value.trim()||"—",difficulty:"Facile",art:["🥗","🍲","🍓","🥑","🧁"][Math.floor(Math.random()*5)],ingredients:ingredients.length?ingredients:["À compléter"],prep:prep.length?prep:["À compléter"],favorite:false,scheduledDate:""});
 localStorage.setItem(KEY,JSON.stringify(recipes));["newTitle","newTime","newIngredients","newPrep"].forEach(id=>$("#"+id).value="");closeModal("addModal");nav("recipes")
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

$("#saveEditBtn").onclick=()=>{
 const r=recipes.find(x=>x.id==editId); if(!r)return;
 const title=$("#editTitle").value.trim(); if(!title){alert("Donne un nom à ta recette 😊");return}
 r.title=title; r.category=$("#editCategory").value; r.time=$("#editTime").value.trim()||"—";
 r.ingredients=$("#editIngredients").value.split("\n").map(x=>x.trim()).filter(Boolean);
 r.prep=$("#editPrep").value.split("\n").map(x=>x.trim()).filter(Boolean);
 if(!r.ingredients.length)r.ingredients=["À compléter"]; if(!r.prep.length)r.prep=["À compléter"];
 localStorage.setItem(KEY,JSON.stringify(recipes)); closeModal("editModal"); renderAll();
};

$("#addRecipeBtn").onclick=addRecipe;
$("#clearData").onclick=()=>{if(confirm("Réinitialiser les recettes de démonstration ?")){recipes=JSON.parse(JSON.stringify(seed));save()}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
renderAll();
