use quick_xml::events::{BytesStart, Event};
use quick_xml::Reader;
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use zip::ZipArchive;

const MAX_XML_BYTES: u64 = 12 * 1024 * 1024;

fn part(archive: &mut ZipArchive<File>, name: &str) -> Result<String, String> {
    let mut entry = archive.by_name(name).map_err(|error| error.to_string())?;
    if entry.size() > MAX_XML_BYTES { return Err("Word 文件内容过大，请拆分后转换".into()); }
    let mut xml = String::new();
    entry.read_to_string(&mut xml).map_err(|error| error.to_string())?;
    Ok(xml)
}

fn attribute(tag: &BytesStart<'_>, name: &[u8]) -> Option<String> {
    tag.attributes().flatten().find(|item| item.key.as_ref() == name)
        .map(|item| String::from_utf8_lossy(&item.value).into_owned())
}

fn enabled(tag: &BytesStart<'_>) -> bool {
    !matches!(attribute(tag, b"w:val").as_deref(), Some("0" | "false" | "off"))
}

fn links(xml: &str) -> HashMap<String, String> {
    let mut result = HashMap::new();
    let mut reader = Reader::from_str(xml);
    loop {
        match reader.read_event() {
            Ok(Event::Start(tag) | Event::Empty(tag)) if tag.local_name().as_ref() == b"Relationship" => {
                if attribute(&tag, b"Type").is_some_and(|value| value.ends_with("/hyperlink")) {
                    if let (Some(id), Some(target)) = (attribute(&tag, b"Id"), attribute(&tag, b"Target")) {
                        result.insert(id, target);
                    }
                }
            }
            Ok(Event::Eof) | Err(_) => break,
            _ => {}
        }
    }
    result
}

fn ordered_lists(xml: &str) -> HashSet<String> {
    let mut reader = Reader::from_str(xml);
    let mut abstract_id = None;
    let mut level = None;
    let mut number_id = None;
    let mut abstract_formats = HashMap::new();
    let mut number_abstract = HashMap::new();
    loop {
        match reader.read_event() {
            Ok(Event::Start(tag) | Event::Empty(tag)) => match tag.local_name().as_ref() {
                b"abstractNum" => abstract_id = attribute(&tag, b"w:abstractNumId"),
                b"lvl" => level = attribute(&tag, b"w:ilvl"),
                b"numFmt" if level.as_deref() == Some("0") => {
                    if let Some(id) = &abstract_id {
                        abstract_formats.insert(id.clone(), attribute(&tag, b"w:val").is_some_and(|value| value != "bullet" && value != "none"));
                    }
                }
                b"num" => number_id = attribute(&tag, b"w:numId"),
                b"abstractNumId" => {
                    if let (Some(id), Some(abstract_id)) = (&number_id, attribute(&tag, b"w:val")) {
                        number_abstract.insert(id.clone(), abstract_id);
                    }
                }
                _ => {}
            },
            Ok(Event::End(tag)) => match tag.local_name().as_ref() {
                b"abstractNum" => abstract_id = None,
                b"lvl" => level = None,
                b"num" => number_id = None,
                _ => {}
            },
            Ok(Event::Eof) | Err(_) => break,
            _ => {}
        }
    }
    number_abstract.into_iter().filter(|(_, abstract_id)| abstract_formats.get(abstract_id) == Some(&true))
        .map(|(number_id, _)| number_id).collect()
}

#[derive(Default)]
struct Paragraph {
    runs: Vec<(String, bool, bool)>,
    heading: usize,
    list_id: Option<String>,
    list_level: usize,
    list_style: bool,
}

fn escape_markdown(text: &str) -> String {
    text.replace('\\', "\\\\").replace('*', "\\*").replace('_', "\\_")
}

