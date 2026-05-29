

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversation_members (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (user_id, conversation_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,

    content TEXT,
    message_type VARCHAR(10) DEFAULT 'text',
    image_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE message_reads (
    message_id INT REFERENCES messages(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (message_id, user_id)
)

-- psql -U postgres -d chat_app -f db.init.sql
-- Migration for existing DBs: run "node migrate_image_support.js" instead