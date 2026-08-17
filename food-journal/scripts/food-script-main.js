/* Food Journal - database/API version */

// # VARIABLES - ==============================================

// ========================================
// Configuration
// ========================================
const API_BASE = "api";

// ========================================
// Application State
// ========================================
let currentUser = null;
let editingMealId = null;
let entries = [];

// ========================================
// Cached DOM Elements
// ========================================
let mealForm;
let mealFormTitle;
let mealEntries;
let mealPhotoInput;
let mealPhotoField;
let userButtons;
let userLoginSection;
let journalSection;
let journalTitle;
let activeUserLabel;
let switchUserButton;
let saveMealButton;
let uploadStatus;
//forms and overlays
let openMealFormButton;
let closeMealFormButton;
let mealFormOverlay;
let loginForm;
let usernameInput;
let loginStatus;

// # FUNCTIONS - ==============================================
// functions are in alphabetical order (except for indexInit() - which we place as a sticky top function)


// Function to run to set up page
// run when we get "in it" lol
// aka - initialize
// Cache DOM elements, attach event listeners, and load selectable users. etc etc
function indexInit() {
  mealForm = document.getElementById("mealForm");
  mealFormTitle = document.getElementById("mealFormTitle");
  mealEntries = document.getElementById("mealEntries");
  mealPhotoInput = document.getElementById("mealPhoto");
  mealPhotoField = document.getElementById("mealPhotoField");
  userLoginSection = document.getElementById("userLoginSection");
  journalSection = document.getElementById("journalSection");
  journalTitle = document.getElementById("journalTitle");
  activeUserLabel = document.getElementById("activeUserLabel");
  switchUserButton = document.getElementById("switchUserButton");
  saveMealButton = document.getElementById("saveMealButton");
  uploadStatus = document.getElementById("uploadStatus");
  //forms and overlays
  openMealFormButton = document.getElementById("openMealFormButton");
  closeMealFormButton = document.getElementById("closeMealFormButton");
  mealFormOverlay = document.getElementById("mealFormOverlay");
  loginForm = document.getElementById("loginForm");
  usernameInput = document.getElementById("usernameInput");
  loginStatus = document.getElementById("loginStatus");

  setUpListeners();
}

// Shared wrapper for API requests.
// Converts JSON responses and throws useful errors for failed requests.
async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && data.error ? data.error : "Something went wrong.";
    throw new Error(message);
  }

  return data;
}

async function createMeal(){
  const photoInput = document.getElementById("mealPhoto");
  const file = photoInput.files[0];

  if (!file) {
    alert("Please choose a meal photo.");
    return;
  }

  const formData = new FormData();
  formData.append("user_id", currentUser.id);
  formData.append("photo", file);
  formData.append("notes", document.getElementById("mealNotes").value);
  formData.append("protein", document.getElementById("protein").value || 0);
  formData.append("veggies", document.getElementById("veggies").value || 0);
  formData.append("carbs", document.getElementById("carbs").value || 0);
  formData.append("fats", document.getElementById("fats").value || 0);

  saveMealButton.disabled = true;
  saveMealButton.textContent = "Uploading Meal...";
  setUploadStatus("Uploading entry...");

  try {
    await apiFetch(`${API_BASE}/meals.php`, {
      method: "POST",
      body: formData
    });

    mealForm.reset();
    resetNumberFields();
    await loadEntries();
    setUploadStatus("Meal uploaded successfully!");

    setTimeout(() => {
      closeMealForm();
    }, 1000);
  } catch (error) {
    setUploadStatus(`Could not save meal: ${error.message}`, true);
  } finally {
    saveMealButton.disabled = false;
    saveMealButton.textContent = "Save Meal";
  }
}

function closeMealForm() {
  //clear the "editing" state
  editingMealId = null;

  mealFormOverlay.hidden = true;
  mealForm.reset();
  resetNumberFields();
  setUploadStatus("");
}

