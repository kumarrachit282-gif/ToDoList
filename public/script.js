
const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");

// Task counter elements
const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

// Filter buttons
const filterButtons = document.querySelectorAll(".filter-btn");
let currentFilter = "all";

// Display tasks
async function loadTasks() {
    try {
        const response = await fetch("/todos");

        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }

        const todos = await response.json();

        taskList.innerHTML = "";

        todos.forEach(todo => {
            displayTask(todo);
        });

        updateCounters();

    } catch (error) {
        console.error("Error loading tasks:", error);
        alert("Could not load tasks!");
    }
}

// Add task
async function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === "") {
        alert("Please Enter a task!");
        return;
    }

    try {
        const response = await fetch("/todos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: taskText
            })
        });

        if (!response.ok) {
            throw new Error("Failed to add task");
        }

        const task = await response.json();

        displayTask(task);

        taskInput.value = "";

    } catch (error) {
        console.error("Error adding task:", error);
        alert("Could not add task!");
    }
}

// Filter tasks
function filterTasks() {
    const tasks = taskList.querySelectorAll("li");

    tasks.forEach(task => {
        const checkbox = task.querySelector('input[type="checkbox"]');

        if (currentFilter === "all") {
            task.style.display = "flex";
        }
        else if (currentFilter === "pending") {
            task.style.display = checkbox.checked ? "none" : "flex";
        }
        else if (currentFilter === "completed") {
            task.style.display = checkbox.checked ? "flex" : "none";
        }
    });
}

// Update task counters
function updateCounters() {
    const tasks = taskList.querySelectorAll("li");

    const total = tasks.length;

    let completed = 0;

    tasks.forEach(task => {
        const checkbox = task.querySelector('input[type="checkbox"]');

        if (checkbox.checked) {
            completed++;
        }
    });

    const pending = total - completed;

    totalTasks.textContent = total;
    pendingTasks.textContent = pending;
    completedTasks.textContent = completed;
}

// Filter button click
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        filterTasks();
    });
});

// Display one task
function displayTask(task) {
    const li = document.createElement("li");

    const container = document.createElement("span");

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.isCompleted || false;

    // Task date and title
    const date = document.createElement("span");

    const taskDate = task.createdAt
        ? new Date(task.createdAt)
        : new Date();

    date.textContent = taskDate.toLocaleDateString("en-IN")
        + " - " + task.title;

    date.classList.toggle("completed", checkbox.checked);

    container.append(checkbox, date);

    // Update completion status
    checkbox.addEventListener("change", async () => {
        const newStatus = checkbox.checked;

        try {
            const response = await fetch(`/todos/${task.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    isCompleted: newStatus
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update task");
            }

            date.classList.toggle("completed", newStatus);

            // Refresh filter and counters
            filterTasks();
            updateCounters();

        } catch (error) {
            console.error(error);
            alert("Could not update task!");
            checkbox.checked = !newStatus;
        }
    });

    // Edit button
    const editButton = document.createElement("button");

    editButton.innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i> Edit';

    editButton.classList.add("edit-btn");

    editButton.addEventListener("click", async () => {
        const newTitle = prompt("Enter the updated task:", task.title);

        if (newTitle === null) {
            return;
        }

        if (newTitle.trim() === "") {
            alert("Task title cannot be empty!");
            return;
        }

        try {
            const response = await fetch(`/todos/${task.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: newTitle.trim()
                })
            });

            if (!response.ok) {
                throw new Error("Failed to edit task");
            }

            // Update displayed title
            task.title = newTitle.trim();

            date.textContent = taskDate.toLocaleDateString("en-IN")
                + " - " + task.title;

        } catch (error) {
            console.error(error);
            alert("Could not edit task!");
        }
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteButton.classList.add("delete-btn");

    deleteButton.addEventListener("click", async () => {
        try {
            const response = await fetch(`/todos/${task.id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to delete task");
            }

            li.remove();

            // Update counters after deletion
            updateCounters();

        } catch (error) {
            console.error(error);
            alert("Could not delete task!");
        }
    });

    li.append(container, editButton, deleteButton);

    taskList.appendChild(li);

    // Apply selected filter and update counters
    filterTasks();
    updateCounters();
}

// Button click
addButton.addEventListener("click", addTask);

// Enter key
taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

// Load existing tasks
loadTasks();
