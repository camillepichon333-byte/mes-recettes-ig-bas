// Base de données locale
let recipes = JSON.parse(localStorage.getItem('my_recipes')) || [
  {
    id: 1,
    title: "Muesli aux pommes et cannelle",
    ingredients: "pommes, flocons d'avoine, lait, cannelle",
    instructions: "Couper les pommes en morceaux, mélanger avec les flocons d'avoine, saupoudrer de cannelle et ajouter le lait.",
    scheduledDate: null
  },
  {
    id: 2,
    title: "Tarte aux pommes rapide",
    ingredients: "pâte feuilletée, pommes, sucre, beurre",
    instructions: "Disposer la pâte dans un plat, ajouter les lamelles de pommes, saupoudrer de sucre et de noisettes de beurre. Cuire 30 min.",
    scheduledDate: null
  }
];

let selectedRecipeForSchedule = null;

const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));

    item.classList.add('active');
    const targetTab = item.getAttribute('data-tab');
    document.getElementById(`tab-${targetTab}`).classList.add('active');

    if (targetTab === 'calendar') {
      renderCalendar();
    }
  });
});

const searchInput = document.getElementById('search-input');
const recipesResults = document.getElementById('recipes-results');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();

  if (query === "") {
    recipesResults.innerHTML = `<p class="placeholder-text">Tape un ingrédient pour afficher les recettes correspondantes.</p>`;
    return;
  }

  const filtered = recipes.filter(recipe =>
    recipe.ingredients.toLowerCase().includes(query) ||
    recipe.title.toLowerCase().includes(query)
  );

  displayRecipes(filtered);
});

