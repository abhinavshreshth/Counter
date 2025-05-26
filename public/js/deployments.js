document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('deployments-container');
  container.innerHTML = '<p>Loading deployments…</p>';

  fetch('/api/deployments')
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { success, data } = await res.json();
      if (!success) throw new Error('API error');
      renderDeploymentsTable(data || []);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<p class="error">Error loading deployments.</p>';
    });

  // Close Edit modal
  document.getElementById('edit-modal')
    .querySelector('.modal-close')
    .addEventListener('click', () =>
      document.getElementById('edit-modal').classList.remove('open')
    );
});

function renderDeploymentsTable(deployments) {
  const container = document.getElementById('deployments-container');
  if (deployments.length === 0) {
    container.innerHTML = '<p>No deployments found.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'card-container';

  deployments.forEach(d => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h3>Deployment #${d.id}</h3>
      <p><strong>Strategy:</strong> ${d.strategyName}</p>
      <p><strong>Status:</strong> ${d.status}</p>
      <button class="edit-btn" data-id="${d.id}">Edit</button>
    `;

    card.querySelector('.edit-btn')
        .addEventListener('click', () => openEditModal(d.id));

    grid.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(grid);
}


function openEditModal(deploymentId) {
  const modal = document.getElementById('edit-modal');
  modal.dataset.deploymentId = deploymentId;
  // (Later: load current params into form)
  modal.classList.add('open');
}
