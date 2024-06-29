// 

const express = require('express');
const bodyParser = require('body-parser');
const { connectToDb, getDb } = require('./Db.cjs');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
let db;

connectToDb(function (error) {
  if (!error) {
    app.listen(8001, () => {
      console.log("Server listening on port 8001");
    });
    db = getDb();
  } else {
    console.log(error);
  }
});

app.post('/add', function (req, res) {
  db.collection('contacts')
    .insertOne(req.body)
    .then(function () {
      res.status(201).json({ message: 'Contact added successfully' });
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).json({ error: 'An error occurred' });
    });
});

app.get('/get', function (req, res) {
  const contacts = [];
  db.collection('contacts')
    .find()
    .forEach(entry => contacts.push(entry))
    .then(function () {
      res.status(200).json(contacts);
    })
    .catch(function (error) {
      res.status(500).json({ error: 'An error occurred' });
    });
});

app.delete('/delete/:id', function (req, res) {
  const { id } = req.params;

  // Ensure ID is valid
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid contact ID' });
  }

  db.collection('contacts')
    .deleteOne({ _id: new ObjectId(id) })
    .then(function (result) {
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json({ message: 'Contact deleted successfully' });
    })
    .catch(function (error) {
      res.status(500).json({ error: 'An error occurred' });
    });
});

app.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, countryCode, address } = req.body;

    try {
        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid ObjectId' });
        }

        // Build update object, filtering out null or undefined values
        const updateObject = {};
        if (name) updateObject.name = name;
        if (email) updateObject.email = email;
        if (phone) updateObject.phone = phone;
        if (countryCode) updateObject.countryCode = countryCode;
        if (address) updateObject.address = address;

        // Update contact in MongoDB
        const result = await db.collection('contacts').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateObject } // Use $set to update fields based on updateObject
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({ message: 'Contact updated successfully' });

    } catch (error) {
        console.error('Error updating contact:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});
