package com.bibliaviva.domain.bible;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookSermonRepository extends JpaRepository<BookSermon, String> {
    
    /**
     * Retrieve all sermons for a specific Bible book ordered by position
     */
    List<BookSermon> findByBookOrderByPositionAsc(String book);
    
    /**
     * Delete all cached sermons for a specific Bible book
     */
    void deleteByBook(String book);
}
