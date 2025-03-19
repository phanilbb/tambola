function generateTickets() {
    let ticketContainer = document.getElementById("ticketContainer");
    let markedCells = document.querySelectorAll(".marked");

    // Check if the game is already in progress (any number marked)
    if (markedCells.length > 0) {
        let confirmReset = confirm("A game is in progress! Generating new tickets will reset all selections. Do you want to continue?");
        if (!confirmReset) {
            return; // Stop ticket generation if user cancels
        }
    }

    // Clear previous tickets and generate new ones
    ticketContainer.innerHTML = "";
    const count = Math.min(5, parseInt(document.getElementById("ticketCount").value)); // Strict limit to 5 tickets

    let usedNumbers = new Set(); // ✅ Maintain a global set to prevent repetition across tickets

    for (let i = 0; i < count; i++) {
        const ticket = document.createElement("div");
        ticket.className = "ticket";
        ticket.dataset.markedCount = "0"; // Track marked numbers for early 5
        ticket.dataset.id = i; // Assign ticket ID

        const table = document.createElement("table");
        table.className = "ticket-table";

        const ticketNumbers = generateTambolaTicket(usedNumbers); // ✅ Ensure unique numbers across all tickets
        for (let rowIndex = 0; rowIndex < ticketNumbers.length; rowIndex++) {
            const row = ticketNumbers[rowIndex];
            const tr = document.createElement("tr");
            tr.dataset.rowIndex = rowIndex; // Store row index for validation

            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const num = row[colIndex];
                const td = document.createElement("td");
                td.innerText = num !== 0 ? num : "";
                td.dataset.rowIndex = rowIndex;
                td.dataset.ticketId = i;
                if (num !== 0) {
                    td.onclick = function () { toggleMark(this); };
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        ticket.appendChild(table);
        ticketContainer.appendChild(ticket);
    }
}

function generateTambolaTicket(usedNumbers) {
    let ticket = Array.from({ length: 3 }, () => Array(9).fill(0));
    let numbersPerColumn = Array(9).fill(0);
    let availableNumbers = {};

    for (let col = 0; col < 9; col++) {
        let start = col * 10 + (col === 0 ? 1 : 0);     // 1, 10, 20, 30, 40, 50, 60, 70, 80
        let end = (col + 1) * 10 - (col === 8 ? 0 : 1); // 9, 19, 29, 39, 49, 59, 69, 79, 90

        availableNumbers[col] = [];

        for (let num = start; num <= end; num++) {
            if (!usedNumbers.has(num)) { // ✅ Ensure global uniqueness
                availableNumbers[col].push(num);
            }
        }
    }

    let rowFilled = [0, 0, 0];
    let totalNumbers = 0;

    for (let col = 0; col < 9; col++) {
        if (availableNumbers[col].length === 0) continue;
        let row = getRowWithSpace(rowFilled);
        let numIndex = Math.floor(Math.random() * availableNumbers[col].length);
        let num = availableNumbers[col].splice(numIndex, 1)[0];
        ticket[row][col] = num;
        usedNumbers.add(num); // ✅ Ensure global uniqueness
        rowFilled[row]++;
        numbersPerColumn[col]++;
        totalNumbers++;
    }

    while (totalNumbers < 15) {
        let col = Math.floor(Math.random() * 9);
        if (numbersPerColumn[col] < 2 && availableNumbers[col].length > 0) {
            let row = getRowWithSpace(rowFilled);
            if (ticket[row][col] === 0) {
                let numIndex = Math.floor(Math.random() * availableNumbers[col].length);
                let num = availableNumbers[col].splice(numIndex, 1)[0];
                ticket[row][col] = num;
                usedNumbers.add(num); // ✅ Ensure global uniqueness
                rowFilled[row]++;
                numbersPerColumn[col]++;
                totalNumbers++;
            }
        }
    }

    return ticket;
}


function getRowWithSpace(rowFilled) {
    let availableRows = [];
    for (let i = 0; i < 3; i++) {
        if (rowFilled[i] < 5) {
            availableRows.push(i);
        }
    }
    return availableRows[Math.floor(Math.random() * availableRows.length)];
}

function toggleMark(element) {
    if (element.classList.contains("marked")) {
        if (confirm("Do you want to unmark this number?")) {
            element.classList.remove("marked");
            updateWinConditions(element.dataset.ticketId);
        }
    } else {
        element.classList.add("marked");
        updateWinConditions(element.dataset.ticketId);
    }
}

function updateWinConditions(ticketId) {
    let ticket = document.querySelector(`.ticket[data-id="${ticketId}"]`);
    let markedCells = ticket.querySelectorAll(".marked");
    let markedNumbers = markedCells.length;
    let rows = [[], [], []];

    // Store marked numbers by row
    ticket.querySelectorAll("td.marked").forEach(cell => {
        let rowIndex = parseInt(cell.dataset.rowIndex);
        rows[rowIndex].push(cell);
    });

    // EARLY 5 - Blink first 5 marked numbers only once
    if (markedNumbers === 5 && !ticket.dataset.early5) {
        ticket.dataset.early5 = "true"; // Prevent re-triggering
        let firstFive = Array.from(markedCells).slice(0, 5);
        firstFive.forEach(cell => {
            cell.classList.add("blinking-green");
            setTimeout(() => cell.classList.remove("blinking-green"), 1500);
        });
    } else if (markedNumbers < 5) {
        delete ticket.dataset.early5; // Reset early 5 flag if count drops below 5
    }

    // ROW COMPLETION - Blink row when fully marked (allow re-triggering)
    rows.forEach((row, index) => {
        if (row.length === 5) {
            if (!ticket.dataset[`row${index}`]) {
                ticket.dataset[`row${index}`] = "true"; // Set row complete flag
                row.forEach(cell => {
                    cell.classList.add("blinking-green");
                    setTimeout(() => cell.classList.remove("blinking-green"), 1500);
                });
            }
        } else {
            delete ticket.dataset[`row${index}`]; // Reset flag if row becomes incomplete
        }
    });

    // FULL TICKET - Show large tick mark
    if (markedNumbers === 15 && !ticket.dataset.fullTicket) {
        ticket.dataset.fullTicket = "true"; // Prevent re-triggering
        let checkmark = document.createElement("div");
        checkmark.className = "full-ticket-checkmark";
        checkmark.innerHTML = "✔";
        ticket.appendChild(checkmark);
        setTimeout(() => checkmark.remove(), 2000);
    } else if (markedNumbers < 15) {
        delete ticket.dataset.fullTicket; // Reset full ticket flag if count drops below 15
    }
}

function clearSelection() {
    let markedCells = document.querySelectorAll(".marked");

    // Check if any numbers are marked before clearing
    if (markedCells.length > 0) {
        let confirmClear = confirm("Are you sure you want to clear all selections?");
        if (!confirmClear) {
            return; // Stop clearing if user cancels
        }
    }

    // Remove all markings and blinking effects
    document.querySelectorAll(".marked").forEach(el => el.classList.remove("marked", "blinking-green"));
}

function confirmNewGame() {
    if (confirm("Are you sure you want to start a new game?")) {
        generateTickets();
    }
}

// Prevent accidental refresh (F5, Ctrl+R)
document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey && event.key === "r") || event.key === "F5") {
        event.preventDefault();
        alert("Refresh is disabled to prevent accidental loss of progress!");
    }
});

// Warn when closing/reloading the page
window.addEventListener("beforeunload", function (event) {
    event.preventDefault();
    event.returnValue = "Are you sure you want to leave? Your progress will be lost.";
});