// Delete a meal from the database and refresh the meal list.
async function deleteMeal(entryId) {
  if (!confirm("Delete this meal?")) return;

  try {
    await apiFetch(`${API_BASE}/meals.php?id=${entryId}`, {
      method: "DELETE"
    });

    await loadEntries();
  } catch (error) {
    alert(`Could not delete meal: ${error.message}`);
  }
}

function editMeal(entryId) {
  
  const meal = entries.find((entry) => Number(entry.id) === Number(entryId));

  if (!meal) {
    console.error("Could not find meal:", entryId);
    return;
  }

  editingMealId = Number(entryId);

  //gather existing information
  document.getElementById("mealNotes").value = meal.notes;
  document.getElementById("protein").value = meal.protein;
  document.getElementById("veggies").value = meal.veggies;
  document.getElementById("carbs").value = meal.carbs;
  document.getElementById("fats").value = meal.fats;

  // UI - context update
  // don't require the photo for an update
  mealPhotoField.hidden = true;
  mealPhotoInput.required = false;
  //For more user friendly information
  mealFormTitle.textContent = "Edit Meal";
  saveMealButton.textContent = "Save Changes";

  showMealForm();
}

// Escape user-entered text before inserting it into card HTML.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Convert a UTC meal timestamp into the active user's timezone.
function formatMealDate(utcTimestamp) {
  if (!utcTimestamp) {
    return "Unknown date";
  }

  const timezone = currentUser?.timezone || "UTC";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(utcTimestamp));
}

// Load meals for the active user.
// cacheBust prevents the browser from reusing stale API responses.
async function loadEntries() {
  if (!currentUser) return;

  setStatus("Loading meals...");

  try {
    const url = `${API_BASE}/meals.php?user_id=${currentUser.id}`;

    // Debug logs
    // TODO: Review and remove? - 06/05/26
    // console.log("Loading meals from:", url);

    entries = await apiFetch(url);

    //console.log("Entries returned from API:", entries);
    //console.log("Is entries an array?", Array.isArray(entries));

    renderEntries();
  } catch (error) {
    console.error("loadEntries failed:", error);
    setStatus(`Could not load meals: ${error.message}`, true);
  }
}

// Login and show journal
async function loadJournal(event)
{
  event.preventDefault();

  const username = usernameInput.value.trim();

  if(!username)
  {
    loginStatus.textContent = "Please enter a username.";
    return;
  }

  loginStatus.textContent = "Loading journal...";

  try
  {
    const user = await apiFetch(
      `${API_BASE}/users.php?username=${encodeURIComponent(username)}`
    );

    loginStatus.textContent = "";

    await selectUser(user);
  }
  catch (error)
  {
    loginStatus.textContent = error.message;
  }
}

// Upload a new meal entry, then refresh the meal list.
async function logEntry(event) {
  event.preventDefault();

  if (!currentUser) {
    alert("Please choose a user first.");
    return;
  }

  if (editingMealId === null) {
    await createMeal();
  } else {
    await updateMeal(editingMealId);
  }

  
}

function openMealForm() {
  //Before opening the form - update and set some data
  editingMealId = null;
  //UI related
  mealFormTitle.textContent = "New Meal Entry";
  saveMealButton.textContent = "Save Meal";

  //Have UI require the photo for an new meal
  mealPhotoField.hidden = false;
  mealPhotoInput.required = true;

  //Show the form
  mealForm.reset();
  resetNumberFields();

  showMealForm();
}

