package com.threadpilot.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NvidiaAIProvider implements AIProvider {

    private final ObjectMapper objectMapper;

    @Value("${threadpilot.ai.nvidia.api-key:}")
    private String apiKey;

    @Value("${threadpilot.ai.nvidia.base-url:https://integrate.api.nvidia.com/v1}")
    private String baseUrl;

    @Value("${threadpilot.ai.nvidia.model:nvidia/nemotron-3-ultra-550b-a55b}")
    private String model;

    @Value("${threadpilot.ai.nvidia.timeout:30000}")
    private int timeout;

    @Override
    public String getName() {
        return "nvidia";
    }

    @Override
    public String getDefaultModel() {
        return model;
    }

    @Override
    public AIChatResponse chat(AIChatRequest request) {
        validateConfiguration();

try (CloseableHttpClient httpClient = HttpClients.createDefault()) {

            HttpPost httpPost = new HttpPost(baseUrl + "/chat/completions");
            httpPost.setHeader("Authorization", "Bearer " + apiKey);
            httpPost.setHeader("Content-Type", "application/json");

            ObjectNode jsonRequest = objectMapper.createObjectNode();
            jsonRequest.put("model", request.model() != null ? request.model() : model);
            jsonRequest.put("temperature", request.temperature() != null ? request.temperature() : 0.7);
            jsonRequest.put("max_tokens", request.maxTokens() != null ? request.maxTokens() : 2000);

            ArrayNode messagesArray = objectMapper.createArrayNode();
            for (AIMessage msg : request.messages()) {
                ObjectNode msgNode = objectMapper.createObjectNode();
                msgNode.put("role", msg.role());
                msgNode.put("content", msg.content());
                if (msg.toolCallId() != null) {
                    msgNode.put("tool_call_id", msg.toolCallId());
                }
                if (msg.name() != null) {
                    msgNode.put("name", msg.name());
                }
                messagesArray.add(msgNode);
            }
            jsonRequest.set("messages", messagesArray);

            if (request.tools() != null && !request.tools().isEmpty()) {
                ArrayNode toolsArray = objectMapper.createArrayNode();
                for (AITool tool : request.tools()) {
                    ObjectNode toolNode = objectMapper.createObjectNode();
                    toolNode.put("type", tool.type());
                    ObjectNode funcNode = objectMapper.createObjectNode();
                    funcNode.put("name", tool.function().name());
                    funcNode.put("description", tool.function().description());
                    funcNode.set("parameters", objectMapper.valueToTree(tool.function().parameters()));
                    toolNode.set("function", funcNode);
                    toolsArray.add(toolNode);
                }
                jsonRequest.set("tools", toolsArray);
                if (request.toolChoice() != null) {
                    jsonRequest.put("tool_choice", request.toolChoice());
                }
            }

            httpPost.setEntity(new StringEntity(jsonRequest.toString(), ContentType.APPLICATION_JSON));

            var response = httpClient.execute(httpPost);
            String responseBody = EntityUtils.toString(response.getEntity());
            int statusCode = response.getCode();

            if (statusCode >= 400) {
                log.error("NVIDIA API error: {} - {}", statusCode, responseBody);
                throw new RuntimeException("NVIDIA API error: " + statusCode + " - " + responseBody);
            }

            JsonNode responseJson = objectMapper.readTree(responseBody);

            String id = responseJson.path("id").asText();
            String model = responseJson.path("model").asText();
            int promptTokens = responseJson.path("usage").path("prompt_tokens").asInt();
            int completionTokens = responseJson.path("usage").path("completion_tokens").asInt();
            int totalTokens = responseJson.path("usage").path("total_tokens").asInt();

            ArrayNode choicesArray = (ArrayNode) responseJson.path("choices");
            List<AIChoice> choices = new java.util.ArrayList<>();
            for (JsonNode choiceNode : choicesArray) {
                JsonNode messageNode = choiceNode.path("message");
                AIMessage message = new AIMessage(
                        messageNode.path("role").asText(),
                        messageNode.path("content").asText(),
                        null,
                        null
                );
                choices.add(new AIChoice(
                        choiceNode.path("index").asInt(),
                        message,
                        choiceNode.path("finish_reason").asText()
                ));
            }

            return new AIChatResponse(id, model, choices, new AIUsage(promptTokens, completionTokens, totalTokens));

} catch (IOException e) {
            log.error("Error calling NVIDIA API", e);
            throw new RuntimeException("Failed to call NVIDIA API", e);
        } catch (org.apache.hc.core5.http.ParseException e) {
            log.error("Error parsing NVIDIA API response", e);
            throw new RuntimeException("Failed to parse NVIDIA API response", e);
        }
    }

    @Override
    public AIRecommendationResponse generateRecommendation(AIRecommendationRequest request) {
        String systemPrompt = "You are a business analyst for a hosiery wholesale/retail business. " +
                "Generate a specific, actionable recommendation based on the provided business context. " +
                "Return your response as a JSON object with fields: recommendation, explanation, confidence (0-1), supportingData.";

AIChatRequest chatRequest = new AIChatRequest(
                List.of(
                        new AIMessage("system", systemPrompt, null, null),
                        new AIMessage("user", "Business Context:\n" + request.context() + "\n\nRecommendation Type: " + request.recommendationType(), null, null)
                ),
                request.model() != null ? request.model() : model,
                request.temperature() != null ? request.temperature() : 0.3,
                1000,
                null,
                null
        );

        AIChatResponse response = chat(chatRequest);
        String content = response.choices().get(0).message().content();

        try {
            JsonNode json = objectMapper.readTree(content);
            return new AIRecommendationResponse(
                    json.path("recommendation").asText(),
                    json.path("explanation").asText(),
                    json.path("confidence").asDouble(),
                    json.path("supportingData").asText()
            );
        } catch (IOException e) {
            log.warn("Failed to parse recommendation JSON, returning raw content");
            return new AIRecommendationResponse(content, "Generated by AI", 0.7, "");
        }
    }

    @Override
    public AIAnalysisResponse analyzeBusinessContext(AIAnalysisRequest request) {
        String systemPrompt = "You are a business analyst for a hosiery wholesale/retail business. " +
                "Analyze the provided business context and answer the question. " +
                "Return your response as a JSON object with fields: analysis, dataSources (array), confidence (0-1).";

AIChatRequest chatRequest = new AIChatRequest(
                List.of(
                        new AIMessage("system", systemPrompt, null, null),
                        new AIMessage("user", "Business Context:\n" + request.context() + "\n\nQuestion: " + request.question(), null, null)
                ),
                request.model() != null ? request.model() : model,
                request.temperature() != null ? request.temperature() : 0.3,
                1500,
                null,
                null
        );

        AIChatResponse response = chat(chatRequest);
        String content = response.choices().get(0).message().content();

        try {
            JsonNode json = objectMapper.readTree(content);
            List<String> dataSources = new java.util.ArrayList<>();
            if (json.has("dataSources") && json.get("dataSources").isArray()) {
                for (JsonNode source : json.get("dataSources")) {
                    dataSources.add(source.asText());
                }
            }
            return new AIAnalysisResponse(
                    json.path("analysis").asText(),
                    dataSources,
                    json.path("confidence").asDouble()
            );
        } catch (IOException e) {
            log.warn("Failed to parse analysis JSON, returning raw content");
            return new AIAnalysisResponse(content, List.of("AI analysis"), 0.7);
        }
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public void validateConfiguration() {
        if (!isAvailable()) {
            throw new IllegalStateException("NVIDIA API key not configured. Set NVIDIA_API_KEY environment variable.");
        }
    }
}

