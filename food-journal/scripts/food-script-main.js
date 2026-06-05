/* Food Journal - database/API version */

const API_BASE = "api";

let mealForm;
let mealEntries;
let userButtons;
let userSelectSection;
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

let currentUser = null;
let entries = [];

function indexInit() {
  mealForm = document.getElementById("mealForm");
  mealEntries = document.getElementById("mealEntries");
  userButtons = document.getElementById("userButtons");
  userSelectSection = document.getElementById("userSelectSection");
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

  setUpListeners();
  loadUsers();
}

function setUploadStatus(message, isError = false) {
  uploadStatus.textContent = message;
  uploadStatus.className = isError ? "upload-status error-message" : "upload-status status-message";
}

function setStatus(message, isError = false) {
  mealEntries.innerHTML = `<p class="${isError ? "error-message" : "status-message"}">${message}</p>`;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data && data.error ? data.error : "Something went wrong.";
    throw new Error(message);
  }

  return data;
}

async function loadUsers() {
  userButtons.innerHTML = `<p class="status-message">Loading users...</p>`;

  try {
    const users = await apiFetch(`${API_BASE}/users.php`);
    renderUserButtons(users);
  } catch (error) {
    userButtons.innerHTML = `<p class="error-message">Could not load users: ${error.message}</p>`;
  }
}

function renderUserButtons(users) {
  userButtons.innerHTML = "";

  users.forEach((user) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "user-button";
    button.textContent = user.name;
    button.dataset.userId = user.id;
    button.dataset.userName = user.name;
    userButtons.appendChild(button);
  });
}

async function selectUser(userId, userName) {
  currentUser = {
    id: Number(userId),
    name: userName
  };

  userSelectSection.hidden = true;
  journalSection.hidden = false;
  journalTitle.textContent = `${currentUser.name}'s Food Journal`;
  activeUserLabel.textContent = `Currently viewing: ${currentUser.name}`;

  await loadEntries();
}

function switchUser() {
  currentUser = null;
  entries = [];

  journalTitle.textContent = "Food Journal.";
  journalSection.hidden = true;
  userSelectSection.hidden = false;
  mealForm.reset();
  resetNumberFields();
}

async function loadEntries() {
  if (!currentUser) return;

  setStatus("Loading meals...");

  try {
    const url = `${API_BASE}/meals.php?user_id=${currentUser.id}&cacheBust=${Date.now()}`;

    console.log("Loading meals from:", url);

    entries = await apiFetch(url);

    console.log("Entries returned from API:", entries);
    console.log("Is entries an array?", Array.isArray(entries));

    renderEntries();
  } catch (error) {
    console.error("loadEntries failed:", error);
    setStatus(`Could not load meals: ${error.message}`, true);
  }
}

function renderEntries() {
  mealEntries.innerHTML = "";

  if (entries.length === 0) {
    mealEntries.innerHTML = `<p class="empty-message">No meals saved yet.</p>`;
    return;
  }

  console.log("Entries: " + entries.length);

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "meal-card";

    card.innerHTML = `
      <img src="${entry.photo_path}" alt="Meal photo">

      <div class="meal-card-content">
        <div class="meal-date">${entry.created_at}</div>

        <p class="meal-notes">${escapeHtml(entry.notes)}</p>

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

async function logEntry(event) {
  event.preventDefault();

  if (!currentUser) {
    alert("Please choose a user first.");
    return;
  }

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

function resetNumberFields() {
  document.getElementById("protein").value = 0;
  document.getElementById("veggies").value = 0;
  document.getElementById("carbs").value = 0;
  document.getElementById("fats").value = 0;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setUpListeners() {
  mealForm.addEventListener("submit", logEntry);

  userButtons.addEventListener("click", function (event) {
    if (!event.target.classList.contains("user-button")) return;

    selectUser(event.target.dataset.userId, event.target.dataset.userName);
  });

  switchUserButton.addEventListener("click", switchUser);

  mealEntries.addEventListener("click", function (event) {
    if (!event.target.classList.contains("delete-button")) return;

    deleteMeal(event.target.dataset.id);
  });

  openMealFormButton.addEventListener("click", openMealForm);
  closeMealFormButton.addEventListener("click", closeMealForm);
}

function openMealForm() {
  mealFormOverlay.hidden = false;
  setUploadStatus("");
}

function closeMealForm() {
  mealFormOverlay.hidden = true;
  mealForm.reset();
  resetNumberFields();
  setUploadStatus("");
}