fn render_runs(runs: &[(String, bool, bool)]) -> String {
    let mut merged: Vec<(String, bool, bool)> = Vec::new();
    for (text, bold, italic) in runs {
        if let Some(last) = merged.last_mut() {
            if last.1 == *bold && last.2 == *italic { last.0.push_str(text); continue; }
        }
        merged.push((text.clone(), *bold, *italic));
    }
    merged.into_iter().map(|(text, bold, italic)| {
        let escaped = escape_markdown(&text);
        let core = escaped.trim();
        if core.is_empty() || (!bold && !italic) { return escaped; }
        let prefix = &escaped[..escaped.len() - escaped.trim_start().len()];
        let suffix = &escaped[escaped.trim_end().len()..];
        let marker = if bold && italic { "***" } else if bold { "**" } else { "*" };
        format!("{prefix}{marker}{core}{marker}{suffix}")
    }).collect()
}

fn preserve_line_breaks(line: &str) -> String {
    line.split('\n').map(str::trim).filter(|part| !part.is_empty()).collect::<Vec<_>>().join("  \n")
}

fn markdown(xml: &str, rels: &HashMap<String, String>, ordered: &HashSet<String>) -> Result<String, String> {
    let mut reader = Reader::from_str(xml);
    let mut output = String::new();
    let mut paragraph = Paragraph::default();
    let mut bold = false;
    let mut italic = false;
    let mut in_run_properties = false;
    let mut in_text = false;
    let mut table_rows: Vec<Vec<String>> = Vec::new();
    let mut table_row: Vec<String> = Vec::new();
    let mut in_cell = false;
    let mut hyperlink: Option<(usize, String)> = None;
    let mut list_numbers: HashMap<(String, usize), usize> = HashMap::new();
    loop {
        match reader.read_event() {
            Ok(Event::Start(tag) | Event::Empty(tag)) => match tag.local_name().as_ref() {
                b"p" => paragraph = Paragraph::default(),
                b"r" => { bold = false; italic = false; },
                b"rPr" => in_run_properties = true,
                b"b" if in_run_properties => bold = enabled(&tag),
                b"i" if in_run_properties => italic = enabled(&tag),
                b"pStyle" => {
                    let style = attribute(&tag, b"w:val").unwrap_or_default().to_ascii_lowercase();
                    if style.starts_with("heading") || style.starts_with("title") {
                        paragraph.heading = style.chars().last().and_then(|ch| ch.to_digit(10)).unwrap_or(1).clamp(1, 6) as usize;
                    }
                    paragraph.list_style = style.contains("list");
                }
                b"numId" => paragraph.list_id = attribute(&tag, b"w:val").filter(|value| value != "0"),
                b"ilvl" => paragraph.list_level = attribute(&tag, b"w:val").and_then(|value| value.parse().ok()).unwrap_or(0),
                b"t" => in_text = true,
                b"tab" => paragraph.runs.push(("\t".into(), false, false)),
                b"br" => paragraph.runs.push(("\n".into(), false, false)),
                b"tbl" => table_rows.clear(),
                b"tr" => table_row.clear(),
                b"tc" => in_cell = true,
                b"hyperlink" => {
                    if let Some(target) = attribute(&tag, b"r:id").and_then(|id| rels.get(&id).cloned()) {
                        hyperlink = Some((paragraph.runs.len(), target));
                    }
                }
                _ => {}
            },
            Ok(Event::Text(value)) if in_text => {
                let text = value.unescape().map_err(|error| error.to_string())?;
                paragraph.runs.push((text.into_owned(), bold, italic));
            }
            Ok(Event::End(tag)) => match tag.local_name().as_ref() {
                b"t" => in_text = false,
                b"rPr" => in_run_properties = false,
                b"hyperlink" => {
                    if let Some((start, target)) = hyperlink.take() {
                        let label = render_runs(&paragraph.runs[start..]);
                        paragraph.runs.truncate(start);
                        paragraph.runs.push((format!("[{}]({})", label.trim(), target), false, false));
                    }
                }
                b"p" => {
                    let line = preserve_line_breaks(render_runs(&paragraph.runs).trim());
                    if line.is_empty() { continue; }
                    if in_cell { table_row.push(line.replace('|', "\\|").replace('\n', "<br>")); }
                    else if paragraph.heading > 0 { output.push_str(&format!("{} {line}\n\n", "#".repeat(paragraph.heading))); }
                    else if paragraph.list_id.is_some() || paragraph.list_style {
                        let indent = "  ".repeat(paragraph.list_level.min(8));
                        let marker = if let Some(id) = &paragraph.list_id {
                            if ordered.contains(id) {
                                let count = list_numbers.entry((id.clone(), paragraph.list_level)).or_default();
                                *count += 1;
                                format!("{count}.")
                            } else { "-".into() }
                        } else { "-".into() };
                        output.push_str(&format!("{indent}{marker} {line}\n"));
                    } else { output.push_str(&format!("{line}\n\n")); }
                }
                b"tc" => in_cell = false,
                b"tr" => { if !table_row.is_empty() { table_rows.push(std::mem::take(&mut table_row)); } },
                b"tbl" => {
                    if let Some(first) = table_rows.first() {
                        let width = table_rows.iter().map(Vec::len).max().unwrap_or(first.len());
                        for (index, row) in table_rows.iter().enumerate() {
                            output.push_str("| ");
                            for column in 0..width { output.push_str(row.get(column).map(String::as_str).unwrap_or("")); output.push_str(" | "); }
                            output.push('\n');
                            if index == 0 { output.push_str(&format!("|{}\n", " --- |".repeat(width))); }
                        }
                        output.push('\n');
                    }
                }
                _ => {}
            },
            Ok(Event::Eof) => break,
            Err(error) => return Err(format!("Word 文件结构无法解析：{error}")),
            _ => {}
        }
    }
    Ok(output.trim().to_owned())
}

