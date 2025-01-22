const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(express.json());

// Create connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'PASSWORD',
  database: 'DATABASE NAME'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL');
});

// Route to add a new expense
app.post('/api/expenses', (req, res) => {
  const { amount, category, date, payment} = req.body;
  const sql = 'INSERT INTO expenses (amount, category, date, payment) VALUES (?, ?, ?, ?)';
  db.query(sql, [amount, category, date, payment], (err, results) => {
    if (err) {
      console.error('Error adding expense:', err);
      return res.status(500).json({ success: false, message: 'Failed to add expense' });
    }
    res.json({ success: true, results });
  });
});

// Route to fetch all expenses
app.get('/api/expenses', (req, res) => {
  const sql = 'SELECT * FROM expenses';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve expenses' });
    }
    res.json(results);
  });
});

// Route to register a new user
app.post('/register', async (req, res) => {
  const { firstname, lastname, username, password } = req.body;

  // Validate username and password
  if (!/^[a-zA-Z]+$/.test(username) || username.length < 4) {
    return res.status(400).send('Username must be at least 4 alphabet characters.');
  }

  if (password.length < 6) {
    return res.status(400).send('Password must be at least 6 characters long.');
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const sql = 'INSERT INTO login (firstname, lastname, username, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [firstname, lastname, username, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).send('Internal server error');
      }
      res.send('User registered successfully');
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).send('Internal server error');
  }
});

// Route to login a user
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the username exists
  const sql = 'SELECT * FROM login WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(400).send('Invalid username or password');
    }

    const user = results[0];

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).send('Invalid username or password');
    }

    res.send({ success: true, message: 'Login successful' });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
