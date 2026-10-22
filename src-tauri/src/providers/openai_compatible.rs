use eventsource_stream::Eventsource;
use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use crate::models::GenerateImageResult;

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

    pub async fn vision_chat_completion(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
        system_prompt: &str,
        user_prompt: &str,
        image_url: &str,
        max_tokens: Option<i64>,
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

        let payload = serde_json::json!({
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.4,
            "max_tokens": max_tokens.unwrap_or(1500),
            "stream": false
        });

        let response = self
            .client
            .post(&chat_url)
            .headers(headers)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("识图请求发送失败: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("视觉接口返回错误 (HTTP {}): {}", status, body));
        }

        let val: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("解析视觉响应 JSON 失败: {}", e))?;
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

        Err("视觉接口返回结果中未包含有效 message content".to_string())
    }

    pub async fn generate_image(
        &self,
        base_url: &str,
        api_key: &str,
        model: &str,
        prompt: &str,
        size: Option<&str>,
        style: Option<&str>,
        response_format: Option<&str>,
    ) -> Result<GenerateImageResult, String> {
        let normalized_url = base_url.trim_end_matches('/');
        let images_url = if normalized_url.ends_with("/images/generations") {
            normalized_url.to_string()
        } else if normalized_url.ends_with("/v1") || normalized_url.contains("/v1/") {
            format!("{}/images/generations", normalized_url)
        } else {
            format!("{}/v1/images/generations", normalized_url)
        };

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        if !api_key.trim().is_empty() {
            let auth_val = format!("Bearer {}", api_key.trim());
            if let Ok(hv) = HeaderValue::from_str(&auth_val) {
                headers.insert(AUTHORIZATION, hv);
            }
        }

        let mut payload_map = serde_json::Map::new();
        payload_map.insert("model".to_string(), serde_json::Value::String(model.to_string()));
        payload_map.insert("prompt".to_string(), serde_json::Value::String(prompt.to_string()));
        payload_map.insert("n".to_string(), serde_json::json!(1));
        if let Some(s) = size {
            payload_map.insert("size".to_string(), serde_json::Value::String(s.to_string()));
        }
        if let Some(st) = style {
            payload_map.insert("style".to_string(), serde_json::Value::String(st.to_string()));
        }
        if let Some(rf) = response_format {
            payload_map.insert("response_format".to_string(), serde_json::Value::String(rf.to_string()));
        }

        let response = self
            .client
            .post(&images_url)
            .headers(headers)
            .json(&serde_json::Value::Object(payload_map))
            .send()
            .await
            .map_err(|e| format!("生图请求网络发送失败: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("绘图接口返回错误 (HTTP {}): {}", status, body));
        }

        let val: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("解析绘图响应 JSON 失败: {}", e))?;

        // 检查服务商返回的业务错误（部分网关在 HTTP 200 下返回 error 对象）
        if let Some(err_obj) = val.get("error") {
            let msg = if let Some(m) = err_obj.get("message").and_then(|m| m.as_str()) {
                m.to_string()
            } else if let Some(m) = err_obj.as_str() {
                m.to_string()
            } else {
                err_obj.to_string()
            };
            return Err(format!("绘图接口返回业务错误: {}", msg));
        }

        // 尝试从标准 data 数组提取 (OpenAI / SiliconFlow / OneAPI / CogView)
        if let Some(data) = val.get("data").and_then(|d| d.as_array()) {
            if let Some(first) = data.first() {
                let revised = first.get("revised_prompt").and_then(|r| r.as_str()).map(|s| s.to_string());
                let b64_candidate = first.get("b64_json")
                    .or_else(|| first.get("b64"))
                    .or_else(|| first.get("image"))
                    .and_then(|b| b.as_str());

                if let Some(b64) = b64_candidate {
                    let full_data_url = if b64.starts_with("data:image") {
                        b64.to_string()
                    } else {
                        format!("data:image/png;base64,{}", b64)
                    };
                    return Ok(GenerateImageResult {
                        image_url: full_data_url,
                        b64_json: Some(b64.to_string()),
                        revised_prompt: revised,
                        model: model.to_string(),
                    });
                }
                if let Some(url) = first.get("url").and_then(|u| u.as_str()) {
                    return Ok(GenerateImageResult {
                        image_url: url.to_string(),
                        b64_json: None,
                        revised_prompt: revised,
                        model: model.to_string(),
                    });
                }
            }
        }

        // 尝试从 images 数组提取 (部分兼容 SD WebUI / ComfyUI 网关)
        if let Some(images) = val.get("images").and_then(|i| i.as_array()) {
            if let Some(first) = images.first() {
                if let Some(url_or_b64) = first.as_str() {
                    let final_url = if url_or_b64.starts_with("http") || url_or_b64.starts_with("data:image") {
                        url_or_b64.to_string()
                    } else {
                        format!("data:image/png;base64,{}", url_or_b64)
                    };
                    return Ok(GenerateImageResult {
                        image_url: final_url,
                        b64_json: None,
                        revised_prompt: None,
                        model: model.to_string(),
                    });
                } else if let Some(url) = first.get("url").and_then(|u| u.as_str()) {
                    return Ok(GenerateImageResult {
                        image_url: url.to_string(),
                        b64_json: None,
                        revised_prompt: None,
                        model: model.to_string(),
                    });
                }
            }
        }

        // 检查根层级的 message 错误信息
        if let Some(msg) = val.get("message").and_then(|m| m.as_str()) {
            return Err(format!("绘图接口返回错误: {}", msg));
        }

        Err("绘图服务返回成功，但未解析到有效的图片 URL 或 Base64 数据".to_string())
    }
}
