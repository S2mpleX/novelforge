use chrono::Utc;
use std::fs::File;
use std::io::Write;
use std::path::Path;

use crate::models::{Chapter, Novel, Volume};

/// 标准 IEEE 802.3 CRC-32 计算
pub fn calculate_crc32(data: &[u8]) -> u32 {
    let mut crc = 0xFFFFFFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            if crc & 1 != 0 {
                crc = (crc >> 1) ^ 0xEDB88320;
            } else {
                crc >>= 1;
            }
        }
    }
    !crc
}

/// XML / XHTML 字符实体转义
pub fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

/// 单行元数据转义（过滤换行回车符，防止破坏 XML/NCX 单行标签结构）
pub fn xml_escape_single_line(s: &str) -> String {
    let single = s.replace(['\r', '\n'], " ");
    xml_escape(single.trim())
}

struct ZipEntry {
    name: String,
    data: Vec<u8>,
}

/// 纯原生轻量 ZIP 打包器 (EPUB 3 规范专用: Stored 模式保证极致兼容性与速度)
pub struct SimpleZipWriter {
    entries: Vec<ZipEntry>,
}

impl SimpleZipWriter {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    pub fn add_file(&mut self, name: &str, data: Vec<u8>) {
        self.entries.push(ZipEntry {
            name: name.to_string(),
            data,
        });
    }

    pub fn finish(self) -> Vec<u8> {
        let mut buffer = Vec::new();
        let mut central_dir = Vec::new();
        let count = self.entries.len() as u16;

        for entry in self.entries {
            let offset = buffer.len() as u32;
            let name_bytes = entry.name.as_bytes();
            let data_bytes = &entry.data;
            let crc = calculate_crc32(data_bytes);
            let size = data_bytes.len() as u32;

            // --- Local File Header (30 字节) ---
            buffer.extend_from_slice(&0x04034b50u32.to_le_bytes()); // Local header signature
            buffer.extend_from_slice(&20u16.to_le_bytes()); // Version needed (2.0)
            buffer.extend_from_slice(&0x0800u16.to_le_bytes()); // UTF-8 filename flag
            buffer.extend_from_slice(&0u16.to_le_bytes()); // Compression method (0 = Stored)
            buffer.extend_from_slice(&0x6000u16.to_le_bytes()); // Last mod time (12:00:00)
            buffer.extend_from_slice(&0x5C21u16.to_le_bytes()); // Last mod date (2026-01-01)
            buffer.extend_from_slice(&crc.to_le_bytes()); // CRC-32
            buffer.extend_from_slice(&size.to_le_bytes()); // Compressed size
            buffer.extend_from_slice(&size.to_le_bytes()); // Uncompressed size
            buffer.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes()); // Filename length
            buffer.extend_from_slice(&0u16.to_le_bytes()); // Extra field length
            buffer.extend_from_slice(name_bytes);
            buffer.extend_from_slice(data_bytes);

            // --- Central Directory Header (46 字节) ---
            central_dir.extend_from_slice(&0x02014b50u32.to_le_bytes()); // Central dir signature
            central_dir.extend_from_slice(&20u16.to_le_bytes()); // Version made by
            central_dir.extend_from_slice(&20u16.to_le_bytes()); // Version needed
            central_dir.extend_from_slice(&0x0800u16.to_le_bytes()); // UTF-8 flag
            central_dir.extend_from_slice(&0u16.to_le_bytes()); // Compression method
            central_dir.extend_from_slice(&0x6000u16.to_le_bytes()); // Mod time
            central_dir.extend_from_slice(&0x5C21u16.to_le_bytes()); // Mod date
            central_dir.extend_from_slice(&crc.to_le_bytes()); // CRC-32
            central_dir.extend_from_slice(&size.to_le_bytes()); // Compressed size
            central_dir.extend_from_slice(&size.to_le_bytes()); // Uncompressed size
            central_dir.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes()); // Filename length
            central_dir.extend_from_slice(&0u16.to_le_bytes()); // Extra field length
            central_dir.extend_from_slice(&0u16.to_le_bytes()); // Comment length
            central_dir.extend_from_slice(&0u16.to_le_bytes()); // Disk start
            central_dir.extend_from_slice(&0u16.to_le_bytes()); // Internal file attributes
            central_dir.extend_from_slice(&0u32.to_le_bytes()); // External file attributes
            central_dir.extend_from_slice(&offset.to_le_bytes()); // Relative offset
            central_dir.extend_from_slice(name_bytes);
        }

        let central_dir_offset = buffer.len() as u32;
        let central_dir_size = central_dir.len() as u32;
        buffer.extend_from_slice(&central_dir);

        // --- End of Central Directory Record (22 字节) ---
        buffer.extend_from_slice(&0x06054b50u32.to_le_bytes()); // EOCD signature
        buffer.extend_from_slice(&0u16.to_le_bytes()); // Disk number
        buffer.extend_from_slice(&0u16.to_le_bytes()); // Disk with CD
        buffer.extend_from_slice(&count.to_le_bytes()); // CD records on this disk
        buffer.extend_from_slice(&count.to_le_bytes()); // Total CD records
        buffer.extend_from_slice(&central_dir_size.to_le_bytes()); // Size of CD
        buffer.extend_from_slice(&central_dir_offset.to_le_bytes()); // Offset of CD
        buffer.extend_from_slice(&0u16.to_le_bytes()); // Comment length

        buffer
    }
}

