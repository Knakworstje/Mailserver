const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json());

// Read database file
const dbPath = path.join(__dirname, 'db.json');
const readDatabase = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data);
};

// Endpoint to get email data
app.get('/:encodedEmail', (req, res) => {
    const encodedEmail = req.params.encodedEmail;
    const email = Buffer.from(encodedEmail, 'base64').toString('utf8'); // Decode email address

    try {
        const db = readDatabase();
        if (db[email]) {
            res.json(db[email]);
        } else {
            res.status(404).json({ error: 'Email not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error reading database' });
    }
});

app.delete('/:encodedEmail/:index', (req, res) => {
    const encodedEmail = req.params.encodedEmail;
    const index = parseInt(req.params.index, 10);
    const email = Buffer.from(encodedEmail, 'base64').toString('utf8'); // Decode email address

    try {
        const db = readDatabase();

        if (db[email]) {
            const emailData = db[email];

            // Example: Removing from inbox
            if (emailData.inbox.length > index) {
                emailData.inbox.splice(index, 1);
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); // Save changes
                res.status(200).send(); // Respond with success
                return;
            }
            
            res.status(404).json({ error: 'Email not found' });
        } else {
            res.status(404).json({ error: 'Email account not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error reading database' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}/`);
});