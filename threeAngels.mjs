import { rowsData } from './dataRetrieval.mjs';
		
if (!rowsData) {
	console.log('The rowsData is not available');
}
		
const tableBody = document.querySelector("#comparisonTable tbody");
const tableContainer = document.getElementById("tableContainer");
let frozenRowIndex = null; // Keeps track of the currently frozen row
let frozenRowElement = null; // The frozen row DOM element
let selectedRows = [];

// Populate table
rowsData.forEach((data, index) => {
	const tr = document.createElement("tr");
	
	data.row.forEach(cell => {
		const td = document.createElement("td");
		td.textContent = cell.value;
				
		// Attach event listener to show popup
		td.onclick = () => showDetails(cell.description);
	
		tr.appendChild(td);
	});

	// Add action button
	const actionTd = document.createElement("td");
	const button = document.createElement("button");
	button.textContent = "Compare";
	button.className = "compare-button";
	button.onclick = () => selectRow(data.row, index);
			
	// View Details Button
	//const viewDetailsButton = document.createElement("button");
	//viewDetailsButton.textContent = "View Details";
	//viewDetailsButton.className = "action-button";
	//viewDetailsButton.onclick = () => showDetails(data.description);
			
	//Freeze Row Button
	const freezeButton = document.createElement("button");
	freezeButton.textContent = `Freeze Row ${index + 1}`;
	freezeButton.className = "freeze-button";
	freezeButton.onclick = () => toggleFreezeRow(index);
			
	actionTd.appendChild(button);
	actionTd.appendChild(freezeButton);
	//actionTd.appendChild(viewDetailsButton);
	tr.appendChild(actionTd);

	tableBody.appendChild(tr);
});

// Handle row selection
function selectRow(row, index) {
	if (!selectedRows.some(r => r.index === index)) {
		selectedRows.push({ row, index });
    }
	if (selectedRows.length === 2) {
		showPopupComparison();
    }
}

// Show comparison popup
function showPopupComparison() {
	const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    const content = document.getElementById("popupContent");

    const row1Details = selectedRows[0].row.map(cell => `<li>${cell.value}</li>`).join("")
	const row2Details = selectedRows[1].row.map(cell => `<li>${cell.value}</li>`).join("")
			
	content.innerHTML = `
		<h3>Row Comparison</h3>
		<p><strong>Row 1:</strong></p>
		<ul>${row1Details}</ul>
		<p><strong>Row 2:</strong></p>
		<ul>${row2Details}</ul>
	`;

    popup.style.display = "block";
    overlay.style.display = "block";
}
		
// Show details popup
function showDetails(details) {
    const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    const content = document.getElementById("popupContent");

    content.innerHTML = `<p>${details}</p>`;

    popup.style.display = "block";
    overlay.style.display = "block";
}

// Close popup
export function closePopup() {
	document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    selectedRows = [];
}
		
		
//Freeze Row functionality
/*
function toggleFreezeRow(rowIndex) {
	console.log(`rowIndex: ${rowIndex}`)
	const rows = document.querySelectorAll("#comparisonTable tbody tr");

	// Unfreeze currently frozen row, if any
	if (frozenRowIndex !== null) {
		const prevRow = rows[frozenRowIndex];
		prevRow.classList.remove("frozen-row", "frozen-top", "frozen-bottom");
	}

	// Freeze the selected row
	if (frozenRowIndex !== rowIndex) {
		const row = rows[rowIndex];
		console.log(`row: ${row}`)
		const scrollTop = tableContainer.scrollTop;
		const maxScroll = tableContainer.scrollHeight - tableContainer.offsetHeight;

		// Decide whether to freeze at the top or bottom
		if (scrollTop < maxScroll / 2) {
			row.classList.add("frozen-row", "frozen-top");
		} else {
			row.classList.add("frozen-row", "frozen-bottom");
		}

		frozenRowIndex = rowIndex;
	} else {
		// If already frozen, unfreeze
		frozenRowIndex = null;
	}

	// Dynamically adjust the sticky row's top value
	updateStickyPositions();
}
*/
		
