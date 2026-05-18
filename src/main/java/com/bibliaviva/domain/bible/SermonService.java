package com.bibliaviva.domain.bible;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SermonService {

    private final BookSermonRepository sermonRepository;
    private final RestClient restClient;

    @Value("${youtube.api.key:AIzaSyD-HtcNGpQy3f6HSz_-tsHHTnx3Ku6abEA}")
    private String youtubeApiKey;

    private static final int CACHE_TTL_DAYS = 7;

    private static final List<String> BLOCKLIST = Arrays.asList(
            "debate", "falso profeta", "falsa", "seita", "polêmica", "polemica",
            " vs ", "versus", "erro de", "heresia", "exposição", "denúncia",
            "denuncia", "crítica", "critica"
    );

    public SermonService(BookSermonRepository sermonRepository, RestClient restClient) {
        this.sermonRepository = sermonRepository;
        this.restClient = restClient;
    }

    /**
     * Retrieve sermons for a book, serving from DB Cache if valid, otherwise queries YouTube.
     */
    @Transactional
    public List<BookSermon> getSermonsForBook(String bookName) {
        List<BookSermon> cachedSermons = sermonRepository.findByBookOrderByPositionAsc(bookName);

        if (!cachedSermons.isEmpty()) {
            BookSermon first = cachedSermons.get(0);
            LocalDateTime limit = LocalDateTime.now().minusDays(CACHE_TTL_DAYS);
            if (first.getCachedAt().isAfter(limit)) {
                System.out.println("[SermonService] Serving Java cached sermons for book: " + bookName);
                return cachedSermons;
            }
            System.out.println("[SermonService] Java cache expired for book: " + bookName + ", refreshing...");
        }

        try {
            List<BookSermon> freshSermons = fetchAndFilterFromYouTube(bookName);
            if (!freshSermons.isEmpty()) {
                updateCache(bookName, freshSermons);
                return freshSermons;
            }
        } catch (Exception e) {
            System.err.println("[SermonService] Error fetching from YouTube: " + e.getMessage());
            e.printStackTrace();
        }

        // Return stale cache as fallback
        return cachedSermons;
    }

    /**
     * Forcibly refresh cache for a Bible book
     */
    @Transactional
    public List<BookSermon> forceRefresh(String bookName) throws Exception {
        List<BookSermon> freshSermons = fetchAndFilterFromYouTube(bookName);
        if (!freshSermons.isEmpty()) {
            updateCache(bookName, freshSermons);
        }
        return freshSermons;
    }

    /**
     * Atomic transaction to update database cache
     */
    @Transactional
    protected void updateCache(String bookName, List<BookSermon> sermons) {
        sermonRepository.deleteByBook(bookName);
        for (int i = 0; i < sermons.size(); i++) {
            BookSermon s = sermons.get(i);
            s.setPosition(i);
            sermonRepository.save(s);
        }
    }

    /**
     * Calls YouTube Search and Video Details API using RestClient, processes filters, and returns top 6 sermons sorted by descending viewCount.
     */
    @SuppressWarnings("unchecked")
    private List<BookSermon> fetchAndFilterFromYouTube(String bookName) throws Exception {
        System.out.println("[SermonService] Querying YouTube Search API from Java for book: " + bookName);
        
        // 1. YouTube Search
        String searchQuery = "Pregação sobre o livro " + bookName;
        String searchUrl = UriComponentsBuilder.fromHttpUrl("https://www.googleapis.com/youtube/v3/search")
                .queryParam("part", "snippet")
                .queryParam("maxResults", "25")
                .queryParam("q", searchQuery)
                .queryParam("type", "video")
                .queryParam("key", youtubeApiKey)
                .toUriString();

        Map<String, Object> searchResult = restClient.get()
                .uri(searchUrl)
                .retrieve()
                .body(Map.class);

        if (searchResult == null || !searchResult.containsKey("items")) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> searchItems = (List<Map<String, Object>>) searchResult.get("items");
        if (searchItems.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> videoIds = searchItems.stream()
                .map(item -> {
                    Map<String, Object> idMap = (Map<String, Object>) item.get("id");
                    return idMap != null ? (String) idMap.get("videoId") : null;
                })
                .filter(id -> id != null && !id.isEmpty())
                .collect(Collectors.toList());

        if (videoIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. Fetch Video Details (viewCount, duration)
        String detailsUrl = UriComponentsBuilder.fromHttpUrl("https://www.googleapis.com/youtube/v3/videos")
                .queryParam("part", "snippet,contentDetails,statistics")
                .queryParam("id", String.join(",", videoIds))
                .queryParam("key", youtubeApiKey)
                .toUriString();

        Map<String, Object> detailsResult = restClient.get()
                .uri(detailsUrl)
                .retrieve()
                .body(Map.class);

        if (detailsResult == null || !detailsResult.containsKey("items")) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> videoDetails = (List<Map<String, Object>>) detailsResult.get("items");
        List<BookSermon> filteredSermons = new ArrayList<>();

        for (Map<String, Object> detail : videoDetails) {
            String videoId = (String) detail.get("id");
            Map<String, Object> snippet = (Map<String, Object>) detail.get("snippet");
            Map<String, Object> contentDetails = (Map<String, Object>) detail.get("contentDetails");
            Map<String, Object> statistics = (Map<String, Object>) detail.get("statistics");

            if (snippet == null || contentDetails == null || statistics == null) {
                continue;
            }

            String title = (String) snippet.get("title");
            String channelTitle = (String) snippet.get("channelTitle");
            String channelId = (String) snippet.get("channelId");
            String durationStr = (String) contentDetails.get("duration");
            String viewCountStr = (String) statistics.get("viewCount");

            long viewCount = viewCountStr != null ? Long.parseLong(viewCountStr) : 0L;
            int durationSeconds = parseISO8601Duration(durationStr);

            // Criteria validation:
            // a. View Count >= 5000
            if (viewCount < 5000L) {
                continue;
            }

            // b. Duration: 8 min (480s) to 2 hours (7200s)
            if (durationSeconds < 480 || durationSeconds > 7200) {
                continue;
            }

            // c. Blocklist check
            String lowerTitle = title.toLowerCase();
            String lowerChannel = channelTitle.toLowerCase();
            boolean blocked = BLOCKLIST.stream().anyMatch(word -> lowerTitle.contains(word) || lowerChannel.contains(word));
            if (blocked) {
                continue;
            }

            // Thumbnail selection
            String thumbnailUrl = "";
            Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
            if (thumbnails != null) {
                Map<String, Object> high = (Map<String, Object>) thumbnails.get("high");
                Map<String, Object> medium = (Map<String, Object>) thumbnails.get("medium");
                Map<String, Object> def = (Map<String, Object>) thumbnails.get("default");

                if (high != null) thumbnailUrl = (String) high.get("url");
                else if (medium != null) thumbnailUrl = (String) medium.get("url");
                else if (def != null) thumbnailUrl = (String) def.get("url");
            }

            String publishedAtStr = (String) snippet.get("publishedAt");
            LocalDateTime publishedAt = null;
            if (publishedAtStr != null && !publishedAtStr.isEmpty()) {
                try {
                    publishedAt = LocalDateTime.parse(publishedAtStr, DateTimeFormatter.ISO_DATE_TIME);
                } catch (Exception ex) {
                    publishedAt = LocalDateTime.now();
                }
            }

            BookSermon sermon = new BookSermon(
                    bookName,
                    videoId,
                    title,
                    channelTitle,
                    channelId,
                    thumbnailUrl,
                    durationSeconds,
                    viewCount,
                    publishedAt,
                    LocalDateTime.now(),
                    0
            );

            filteredSermons.add(sermon);
        }

        // 3. Sort by viewCount descending and limit to top 6
        return filteredSermons.stream()
                .sorted((a, b) -> Long.compare(b.getViewCount(), a.getViewCount()))
                .limit(6)
                .collect(Collectors.toList());
    }

    /**
     * Parser for ISO 8601 duration
     */
    private int parseISO8601Duration(String duration) {
        if (duration == null || duration.isEmpty()) return 0;
        try {
            // Spring/Java Duration.parse parses ISO-8601 durations like PT15M33S natively!
            Duration d = Duration.parse(duration);
            return (int) d.getSeconds();
        } catch (Exception e) {
            // Regex fallback
            Pattern pattern = Pattern.compile("PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?");
            Matcher matcher = pattern.matcher(duration);
            if (matcher.matches()) {
                int hours = matcher.group(1) != null ? Integer.parseInt(matcher.group(1)) : 0;
                int minutes = matcher.group(2) != null ? Integer.parseInt(matcher.group(2)) : 0;
                int seconds = matcher.group(3) != null ? Integer.parseInt(matcher.group(3)) : 0;
                return hours * 3600 + minutes * 60 + seconds;
            }
            return 0;
        }
    }
}
