// Initialize variables
let foodEntries = [];
let editingIndex = -1;
const foodDescription = document.getElementById('food-description');
const mealType = document.getElementById('meal-type');
const foodTime = document.getElementById('food-time');
const foodPhoto = document.getElementById('food-photo');
const photoPreview = document.getElementById('photo-preview');
const addEntryBtn = document.getElementById('add-entry');
const entriesContainer = document.getElementById('entries-container');
const emptyMessage = document.getElementById('empty-message');
const exportBtn = document.getElementById('export-data');
const clearBtn = document.getElementById('clear-data');
const imageModal = document.getElementById('image-modal');
const enlargedImage = document.getElementById('enlarged-image');
const modalClose = document.getElementById('modal-close');
const entryForm = document.getElementById('entry-form');
const editModeButtons = document.getElementById('edit-mode-buttons');
const cancelEditBtn = document.getElementById('cancel-edit');
const deleteEntryBtn = document.getElementById('delete-entry');

// Set default datetime to now
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
foodTime.value = now.toISOString().slice(0, 16);

// Initialize IndexedDB
let db;
const request = indexedDB.open('foodDiaryDB', 1);

request.onerror = (event) => {
  console.error('Database error:', event.target.error);
};

request.onsuccess = (event) => {
  db = event.target.result;
  loadEntries();
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains('entries')) {
    db.createObjectStore('entries', { autoIncrement: true });
  }
};

// Load entries from IndexedDB
function loadEntries() {
  const transaction = db.transaction(['entries'], 'readonly');
  const objectStore = transaction.objectStore('entries');
  const request = objectStore.getAll();

  request.onsuccess = (event) => {
    foodEntries = event.target.result;
    renderEntries();
  };
}

// Save entries to IndexedDB
function saveEntries() {
  const transaction = db.transaction(['entries'], 'readwrite');
  const objectStore = transaction.objectStore('entries');
  objectStore.clear();

  foodEntries.forEach((entry) => {
    objectStore.add(entry);
  });

  transaction.oncomplete = () => {
    if (transaction.error) {
      console.error('Transaction error:', transaction.error);
    } else {
      console.log('Transaction completed successfully');
    }
  };
}

// Render entries in the UI
function renderEntries() {
  entriesContainer.innerHTML = '';

  if (!foodEntries || foodEntries.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  // Sort entries by time
  foodEntries.sort((a, b) => new Date(a.time) - new Date(b.time));

  foodEntries.forEach((entry, index) => {
    const entryElement = document.createElement('div');
    entryElement.className = `entry ${entry.mealType || 'breakfast'}`;
    entryElement.dataset.index = index;

    const timeElement = document.createElement('div');
    timeElement.className = 'entry-time';
    const entryDate = new Date(entry.time);

    const timeText = document.createElement('span');
    timeText.textContent = entryDate.toLocaleString();

    const mealTypeSpan = document.createElement('span');
    mealTypeSpan.className = 'meal-type';
    const mealTypeName = entry.mealType ? entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1) : 'Meal';
    mealTypeSpan.textContent = mealTypeName;

    timeElement.appendChild(timeText);
    timeElement.appendChild(mealTypeSpan);

    const contentElement = document.createElement('div');
    contentElement.className = 'entry-content';
    contentElement.textContent = entry.description;

    entryElement.appendChild(timeElement);
    entryElement.appendChild(contentElement);

    if (entry.photo) {
      const photoContainer = document.createElement('div');
      photoContainer.className = 'photo-container';

      const photoElement = document.createElement('img');
      photoElement.className = 'entry-photo';
      photoElement.src = entry.photo;
      photoElement.alt = 'Food photo';
      photoElement.addEventListener('click', function() {
        enlargedImage.src = entry.photo;
        imageModal.style.display = 'flex';
      });

      photoContainer.appendChild(photoElement);
      entryElement.appendChild(photoContainer);
    }

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';

    const editButton = document.createElement('button');
    editButton.className = 'edit-btn';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      startEditing(index);
    });

    btnGroup.appendChild(editButton);
    entryElement.appendChild(btnGroup);
    entriesContainer.appendChild(entryElement);
  });
}

