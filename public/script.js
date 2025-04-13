const socket = io();
const tbody = document.querySelector("#tradeTable tbody");

socket.on("counter", (data) => {
  const row = document.createElement("tr");
  row.classList.add("new");

  row.innerHTML = `
    <td>${data.id}</td>
    <td>${new Date(data.timestamp * 1000).toLocaleTimeString()}</td>
    <td>${data.user_id}</td>
    <td>${data.payload.symbol}</td>
    <td class="${data.payload.side === 'buy' ? 'buy' : 'sell'}">
      ${data.payload.side.toUpperCase()}
    </td>
    <td>₹${data.payload.price.toFixed(2)}</td>
    <td>${data.payload.quantity}</td>
    <td>${data.payload.filled_quantity}</td>
    <td>${data.payload.remaining_quantity}</td>
    <td class="${data.status}">${data.status.toUpperCase()}</td>
  `;

  tbody.prepend(row);

  if (tbody.rows.length > 50) {
    tbody.removeChild(tbody.lastChild);
  }
});
