package com.threadpilot.copilot;

import com.threadpilot.ai.AIProvider;
import com.threadpilot.ai.AIProviderFactory;
import com.threadpilot.copilot.ConversationStatus;
import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/copilot")
@RequiredArgsConstructor
public class CopilotController {

    private final CopilotService copilotService;
    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final AIProviderFactory aiProviderFactory;

    @GetMapping("/provider")
    public ResponseEntity<ApiResponse<ProviderInfo>> getProviderInfo() {
        AIProvider provider = aiProviderFactory.getDefaultProvider();
        return ResponseEntity.ok(ApiResponse.success(new ProviderInfo(
                provider.getName(),
                provider.isAvailable(),
                provider.getDefaultModel()
        )));
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderInfo {
        private String name;
        private boolean available;
        private String model;
    }

@PostMapping("/chat")
    public ResponseEntity<ApiResponse<CopilotService.CopilotResponse>> chat(
            @RequestBody ChatRequest request
    ) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Message is required"));
        }
        UUID conversationId = null;
        if (request.getConversationId() != null) {
            try {
                conversationId = UUID.fromString(request.getConversationId());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid conversationId format"));
            }
        }
        CopilotService.CopilotResponse response = copilotService.chat(conversationId, request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

@GetMapping("/conversations")
    public ResponseEntity<ApiResponse<PageResponse<AIConversation>>> getConversations(PaginationRequest request) {
        UUID userId = com.threadpilot.security.TenantContext.getUserId();
        var page = conversationRepository.findActiveByUserId(userId, request.toPageable());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(page)));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<AIConversation>> getConversation(@PathVariable UUID id) {
        AIConversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new com.threadpilot.common.exception.ResourceNotFoundException("Conversation", id));
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<AIMessage>>> getMessages(@PathVariable UUID id) {
        List<AIMessage> messages = messageRepository.findByConversationIdOrderByCreatedAt(id);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<AIConversation>> createConversation(@RequestBody CreateConversationRequest request) {
        UUID userId = com.threadpilot.security.TenantContext.getUserId();
        UUID orgId = com.threadpilot.security.TenantContext.getOrganizationId();

AIConversation conversation = AIConversation.builder()
                .title(request.getTitle())
                .status(ConversationStatus.ACTIVE)
                .organization(new com.threadpilot.organization.Organization() {{ setId(orgId); }})
                .user(new com.threadpilot.user.User() {{ setId(userId); }})
                .build();
        conversation = conversationRepository.save(conversation);

        return ResponseEntity.ok(ApiResponse.success(conversation, "Conversation created"));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable UUID id) {
        conversationRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Conversation deleted"));
    }

@Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String message;
        private String conversationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateConversationRequest {
        private String title;
    }
}

