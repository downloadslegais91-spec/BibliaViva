-- Flyway database migration - V8__create_book_sermons.sql

-- Add plan field to users table
ALTER TABLE users ADD COLUMN plan VARCHAR(20) DEFAULT 'FREE';

-- Create book_sermons table
CREATE TABLE book_sermons (
    id VARCHAR(36) PRIMARY KEY,
    book VARCHAR(30) NOT NULL,
    video_id VARCHAR(30) NOT NULL,
    title TEXT NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(100),
    thumbnail_url TEXT NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    view_count BIGINT NOT NULL DEFAULT 0,
    published_at TIMESTAMP,
    cached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    position INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_book_video UNIQUE (book, video_id)
);

-- Index for searching sermons by book
CREATE INDEX idx_book_sermons_book ON book_sermons(book);

-- Index for ordered search within book
CREATE INDEX idx_book_sermons_book_pos ON book_sermons(book, position);