/// 导出结果元数据
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EpubExportResult {
    pub file_path: String,
    pub file_size: usize,
    pub chapter_count: usize,
    pub word_count: usize,
    pub title: String,
}

/// 核心 EPUB 3 生成引擎
pub struct EpubBuilder {
    novel: Novel,
    #[allow(dead_code)]
    volumes: Vec<Volume>,
    chapters: Vec<Chapter>,
    author: String,
}

impl EpubBuilder {
    pub fn new(novel: Novel, volumes: Vec<Volume>, chapters: Vec<Chapter>) -> Self {
        Self {
            novel,
            volumes,
            chapters,
            author: "佚名".to_string(),
        }
    }

    pub fn with_author(mut self, author: impl Into<String>) -> Self {
        let a = author.into();
        if !a.trim().is_empty() {
            self.author = a;
        }
        self
    }

    /// 构建符合 IDPF EPUB 3 规范的标准电子书二进制数据
    pub fn build(&self) -> Result<Vec<u8>, String> {
        let mut zip = SimpleZipWriter::new();

        // 1. mimetype (必须且只能是第一项，无压缩，无额外字节)
        zip.add_file("mimetype", b"application/epub+zip".to_vec());

        // 2. META-INF/container.xml
        let container_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"#;
        zip.add_file("META-INF/container.xml", container_xml.as_bytes().to_vec());

        // 3. 样式表 OEBPS/style.css
        let css = self.build_style_css();
        zip.add_file("OEBPS/style.css", css.as_bytes().to_vec());

        // 4. 精美宣纸水墨封面 OEBPS/cover.xhtml
        let cover_xhtml = self.build_cover_xhtml();
        zip.add_file("OEBPS/cover.xhtml", cover_xhtml.as_bytes().to_vec());

        // 5. 生成各个章节的 XHTML 页面
        for (idx, ch) in self.chapters.iter().enumerate() {
            let filename = format!("OEBPS/chapters/chapter_{}.xhtml", idx + 1);
            let content = self.build_chapter_xhtml(idx + 1, ch);
            zip.add_file(&filename, content.as_bytes().to_vec());
        }

        // 6. EPUB 3 现代导航文档 OEBPS/nav.xhtml
        let nav_xhtml = self.build_nav_xhtml();
        zip.add_file("OEBPS/nav.xhtml", nav_xhtml.as_bytes().to_vec());

        // 7. EPUB 2/3 兼容层次目录 OEBPS/toc.ncx
        let toc_ncx = self.build_toc_ncx();
        zip.add_file("OEBPS/toc.ncx", toc_ncx.as_bytes().to_vec());

        // 8. 核心元数据与清单 OEBPS/content.opf
        let content_opf = self.build_content_opf();
        zip.add_file("OEBPS/content.opf", content_opf.as_bytes().to_vec());

        Ok(zip.finish())
    }