// Render the in-memory entries array as meal cards.
function renderEntries() {
  mealEntries.innerHTML = "";

  if (entries.length === 0) {
    mealEntries.innerHTML = `<p class="empty-message">No meals saved yet.</p>`;
    return;
  }

  // Debug logs
  // TODO: Review and remove? - 06/05/26
  // console.log("Entries: " + entries.length);

  entries.forEach((entry) => {

    const card = document.createElement("article");
    card.className = "meal-card";

    card.innerHTML = `
      <img src="${entry.photo_path}" alt="Meal photo">

      <div class="meal-card-content">
        <div class="meal-date">${formatMealDate(entry.created_at)}</div>

        <p class="meal-notes">${escapeHtml(entry.notes)}</p>

        <div class="meal-stats">
          <span><strong>Protein:</strong> ${entry.protein}</span>
          <span><strong>Veggies:</strong> ${entry.veggies}</span>
          <span><strong>Carbs:</strong> ${entry.carbs}</span>
          <span><strong>Fats:</strong> ${entry.fats}</span>
        </div>

        <button class="edit-button" data-id="${entry.id}">Edit</button>
        <button class="delete-button" data-id="${entry.id}">Delete</button>
      </div>
    `;

    mealEntries.appendChild(card);
  });
}

function resetNumberFields() {
  document.getElementById("protein").value = 0;
  document.getElementById("veggies").value = 0;
  document.getElementById("carbs").value = 0;
  document.getElementById("fats").value = 0;
}

function showMealForm() {
  mealFormOverlay.hidden = false;
  setUploadStatus("");
}

// Set the active user and load that user's meal entries.
async function selectUser(user) {
  currentUser = {
    id: user.id,
    name: user.name,
    timezone: user.timezone
  };

  userLoginSection.hidden = true;
  journalSection.hidden = false;
  journalTitle.textContent = `${currentUser.name}'s Food Journal`;
  activeUserLabel.textContent = `Currently viewing: ${currentUser.name}`;

  await loadEntries();
}

function setStatus(message, isError = false) {
  mealEntries.innerHTML = `<p class="${isError ? "error-message" : "status-message"}">${message}</p>`;
}

function setUpListeners() {
  loginForm.addEventListener("submit", loadJournal);

  mealForm.addEventListener("submit", logEntry);

  switchUserButton.addEventListener("click", switchUser);

  mealEntries.addEventListener("click", function (event) {


    const entryId = event.target.dataset.id;

    if (event.target.classList.contains("edit-button")) {
      console.log("Editing meal:", entryId);
      editMeal(entryId);
      console.log("Edited meal:", entryId);
      return;
    }

    if (event.target.classList.contains("delete-button")){
      //console.log("deleting meal:", entryId);
      deleteMeal(entryId);
      //console.log("deleted meal:", entryId);
      return;
    }

  });

  openMealFormButton.addEventListener("click", openMealForm);
  closeMealFormButton.addEventListener("click", closeMealForm);
}

function setUploadStatus(message, isError = false) {
  uploadStatus.textContent = message;
  uploadStatus.className = isError ? "upload-status error-message" : "upload-status status-message";
}

function switchUser() {
  currentUser = null;
  entries = [];

  journalTitle.textContent = "Food Journal.";
  journalSection.hidden = true;
  userLoginSection.hidden = false;
  mealForm.reset();
  resetNumberFields();
}

async function updateMeal(entryId){
  const mealData = {
    id: Number(entryId),
    user_id: currentUser.id,
    notes: document.getElementById("mealNotes").value,
    protein: Number(document.getElementById("protein").value || 0),
    veggies: Number(document.getElementById("veggies").value || 0),
    carbs: Number(document.getElementById("carbs").value || 0),
    fats: Number(document.getElementById("fats").value || 0)
  };

  saveMealButton.disabled = true;
  saveMealButton.textContent = "Saving Changes...";
  setUploadStatus("Updating meal...");

  try {
    await apiFetch(`${API_BASE}/meals.php`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mealData)
    });

    await loadEntries();

    setUploadStatus("Meal updated successfully!");

    setTimeout(() => {
      closeMealForm();
    }, 1000);

  } catch (error) {
    setUploadStatus(`Could not update meal: ${error.message}`, true);

  } finally {
    saveMealButton.disabled = false;
    saveMealButton.textContent = "Save Changes";
  }
}