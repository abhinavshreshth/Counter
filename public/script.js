const socket = io();
const tableBody = document.getElementById("ordersTableBody");

// Tracking sort state:
// activeSortColumn: holds the index of the column currently sorted (or null if no active sort)
// activeSortState: "asc" or "desc" when a sort is active, or null when disabled
let activeSortColumn = null;
let activeSortState = null;

document.addEventListener("DOMContentLoaded", () => {
  // Attach click listeners on each <th> in the table header.
  const headerCells = document.querySelectorAll(".trades-table thead th");
  
  headerCells.forEach((th, index) => {
    th.addEventListener("click", () => {
      // If a different column is clicked, switch sorting to that column in ascending order.
      if (activeSortColumn !== index) {
        activeSortColumn = index;
        activeSortState = "asc";
        headerCells.forEach(cell => cell.classList.remove("sorted-asc", "sorted-desc"));
        th.classList.add("sorted-asc");
        sortTable(activeSortColumn, activeSortState);
      } else {
        // Same column clicked – cycle the sort state.
        if (activeSortState === "asc") {
          activeSortState = "desc";
          headerCells.forEach(cell => cell.classList.remove("sorted-asc", "sorted-desc"));
          th.classList.add("sorted-desc");
          sortTable(activeSortColumn, activeSortState);
        } else if (activeSortState === "desc") {
          // Third click: disable sorting and revert to default (time-based) sort.
          activeSortColumn = null;
          activeSortState = null;
          headerCells.forEach(cell => cell.classList.remove("sorted-asc", "sorted-desc"));
          sortByTime();
        }
      }
    });
  });
});

// Sort the table based on a given column and sortState ("asc" or "desc")
function sortTable(columnIndex, sortState) {
  const rowsArray = Array.from(tableBody.querySelectorAll("tr"));
  
  rowsArray.sort((rowA, rowB) => {
    const cellA = rowA.children[columnIndex].innerText.trim();
    const cellB = rowB.children[columnIndex].innerText.trim();
    let compareVal = 0;
    
    // Special handling for the Time column (assumed index 0):
    if (columnIndex === 0) {
      // Use the data-timestamp attribute for accurate numeric sorting.
      const tA = parseInt(rowA.getAttribute("data-timestamp"), 10) || 0;
      const tB = parseInt(rowB.getAttribute("data-timestamp"), 10) || 0;
      compareVal = tA - tB;
    }
    // For numeric columns (e.g. Qty (index 4), Price (index 5), or Avg (index 6))
    else if ([4, 5, 6].includes(columnIndex)) {
      const numA = parseFloat(cellA.replace(/[^\d.-]/g, "")) || 0;
      const numB = parseFloat(cellB.replace(/[^\d.-]/g, "")) || 0;
      compareVal = numA - numB;
    }
    else {
      // Default: perform a string comparison.
      compareVal = cellA.localeCompare(cellB);
    }
    
    return sortState === "asc" ? compareVal : -compareVal;
  });
  
  // Replace table body with sorted rows.
  rowsArray.forEach(row => tableBody.appendChild(row));
}

// Default sorting function: sorts rows by time (using data-timestamp) in descending order.
function sortByTime() {
  const rowsArray = Array.from(tableBody.querySelectorAll("tr"));
  
  rowsArray.sort((rowA, rowB) => {
    const tA = parseInt(rowA.getAttribute("data-timestamp"), 10) || 0;
    const tB = parseInt(rowB.getAttribute("data-timestamp"), 10) || 0;
    // Descending: newest time first.
    return tB - tA;
  });
  
  rowsArray.forEach(row => tableBody.appendChild(row));
}

// Listen for new order data from the server.
socket.on("counter", (data) => {
  const row = document.createElement("tr");
  
  // Save the original timestamp as a data attribute.
  row.setAttribute("data-timestamp", data.timestamp);
  
  // Convert the timestamp to a readable time string.
  const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString();
  
  let displayStatus = data.status.toLowerCase();
// If the status is "filled", change it to "complete"
  if (displayStatus === "filled") {
    displayStatus = "complete";
  }
// If the status is "cancelled amo", change it to "cancel"

  else if (displayStatus === "rejected") {
    displayStatus = "rejected";
  }
  // Generate a slug for the status CSS class: e.g. "executed" or "cancelled-amo"
  const statusSlug = displayStatus.toLowerCase().replace(/\s+/g, "-");
  
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
    <td>
      <span class="status-pill ${statusSlug}">
        ${displayStatus.toUpperCase()}
      </span>
    </td>
  `;
  
  // Insert the new row.
  tableBody.prepend(row);
  
  // If a column sort is active, re-sort using that sort; otherwise, revert to default time sort.
  if (activeSortColumn !== null) {
    sortTable(activeSortColumn, activeSortState);
  } else {
    sortByTime();
  }
  
  // (Optional) Limit the table to 50 rows.
  while (tableBody.rows.length > 50) {
    tableBody.removeChild(tableBody.lastChild);
  }
});