pub fn docx_to_markdown(path: &Path) -> Result<String, String> {
    let mut archive = ZipArchive::new(File::open(path).map_err(|error| error.to_string())?)
        .map_err(|error| format!("Word 文件无法读取：{error}"))?;
    let document = part(&mut archive, "word/document.xml")?;
    let relationships = part(&mut archive, "word/_rels/document.xml.rels").unwrap_or_default();
    let numbering = part(&mut archive, "word/numbering.xml").unwrap_or_default();
    markdown(&document, &links(&relationships), &ordered_lists(&numbering))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preserves_heading_and_inline_formatting() {
        let xml = r#"<w:document xmlns:w="word"><w:body><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>标题</w:t></w:r></w:p><w:p><w:r><w:t>正文 </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>加粗</w:t></w:r></w:p></w:body></w:document>"#;
        assert_eq!(markdown(xml, &HashMap::new(), &HashSet::new()).unwrap(), "## 标题\n\n正文 **加粗**");
    }

    #[test]
    fn disabled_run_formatting_stays_plain() {
        let xml = r#"<w:document xmlns:w="word"><w:body><w:p><w:r><w:rPr><w:b w:val="false"/><w:i w:val="0"/></w:rPr><w:t>普通正文</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>加粗</w:t></w:r></w:p></w:body></w:document>"#;
        assert_eq!(markdown(xml, &HashMap::new(), &HashSet::new()).unwrap(), "普通正文**加粗**");
    }

    #[test]
    fn word_line_breaks_render_as_markdown_hard_breaks() {
        let xml = r#"<w:document xmlns:w="word"><w:body><w:p><w:r><w:t>第一行&#10;第二行</w:t></w:r></w:p></w:body></w:document>"#;
        assert_eq!(markdown(xml, &HashMap::new(), &HashSet::new()).unwrap(), "第一行  \n第二行");
    }

    #[test]
    fn converts_supplied_docx() {
        let Ok(path) = std::env::var("MARKART_DOCX_TEST") else { return; };
        let converted = docx_to_markdown(Path::new(&path)).unwrap();
        assert!(converted.starts_with("# "), "DOCX 的一级标题未保留：{}", &converted[..converted.len().min(120)]);
        assert!(converted.contains("## "), "DOCX 的二级标题未保留");
        assert!(converted.contains("这是一份用于检查 **预览、源代码和分栏** 三种视图"), "正文粗体范围不正确");
        assert!(!converted.starts_with("# ***"), "关闭的粗斜体被错误启用");
        assert!(converted.contains("第二项的子项  \n另一条子项"), "Word 段内换行未保留");
    }
}