// Start editing an entry
function startEditing(index) {
  editingIndex = index;
  const entry = foodEntries[index];

  // Fill the form with the entry data
  foodDescription.value = entry.description || '';
  mealType.value = entry.mealType || 'breakfast';
  foodTime.value = entry.time || now.toISOString().slice(0, 16);

  // Update photo preview if there's a photo
  if (entry.photo) {
    photoPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = entry.photo;
    photoPreview.appendChild(img);
  } else {
    photoPreview.innerHTML = '<span>No photo selected</span>';
  }

  // Change button text
  addEntryBtn.textContent = 'Update Entry';

  // Show edit mode buttons
  editModeButtons.style.display = 'flex';

  // Scroll to form
  entryForm.scrollIntoView({ behavior: 'smooth' });

  // Highlight the entry being edited
  document.querySelectorAll('.entry').forEach(entry => {
    entry.classList.remove('editing');
  });

  const entryElement = document.querySelector(`.entry[data-index="${index}"]`);
  if (entryElement) {
    entryElement.classList.add('editing');
  }
}

// Cancel editing
function cancelEditing() {
  editingIndex = -1;

  // Reset form
  foodDescription.value = '';
  mealType.value = 'breakfast';
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  foodTime.value = now.toISOString().slice(0, 16);
  foodPhoto.value = '';
  photoPreview.innerHTML = '<span>No photo selected</span>';

  // Reset button text
  addEntryBtn.textContent = 'Add to Diary';

  // Hide edit mode buttons
  editModeButtons.style.display = 'none';

  // Remove highlight
  document.querySelectorAll('.entry').forEach(entry => {
    entry.classList.remove('editing');
  });
}

// Delete an entry
function deleteEntry(index) {
  if (confirm('Are you sure you want to delete this entry?')) {
    foodEntries.splice(index, 1);
    saveEntries(); 
    renderEntries();
    cancelEditing();
  }
}

// Handle photo selection
foodPhoto.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      photoPreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = event.target.result;
      photoPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  } else {
    photoPreview.innerHTML = '<span>No photo selected</span>';
  }
});

// Add or update an entry
addEntryBtn.addEventListener('click', function() {
  if (!foodDescription.value.trim() || !foodTime.value) {
    alert('Please enter what you ate and when you ate it.');
    return;
  }

  const entryData = {
    description: foodDescription.value.trim(),
    mealType: mealType.value,
    time: foodTime.value,
    photo: null
  };

  // Check if we're editing or creating a new entry
  if (editingIndex >= 0) {
    // If photo wasn't changed, keep the old one
    if (foodPhoto.files.length === 0) {
      entryData.photo = foodEntries[editingIndex].photo;
      updateEntry(entryData);
    } else {
      // If photo was changed, read the new one
      const reader = new FileReader();
      reader.onload = function(event) {
        entryData.photo = event.target.result;
        updateEntry(entryData);
      };
      reader.readAsDataURL(foodPhoto.files[0]);
    }
  } else {
    // Creating a new entry
    if (foodPhoto.files.length === 0) {
      // No photo selected
      addEntryToList(entryData);
    } else {
      // Photo selected, read it
      const reader = new FileReader();
      reader.onload = function(event) {
        entryData.photo = event.target.result;
        addEntryToList(entryData);
      };
      reader.readAsDataURL(foodPhoto.files[0]);
    }
  }
});

function updateEntry(entryData) {
  foodEntries[editingIndex] = entryData;
  saveEntries();
  renderEntries();
  cancelEditing();
}

function addEntryToList(entry) {
  // Make sure foodEntries is an array
  if (!Array.isArray(foodEntries)) {
    foodEntries = [];
  }

  foodEntries.push(entry);
  saveEntries(); 
  renderEntries();

  // Reset form
  foodDescription.value = '';
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  foodTime.value = now.toISOString().slice(0, 16);
  foodPhoto.value = '';
  photoPreview.innerHTML = '<span>No photo selected</span>';
}

// Export data
exportBtn.addEventListener('click', function() {
  if (!foodEntries || foodEntries.length === 0) {
    alert('No entries to export.');
    return;
  }

  // Create data object for JSON export
  const exportData = {
    exportDate: new Date().toISOString(),
    entries: foodEntries
  };

  // Create and download the file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `food-diary-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Clear all data
clearBtn.addEventListener('click', function() {
  if (confirm('Are you sure you want to delete all entries? This cannot be undone.')) {
    foodEntries = [];
    saveEntries(); 
    renderEntries();
    cancelEditing();
  }
});

// Close modal when clicking the X
modalClose.addEventListener('click', function() {
  imageModal.style.display = 'none';
});

// Close modal when clicking outside the image
imageModal.addEventListener('click', function(event) {
  if (event.target === imageModal) {
    imageModal.style.display = 'none';
  }
});

// Hook up cancel and delete buttons
cancelEditBtn.addEventListener('click', cancelEditing);
deleteEntryBtn.addEventListener('click', function() {
  if (editingIndex >= 0) {
    deleteEntry(editingIndex);
  }
});

// Load immediately in case DOMContentLoaded already fired, also because DB needs to be set up
document.addEventListener('DOMContentLoaded', loadEntries);
