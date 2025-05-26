const express = require('express');
const router = express.Router();
const pool = require('./db/pg'); // or ../db/pg if outside this dir

// GET /api/strategies — load all strategies from Postgres
router.get('/strategies', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT id, name, description
      FROM strategies
      ORDER BY name;
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching strategies:', err);
    res.status(500).json({ success: false, error: 'Failed to load strategies' });
  } finally {
    client.release();
  }
});


// POST /api/strategies
router.post('/strategies', async (req, res) => {
  const { name, description, fields } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert new strategy
    const insertStrategyText = `INSERT INTO strategies (name, description) VALUES ($1, $2) RETURNING id`;
    const { rows } = await client.query(insertStrategyText, [name, description]);
    const strategyId = rows[0].id;

    // 2. Process fields
    for (const field of fields) {
      const { field_key, label, type, options, defaultValue, position, data_type } = field;

      // Upsert field_definitions
      const upsertFieldText = `
          INSERT INTO field_definitions (field_key, label, type, options, data_type)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (field_key) DO UPDATE
          SET label = EXCLUDED.label, type = EXCLUDED.type, options = EXCLUDED.options, data_type = EXCLUDED.data_type
          RETURNING id
      `;
      const fieldResult = await client.query(upsertFieldText, [
        field_key,
        label,
        type,
        options.length > 0 ? options : null, data_type
      ]);
      const fieldId = fieldResult.rows[0].id;

      // Insert into strategy_field_values
      const insertValueText = `
        INSERT INTO strategy_field_values (strategy_id, field_id, value, position)
        VALUES ($1, $2, $3, $4)
      `;
      let parsedValue = defaultValue;

      if (type === 'number') {
        parsedValue = parseInt(defaultValue, 10);
      } else if (type === 'double') {
        parsedValue = parseFloat(defaultValue);
      } else if (type === 'date') {
        parsedValue = new Date(defaultValue).toISOString().split('T')[0]; // 'YYYY-MM-DD'
      } else if (type === 'boolean') {
        parsedValue = defaultValue === 'true' || defaultValue === true;
      }

      await client.query(insertValueText, [strategyId, fieldId, parsedValue, position]);

    }

    await client.query('COMMIT');
    res.json({ success: true, id: strategyId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error saving strategy:', err);
    res.status(500).json({ success: false, error: 'Failed to save strategy' });
  } finally {
    client.release();
  }
});


// GET /api/strategies/:id/settings
router.get('/strategies/:id/settings', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const strategyId = parseInt(req.params.id, 10);
  const client = await pool.connect();
  try {
    const q = `
      SELECT fd.field_key, fd.label, fd.type, fd.options, sfv.value
      FROM field_definitions fd
      JOIN strategy_field_values sfv
        ON fd.id = sfv.field_id
      WHERE sfv.strategy_id = $1
      ORDER BY sfv.position
    `;
    const { rows } = await client.query(q, [strategyId]);
    const fields = rows.map(r => ({
      field_key: r.field_key,
      label:     r.label,
      type:      r.type,
      options:   r.options || [],
      value:     r.value
    }));
    res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load settings' });
  } finally {
    client.release();
  }
});

// POST /api/strategies/:id/settings
router.post('/strategies/:id/settings', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const strategyId = parseInt(req.params.id, 10);
  const { fields } = req.body;
  if (!Array.isArray(fields)) return res.status(400).json({ success: false, error: 'Invalid payload' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const field of fields) {
    const { field_key, value, type } = field;
    let parsedValue = value;

    if (type === 'number') {
      parsedValue = parseInt(value, 10);
    } else if (type === 'double') {
      parsedValue = parseFloat(value);
    } else if (type === 'date') {
      parsedValue = new Date(value).toISOString().split('T')[0];
    } else if (type === 'boolean') {
      parsedValue = value === 'true' || value === true;
    }
      await client.query(
        `UPDATE strategy_field_values
           SET value = $1
         WHERE strategy_id = $2
           AND field_id = (
             SELECT id FROM field_definitions WHERE field_key = $3
           )`,
         [parsedValue, strategyId, field_key]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  } finally {
    client.release();
  }
});


router.get('/deployments', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, errors: ['Unauthorized'] });
  }
  res.json({
    success: true,
    data: [
      { id: 101, strategyName: 'Mean Reversion', status: 'Running' },
      { id: 102, strategyName: 'Momentum',       status: 'Stopped' }
    ]
  });
});

module.exports = router;
