const socket = io();
const tableBody = document.getElementById("ordersTableBody");

// Variables for tracking sort state.
// activeSortColumn stores the index of the column used for sorting, or null if no sort is active.
// activeSortState is either "asc", "desc", or null.
let activeSortColumn = null;
let activeSortState = null;

// Wait for DOM content to load and attach click listeners on header cells.
document.addEventListener("DOMContentLoaded", () => {
  const headerCells = document.querySelectorAll(".trades-table thead th");
  headerCells.forEach((th, index) => {
    th.addEventListener("click", () => {
      // If a different column is clicked, switch to that column in ascending order.
      if (activeSortColumn !== index) {
        activeSortColumn = index;
        activeSortState = "asc";
        // Clear any sort indicators on all header cells.
        headerCells.forEach(cell => {
          cell.classList.remove("sorted-asc", "sorted-desc");
        });
        th.classList.add("sorted-asc");
        sortTable(activeSortColumn, activeSortState);
      } else {
        // Same column clicked again, cycle sort state.
        if (activeSortState === "asc") {
          // Change to descending.
          activeSortState = "desc";
          headerCells.forEach(cell => {
            cell.classList.remove("sorted-asc", "sorted-desc");
          });
          th.classList.add("sorted-desc");
          sortTable(activeSortColumn, activeSortState);
        } else if (activeSortState === "desc") {
          // Third click: disable sorting.
          activeSortColumn = null;
          activeSortState = null;
          headerCells.forEach(cell => {
            cell.classList.remove("sorted-asc", "sorted-desc");
          });
          // (Optionally, you could restore the original insertion order if saved somewhere.)
        }
      }
    });
  });
});

// Function to sort the table based on the provided column index and state.
function sortTable(columnIndex, sortState) {
  const rowsArray = Array.from(tableBody.querySelectorAll("tr"));
  rowsArray.sort((rowA, rowB) => {
    const cellA = rowA.children[columnIndex].innerText.trim();
    const cellB = rowB.children[columnIndex].innerText.trim();
    let compareVal = 0;
    
    // For the time column (assumed at index 0), use string compare;
    // you can enhance this to parse as dates if needed.
    if (columnIndex === 0) {
      compareVal = cellA.localeCompare(cellB);
    }
    // For numeric columns (e.g. Qty, Price, Average - assumed indices 4, 5, 6)
    else if ([4, 5, 6].includes(columnIndex)) {
      const numA = parseFloat(cellA.replace(/[^\d.-]/g, "")) || 0;
      const numB = parseFloat(cellB.replace(/[^\d.-]/g, "")) || 0;
      compareVal = numA - numB;
    }
    // Otherwise, default to string comparison.
    else {
      compareVal = cellA.localeCompare(cellB);
    }
    
    return sortState === "asc" ? compareVal : -compareVal;
  });
  
  // Replace the table body content with the sorted rows.
  rowsArray.forEach(row => tableBody.appendChild(row));
}

// When new order data arrives from the server.
socket.on("counter", (data) => {
  const row = document.createElement("tr");

  // Convert timestamp to a readable time string.
  const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString();

  row.innerHTML = `
    <td>${timeStr}</td>
    <td>
      <span class="type-pill ${data.payload.side === 'buy' ? 'buy' : 'sell'}">
        ${data.payload.side.toUpperCase()}
      </span>
    </td>
    <td>${data.payload.symbol}</td>
    <td>${data.product || "NRML"}</td>
    <td>${data.payload.quantity}</td>
    <td>₹${data.payload.price.toFixed(2)}</td>
    <td>–</td>
    <td class="${data.status}">${data.status.toUpperCase()}</td>
  `;

  // Insert the new row: if a sort is active, add the row then re-sort; otherwise, simply prepend.
  if (activeSortColumn === null) {
    tableBody.prepend(row);
  } else {
    tableBody.prepend(row);
    sortTable(activeSortColumn, activeSortState);
  }

  // Optional: limit the table to 50 rows.
  while (tableBody.rows.length > 50) {
    tableBody.removeChild(tableBody.lastChild);
  }
});
