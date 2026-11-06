
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use('/vendor', express.static(path.join(__dirname, 'public', 'vendor')));
app.use(express.static(path.join(__dirname, 'public')));
// MongoDB connection
let isConnecting = false;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured');
    }

    if (!isConnecting) {
        isConnecting = mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.log('MongoDB connected successfully');
            })
            .finally(() => {
                isConnecting = false;
            });
    }

    await isConnecting;
}

// Ensure database is connected before API requests
app.use('/notes', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('MongoDB connection error:', error);
        res.status(500).json({
            message: 'Database connection failed'
        });
    }
});

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create note
app.post('/notes', async (req, res) => {
    try {
        const { title, content, author } = req.body;

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

// Get all notes
app.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find({})
            .sort({ updatedAt: -1 })
            .exec();

        res.json(notes);
    } catch (error) {
        console.error('Fetch notes error:', error);
        res.status(500).json({
            message: 'Failed to fetch notes'
        });
    }
});

// Update note
app.put('/notes/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        res.json(note);
    } catch (error) {
        console.error('Update note error:', error);
        res.status(400).json({
            message: 'Failed to update note'
        });
    }
});

// Delete note
app.delete('/notes/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        res.json({
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(400).json({
            message: 'Failed to delete note'
        });
    }
});

// Load Note model
const Note = require('./models/Note');

// Local development only
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app for deployment
module.exports = app;
