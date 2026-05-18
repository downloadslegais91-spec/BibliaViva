package com.bibliaviva.domain.bible;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_sermons", uniqueConstraints = {
    @UniqueConstraint(name = "uq_book_video", columnNames = {"book", "video_id"})
})
public class BookSermon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 30)
    private String book;

    @Column(name = "video_id", nullable = false, length = 30)
    private String videoId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(name = "channel_name", nullable = false, length = 255)
    private String channelName;

    @Column(name = "channel_id", length = 100)
    private String channelId;

    @Column(name = "thumbnail_url", nullable = false, columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds = 0;

    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "cached_at", nullable = false)
    private LocalDateTime cachedAt = LocalDateTime.now();

    @Column(nullable = false)
    private Integer position = 0;

    // Constructors
    public BookSermon() {}

    public BookSermon(String book, String videoId, String title, String channelName, String channelId,
                      String thumbnailUrl, Integer durationSeconds, Long viewCount, LocalDateTime publishedAt,
                      LocalDateTime cachedAt, Integer position) {
        this.book = book;
        this.videoId = videoId;
        this.title = title;
        this.channelName = channelName;
        this.channelId = channelId;
        this.thumbnailUrl = thumbnailUrl;
        this.durationSeconds = durationSeconds;
        this.viewCount = viewCount;
        this.publishedAt = publishedAt;
        this.cachedAt = cachedAt;
        this.position = position;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBook() { return book; }
    public void setBook(String book) { this.book = book; }

    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getChannelName() { return channelName; }
    public void setChannelName(String channelName) { this.channelName = channelName; }

    public String getChannelId() { return channelId; }
    public void setChannelId(String channelId) { this.channelId = channelId; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public LocalDateTime getCachedAt() { return cachedAt; }
    public void setCachedAt(LocalDateTime cachedAt) { this.cachedAt = cachedAt; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
