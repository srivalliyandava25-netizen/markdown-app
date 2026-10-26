
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const Note = require('./models/Note');

app.post('/notes', async(req, res) => {
    try {
        const {title, content, author} = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Note title is required'
            });
        }

        const note = await Note.create({
            title: title.trim(),
            content: content || '',
            author: author || 'Anonymous'
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({
            message: 'Failed to create note'
        });
    }
});

app.get('/notes', async (req, res) => {
    try{
        const notes = await Note.find({}).sort({ updatedAt: -1 }).exec();
        res.json(notes);
    } catch (error) {
        console.error('Fetch notes error: ', error)
        res.status(500).json({ message: 'Failed to fetch notes'});
    }
})

app.put('/notes/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!note) {
            return res.status(404).json({ message: 'Note not found'});
        }
        res.json(note);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update note' })
    }
});

app.delete('/notes/:id', async (req, res) => {
    try { 
        const note = await Note.findByIdAndDelete(req. params.id);

        if (!note) {
            return res.status(400).json({ message: 'Note not found' })
        }

        res.json({ message: 'Note deleted successfully' })
    } catch (error) {
        res.status(400).json({ message: 'Failed to delete note'});
    }
});

// app.get('/', (req, res) => {
//   res.send('Markdown Notes API is running!');
// });

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connect sucessfully'))
.catch((error) => console.error('MongoDB connection failed:', error));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

