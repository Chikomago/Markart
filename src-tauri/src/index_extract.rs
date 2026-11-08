use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd};
use serde::Serialize;
use serde_json::{Map, Value};
use std::collections::BTreeSet;

#[derive(Debug, Serialize, serde::Deserialize)]
pub struct Heading {
    pub level: u8,
    pub text: String,
    pub line: usize,
    pub from: usize,
    pub to: usize,
}
#[derive(Debug, Serialize, serde::Deserialize)]
pub struct TagOccurrence {
    pub name: String,
    pub from: Option<usize>,
    pub to: Option<usize>,
}
#[derive(Debug, Serialize, serde::Deserialize, Default)]
pub struct Metadata {
    pub headings: Vec<Heading>,
    pub tags: Vec<TagOccurrence>,
    pub properties: Map<String, Value>,
    pub yaml: Option<String>,
    pub error: Option<String>,
}
pub fn extract(body: &str) -> Metadata {
    let mut result = Metadata::default();
    let mut offset = 0;
    if body
        .lines()
        .next()
        .is_some_and(|line| line.trim_end() == "---")
    {
        let mut bytes = body.find('\n').map_or(body.len(), |p| p + 1);
        let start = bytes;
        for line in body[start..].split_inclusive('\n') {
            if matches!(line.trim_end(), "---" | "...") {
                let yaml = &body[start..bytes];
                result.yaml = Some(yaml.trim_end_matches(['\r', '\n']).to_owned());
                match serde_yaml_ng::from_str::<serde_yaml_ng::Value>(yaml).and_then(|v| {
                    if v.is_null() {
                        Ok(Map::new())
                    } else {
                        serde_yaml_ng::from_value::<Map<String, Value>>(v)
                    }
                }) {
                    Ok(properties) => result.properties = properties,
                    Err(error) => result.error = Some(error.to_string()),
                }
                offset = bytes + line.len();
                break;
            }
            bytes += line.len();
        }
    }
    let mut property_tags = BTreeSet::new();
    for key in ["tags", "tag"] {
        if let Some(value) = result.properties.get(key) {
            match value {
                Value::String(value) => {
                    for tag in value.split([',', ' ']).filter(|s| !s.is_empty()) {
                        property_tags.insert(tag.trim_start_matches('#').to_owned());
                    }
                }
                Value::Array(values) => {
                    for tag in values.iter().filter_map(Value::as_str) {
                        property_tags.insert(tag.trim_start_matches('#').to_owned());
                    }
                }
                _ => {}
            }
        }
    }
    result.tags.extend(
        property_tags
            .into_iter()
            .filter(|s| !s.is_empty())
            .map(|name| TagOccurrence {
                name,
                from: None,
                to: None,
            }),
    );
    let mut heading: Option<Heading> = None;
    let mut code = false;
    // Each offset is computed against the original indexed UTF-8 string, then exposed as UTF-16.
    let mut utf16 = body[..offset].encode_utf16().count();
    let mut byte = offset;
    let mut line_number = body[..offset].bytes().filter(|b| *b == b'\n').count() + 1;
    let options = Options::ENABLE_TABLES
        | Options::ENABLE_STRIKETHROUGH
        | Options::ENABLE_TASKLISTS
        | Options::ENABLE_FOOTNOTES
        | Options::ENABLE_MATH;
    for (event, range) in Parser::new_ext(&body[offset..], options).into_offset_iter() {
        let start = range.start + offset;
        let end = range.end + offset;
        // Offset iterator can repeat/overlap ranges for nested events.
        if start >= byte {
            utf16 += body[byte..start].encode_utf16().count();
            line_number += body[byte..start].bytes().filter(|b| *b == b'\n').count();
            byte = start;
        }
        let from = if start == byte {
            utf16
        } else {
            body[..start].encode_utf16().count()
        };
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                heading = Some(Heading {
                    level: level as u8,
                    text: String::new(),
                    line: line_number,
                    from,
                    to: from + body[start..end].encode_utf16().count(),
                })
            }
            Event::End(TagEnd::Heading(_)) => {
                if let Some(heading) = heading.take() {
                    result.headings.push(heading);
                }
            }
            Event::Start(Tag::CodeBlock(_)) => code = true,
            Event::End(TagEnd::CodeBlock) => code = false,
            Event::Text(text) | Event::Code(text) => {
                if let Some(heading) = heading.as_mut() {
                    heading.text.push_str(&text);
                }
                if !code && &body[start..end] == text.as_ref() {
                    let raw = &body[start..end];
                    for (position, ch) in raw.char_indices() {
                        if ch != '#'
                            || raw[..position]
                                .chars()
                                .next_back()
                                .is_some_and(|c| c.is_alphanumeric() || "_/#".contains(c))
                        {
                            continue;
                        }
                        let tag: String = raw[position + 1..]
                            .chars()
                            .take_while(|c| c.is_alphanumeric() || "_-/".contains(*c))
                            .collect();
                        if !tag.is_empty() {
                            let begin = from + raw[..position].encode_utf16().count();
                            result.tags.push(TagOccurrence {
                                name: tag.clone(),
                                from: Some(begin),
                                to: Some(begin + 1 + tag.encode_utf16().count()),
                            });
                        }
                    }
                }
            }
            Event::InlineMath(text) | Event::DisplayMath(text) => {
                if let Some(heading) = heading.as_mut() {
                    heading.text.push_str(&text);
                }
            }
            Event::SoftBreak | Event::HardBreak => {
                if let Some(heading) = heading.as_mut() {
                    heading.text.push(' ');
                }
            }
            _ => {}
        }
    }
    result
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn heading_text_matches_inline_styles_and_math_is_not_a_tag() {
        let parsed = extract("# ~~removed~~ and $x$\n\n$$\n#not-tag\n$$\n");
        assert_eq!(parsed.headings[0].text, "removed and x");
        assert!(parsed.tags.is_empty());
    }
    #[test]
    fn parses_empty_invalid_and_nested_yaml_without_losing_body() {
        let empty = extract("---  \r\n---\r\n# body\r\n");
        assert!(empty.error.is_none());
        assert_eq!(empty.headings[0].line, 3);
        let invalid = extract("---\nbroken: [\n---\n# body\n");
        assert!(invalid.error.is_some());
        assert_eq!(invalid.headings.len(), 1);
        assert!(invalid.yaml.is_some());
        let nested = extract("---\nvalues: [1, true, {name: test}]\n---\n");
        assert_eq!(nested.properties["values"][2]["name"], "test");
    }
    #[test]
    fn tags_ignore_code_entities_and_keep_utf16_offsets() {
        let body = "😀 #中文/子 #tag `#code` &#35;entity\n\n    #indented\n\n```md\n#fenced\n```\n";
        let parsed = extract(body);
        let names: Vec<_> = parsed.tags.iter().map(|t| t.name.as_str()).collect();
        assert_eq!(names, ["中文/子", "tag"]);
        let tag = &parsed.tags[0];
        assert_eq!(tag.from, Some(3));
        assert_eq!(tag.to, Some(8));
    }
}
