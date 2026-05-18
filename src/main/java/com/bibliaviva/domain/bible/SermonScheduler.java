package com.bibliaviva.domain.bible;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class SermonScheduler {

    private final SermonService sermonService;
    private final BookSermonRepository sermonRepository;

    // List of some common Bible books to initialize
    private static final List<String> COMMON_BOOKS = Arrays.asList(
            "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", 
            "Gênesis", "Êxodo", "Salmos", "Provérbios", "Isaías"
    );

    public SermonScheduler(SermonService sermonService, BookSermonRepository sermonRepository) {
        this.sermonService = sermonService;
        this.sermonRepository = sermonRepository;
    }

    /**
     * Cron schedule: Runs every Monday at 2:00 AM
     * Weekly background sermon update.
     */
    @Scheduled(cron = "0 0 2 * * MON")
    public void scheduleWeeklySermonUpdate() {
        System.out.println("[SermonScheduler] Triggering weekly background sermon update...");
        updateAllSermons();
    }

    /**
     * Listen for application ready event to prefetch default books if cache is empty
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationStart() {
        long count = sermonRepository.count();
        if (count == 0) {
            System.out.println("[SermonScheduler] Database cache empty on startup. Prefetching sermons in background...");
            new Thread(this::updateAllSermons).start();
        }
    }

    private void updateAllSermons() {
        for (String book : COMMON_BOOKS) {
            try {
                System.out.println("[SermonScheduler] Background updating sermons for book: " + book);
                sermonService.forceRefresh(book);
                // Respect API rate limits by pausing between requests
                Thread.sleep(2000);
            } catch (Exception e) {
                System.err.println("[SermonScheduler] Failed to update sermons for " + book + ": " + e.getMessage());
            }
        }
        System.out.println("[SermonScheduler] Background sermon prefetching/updating completed successfully.");
    }
}
