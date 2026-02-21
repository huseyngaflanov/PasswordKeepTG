# Telegram Bot Commands

## User Commands

### `/start`
Register as a new user and set up your master password (8 characters).

### `/new`
Create a new password entry.
- Bot will ask for a name (e.g., "Gmail Account")
- Then ask for a login (email/username)
- Automatically generates a secure 12-character password
- Saves to database with unique ID

### `/list`
View all your saved passwords.
Shows name, login, and ID for each password.

### `/get <password_id>`
Retrieve a specific password by its ID.
- Shows name, login, and password (with spoiler)
- Message auto-deletes after 30 seconds
- Example: `/get a1b2c3d4e5f6g7h8`

### `/search <query>`
Search your passwords by name or login.
- Case-insensitive search
- Example: `/search gmail`

### `/edit <password_id>`
Edit an existing password.
- Example: `/edit a1b2c3d4e5f6g7h8`
- Bot will show current values and ask what to edit
- Reply with:
  - `name New Name` to change the name
  - `login newlogin@email.com` to change the login
  - `password NewP@ss123` to change the password
  - `cancel` to cancel editing

### `/delete <password_id>`
Delete a password from your database.
- Example: `/delete a1b2c3d4e5f6g7h8`
- Permanently removes the password

### `/me`
View your user profile information.

---

## Admin Commands

### `/stats`
Show total number of registered users.
(Admin only)

### `/notify <message>`
Send a broadcast message to all users.
- Example: `/notify Scheduled maintenance at 3pm`
(Admin only)

---

## Password Entry Structure

Each password entry contains:
```json
{
  "id": "a1b2c3d4e5f6g7h8",       // Auto-generated unique ID
  "name": "Gmail Account",          // User-defined name
  "login": "user@gmail.com",        // Email or username
  "password": "aB3xKpQ9mWvL",      // The password
  "createdAt": "2026-02-21T10:30:00.000Z",
  "updatedAt": "2026-02-21T12:00:00.000Z"  // If edited
}
```

---

## Database Functions (for developers)

### `addPassword(userId, credentials)`
Add a new password entry.
```javascript
const password = db.addPassword(userId, {
  name: "GitHub",
  login: "myusername",
  password: "mypassword123"
});
```

### `deletePassword(userId, passwordId)`
Delete a password by ID.
```javascript
const success = db.deletePassword(userId, "a1b2c3d4");
```

### `searchPassword(userId, query)`
Search passwords (searches name and login fields).
```javascript
const results = db.searchPassword(userId, "github");
```

### `editPassword(userId, passwordId, newCredentials)`
Edit password fields.
```javascript
const updated = db.editPassword(userId, "a1b2c3d4", {
  login: "newemail@example.com"
});
```

### `getAllPasswords(userId)`
Get all passwords for a user.
```javascript
const passwords = db.getAllPasswords(userId);
```

### `getPasswordById(userId, passwordId)`
Get a specific password by ID.
```javascript
const password = db.getPasswordById(userId, "a1b2c3d4");
```

---

## Security Features

- Master password required (8 characters)
- Passwords displayed with spoiler tags (click to reveal)
- Sensitive messages auto-delete after 30 seconds
- Database stored locally in `db.json` (not committed to git)
- Environment variables for bot token and admin ID
