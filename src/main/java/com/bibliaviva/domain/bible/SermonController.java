  package com.bibliaviva.domain.bible;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sermons")
public class SermonController {

    private final SermonService sermonService;

    public SermonController(SermonService sermonService) {
        this.sermonService = sermonService;
    }

    /**
     * Get sermons for a specific Bible book, applying user plan-based gating.
     * FREE user: sees top 3 sermons.
     * BASIC/PREMIUM user: sees top 6 sermons.
     */
    @GetMapping("/{book}")
    public ResponseEntity<Map<String, Object>> getSermons(
            @PathVariable String book,
            @RequestHeader(value = "X-User-Plan", defaultValue = "FREE") String plan) {
        
        List<BookSermon> sermons = sermonService.getSermonsForBook(book);
        
        String userPlan = plan.toUpperCase();
        boolean isFree = "FREE".equals(userPlan);
        
        List<BookSermon> gatedSermons = isFree && sermons.size() > 3 
                ? sermons.subList(0, 3) 
                : sermons;

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        
        Map<String, Object> data = new HashMap<>();
        data.put("sermons", gatedSermons);
        data.put("plan", userPlan);
        data.put("totalAvailable", sermons.size());
        
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Trigger manual background refresh for a book
     */
    @PostMapping("/{book}/refresh")
    public ResponseEntity<Map<String, Object>> refreshSermons(@PathVariable String book) {
        try {
            List<BookSermon> sermons = sermonService.forceRefresh(book);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", sermons);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
