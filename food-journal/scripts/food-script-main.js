/*Variables*/

/*
const mealForm = document.getElementById("mealForm");
const mealEntries = document.getElementById("mealEntries");

const STORAGE_KEY = "foodJournalEntries";

let entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
*/

let mealForm;
let mealEntries;
let loginSection;
let journalSection;
let pageTitle;
let journalHeading;
let switchUserButton;

let currentUser;
let STORAGE_KEY;

let entries;

const CURRENT_USER_KEY = "foodJournalCurrentUser";
const STORAGE_PREFIX = "foodJournalEntries";

/*Functions*/
function indexInit(){
  mealForm = document.getElementById("mealForm");
  mealEntries = document.getElementById("mealEntries");
  loginSection = document.getElementById("loginSection");
  journalSection = document.getElementById("journalSection");
  pageTitle = document.getElementById("pageTitle");
  journalHeading = document.getElementById("journalHeading");
  switchUserButton = document.getElementById("switchUserButton");

  entries = [];

  const savedUser = localStorage.getItem(CURRENT_USER_KEY);

  if(savedUser){
    selectUser(savedUser);
  }

  setUpListeners();
}

function getStorageKeyForUser(userName){
  return `${STORAGE_PREFIX}_${userName}`;
}

function selectUser(userName){
  currentUser = userName;
  STORAGE_KEY = getStorageKeyForUser(currentUser);
  entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  localStorage.setItem(CURRENT_USER_KEY, currentUser);

  loginSection.hidden = true;
  journalSection.hidden = false;

  pageTitle.textContent = `${currentUser}'s Food Journal`;
  journalHeading.textContent = `${currentUser}'s Entries`;

  renderEntries();
}

function switchUser(){
  currentUser = undefined;
  STORAGE_KEY = undefined;
  entries = [];

  localStorage.removeItem(CURRENT_USER_KEY);

  mealEntries.innerHTML = "";
  mealForm.reset();
  resetNumberFields();

  pageTitle.textContent = "Food Journal.";
  journalSection.hidden = true;
  loginSection.hidden = false;
}

function saveEntries() {
  if(!STORAGE_KEY)
  {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries() {
  mealEntries.innerHTML = "";

  if (entries.length === 0) {
    mealEntries.innerHTML = `<p class="empty-message">No meals saved yet.</p>`;
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "meal-card";

    card.innerHTML = `
      <img src="${entry.photo}" alt="Meal photo" />

      <div class="meal-card-content">
        <div class="meal-date">${entry.date}</div>

        <p class="meal-notes">${entry.notes}</p>

        <div class="meal-stats">
          <span><strong>Protein:</strong> ${entry.protein}</span>
          <span><strong>Veggies:</strong> ${entry.veggies}</span>
          <span><strong>Carbs:</strong> ${entry.carbs}</span>
          <span><strong>Fats:</strong> ${entry.fats}</span>
        </div>

        <button class="delete-button" data-id="${entry.id}">Delete</button>
      </div>
    `;

    mealEntries.appendChild(card);
  });
}

function createMealEntry(photoData) {
  return {
    id: crypto.randomUUID(),
    date: new Date().toLocaleString(),
    photo: photoData,
    notes: document.getElementById("mealNotes").value,
    protein: Number(document.getElementById("protein").value),
    veggies: Number(document.getElementById("veggies").value),
    carbs: Number(document.getElementById("carbs").value),
    fats: Number(document.getElementById("fats").value)
  };
}

function resetNumberFields(){
  document.getElementById("protein").value = 0;
  document.getElementById("veggies").value = 0;
  document.getElementById("carbs").value = 0;
  document.getElementById("fats").value = 0;
}

function setUpListeners(){
  document.querySelectorAll(".user-button").forEach((button) => {
    button.addEventListener("click", function(){
      selectUser(this.dataset.user);
    });
  });

  switchUserButton.addEventListener("click", switchUser);

  mealForm.addEventListener("submit", function (event){
    event.preventDefault();

    if(!currentUser){
      alert("Please choose a user first.");
      return;
    }

    const photoInput = document.getElementById("mealPhoto");
    const file = photoInput.files[0];

    if (!file) {
      alert("Please choose a meal photo.");
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      const newEntry = createMealEntry(reader.result);

      entries.unshift(newEntry);
      saveEntries();
      renderEntries();

      mealForm.reset();
      resetNumberFields();
    };

    reader.readAsDataURL(file);
  });

  mealEntries.addEventListener("click", function (event) {
    if (!event.target.classList.contains("delete-button")) return;

    const entryId = event.target.dataset.id;

    entries = entries.filter((entry) => entry.id !== entryId);

    saveEntries();
    renderEntries();
  });
}