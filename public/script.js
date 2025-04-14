const socket = io({
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
const tableBody = document.getElementById("ordersTableBody");

// Sorting state
let activeSortColumn = null;
let activeSortState = null;

// Flags
const shownIds = new Set();
let hasClearedOnce = false;

document.addEventListener("DOMContentLoaded", () => {
  const headerCells = document.querySelectorAll(".trades-table thead th");

  headerCells.forEach((th, index) => {
    th.addEventListener("click", () => {
      if (activeSortColumn !== index) {
        activeSortColumn = index;
        activeSortState = "asc";
        headerCells.forEach(cell => cell.classList.remove("sorted-asc", "sorted-desc"));
        th.classList.add("sorted-asc");
        sortTable(activeSortColumn, activeSortState);
      } else {
        if (activeSortState === "asc") {
          activeSortState = "desc";
          headerCells.forEach(cell => cell.classList.remove("sorted-asc", "sorted-desc"));
          th.classList.add("sorted-desc");
          sortTable(activeSortColumn, activeSortState);
        } else if (activeSortState === "desc") {
          activeSortColumn = null;
          activeSortState = null;
          headerCells.forEach(cell => cell.classList.remove("sorted-asc", "sorted-desc"));
          sortByTime();
        }
      }
    });
  });
});

function sortTable(columnIndex, sortState) {
  const rowsArray = Array.from(tableBody.querySelectorAll("tr"));

  rowsArray.sort((rowA, rowB) => {
    const cellA = rowA.children[columnIndex].innerText.trim();
    const cellB = rowB.children[columnIndex].innerText.trim();
    let compareVal = 0;

    if (columnIndex === 0) {
      const tA = parseInt(rowA.getAttribute("data-timestamp"), 10) || 0;
      const tB = parseInt(rowB.getAttribute("data-timestamp"), 10) || 0;
      compareVal = tA - tB;
    } else if ([4, 5, 6].includes(columnIndex)) {
      const numA = parseFloat(cellA.replace(/[^\d.-]/g, "")) || 0;
      const numB = parseFloat(cellB.replace(/[^\d.-]/g, "")) || 0;
      compareVal = numA - numB;
    } else {
      compareVal = cellA.localeCompare(cellB);
    }

    return sortState === "asc" ? compareVal : -compareVal;
  });

  rowsArray.forEach(row => tableBody.appendChild(row));
}

function sortByTime() {
  const rowsArray = Array.from(tableBody.querySelectorAll("tr"));
  rowsArray.sort((rowA, rowB) => {
    const tA = parseInt(rowA.getAttribute("data-timestamp"), 10) || 0;
    const tB = parseInt(rowB.getAttribute("data-timestamp"), 10) || 0;
    return tB - tA;
  });
  rowsArray.forEach(row => tableBody.appendChild(row));
}

// Optional: Clear old shownIds every minute to avoid memory bloat
setInterval(() => shownIds.clear(), 60000);

// WebSocket connection status logs
socket.on("connect", () => console.log("✅ Connected to WebSocket"));
socket.on("disconnect", () => console.warn("⚠️ Disconnected from WebSocket"));

socket.on("counter", (data) => {
  // Clear old data once when first message arrives (i.e., on refresh)
  if (!hasClearedOnce) {
    tableBody.innerHTML = "";
    hasClearedOnce = true;
  }

  // Create a unique key based on id + timestamp + symbol + side + status
  const uniqueKey = `${data.id}_${data.timestamp}_${data.payload.symbol}_${data.payload.side}_${data.status}`;
  if (shownIds.has(uniqueKey)) return;
  shownIds.add(uniqueKey);

  const row = document.createElement("tr");
  row.setAttribute("data-timestamp", data.timestamp);
  const timeStr = new Date(data.timestamp * 1000).toLocaleTimeString();

  let displayStatus = data.status.toLowerCase();
  if (displayStatus === "filled") {
    displayStatus = "complete";
  }

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

  tableBody.prepend(row);

  if (activeSortColumn !== null) {
    sortTable(activeSortColumn, activeSortState);
  } else {
    sortByTime();
  }

  while (tableBody.rows.length > 50) {
    tableBody.removeChild(tableBody.lastChild);
  }

  showToast(`${data.payload.side.toUpperCase()} ${data.payload.symbol} is placed. Check the orderbook for status.`, data.id);

});
function showToast(message, id) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <strong>Placed</strong>
    ${message}<br><small style="color: #888;">#${id}</small>
  `;
  document.getElementById("toast-container").appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}
