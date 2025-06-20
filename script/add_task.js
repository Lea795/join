const BASE_URL = "https://joinstorage-ef266-default-rtdb.europe-west1.firebasedatabase.app/";

let Contacts = [];

loadContacts();

document.querySelector('.clear-btn').onclick = resetForm;

const form = document.getElementById("taskForm");
const submitBtn = document.querySelector(".create-btn");

submitBtn.onclick = function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    submitTask();
};

async function submitTask() {
    const task = collectTaskData();
    const tasks = await fetchAllTasks();
    const newId = getNextTaskId(tasks);
    task.id = newId.toString();

    saveTaskToFirebase(task, newId);
}

function collectTaskData() {
    const title = document.getElementById("title").value.trim(); // ← wird zu task
    const description = document.getElementById("description").value.trim();
    const dueDateRaw = document.getElementById("due-date").value;
    const categoryValue = document.getElementById("category").value;
    const priorityRaw = document.querySelector("input[name='priority']:checked")?.value;

    const [year, month, day] = dueDateRaw.split("-");
    const dueDate = `${day}-${month}-${year}`;

    const categoryMap = {
        "technical-task": "Technical Task",
        "user-story": "user-story"
    };
    const category = categoryMap[categoryValue] || categoryValue;

    const priority = priorityRaw ? priorityRaw.charAt(0).toUpperCase() + priorityRaw.slice(1).toLowerCase() : null;

    const checkboxElements = document.querySelectorAll('#assignee-dropdown input[type="checkbox"]:checked');
    const assignees = Array.from(checkboxElements).map(cb => cb.value);

    const subtaskItems = document.querySelectorAll('#subtask-list li');
    const subTasks = Array.from(subtaskItems).map(item => ({
      task: item.textContent.trim()
    }));

    return {
        task: title,
        description,
        dueDate,
        category,
        priority,
        assignedTo: assignees,
        subTasks,
        status: "toDo"
    };
}

async function fetchAllTasks() {
    try {
        const res = await fetch(`${BASE_URL}tasks.json`);
        return await res.json() || {};
    } catch (err) {
        console.error("Fehler beim Laden der Aufgaben:", err);
        alert("Fehler beim Laden der Aufgaben.");
        return {};
    }
}

function getNextTaskId(tasks) {
    let maxId = 0;
    for (const key in tasks) {
        const task = tasks[key];
        const idNum = parseInt(task.id);
        if (!isNaN(idNum) && idNum > maxId) {
            maxId = idNum;
        }
    }
    return maxId + 1;
}

