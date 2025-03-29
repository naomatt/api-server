const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

console.log('接続先ホスト:', process.env.DB_HOST);

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// PostgreSQLに接続→supabaseに接続へ変更
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
// supabaseとの接続確認
app.get('/test', async(req, res) => {
  try {
    const result = await pool.query('SELECT * FROM atsukai');
    res.json(result.rows);
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});

// atsukaiのデータを全て参照するAPI
app.get('/atsukai', async(req, res) => {
  try {
    const result = await pool.query('SELECT * FROM atsukai');
      res.json(result.rows)
  } catch(error) {
    console.log('エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// atsukaiにデータを追加するAPI
app.post('/atsukai', async(req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO atsukai (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch(error) {
    console.error('atsukai登録のエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// atsukaiからデータを削除するAPI
app.delete('/atsukai/:id', async(req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM atsukai WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({  message: '指定されたデータは見つかりませんでした。'});
    }
    res.json({ message: '削除が完了しました', delete: result.rows[0] });
  } catch(error) {
    console.error('削除エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// atsukaiのデータを更新するAPI
app.put('/atsukai/:id', async(req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  try { 
    const result = await pool.query(
      'UPDATE atsukai SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '指定されたデータは見つかりませんでした。' });
    }

    res.json({
      message: '更新が完了しました。',
      updated: result.rows[0],
    });
  } catch(error) {
    console.error('更新エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// kiji1のAPI  ---------------------------------------------------------------
app.get('/kiji1', async(req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kiji1 ORDER BY id');
    res.json(result.rows);
  } catch(error) {
    console.error('取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.post('/kiji1', async(req, res) => {
  const { atsukai_id, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO kiji1 (atsukai_id, content) VALUES ($1, $2) RETURNING *',
      [atsukai_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch(error) {
    console.error('kiji1の追加エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.put('/kiji1/:id', async(req, res) => {
  const { id } = req.params;
  const { atsukai_id, content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE kiji1 SET atsukai_id = $1, content = $2 WHERE id = $3 RETURNING *',
      [atsukai_id, content, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'データが見つかりません。' });
    }
    res.json({
      message: '更新完了',
      update: result.rows[0]
    });
  } catch(error) {
    console.error('更新エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.delete('/kiji1/:id', async(req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM kiji1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'データが見つかりません' });
    }
    res.json({
      message: '削除完了',
      delete: result.rows[0]
    })
  } catch(error) {
    console.error('削除エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
// kiji2のAPI  ---------------------------------------------------------------
app.get('/kiji2', async(req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kiji2 ORDER BY id');
    res.json(result.rows);
  } catch(error) {
    console.error('取得エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.post('/kiji2', async(req, res) => {
  const { atsukai_id, detail } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO kiji2 (atsukai_id, detail) VALUES ($1, $2) RETURNING *',
      [atsukai_id, detail]
    );
    res.status(201).json(result.rows[0]);
  } catch(error) {
    console.error('kiji2の追加エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.put('/kiji2/:id', async(req, res) => {
  const { id } = req.params;
  const { atsukai_id, detail } = req.body;
  try {
    const result = await pool.query(
      'UPDATE kiji2 SET atsukai_id = $1, detail = $2 WHERE id = $3 RETURNING *',
      [atsukai_id, detail, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'データが見つかりません。' });
    }
    res.json({
      message: '更新完了',
      update: result.rows[0]
    });
  } catch(error) {
    console.error('更新エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.delete('/kiji2/:id', async(req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM kiji2 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'データが見つかりません' });
    }
    res.json({
      message: '削除完了',
      delete: result.rows[0]
    })
  } catch(error) {
    console.error('削除エラー:', error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`APIサーバー起動中:http://localhost:${port}`);
});

