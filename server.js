// server.js

const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const nodemailer = require('nodemailer');

// Configuration for the SMTP server
const server = new SMTPServer({
  // Disable authentication for simplicity
  authOptional: true,

  // Handler that runs when an email is received
  onData(stream, session, callback) {
    // Parse the incoming email
    simpleParser(stream)
      .then((parsed) => {
        console.log("Email received:");

        // Check if the parsed email has expected properties
        if (!parsed.from || !parsed.to || !parsed.subject) {
          console.error("Error: Missing expected email properties");
          callback(new Error("Missing expected email properties"));
          return;
        }

        // Log email details safely
        if (parsed.to?.text.length > 0) {
          fs.readFile('./db.json', (err, data) => {
            if (err) {
              console.log('ERROR: ' + err);
            }

            let db = JSON.parse(data.toString());;
            if (db[parsed.to?.text] !== undefined) {
              db[parsed.to?.text].inbox.push({from: parsed.from?.text, to: parsed.to?.text, subject: parsed.subject, body: parsed.text, attachments: parsed.attachments});
              fs.writeFileSync('./db.json', JSON.stringify(db, null, 3));
            }
          });
        }
        
        console.log("Recieved new Email");
        console.log("From:", parsed.from?.text || "Unknown sender");
        console.log("To:", parsed.to?.text || "Unknown recipient");
        console.log("Subject:", parsed.subject || "No subject");
        console.log("Text:", parsed.text || "No text content");
        console.log("HTML:", parsed.html || "No HTML content");
        console.log("Attachments:", parsed.attachments || "No attachments");

        // Process email (e.g., save to database, trigger notifications, etc.)
        // Add your email processing logic here

        callback(); // Indicate the message has been processed
      })
      .catch((err) => {
        console.error("Error parsing email:", err.message);
        callback(new Error("Error parsing email"));
      });
  },

  // Handler for errors
  onError(err) {
    console.error("Server Error:", err);
  },
});

// Start the server
const PORT = 2525; // Standard ports are 25, 587, 465, but using 2525 for testing
server.listen(PORT, () => {
  console.log(`SMTP Server is listening on port ${PORT}`);
});

function createAccount(email) {
  fs.readFile('./db.json', (err, data) => {
    if (err) {
      console.log('ERROR: ' + err);
      return;
    }

    // Parse the current data
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseErr) {
      console.log('ERROR: ' + parseErr);
      return;
    }

    // Add the new account
    jsonData[email] = { inbox: [], spam: [], drafts: [] };

    // Write the updated data back to the file
    fs.writeFile('./db.json', JSON.stringify(jsonData, null, 3), (writeErr) => {
      if (writeErr) {
        console.log('ERROR: ' + writeErr);
      } else {
        console.log('Account created successfully.');
      }
    });
  });
}