async function saveTaskToFirebase(task, id) {
    try {
        if (!Array.isArray(task.assignedTo)) {
            task.assignedTo = Object.values(task.assignedTo || {});
        }

        const res = await fetch(`${BASE_URL}tasks/${id}.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task)
        });

        if (res.ok) {
            alert("Task erfolgreich erstellt!");
            resetForm();
        } else {
            alert("Fehler beim Speichern der Aufgabe.");
        }
    } catch (error) {
        console.error("Fehler beim Speichern der Aufgabe:", error);
        alert("Ein Fehler ist aufgetreten.");
    }
}

function resetForm() {
    document.getElementById("taskForm").reset();
    document.getElementById("subtask-list").innerHTML = "";
    const checkboxes = document.querySelectorAll('#assignee-dropdown input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateAssigneePlaceholder();
}

async function loadContacts() {
    try {
        const res = await fetch(`${BASE_URL}contacts.json`);
        const data = await res.json();

        if (!Array.isArray(data)) {
            console.warn("Contacts ist kein Array.");
            return;
        }

        Contacts = data;
        renderAssigneeDropdown();
    } catch (error) {
        console.error("Fehler beim Laden der Kontakte:", error);
    }
}

function getInitials(name) {
    return name.trim().split(" ").map(word => word[0].toUpperCase()).join("");
}

function getColor(letter) {
    const colorsArray = [
        "#FF6B6B", "#FF8C42", "#FFA500", "#FFD700", "#FFE600",
        "#B4FF00", "#4CAF50", "#00C853", "#00E5FF", "#00B8D4",
        "#1DE9B6", "#00CFAE", "#00BCD4", "#40C4FF", "#2196F3",
        "#3D5AFE", "#536DFE", "#7C4DFF", "#AB47BC", "#E040FB",
        "#FF4081", "#F50057", "#EC407A", "#FF1744", "#FF5252",
        "#D500F9", "#9C27B0"
    ];
    const index = (letter.toUpperCase().charCodeAt(0) - 65) % colorsArray.length;
    return colorsArray[index];
}

function addSubtask() {
    const input = document.getElementById("subtask");
    const value = input.value.trim();
    if (!value) return;

    const li = createSubtaskElement(value);
    document.getElementById("subtask-list").appendChild(li);
    input.value = "";
}

function createSubtaskElement(value) {
    const li = document.createElement("li");
    li.classList.add("subtask-item");

    li.innerHTML = `
        <span class="subtask-circle"></span>
        <span class="subtask-text">• ${value}</span>
        <input class="subtask-edit-input d-none" type="text" value="${value}">
        <div class="subtask-actions">
            <img src="./assets/icons/edit.svg" class="edit-subtask" title="Edit">
            <img src="./assets/icons/delete_icon.svg" class="delete-subtask" title="Delete">
        </div>
    `;

    addSubtaskEditHandler(li);
    addSubtaskDeleteHandler(li);
    return li;
}

function addSubtaskEditHandler(li) {
    const editButton = li.querySelector('.edit-subtask');
    editButton.addEventListener('click', () => enterEditMode(li));
}

function addSubtaskDeleteHandler(li) {
    const deleteButton = li.querySelector('.delete-subtask');
    deleteButton.addEventListener('click', () => li.remove());
}

function enterEditMode(li) {
    const textSpan = li.querySelector('.subtask-text');
    const inputField = li.querySelector('.subtask-edit-input');

    inputField.value = textSpan.textContent.replace(/^•\s*/, '');
    textSpan.style.display = 'none';
    inputField.classList.remove('d-none');
    inputField.focus();

    const save = () => {
        const newValue = inputField.value.trim();
        if (newValue) {
            textSpan.textContent = `• ${newValue}`;
            inputField.classList.add('d-none');
            textSpan.style.display = 'inline';
        }
        removeEditListeners();
    };

    const onEnter = (e) => e.key === 'Enter' && save();
    const onBlur = () => save();

    function removeEditListeners() {
        inputField.removeEventListener('keydown', onEnter);
        inputField.removeEventListener('blur', onBlur);
    }

    inputField.addEventListener('keydown', onEnter);
    inputField.addEventListener('blur', onBlur);
}

function renderAssigneeDropdown() {
    const container = document.getElementById('assignee-dropdown');
    container.innerHTML = '';

    Contacts.forEach((contact, index) => {
        const initials = getInitials(contact.name);
        const color = getColor(initials[0]);
        const checkboxId = `assignee_${index}`;

        const html = `
            <label class="checkbox-label" for="${checkboxId}">
                <div class="assignee-info">
                    <div class="user-initials" style="background-color: ${color};">${initials}</div>
                    <span>${contact.name}</span>
                </div>
                <input type="checkbox" id="${checkboxId}" value="${contact.name}" onchange="updateAssigneePlaceholder()">
            </label>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function updateAssigneePlaceholder() {
    const checkboxes = document.querySelectorAll('#assignee-dropdown input[type="checkbox"]');
    const selectedAvatars = document.getElementById("selected-assignee-avatars");
    const placeholder = document.getElementById("selected-assignees-placeholder");

    let avatarHTML = "";

    checkboxes.forEach(cb => {
        if (cb.checked) {
            const initials = getInitials(cb.value);
            const color = getColor(initials[0]);

            avatarHTML += `
                <div class="avatar" style="background-color: ${color};">
                    ${initials}
                </div>
            `;
        }
    });

    placeholder.textContent = 'Select contacts';
    selectedAvatars.innerHTML = avatarHTML;
}

document.addEventListener('click', function(event) {
    const dropdowns = [
        { dropdown: document.getElementById('assignee-dropdown'), header: document.querySelector('.multiselect-header') },
        { dropdown: document.getElementById('category-dropdown'), header: document.querySelector('.category-select-header') }
    ];

    dropdowns.forEach(({ dropdown, header }) => {
        if (!dropdown || !header) return;
        if (!dropdown.contains(event.target) && !header.contains(event.target)) {
            dropdown.classList.add('d-none');
        }
    });
});

function toggleAssigneeDropdown() {
    document.getElementById("category-dropdown").classList.add("d-none");
    const assigneeDropdown = document.getElementById("assignee-dropdown");
    assigneeDropdown.classList.toggle("d-none");
}

function toggleCategoryDropdown() {
    document.getElementById("assignee-dropdown").classList.add("d-none");
    const categoryDropdown = document.getElementById("category-dropdown");
    categoryDropdown.classList.toggle("d-none");
}

function selectCategory(value) {
    const label = {
        'technical-task': 'Technical Task',
        'user-story': 'User Story'
    };

    document.getElementById('category').value = value;
    document.getElementById('selected-category-placeholder').textContent = label[value] || 'Select category';
    document.getElementById('category-dropdown').classList.add('d-none');
}