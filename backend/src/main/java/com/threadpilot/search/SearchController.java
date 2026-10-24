package com.threadpilot.search;

import com.threadpilot.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<ApiResponse<SearchService.SearchResults>> search(@RequestParam String q) {
        SearchService.SearchResults results = searchService.search(q);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}

