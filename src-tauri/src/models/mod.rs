use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Novel {
    pub id: String,
    pub title: String,
    pub description: String,
    pub genre_profile: String,
    pub language: String,
    pub writing_style: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub chapter_count: Option<i64>,
    pub total_word_count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNovelInput {
    pub title: String,
    pub description: Option<String>,
    pub genre_profile: Option<String>,
    pub language: Option<String>,
    pub writing_style: Option<String>,
    pub chapter_target_length: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Volume {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub order_index: i64,
    pub summary: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub novel_id: String,
    pub volume_id: Option<String>,
    pub chapter_number: i64,
    pub title: String,
    pub status: String,
    pub active_version_id: Option<String>,
    pub word_count: i64,
    pub content: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateChapterInput {
    pub novel_id: String,
    pub volume_id: Option<String>,
    pub chapter_number: Option<i64>,
    pub title: String,
    pub initial_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterVersion {
    pub id: String,
    pub chapter_id: String,
    pub version_number: i64,
    pub content: String,
    pub source_type: String,
    pub created_by: String,
    pub content_hash: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub novel_id: String,
    pub name: String,
    pub aliases: String,
    pub profile: String,
    pub personality: String,
    pub background: String,
    pub motivation: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterInput {
    pub novel_id: String,
    pub name: String,
    pub aliases: Option<String>,
    pub profile: Option<String>,
    pub personality: Option<String>,
    pub background: Option<String>,
    pub motivation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldRule {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub rule_content: String,
    pub authority_level: String,
    pub status: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorldRuleInput {
    pub novel_id: String,
    pub title: String,
    pub rule_content: String,
    pub authority_level: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlotThread {
    pub id: String,
    pub novel_id: String,
    pub title: String,
    pub description: String,
    pub introduced_chapter_id: Option<String>,
    pub expected_resolution: String,
    pub resolved_chapter_id: Option<String>,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePlotThreadInput {
    pub novel_id: String,
    pub title: String,
    pub description: Option<String>,
    pub introduced_chapter_id: Option<String>,
    pub expected_resolution: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiProvider {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub base_url: String,
    pub api_key: String,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveProviderInput {
    pub id: Option<String>,
    pub name: String,
    pub provider_type: String,
    pub base_url: String,
    pub api_key: String,
    pub is_active: bool,
    pub models: Vec<AiModelInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModel {
    pub id: String,
    pub provider_id: String,
    pub model_name: String,
    pub display_name: String,
    pub context_window: i64,
    pub max_output_tokens: i64,
    pub is_default: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModelInput {
    pub id: Option<String>,
    pub model_name: String,
    pub display_name: String,
    pub context_window: Option<i64>,
    pub max_output_tokens: Option<i64>,
    pub is_default: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateStreamInput {
    pub novel_id: String,
    pub chapter_id: String,
    pub instruction: String,
    pub context_mode: Option<String>, // 'CONTINUE', 'POLISH', 'SCENE', 'OUTLINE'
    pub current_content: Option<String>,
    pub model_id: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunkPayload {
    pub chapter_id: String,
    pub chunk: String,
    pub is_done: bool,
    pub error: Option<String>,
}