// Function to toggle freezing of a row
function toggleFreezeRow(rowIndex) {
	const rows = document.querySelectorAll("#comparisonTable tbody tr");

	// Unfreeze currently frozen row, if any
	if (frozenRowElement) {
		frozenRowElement.remove();
		frozenRowElement = null;
		frozenRowIndex = null;
	}

	// Freeze the selected row
	if (frozenRowIndex !== rowIndex) {
		const row = rows[rowIndex].cloneNode(true); // Clone the selected row
		row.classList.add("frozen-row");
		
		// Align the frozen row's columns with the table
		alignFrozenRowColumns(row);

		// Set initial position of the frozen row
		const containerRect = tableContainer.getBoundingClientRect();
		row.style.top = `${containerRect.top}px`;
		row.style.left = `${containerRect.left}px`;
		//row.style.right = `${containerRect.right}px`;
		console.log(`row.style.left: ${row.style.left}`)
		//console.log(`row.style.right: ${row.style.right}`)

		document.body.appendChild(row);
		frozenRowElement = row;
		frozenRowIndex = rowIndex;

		// Make the frozen row draggable
		makeRowDraggable(row, containerRect);
	}
}
	
// Update the "top" or "bottom" property for the sticky row dynamically
function updateStickyPositions() {
	const headerHeight = document.querySelector("#comparisonTable thead").offsetHeight;
	const frozenRow = document.querySelector(".frozen-row");
	if (frozenRow) {
		console.log(`frozenrow: ${frozenRow}`)
		if (frozenRow.classList.contains("frozen-top")) {
			frozenRow.style.top = `${headerHeight}px`;
			frozenRow.style.bottom = "unset";
		} else if (frozenRow.classList.contains("frozen-bottom")) {
			frozenRow.style.bottom = "0";
			frozenRow.style.top = "unset";
		}
	}
}

// Function to align the frozen row's columns with the table columns
function alignFrozenRowColumns(row) {
	const tableColumns = document.querySelectorAll("#comparisonTable thead th");
	const frozenColumns = row.querySelectorAll("td");

	tableColumns.forEach((col, index) => {
		const colWidth = col.getBoundingClientRect().width;
		frozenColumns[index].style.width = `${colWidth}px`;
	});
}

// Function to make a row draggable
function makeRowDraggable(row, containerRect) {
	let offsetX = 0;
	let offsetY = 0;

	row.addEventListener("mousedown", (e) => {
		offsetX = e.clientX - row.offsetLeft;
		offsetY = e.clientY - row.offsetTop;
		row.style.cursor = "grabbing";

		const moveRow = (event) => {
			const newLeft = event.clientX - offsetX;
			const newTop = event.clientY - offsetY;
			
			// Constrain within table container
			const constrainedLeft = Math.max(
				containerRect.left,
				Math.min(newLeft, containerRect.right - row.offsetWidth)
			);
			
			const constrainedTop = Math.max(
				containerRect.top,
				Math.min(newTop, containerRect.bottom - row.offsetHeight)
			);
			//const constrainedRight = containerRect.right;
			
			row.style.left = `${constrainedLeft}px`;
			row.style.top = `${constrainedTop}px`;
			//row.style.right = `${constrainedRight}px`;
		};

		const stopDragging = () => {
			row.style.cursor = "grab";
			document.removeEventListener("mousemove", moveRow);
			document.removeEventListener("mouseup", stopDragging);
		};

		document.addEventListener("mousemove", moveRow);
		document.addEventListener("mouseup", stopDragging);
	});
}

// Ensure sticky row adjusts its position on window resize
//window.addEventListener("resize", updateStickyPositions);
//tableContainer.addEventListener("scroll", updateStickyPositions);
