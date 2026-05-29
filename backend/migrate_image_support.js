/**
 * Migration Script: Add image support to messages table
 * 
 * Run: node migrate_image_support.js
 * 
 * This script will:
 *   1. Add message_type column (VARCHAR 10, default 'text')
 *   2. Add image_url column (TEXT, nullable)
 *   3. Make content column nullable (for image-only messages)
 * 
 * Safe to run multiple times (idempotent - skips existing columns)
 */

require("dotenv").config();
const pool = require("./db");

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("=== Starting Migration: Image Support ===\n");

    // Check and add message_type column
    const checkType = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'message_type'
    `);

    if (checkType.rows.length === 0) {
      await client.query(`
        ALTER TABLE messages 
        ADD COLUMN message_type VARCHAR(10) DEFAULT 'text'
      `);
      console.log("✅ Added column: message_type (VARCHAR 10, default 'text')");
    } else {
      console.log("⏭️  Skipped: message_type column already exists");
    }

    // Check and add image_url column
    const checkImage = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'image_url'
    `);

    if (checkImage.rows.length === 0) {
      await client.query(`
        ALTER TABLE messages 
        ADD COLUMN image_url TEXT
      `);
      console.log("✅ Added column: image_url (TEXT, nullable)");
    } else {
      console.log("⏭️  Skipped: image_url column already exists");
    }

    // Make content nullable
    await client.query(`
      ALTER TABLE messages 
      ALTER COLUMN content DROP NOT NULL
    `);
    console.log("✅ Altered column: content is now nullable");

    console.log("\n=== Migration Complete ===");
    console.log("Table 'messages' now supports image messages.");
    console.log("message_type: 'text' | 'image'");
    console.log("image_url: path to uploaded image (e.g., /uploads/xxx.png)");

  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
