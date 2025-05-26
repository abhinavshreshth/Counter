let activeStrategyId = null;


document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('strategy-list'); 
  container.innerHTML = '<p>Loading strategies…</p>';

  // Persisted ID was stored as string → convert to number
  activeStrategyId = parseInt(localStorage.getItem('activeStrategyId'), 10) || null;

  fetch('/api/strategies')
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { success, data } = await res.json();
      if (!success) throw new Error('API error');
      renderStrategiesTable(data || []);
            // ✅ Call openStrategySettings if valid ID exists
      const active = data.find(s => s.id === activeStrategyId);
      if (active) {
        openStrategySettings(activeStrategyId, active.name);
          // ✅ Auto-scroll to the active card
        const el = document.getElementById(active.name.toLowerCase().replace(/\s+/g, '-'));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    })
    .catch(err => {
      console.error(err);
      // container.innerHTML = '<p class="error">Error loading strategies.</p>';
    });
});

/**
 * Gathers all named inputs from the #strategy-form
 * and sends them back to update their values.
 */
async function saveForm(strategyId) {
  const form = document.getElementById('strategy-form');
  // Collect every element with a name attribute
  const fields = Array.from(form.elements)
    .filter(el => el.name)                  // only inputs/selects/checkboxes
    .map(el => ({
      field_key: el.name,
      value: el.type === 'checkbox'
        ? el.checked
        : el.value
    }));

  try {
    const res = await fetch(`/api/strategies/${strategyId}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const body = await res.json();
    if (body.success) {
      showToast('Settings saved!', 'success');
    } else {
      showToast(body.error || 'Save failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error', 'error');
  }
}


function renderStrategiesTable(strategies) {
  const container = document.getElementById('strategy-list');
  container.innerHTML = '';
  strategies.forEach((strategy) => {
    const card = document.createElement('div');
    card.className = 'strategy-card';
    card.id = strategy.name.toLowerCase().replace(/\s+/g, '-');
    if (strategy.id === activeStrategyId) {
      card.classList.add('active');
    }
    card.onclick = () => card.classList.toggle('expanded');

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = strategy.name;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const propertiesBtn = document.createElement('button');
    propertiesBtn.className = 'pill-button properties';
    propertiesBtn.textContent = 'Properties';
    propertiesBtn.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      // ✅ Persist selected strategy ID
      localStorage.setItem('activeStrategyId', strategy.id);
      
      openStrategySettings(strategy.id, strategy.name);
    };


    const deployBtn = document.createElement('button');
    deployBtn.className = 'pill-button deploy';
    deployBtn.textContent = 'Deploy';
    deployBtn.onclick = (e) => {
      e.stopPropagation();
      console.log('Deploying strategy:', strategy.name);
    };

    actions.appendChild(propertiesBtn);
    actions.appendChild(deployBtn);

    const description = document.createElement('div');
    description.className = 'strategy-description';
    description.innerHTML = '<strong>Description:</strong> ' + (strategy.description || 'No description provided.');

    cardHeader.appendChild(title);
    cardHeader.appendChild(actions);
    card.appendChild(cardHeader); // ✅ Append the wrapper instead
    card.appendChild(description);

    container.appendChild(card);
  });
}

  /**
   * Render settings form from server-provided metadata.
   * @param {Array} fieldsArray  List of {field_key, label, type, options, value}
   * @param {string} strategyName
   */
  function renderForm(fieldsArray, strategyName) {
    const form = document.getElementById('strategy-form');
    form.innerHTML = `<h2>${strategyName}</h2>`;

    // Reveal Save button
    const saveWrapper = document.getElementById('save-button-wrapper');
    if (saveWrapper) saveWrapper.style.display = 'block';

    // Build one form-group per field
    fieldsArray.forEach(f => {
      const { field_key, label, type, options, value } = f;
      const group = document.createElement('div');
      group.className = 'form-group';

      // Label
      const lbl = document.createElement('label');
      lbl.textContent = label;
      group.appendChild(lbl);

      // Input based on type
      let input;
      switch (type) {
        case 'time':
          input = document.createElement('input');
          input.type  = 'time';
          try {
              // Parse and reformat if input is in AM/PM
              let time24 = value;
              if (typeof value === 'string' && value.match(/(AM|PM)/i)) {
                const [time, modifier] = value.trim().split(' ');
                let [hours, minutes] = time.split(':').map(v => parseInt(v, 10));

                if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

                time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              }
              input.value = time24;
            } catch (e) {
              input.value = ''; // fallback on parsing failure
            }

          input.name  = field_key;
          group.appendChild(input);
          break;

        case 'boolean':
          const sw = document.createElement('label');
          sw.className = 'switch';
          const chk = document.createElement('input');
          chk.type    = 'checkbox';
          chk.checked = value === "true";
          chk.name    = field_key;
          const slider = document.createElement('span');
          slider.className = 'slider';
          sw.appendChild(chk);
          sw.appendChild(slider);
          group.appendChild(sw);
          break;

        case 'select':
          input = document.createElement('select');
          input.name = field_key;
          options.forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value       = opt;
            optEl.textContent = opt;
            if (opt === value) optEl.selected = true;
            input.appendChild(optEl);
          });
          group.appendChild(input);
          break;

          default:
            // text, number, date, double, etc.
            input = document.createElement('input');

            // Enforce integer-only for `number`
            if (type === 'number') {
              input.type = 'number';
              input.step = '1';
              input.addEventListener('input', () => {
                input.value = input.value.replace(/[^\d-]/g, '');
              });
            }
                        // Allow full-precision decimals for `double`
            else if (type === 'double') {
              input.type = 'text';   // ← let us handle filtering ourselves
              input.classList.add('field-default');

              input.addEventListener('input', () => {
                let v = input.value
                  // only digits and dots
                  .replace(/[^0-9.]/g, '');

                // keep only the first dot
                const parts = v.split('.');
                if (parts.length > 2) {
                  v = parts.shift() + '.' + parts.join('');
                }

                input.value = v;
              });
            }
            // Fallback for text, date, etc.
            else {
              input.type = type;
            }

            input.name  = field_key;
            input.value = value;
            group.appendChild(input);
            break;
      }

      form.appendChild(group);
    });
  }

async function openStrategySettings(strategyId, strategyName) {
  activeStrategyId = strategyId;

  try {
    const res = await fetch(`/api/strategies/${strategyId}/settings`);
    if (!res.ok) throw new Error(`Failed to fetch settings`);
    const { fields } = await res.json();   // fields is now [ { field_key,label,type,options,value… }, … ]
    renderForm(fields, strategyName);
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

// Wire up the Save button once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('save-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      saveForm(activeStrategyId);
    });
  }
});
function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => container.removeChild(toast), 300);
  }, 4000);
}



