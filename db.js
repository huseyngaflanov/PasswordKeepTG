// get db.json as database
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');


function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
    } else {
        try {
            const content = fs.readFileSync(DB_PATH, 'utf8');
            if (!content || content.trim() === '') {
                fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
            }
        } catch (error) {
            fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
        }
    }
}

// Read database
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { users: {} };
    }
}

// Write to database
function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing to database:', error);
        return false;
    }
}

// Get user by ID
function getUser(userId) {
    const db = readDB();
    return db.users[userId] || null;
}

// Add or update user
function saveUser(userId, userData) {
    const db = readDB();
    if (!db.users[userId]) {
        // New user
        db.users[userId] = {
            id: userId,
            createdAt: new Date().toISOString(),
            ...userData
        };
    } else {
        // Update existing user
        db.users[userId] = {
            ...db.users[userId],
            ...userData,
            updatedAt: new Date().toISOString()
        };
    }
    return writeDB(db);
}


// Check if user exists
function userExists(userId) {
    const db = readDB();
    return !!db.users[userId];
}

// Get all users
function getAllUsers() {
    const db = readDB();
    return Object.values(db.users);
}


// Delete user
function deleteUser(userId) {
    const db = readDB();
    delete db.users[userId];
    return writeDB(db);
}

// Initialize on module load
initDB();

module.exports = {
    getUser,
    saveUser,
    userExists,
    getAllUsers,
    deleteUser,
    readDB,
    writeDB
};