-- Grace Community Church Database Schema
-- Phase 1: Core tables for program management

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    theme_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CONGREGATION',
    church_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    theme TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Schedule items table
CREATE TABLE IF NOT EXISTS schedule_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIME,
    order_index INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'worship',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Special guests table
CREATE TABLE IF NOT EXISTS special_guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    bio TEXT,
    photo_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Program templates table
CREATE TABLE IF NOT EXISTS program_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    template_data TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_church_id ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_programs_church_id ON programs(church_id);
CREATE INDEX IF NOT EXISTS idx_programs_date ON programs(date);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_schedule_items_program_id ON schedule_items(program_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_order ON schedule_items(program_id, order_index);
CREATE INDEX IF NOT EXISTS idx_special_guests_program_id ON special_guests(program_id);
CREATE INDEX IF NOT EXISTS idx_resources_program_id ON resources(program_id);
CREATE INDEX IF NOT EXISTS idx_templates_church_id ON program_templates(church_id);

-- Trigger for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_programs_timestamp 
    AFTER UPDATE ON programs
    BEGIN
        UPDATE programs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;