function displayRecipes(recipesToDisplay) {
  if (recipesToDisplay.length === 0) {
    recipesResults.innerHTML = `<p class="placeholder-text">Aucune recette trouvée avec cet ingrédient.</p>`;
    return;
  }

  recipesResults.innerHTML = "";

  recipesToDisplay.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <div class="recipe-title">${escapeHtml(recipe.title)}</div>
      <div class="recipe-ingredients"><strong>Ingrédients :</strong> ${escapeHtml(recipe.ingredients)}</div>
      <div class="recipe-instructions"><strong>Préparation :</strong> ${escapeHtml(recipe.instructions)}</div>
      ${recipe.scheduledDate ? `<div class="scheduled-badge">📅 Prévu le : ${formatDate(recipe.scheduledDate)}</div>` : ''}
    `;

    card.addEventListener('click', () => {
      openScheduleModal(recipe);
    });

    recipesResults.appendChild(card);
  });
}

const addModal = document.getElementById('add-modal');
const openAddModalBtn = document.getElementById('open-add-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveNewRecipeBtn = document.getElementById('save-new-recipe-btn');

openAddModalBtn.addEventListener('click', () => { addModal.style.display = 'flex'; });
closeModalBtn.addEventListener('click', () => { addModal.style.display = 'none'; });

saveNewRecipeBtn.addEventListener('click', () => {
  const title = document.getElementById('new-title').value.trim();
  const ingredients = document.getElementById('new-ingredients').value.trim();
  const instructions = document.getElementById('new-instructions').value.trim();

  if (!title || !ingredients || !instructions) {
    alert("Merci de remplir tous les champs !");
    return;
  }

  const newRecipe = {
    id: Date.now(),
    title,
    ingredients,
    instructions,
    scheduledDate: null
  };

  recipes.push(newRecipe);
  localStorage.setItem('my_recipes', JSON.stringify(recipes));

  document.getElementById('new-title').value = "";
  document.getElementById('new-ingredients').value = "";
  document.getElementById('new-instructions').value = "";
  addModal.style.display = 'none';

  alert("Recette ajoutée avec succès !");
});

const scheduleModal = document.getElementById('schedule-modal');
const closeScheduleBtn = document.getElementById('close-schedule-btn');
const confirmScheduleBtn = document.getElementById('confirm-schedule-btn');
const scheduleRecipeTitle = document.getElementById('schedule-recipe-title');
const scheduleDateInput = document.getElementById('schedule-date-input');

function openScheduleModal(recipe) {
  selectedRecipeForSchedule = recipe;
  scheduleRecipeTitle.textContent = `Planifier : ${recipe.title}`;
  scheduleDateInput.value = recipe.scheduledDate || "";
  scheduleModal.style.display = 'flex';
}

closeScheduleBtn.addEventListener('click', () => { scheduleModal.style.display = 'none'; });

confirmScheduleBtn.addEventListener('click', () => {
  const dateVal = scheduleDateInput.value;

  if (!dateVal) {
    alert("Choisis une date !");
    return;
  }

  selectedRecipeForSchedule.scheduledDate = dateVal;
  localStorage.setItem('my_recipes', JSON.stringify(recipes));
  scheduleModal.style.display = 'none';

  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    const filtered = recipes.filter(r =>
      r.ingredients.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query)
    );
    displayRecipes(filtered);
  }

  alert("Recette planifiée avec succès !");
});

// Affichage du calendrier
function renderCalendar() {
  const container = document.getElementById('calendar-days-container');
  container.innerHTML = "";

  const scheduled = recipes.filter(r => r.scheduledDate !== null);

  if (scheduled.length === 0) {
    container.innerHTML = `<p class="placeholder-text">Aucune recette programmée pour l'instant. Clique sur une recette dans l'onglet Recettes pour lui assigner une date.</p>`;
    return;
  }

  scheduled.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const groupedByDate = {};
  scheduled.forEach(r => {
    if (!groupedByDate[r.scheduledDate]) {
      groupedByDate[r.scheduledDate] = [];
    }
    groupedByDate[r.scheduledDate].push(r);
  });

  for (const [date, recs] of Object.entries(groupedByDate)) {
    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day-box';

    const title = document.createElement('div');
    title.className = 'calendar-day-title';
    title.textContent = `📅 ${formatDate(date)}`;
    dayBox.appendChild(title);

    recs.forEach(r => {
      const recipeItem = document.createElement('div');
      recipeItem.className = 'calendar-recipe-item';

      const recipeName = document.createElement('span');
      recipeName.className = 'calendar-recipe-name';
      recipeName.innerHTML = `<strong>${escapeHtml(r.title)}</strong>`;

      // Cliquer sur toute la ligne ouvre la fiche complète
      recipeItem.addEventListener('click', () => {
        openRecipeDetail(r);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-schedule-btn';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Retirer du calendrier';

      // Empêche le clic sur ✕ d'ouvrir la recette
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        removeSchedule(r.id);
      });

      recipeItem.appendChild(recipeName);
      recipeItem.appendChild(deleteBtn);
      dayBox.appendChild(recipeItem);
    });

    container.appendChild(dayBox);
  }
}

window.removeSchedule = function(id) {
  const recipe = recipes.find(r => r.id === id);

  if (recipe) {
    recipe.scheduledDate = null;
    localStorage.setItem('my_recipes', JSON.stringify(recipes));
    renderCalendar();
  }
};

// NOUVEAU : fenêtre affichant la recette complète
const recipeDetailModal = document.getElementById('recipe-detail-modal');
const closeRecipeDetailBtn = document.getElementById('close-recipe-detail-btn');
const detailRecipeTitle = document.getElementById('detail-recipe-title');
const detailRecipeIngredients = document.getElementById('detail-recipe-ingredients');
const detailRecipeInstructions = document.getElementById('detail-recipe-instructions');
const detailRecipeDate = document.getElementById('detail-recipe-date');

function openRecipeDetail(recipe) {
  detailRecipeTitle.textContent = recipe.title;
  detailRecipeIngredients.textContent = recipe.ingredients;
  detailRecipeInstructions.textContent = recipe.instructions;

  if (recipe.scheduledDate) {
    detailRecipeDate.textContent = `📅 Prévu le : ${formatDate(recipe.scheduledDate)}`;
    detailRecipeDate.style.display = 'inline-block';
  } else {
    detailRecipeDate.style.display = 'none';
  }

  recipeDetailModal.style.display = 'flex';
}

closeRecipeDetailBtn.addEventListener('click', () => {
  recipeDetailModal.style.display = 'none';
});

// Fermer une fenêtre si on touche l'arrière-plan
[addModal, scheduleModal, recipeDetailModal].forEach(modal => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});

function formatDate(dateString) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', options);
}

// Petite protection pour afficher correctement les caractères saisis
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

// Enregistrement du service worker pour le mode application
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(error => {
      console.log('Service Worker non enregistré :', error);
    });
  });
}
