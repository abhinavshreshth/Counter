
const socket = io();
socket.on('counter', (counter) => {
  document.getElementById('counter').textContent = counter;
});
