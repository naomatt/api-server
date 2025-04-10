const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

console.log('接続先ホスト:', process.env.DB_HOST);

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM atsukai');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/atsukai', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM atsukai ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (error) {
    console.log('エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/atsukai', async (req, res) => {
  const { name } = req.body;
  try {
    const maxResult = await pool.query('SELECT MAX(display_order) as max_order FROM atsukai');
    const nextOrder = (maxResult.rows[0].max_order || 0) + 1;

    const result = await pool.query(
      'INSERT INTO atsukai (name, display_order) VALUES ($1, $2) RETURNING *',
      [name, nextOrder]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('atsukai登録のエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/atsukai/:id', async (req, res) => {
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

    res.json({ message: '名前の更新が完了しました。', updated: result.rows[0] });
  } catch (error) {
    console.error('名前更新エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/atsukai/:id/order', async (req, res) => {
  const { id } = req.params;
  const { display_order } = req.body;

  try {
    const result = await pool.query(
      'UPDATE atsukai SET display_order = $1 WHERE id = $2 RETURNING *',
      [display_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'データが見つかりませんでした。' });
    }

    res.json({ message: '表示順を更新しました。', updated: result.rows[0] });
  } catch (error) {
    console.error('表示順更新エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/atsukai/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM atsukai WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '指定されたデータは見つかりませんでした。' });
    }
    res.json({ message: '削除が完了しました', delete: result.rows[0] });
  } catch (error) {
    console.error('削除エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// display_orderを入れ替えるAPI
app.put('/atsukai/reorder', async (req, res) => {
  const { id1, id2 } = req.body;

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const res1 = await client.query('SELECT display_order FROM atsukai WHERE id = $1', [id1]);
    const res2 = await client.query('SELECT display_order FROM atsukai WHERE id = $2', [id2]);

    const order1 = res1.rows[0].display_order;
    const order2 = res2.rows[0].display_order;

    await client.query('UPDATE atsukai SET display_order = $1 WHERE id = $2', [order2, id1]);
    await client.query('UPDATE atsukai SET display_order = $1 WHERE id = $2', [order1, id2]);

    await client.query('COMMIT');
    res.json({ message: '順序を入れ替えました' });
  } catch (error) {
    console.error('並び替えエラー:', error);
    res.status(500).json({ error: '順序の入れ替えに失敗しました' });
  }
});

// jyoukyou 一覧取得
app.get('/jyoukyou', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM type ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('jyoukyou取得エラー:', error);
    res.status(500).json({ error: 'jyoukyou取得失敗' });
  }
});
// 状況を登録（try/catch 付きに修正）
app.post('/jyoukyou', async (req, res) => {
  const {
    car_position,
    request_source,
    response_method,
    action_type,
    cooperation,
    afterword,
  } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO jyoukyou (car_position, request_source, response_method, action_type, cooperation, afterword) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [car_position, request_source, response_method, action_type, cooperation, afterword]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('jyoukyou登録エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// typeを取得
app.get('/type', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM type ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('type取得エラー:', err);
    res.status(500).json({ error: 'type取得失敗' })
  }
});
// typeを登録
app.post('/type', async (req, res) => {
  const { name, atsukai_order } = req.body;

  try {
    // 最大 display_order を取得
    const maxResult = await pool.query('SELECT MAX(display_order) as max_order FROM type WHERE atsukai_order = $1', [atsukai_order]);
    const nextOrder = (maxResult.rows[0].max_order || 0) + 1;

    const result = await pool.query(
      'INSERT INTO type (name, atsukai_order, display_order) VALUES ($1, $2, $3) RETURNING *',
      [name, atsukai_order, nextOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('type登録エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
// type 更新
app.put('/type/:id', async (req, res) => {
  const { id } = req.params;
  const { name, atsukai_order, display_order } = req.body;
  try {
    const result = await pool.query(
      'UPDATE type SET name = $1, atsukai_order = $2, display_order = $3 WHERE id = $4 RETURNING *',
      [name, atsukai_order, display_order, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '更新失敗' });
  }
});
// type 削除
app.delete('/type/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM type WHERE id = $1 RETURNING *',
      [id]
    );
    res.json({ message: '削除完了', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: '削除失敗' });
  }
});
// 順序入れ替えAPI
app.put('/type/reorder', async (req, res) => {
  const { id1, id2 } = req.body;

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const [res1, res2] = await Promise.all([
      client.query('SELECT display_order FROM type WHERE id = $1', [id1]),
      client.query('SELECT display_order FROM type WHERE id = $1', [id2]),
    ]);

    const order1 = res1.rows[0].display_order;
    const order2 = res2.rows[0].display_order;

    await client.query('UPDATE type SET display_order = $1 WHERE id = $2', [order2, id1]);
    await client.query('UPDATE type SET display_order = $1 WHERE id = $2', [order1, id2]);

    await client.query('COMMIT');
    res.json({ message: 'typeの順序を入れ替えました' });
  } catch (error) {
    console.error('並び替えエラー:', error);
    res.status(500).json({ error: '順序の入れ替えに失敗しました' });
  }
});

// memoのAPI
// memoの取得
// GET /memo?type_id=xx&atsukai_id=yy
app.get('/memo', async (req, res) => {
  const { type_id, atsukai_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM memo WHERE type_id = $1 AND atsukai_id = $2',
      [type_id, atsukai_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('memo取得エラー:', err);
    res.status(500).json({ error: err.message });
  }
});
// すべてのmemoを取得（必要に応じてフィルター）
app.get('/memo/list', async (req, res) => {
  const { atsukai_id, type_id } = req.query;
  try {
    let query = 'SELECT * FROM memo';
    const params = [];

    if (atsukai_id || type_id) {
      const conditions = [];
      if (atsukai_id) {
        conditions.push('atsukai_id = $' + (params.length + 1));
        params.push(atsukai_id);
      }
      if (type_id) {
        conditions.push('type_id = $' + (params.length + 1));
        params.push(type_id);
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('memo list 取得エラー:', err);
    res.status(500).json({ error: err.message });
  }
});



// memoの登録
app.post('/memo', async (req, res) => {
  const { type_id, atsukai_id, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO memo (type_id, atsukai_id, content) VALUES ($1, $2, $3) RETURNING *',
      [type_id, atsukai_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('memoの登録エラー:', err);
    res.status(500).json({ error: err.message });
  }
});

// memoの更新
app.put('/memo/:id', async(req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE memo SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );
    res.json(result.rows[0]);
  } catch(err) {
    console.error('memo更新エラー:', err);
    res.status(500).json({error: err.message});
  }
});
// memoの削除
app.delete('/memo/:id', async(req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM memo WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'メモが見つかりませんでした' });
    }
    res.json({
      message: 'メモの削除が完了しました。',
      delete: result.rows[0],
    });
  } catch(err) {
    console.error('メモ削除エラー:', err);
    res.status(500).json({ error: err.message });
  }
});


// 以下、kiji1とkiji2のAPI
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
  const { atsukai_id, content, type_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO kiji1 (atsukai_id, content, type_id) VALUES ($1, $2, $3) RETURNING *',
      [atsukai_id, content, type_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch(error) {
    console.error('kiji1の追加エラー:', error);
    res.status(500).json({ error: error.message });
  }
});
app.put('/kiji1/:id', async(req, res) => {
  const { id } = req.params;
  const { atsukai_id, content, type_id} = req.body;
  try {
    const result = await pool.query(
      'UPDATE kiji1 SET atsukai_id = $1, content = $2, type_id = $4, WHERE id = $4 RETURNING *',
      [atsukai_id, content, type_id || null, id]
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
// kiji2 追加
app.post('/kiji2', async (req, res) => {
  const { atsukai_id, detail, jyoukyou_id, type_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO kiji2 (atsukai_id, detail, jyoukyou_id, type_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [atsukai_id, detail, jyoukyou_id || null, type_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('kiji2追加エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// kiji2 更新
app.put('/kiji2/:id', async (req, res) => {
  const { id } = req.params;
  const { atsukai_id, detail, jyoukyou_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE kiji2 SET atsukai_id = $1, detail = $2, jyoukyou_id = $3 WHERE id = $4 RETURNING *',
      [atsukai_id, detail, jyoukyou_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'データが見つかりません。' });
    }
    res.json({ message: '更新完了', update: result.rows[0] });
  } catch (error) {
    console.error('kiji2更新エラー:', error);
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
