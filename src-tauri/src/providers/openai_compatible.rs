use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<i64>,
    pub stream: bool,
}

#[derive(Debug, Deserialize)]
pub struct StreamChunkChoice {
    pub delta: Option<StreamDelta>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StreamDelta {
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StreamChunkResponse {
    pub choices: Option<Vec<StreamChunkChoice>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectionTestResult {
    pub success: bool,
    pub latency_ms: u128,
    pub message: String,
    pub models_found: Vec<String>,
}

pub struct OpenAIClient {
    client: reqwest::Client,
}

impl OpenAIClient {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(180))
            .build()
            .unwrap_or_default();
        Self { client }
    }

    pub async fn test_connection(
        &self,
        base_url: &str,
        api_key: &str,
        model_name: Option<&str>,
    ) -> ConnectionTestResult {
        let start = Instant::now();
        let normalized_url = base_url.trim_end_matches('/');

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        if !api_key.trim().is_empty() {
            let auth_val = format!("Bearer {}", api_key.trim());
            if let Ok(hv) = HeaderValue::from_str(&auth_val) {
                headers.insert(AUTHORIZATION, hv);
            }
        }

        // 1. Try GET /models first
        let models_url = format!("{}/models", normalized_url);
        let models_resp = self.client.get(&models_url).headers(headers.clone()).send().await;

        let mut discovered_models = Vec::new();
        if let Ok(resp) = models_resp {
            if resp.status().is_success() {
                if let Ok(body) = resp.json::<serde_json::Value>().await {
                    if let Some(data) = body.get("data").and_then(|d| d.as_array()) {
                        for item in data {
                            if let Some(id_str) = item.get("id").and_then(|i| i.as_str()) {
                                discovered_models.push(id_str.to_string());
                            }
                        }
                    }
                }
                let latency = start.elapsed().as_millis();
                return ConnectionTestResult {
                    success: true,
                    latency_ms: latency,
                    message: format!("连接成功！检测到 {} 个可用模型", discovered_models.len()),
                    models_found: discovered_models,
                };
            }
        }

        // 2. If /models is not supported or failed, try minimal /chat/completions ping
        let chat_url = format!("{}/chat/completions", normalized_url);
        let target_model = model_name.unwrap_or("gpt-4o-mini");
        let ping_body = ChatCompletionRequest {
            model: target_model.to_string(),
            messages: vec![ChatMessage {
                role: "user".to_string(),
                content: "ping".to_string(),
            }],
            temperature: Some(0.1),
            max_tokens: Some(5),
            stream: false,
        };

        match self.client.post(&chat_url).headers(headers).json(&ping_body).send().await {
            Ok(resp) => {
                let latency = start.elapsed().as_millis();
                if resp.status().is_success() {
                    ConnectionTestResult {
                        success: true,
                        latency_ms: latency,
                        message: format!("模型响应正常！端点 {} 已激活", target_model),
                        models_found: vec![target_model.to_string()],
                    }
                } else {
                    let err_code = resp.status();
                    let err_text = resp.text().await.unwrap_or_default();
                    ConnectionTestResult {
                        success: false,
                        latency_ms: latency,
                        message: format!("HTTP {}: {}", err_code, err_text),
                        models_found: Vec::new(),
                    }
                }
            }
            Err(e) => {
                let latency = start.elapsed().as_millis();
                ConnectionTestResult {
                    success: false,
                    latency_ms: latency,
                    message: format!("网络连接失败: {}", e),
                    models_found: Vec::new(),
                }
            }
        }
    }

    pub async fn stream_chat_completion<F>(
        &self,
        base_url: &str,
        api_key: &str,
        request: ChatCompletionRequest,
        mut on_chunk: F,
    ) -> Result<String, String>
    where
        F: FnMut(&str) -> Result<(), String> + Send + 'static,
    {
        let normalized_url = base_url.trim_end_matches('/');
        let chat_url = format!("{}/chat/completions", normalized_url);

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        if !api_key.trim().is_empty() {
            let auth_val = format!("Bearer {}", api_key.trim());
            if let Ok(hv) = HeaderValue::from_str(&auth_val) {
                headers.insert(AUTHORIZATION, hv);
            }
        }

        let response = self
            .client
            .post(&chat_url)
            .headers(headers)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("请求发送失败: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("接口返回错误 (HTTP {}): {}", status, body));
        }

        let mut stream = response.bytes_stream().eventsource();
        let mut full_text = String::new();

        while let Some(item) = stream.next().await {
            match item {
                Ok(event) => {
                    let data = event.data.trim();
                    if data == "[DONE]" {
                        break;
                    }
                    if let Ok(chunk_resp) = serde_json::from_str::<StreamChunkResponse>(data) {
                        if let Some(choices) = chunk_resp.choices {
                            for choice in choices {
                                if let Some(delta) = choice.delta {
                                    if let Some(content) = delta.content {
                                        full_text.push_str(&content);
                                        on_chunk(&content)?;
                                    }
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    return Err(format!("流式传输异常: {}", e));
                }
            }
        }

        Ok(full_text)
    }

    pub async fn chat_completion(
        &self,
        base_url: &str,
        api_key: &str,
        request: ChatCompletionRequest,
    ) -> Result<String, String> {
        let normalized_url = base_url.trim_end_matches('/');
        let chat_url = format!("{}/chat/completions", normalized_url);

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        if !api_key.trim().is_empty() {
            let auth_val = format!("Bearer {}", api_key.trim());
            if let Ok(hv) = HeaderValue::from_str(&auth_val) {
                headers.insert(AUTHORIZATION, hv);
            }
        }

        let mut req = request;
        req.stream = false;

        let response = self
            .client
            .post(&chat_url)
            .headers(headers)
            .json(&req)
            .send()
            .await
            .map_err(|e| format!("请求发送失败: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("接口返回错误 (HTTP {}): {}", status, body));
        }

        let val: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("解析响应 JSON 失败: {}", e))?;
        if let Some(choices) = val.get("choices").and_then(|c| c.as_array()) {
            if let Some(first) = choices.first() {
                if let Some(content) = first
                    .get("message")
                    .and_then(|m| m.get("content"))
                    .and_then(|c| c.as_str())
                {
                    return Ok(content.to_string());
                }
            }
        }

        Err("返回结果中未包含有效 message content".to_string())
    }
}