    /// 将生成的 EPUB 写入物理磁盘文件
    pub fn export_to_file(&self, output_path: Option<String>) -> Result<EpubExportResult, String> {
        let bytes = self.build()?;
        let file_size = bytes.len();

        let path_str = match output_path {
            Some(p) if !p.trim().is_empty() => {
                let trimmed = p.trim();
                if trimmed.contains('\0') {
                    return Err("文件路径包含非法空字符".to_string());
                }
                // 确保扩展名为 .epub
                if !trimmed.to_lowercase().ends_with(".epub") {
                    format!("{}.epub", trimmed)
                } else {
                    trimmed.to_string()
                }
            }
            _ => {
                // 默认写入用户 Documents 或当前工作区
                let raw_cleaned = self.novel.title.replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-', "_");
                let trimmed_title = raw_cleaned.trim_matches('_');
                let safe_title = if trimmed_title.is_empty() {
                    let short_id = if self.novel.id.len() >= 8 { &self.novel.id[..8] } else { "novel" };
                    format!("novel_{}", short_id)
                } else {
                    raw_cleaned
                };

                let default_dir = dirs::document_dir()
                    .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from(".")));
                let out_file = default_dir.join(format!("{}.epub", safe_title));
                out_file.to_string_lossy().to_string()
            }
        };

        let path = Path::new(&path_str);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        let mut file = File::create(path).map_err(|e| format!("创建文件失败: {}", e))?;
        file.write_all(&bytes).map_err(|e| format!("写入数据失败: {}", e))?;

        let total_words: usize = self.chapters.iter().map(|c| c.word_count as usize).sum();

        Ok(EpubExportResult {
            file_path: path_str,
            file_size,
            chapter_count: self.chapters.len(),
            word_count: total_words,
            title: self.novel.title.clone(),
        })
    }

    fn build_style_css(&self) -> String {
        r#"@charset "UTF-8";
@page {
    margin: 24pt 18pt;
}

body {
    margin: 0;
    padding: 0 1em;
    font-family: "PingFang SC", "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", "SimSun", serif;
    font-size: 1.05em;
    line-height: 1.85;
    color: #242424;
    background-color: #faf8f5;
    text-align: justify;
}

.cover-container {
    text-align: center;
    padding: 3em 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
}

.cover-border {
    border: 3px double #8c7b6c;
    border-radius: 8px;
    padding: 3em 2em;
    width: 85%;
    max-width: 480px;
    margin: 0 auto;
    background-color: #fffdfa;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.cover-badge {
    font-size: 0.85em;
    color: #8c7b6c;
    letter-spacing: 4px;
    margin-bottom: 2em;
    font-weight: 500;
}

.cover-title {
    font-size: 2.2em;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: 3px;
    margin: 0.6em 0;
    line-height: 1.3;
}

.cover-divider {
    width: 60px;
    height: 2px;
    background-color: #a89f91;
    margin: 1.5em auto;
}

.cover-author {
    font-size: 1.15em;
    color: #4a4a4a;
    letter-spacing: 2px;
    margin: 1em 0;
}

.cover-desc {
    font-size: 0.9em;
    color: #666;
    line-height: 1.6;
    margin-top: 2em;
    text-align: left;
    text-indent: 2em;
}

.cover-footer {
    margin-top: 3em;
    font-size: 0.8em;
    color: #999;
    letter-spacing: 1px;
}

.chapter-header {
    text-align: center;
    margin: 2.5em 0 2em 0;
    padding-bottom: 1.2em;
    border-bottom: 1px dashed #d1c7b8;
}

.chapter-number {
    font-size: 0.9em;
    color: #8c7b6c;
    letter-spacing: 2px;
    display: block;
    margin-bottom: 0.4em;
}

.chapter-title {
    font-size: 1.5em;
    font-weight: 700;
    color: #1c1c1c;
    margin: 0.2em 0;
    letter-spacing: 1.5px;
}

.chapter-meta {
    font-size: 0.8em;
    color: #888;
    margin-top: 0.5em;
}

p {
    text-indent: 2em;
    margin: 0.8em 0;
    word-break: break-all;
}

.nav-title {
    text-align: center;
    font-size: 1.6em;
    margin: 2em 0 1em 0;
}

ol.toc-list {
    list-style-type: none;
    padding-left: 0;
    max-width: 600px;
    margin: 0 auto;
}

ol.toc-list li {
    padding: 0.6em 0;
    border-bottom: 1px dotted #e6dfd5;
}

ol.toc-list li a {
    color: #2b2b2b;
    text-decoration: none;
    display: flex;
    justify-content: space-between;
}

ol.toc-list li a:hover {
    color: #b33924;
}

@media (prefers-color-scheme: dark) {
    body {
        background-color: #14161a;
        color: #d1d5db;
    }
    .cover-border {
        background-color: #1a1d24;
        border-color: #4b5563;
    }
    .cover-title {
        color: #f3f4f6;
    }
    .chapter-title {
        color: #f3f4f6;
    }
    ol.toc-list li a {
        color: #e5e7eb;
    }
}
"#.to_string()
    }

    fn build_cover_xhtml(&self) -> String {
        let title = xml_escape_single_line(&self.novel.title);
        let author = xml_escape_single_line(&self.author);
        let desc = if self.novel.description.trim().is_empty() { "暂无简介" } else { &self.novel.description };
        let desc_escaped = xml_escape(desc);

        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN" lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <title>{} - 封面</title>
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
    <div class="cover-container">
        <div class="cover-border">
            <div class="cover-badge">✦ NOVELFORGE AI 典藏版 ✦</div>
            <h1 class="cover-title">{}</h1>
            <div class="cover-divider"></div>
            <div class="cover-author">著 / {}</div>
            <div class="cover-desc">{}</div>
            <div class="cover-footer">由 NovelForge AI 智能创作引擎生成排版</div>
        </div>
    </div>
</body>
</html>"#,
            title, title, author, desc_escaped
        )
    }

    fn build_chapter_xhtml(&self, _index: usize, chapter: &Chapter) -> String {
        let ch_title = xml_escape_single_line(&chapter.title);
        let content = chapter.content.as_deref().unwrap_or_default();
        
        let mut paragraphs = String::new();
        for line in content.lines() {
            let trimmed = line.trim();
            if !trimmed.is_empty() {
                paragraphs.push_str(&format!("    <p>{}</p>\n", xml_escape(trimmed)));
            }
        }

        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN" lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <title>第 {} 章 {}</title>
    <link rel="stylesheet" type="text/css" href="../style.css" />
</head>
<body>
    <header class="chapter-header">
        <span class="chapter-number">第 {} 章</span>
        <h2 class="chapter-title">{}</h2>
        <div class="chapter-meta">全文字数：{} 字</div>
    </header>
    <main class="chapter-content">
{}
    </main>
</body>
</html>"#,
            chapter.chapter_number, ch_title, chapter.chapter_number, ch_title, chapter.word_count, paragraphs
        )
    }

    fn build_nav_xhtml(&self) -> String {
        let title = xml_escape_single_line(&self.novel.title);
        let mut list_items = String::new();

        for (idx, ch) in self.chapters.iter().enumerate() {
            list_items.push_str(&format!(
                r#"        <li><a href="chapters/chapter_{}.xhtml">第 {} 章 {}</a></li>
"#,
                idx + 1,
                ch.chapter_number,
                xml_escape_single_line(&ch.title)
            ));
        }

        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN" lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <title>目录 - {}</title>
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
    <nav epub:type="toc" id="toc">
        <h1 class="nav-title">目 录</h1>
        <ol class="toc-list">
            <li><a href="cover.xhtml">封面 / 扉页</a></li>
{}
        </ol>
    </nav>
</body>
</html>"#,
            title, list_items
        )
    }

    fn build_toc_ncx(&self) -> String {
        let title = xml_escape_single_line(&self.novel.title);
        let uuid = xml_escape(&self.novel.id);
        let mut nav_points = String::new();

        nav_points.push_str(r#"    <navPoint id="navpoint-cover" playOrder="1">
        <navLabel><text>封面</text></navLabel>
        <content src="cover.xhtml"/>
    </navPoint>
"#);

        for (idx, ch) in self.chapters.iter().enumerate() {
            let play_order = idx + 2;
            nav_points.push_str(&format!(
                r#"    <navPoint id="navpoint-{}" playOrder="{}">
        <navLabel><text>第 {} 章 {}</text></navLabel>
        <content src="chapters/chapter_{}.xhtml"/>
    </navPoint>
"#,
                play_order,
                play_order,
                ch.chapter_number,
                xml_escape_single_line(&ch.title),
                idx + 1
            ));
        }

        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
    <meta name="dtb:uid" content="urn:uuid:{}"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>{}</text></docTitle>
<navMap>
{}
</navMap>
</ncx>"#,
            uuid, title, nav_points
        )
    }

    fn build_content_opf(&self) -> String {
        let title = xml_escape_single_line(&self.novel.title);
        let author = xml_escape_single_line(&self.author);
        let uuid = xml_escape(&self.novel.id);
        let desc = if self.novel.description.trim().is_empty() { "由 NovelForge AI 智能生成" } else { &self.novel.description };
        let desc_escaped = xml_escape(desc);
        let date_str = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

        let mut manifest_items = String::new();
        let mut spine_items = String::new();

        // 基础文件
        manifest_items.push_str(r#"    <item id="style" href="style.css" media-type="text/css"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
"#);

        spine_items.push_str(r#"    <itemref idref="cover"/>
    <itemref idref="nav"/>
"#);

        // 章节文件
        for (idx, _) in self.chapters.iter().enumerate() {
            let item_id = format!("chap_{}", idx + 1);
            let href = format!("chapters/chapter_{}.xhtml", idx + 1);
            manifest_items.push_str(&format!(
                r#"    <item id="{}" href="{}" media-type="application/xhtml+xml"/>
"#,
                item_id, href
            ));
            spine_items.push_str(&format!(
                r#"    <itemref idref="{}"/>
"#,
                item_id
            ));
        }

        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="zh-CN">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:{}</dc:identifier>
    <dc:title>{}</dc:title>
    <dc:creator>{}</dc:creator>
    <dc:language>zh-CN</dc:language>
    <dc:description>{}</dc:description>
    <dc:publisher>NovelForge AI</dc:publisher>
    <meta property="dcterms:modified">{}</meta>
</metadata>
<manifest>
{}
</manifest>
<spine toc="ncx">
{}
</spine>
<guide>
    <reference type="cover" title="封面" href="cover.xhtml"/>
    <reference type="toc" title="目录" href="nav.xhtml"/>
</guide>
</package>"#,
            uuid, title, author, desc_escaped, date_str, manifest_items, spine_items
        )
    }
}
