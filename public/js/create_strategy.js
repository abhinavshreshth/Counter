// Auto-increment ID for fields
let fieldCount = 0;

// Add a new field row
function addFieldRow(data = {}) {
  const tbody = document.getElementById("fields-body");
  const tr    = document.createElement("tr");
  tr.classList.add("field-row");
  tr.setAttribute("draggable", "true");

tr.innerHTML = `
  <td class="drag-handle">
  <div class="handle-icon">
    <span></span>
    <span></span>
    <span></span>
  </div>
  </td>
  <td><input type="text" class="field-key"   value="${data.field_key   || ''}" required></td>
  <td><input type="text" class="field-label" value="${data.label       || ''}" required></td>
  <td>
    <select class="field-type">
      <option value="text"    ...>text</option>
      <option value="number"  ...>number</option>
      <option value="double" ${data.type === 'double' ? 'selected' : ''}>double</option>
      <option value="boolean" ...>boolean</option>
      <option value="date"    ...>date</option>
      <option value="time"    ...>time</option>
      <option value="select"  ...>select</option>
    </select>
  </td>
  <td>
    <input
      type="text"
      class="field-options"
      value="${(data.options || []).join(',')}"
      ${data.type === 'select' ? '' : 'disabled'}>
  </td>
  <td>
    <input
      type="text"
      class="field-default"
      value="${data.defaultValue || ''}">
  </td>
  <td><button type="button" onclick="this.closest('tr').remove()">❌</button></td>
`;


  // 1️⃣ append it so querySelector can find your new elements
  tbody.appendChild(tr);

  // 2️⃣ now grab them exactly once
  const typeSelect   = tr.querySelector(".field-type");
  const optionsInput = tr.querySelector(".field-options");

  // 3️⃣ wire events
  typeSelect.addEventListener("change", () => onTypeChange(typeSelect));
  optionsInput.addEventListener("input", () => onTypeChange(typeSelect));

  // 4️⃣ initial render
  onTypeChange(typeSelect);

  fieldCount++;

}
/**
 * Enable/disable Options input, then rebuild the Default cell
 */
function onTypeChange(select) {
  toggleOptions(select);

  const tr         = select.closest("tr");
  const optionsVal = tr.querySelector(".field-options").value;
  const defaultTd  = tr.querySelector(".field-default").parentNode;

  // 1) clear out old default
  defaultTd.innerHTML = "";

  // 2) pick the right element
  const t = select.value;
  let inputElem;
  if (t === "boolean") {
    inputElem = document.createElement("input");
    inputElem.type = "checkbox";
    inputElem.classList.add("field-default", "toggle");
  }
  else if (["date", "time", "number", "double"].includes(t)) {
    inputElem = document.createElement("input");
    inputElem.type = t;
    inputElem.classList.add("field-default");

    if (t === "number") {
      inputElem.addEventListener("input", () => {
        inputElem.value = inputElem.value.replace(/[^\d-]/g, ''); // ✅ Only integers allowed
      });
    } else if (t === "double") {
      // text + manual filter for full-precision decimals
      inputElem.type = "text";
      inputElem.addEventListener("input", () => {
        let v = inputElem.value
          // strip anything but digits or dot
          .replace(/[^0-9.]/g, '');

        // collapse multiple dots into one
        const parts = v.split('.');
        if (parts.length > 2) {
          v = parts.shift() + '.' + parts.join('');
        }

        inputElem.value = v;
      });
        }
  }
  else if (t === "select") {
    inputElem = document.createElement("select");
    inputElem.classList.add("field-default");
    optionsVal
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
      .forEach(opt => {
        const oEl = document.createElement("option");
        oEl.value = oEl.textContent = opt;
        inputElem.appendChild(oEl);
      });
  }
  else {
    inputElem = document.createElement("input");
    inputElem.type = "text";
    inputElem.classList.add("field-default");
  }

  // 3) inject into the cell
  defaultTd.appendChild(inputElem);
}

// Toggle options input on type change
function toggleOptions(select) {
  const optionsInput = select.closest("tr").querySelector(".field-options");
  if (select.value === "select") {
    optionsInput.disabled = false;
  } else {
    optionsInput.disabled = true;
    optionsInput.value = "";      // ← clear out any old options
  }
}

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function mapToDataType(type) {
  switch (type) {
    case "text":
    case "select": return "string";
    case "number": return "int";
    case "double": return "double";
    case "boolean": return "bool";
    case "date": return "date";
    case "time": return "time";
    default: return "string";
  }
}
// Submit the full strategy form
async function submitStrategy() {
  const name = document.getElementById("strategy-name").value.trim();
  const description = document.getElementById("strategy-desc").value.trim();
  const rows = document.querySelectorAll("#fields-body tr");

  // Client-side validation
  if (!name) {
    return showToast(" Strategy name is required", "warning");
  }

  if (rows.length === 0) {
    return showToast(" Please add at least one field.", "warning");
  }

  const fields = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const field_key = row.querySelector(".field-key").value.trim();
    const label = row.querySelector(".field-label").value.trim();
    const type = row.querySelector(".field-type").value;
    const options = row.querySelector(".field-options").value
      .split(',').map(o => o.trim()).filter(Boolean);
    const defInput = row.querySelector(".field-default");
    const defaultValue = defInput.type === 'checkbox' ? defInput.checked.toString() : defInput.value.trim();
    // ❌ Reject decimal values if field type is "number"
    if (type === "number" && defaultValue.includes('.')) {
      return showToast(` Only integers are allowed for 'number' in row ${i + 1}`, "warning");
    }


    if (!field_key || !label || !type) {
      return showToast(` Missing required field values in row ${i + 1}`, "warning");
    }

    if (type === "select" && options.length < 2) {
      return showToast(` Please provide at least two options for 'select' in row ${i + 1}`, "warning");
    }

    fields.push({
    field_key,
    label,
    type,
    options,
    defaultValue,
    position: i + 1,
    data_type: mapToDataType(type)
  });
  }

  const allKeys = fields.map(f => f.field_key);
  if (new Set(allKeys).size !== allKeys.length) {
    return showToast(" Field keys must be unique.", "warning");
  }

  try {
    const res = await fetch("/api/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, fields })
    });

    const json = await res.json();
    if (json.success) {
      showToast(" Strategy created successfully!");
      setTimeout(() => {
        window.location.href = "strategies.html";
      }, 1500);
    } else {
      showToast(" Failed to save strategy: ", "error");
    }
  } catch (err) {
    console.error(err);
    showToast(" Network error while saving strategy.", "error");
  }
}


// Optional: Drag-and-drop ordering using SortableJS
window.addEventListener("DOMContentLoaded", () => {
  addFieldRow({ type: 'number' }); // Add one row by default

  // Load SortableJS
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js";
  script.onload = () => {
    Sortable.create(document.getElementById("fields-body"), {
      handle: ".drag-handle",
      animation: 150
    });
  };
  document.body.appendChild(script);
}
);
