use percent_encoding::percent_decode_str;
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LinkChange {
    pub line: usize,
    pub before: String,
    pub after: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LocalReference {
    pub line: usize,
    pub target: String,
    pub resolved: String,
    pub from: usize,
    pub to: usize,
}

fn normalize_relative(base: &str, target: &str) -> Option<String> {
    let mut parts: Vec<&str> = base.split('/').filter(|part| !part.is_empty()).collect();
    for part in target.split('/') {
        match part {
            "" | "." => {}
            ".." => { parts.pop()?; }
            _ => parts.push(part),
        }
    }
    Some(parts.join("/"))
}

fn remap(path: &str, from: &str, to: &str) -> String {
    if path == from { to.to_owned() }
    else if path.starts_with(&format!("{from}/")) { format!("{to}{}", &path[from.len()..]) }
    else { path.to_owned() }
}

fn relative_to(source_dir: &str, target: &str) -> String {
    let source: Vec<_> = source_dir.split('/').filter(|part| !part.is_empty()).collect();
    let destination: Vec<_> = target.split('/').filter(|part| !part.is_empty()).collect();
    let common = source.iter().zip(&destination).take_while(|(a, b)| a == b).count();
    let mut result = vec![".."; source.len() - common];
    result.extend(destination[common..].iter().copied());
    if result.is_empty() { ".".to_owned() } else { result.join("/") }
}

fn safe_destination(raw: &str) -> Option<(String, String)> {
    if raw.is_empty() || raw.starts_with('#') || raw.starts_with('/') || raw.starts_with('\\') || raw.starts_with("//") { return None; }
    if raw.contains('?') || raw.contains('\n') || raw.contains('\r') { return None; }
    if raw.split('/').next()?.contains(':') { return None; }
    let (path, fragment) = raw.split_once('#').map_or((raw, ""), |(path, rest)| (path, rest));
    let decoded = percent_decode_str(path).decode_utf8().ok()?.into_owned();
    if decoded.contains('\0') || decoded.contains('\\') || decoded.is_empty() { return None; }
    Some((decoded, fragment.to_owned()))
}

fn encode_path(path: &str) -> String {
    let mut encoded = String::new();
    for byte in path.bytes() {
        if byte.is_ascii_alphanumeric() || b"-_.~/".contains(&byte) { encoded.push(byte as char); }
        else { encoded.push_str(&format!("%{byte:02X}")); }
    }
    encoded
}

fn rewrite_target(raw: &str, old_source: &str, new_source: &str, from: &str, to: &str, exists: &impl Fn(&str) -> bool) -> Option<String> {
    let (decoded, fragment) = safe_destination(raw)?;
    let old_dir = old_source.rsplit_once('/').map_or("", |(dir, _)| dir);
    let old_target = normalize_relative(old_dir, &decoded)?;
    if !exists(&old_target) { return None; }
    let new_target = remap(&old_target, from, to);
    let new_dir = new_source.rsplit_once('/').map_or("", |(dir, _)| dir);
    let new_relative = relative_to(new_dir, &new_target);
    if new_relative == decoded { return None; }
    let mut next = encode_path(&new_relative);
    if !fragment.is_empty() { next.push('#'); next.push_str(&fragment); }
    Some(next)
}

fn destination_ranges(line: &str) -> Vec<(usize, usize)> {
    let bytes = line.as_bytes();
    let mut ranges = Vec::new();
    let mut cursor = 0;
    let mut in_code = false;
    while cursor < bytes.len() {
        if bytes[cursor] == b'`' { in_code = !in_code; cursor += 1; continue; }
        if !in_code && bytes[cursor] == b'<' && bytes.get(cursor + 1).is_some_and(u8::is_ascii_alphabetic) {
            if let Some(close) = bytes[cursor + 1..].iter().position(|byte| *byte == b'>').map(|offset| cursor + 1 + offset) {
                let mut attribute = cursor + 1;
                while attribute < close {
                    while attribute < close && !bytes[attribute].is_ascii_alphabetic() { attribute += 1; }
                    let name_start = attribute;
                    while attribute < close && (bytes[attribute].is_ascii_alphanumeric() || bytes[attribute] == b'-') { attribute += 1; }
                    if name_start == attribute { continue; }
                    let name = &line[name_start..attribute];
                    while attribute < close && bytes[attribute].is_ascii_whitespace() { attribute += 1; }
                    if attribute >= close || bytes[attribute] != b'=' { continue; }
                    attribute += 1;
                    while attribute < close && bytes[attribute].is_ascii_whitespace() { attribute += 1; }
                    if attribute >= close { break; }
                    let quote = bytes[attribute];
                    if quote != b'\'' && quote != b'"' { continue; }
                    let start = attribute + 1;
                    let Some(end) = bytes[start..close].iter().position(|byte| *byte == quote).map(|offset| start + offset) else { break; };
                    if (name.eq_ignore_ascii_case("src") || name.eq_ignore_ascii_case("href")) && end > start { ranges.push((start, end)); }
                    attribute = end + 1;
                }
                cursor = close + 1;
                continue;
            }
        }
        if !in_code && bytes[cursor] == b']' && bytes.get(cursor + 1) == Some(&b'(') {
            let start = cursor + 2;
            if bytes.get(start) == Some(&b'<') {
                if let Some(end) = bytes[start + 1..].iter().position(|byte| *byte == b'>').map(|offset| start + 1 + offset) {
                    if end > start + 1 { ranges.push((start + 1, end)); }
                    cursor = end + 1;
                    continue;
                }
            } else {
                let mut end = start;
                let mut nested = 0;
                while end < bytes.len() {
                    match bytes[end] {
                        b'\\' if end + 1 < bytes.len() => { end += 2; continue; }
                        b'(' => nested += 1,
                        b')' if nested > 0 => nested -= 1,
                        b')' | b' ' | b'\t' if nested == 0 => break,
                        _ => {}
                    }
                    end += 1;
                }
                if end > start && end < bytes.len() { ranges.push((start, end)); }
                cursor = end.saturating_add(1);
                continue;
            }
        }
        cursor += 1;
    }
    if ranges.is_empty() {
        let trimmed = line.trim_start();
        let indent = line.len() - trimmed.len();
        if indent <= 3 && trimmed.starts_with('[') {
            if let Some(marker) = trimmed.find("]: ").or_else(|| trimmed.find("]:")) {
                let mut start = indent + marker + 2;
                while bytes.get(start).is_some_and(u8::is_ascii_whitespace) { start += 1; }
                if bytes.get(start) == Some(&b'<') {
                    if let Some(end) = bytes[start + 1..].iter().position(|byte| *byte == b'>').map(|offset| start + 1 + offset) { ranges.push((start + 1, end)); }
                } else {
                    let end = bytes[start..].iter().position(u8::is_ascii_whitespace).map_or(bytes.len(), |offset| start + offset);
                    if end > start { ranges.push((start, end)); }
                }
            }
        }
    }
    ranges
}

pub fn rewrite_markdown(content: &str, old_source: &str, new_source: &str, from: &str, to: &str, exists: impl Fn(&str) -> bool) -> (String, Vec<LinkChange>) {
    let mut output = String::with_capacity(content.len());
    let mut changes = Vec::new();
    let mut in_fence = false;
    for (index, line) in content.split_inclusive('\n').enumerate() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            in_fence = !in_fence;
            output.push_str(line);
            continue;
        }
        if in_fence { output.push_str(line); continue; }
        let ranges = destination_ranges(line);
        let mut rewritten = line.to_owned();
        for (start, end) in ranges.into_iter().rev() {
            let before = &line[start..end];
            if let Some(after) = rewrite_target(before, old_source, new_source, from, to, &exists) {
                rewritten.replace_range(start..end, &after);
                changes.push(LinkChange { line: index + 1, before: before.to_owned(), after });
            }
        }
        output.push_str(&rewritten);
    }
    changes.reverse();
    (output, changes)
}

pub fn local_references(content: &str, source: &str) -> Vec<LocalReference> {
    let source_dir = source.rsplit_once('/').map_or("", |(dir, _)| dir);
    let mut references = Vec::new();
    let mut in_fence = false;
    let mut utf16 = 0;
    for (index, line) in content.split_inclusive('\n').enumerate() {
        let base = utf16;
        utf16 += line.encode_utf16().count();
        let trimmed = line.trim_start();
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") { in_fence = !in_fence; continue; }
        if in_fence { continue; }
        for (start, end) in destination_ranges(line) {
            let target = &line[start..end];
            let Some((decoded, _)) = safe_destination(target) else { continue; };
            let Some(resolved) = normalize_relative(source_dir, &decoded) else { continue; };
            references.push(LocalReference { line: index + 1, target: target.to_owned(), resolved, from: base+line[..start].encode_utf16().count(), to: base+line[..end].encode_utf16().count() });
        }
    }
    references
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn updates_moved_target_and_rebases_moved_source() {
        let (body, changes) = rewrite_markdown("[目标](b.md)\n![图](../assets/a.png)\n", "notes/a.md", "archive/a.md", "notes", "archive", |path| matches!(path, "notes/b.md" | "assets/a.png"));
        assert_eq!(body, "[目标](b.md)\n![图](../assets/a.png)\n");
        assert!(changes.is_empty());
        let (body, changes) = rewrite_markdown("[目标](b.md)\n", "notes/a.md", "notes/a.md", "notes/b.md", "archive/b.md", |path| path == "notes/b.md");
        assert_eq!(body, "[目标](../archive/b.md)\n");
        assert_eq!(changes.len(), 1);
        let (body, _) = rewrite_markdown("[目标](b.md)\n", "notes/a.md", "archive/a.md", "notes/a.md", "archive/a.md", |path| path == "notes/b.md");
        assert_eq!(body, "[目标](../notes/b.md)\n");
    }

    #[test]
    fn preserves_code_remote_and_utf8_fragment() {
        let body = "`[x](b.md)`\n```md\n[x](b.md)\n```\n[x](b.md#标题)\n[x](https://site.test/b.md)\n[ref]: b.md\n";
        let (rewritten, changes) = rewrite_markdown(body, "notes/a.md", "notes/a.md", "notes/b.md", "archive/b.md", |path| path == "notes/b.md");
        assert_eq!(rewritten, "`[x](b.md)`\n```md\n[x](b.md)\n```\n[x](../archive/b.md#标题)\n[x](https://site.test/b.md)\n[ref]: ../archive/b.md\n");
        assert_eq!(changes.len(), 2);
    }

    #[test]
    fn extracts_only_local_references_outside_code() {
        let refs = local_references("![图](../assets/x.png)\n[x](https://site.test)\n`[x](missing.md)`\n[ref]: next.md\n", "notes/a.md");
        assert_eq!(refs.len(), 2);
        assert_eq!(refs[0].resolved, "assets/x.png");
        assert_eq!(refs[1].resolved, "notes/next.md");
    }

    #[test]
    fn rewrites_titles_angle_paths_and_nested_parentheses_without_touching_titles() {
        let body = "![a](assets/fig(1).png \"图注\")\n[x](<assets/my figure.png> \"标题\")\n[ref]: <assets/my figure.png> \"标题\"\n";
        let (rewritten, changes) = rewrite_markdown(body, "note.md", "note.md", "assets", "images", |path| matches!(path, "assets/fig(1).png" | "assets/my figure.png"));
        assert_eq!(rewritten, "![a](images/fig%281%29.png \"图注\")\n[x](<images/my%20figure.png> \"标题\")\n[ref]: <images/my%20figure.png> \"标题\"\n");
        assert_eq!(changes.len(), 3);
    }

    #[test]
    fn handles_html_image_and_link_attributes_outside_code() {
        let body = "<img src=\"assets/a.png\" alt=\"a\">\n<a href='assets/b.md'>文件</a>\n`<img src=\"assets/a.png\">`\n";
        let (rewritten, changes) = rewrite_markdown(body, "note.md", "note.md", "assets", "images", |path| matches!(path, "assets/a.png" | "assets/b.md"));
        assert_eq!(rewritten, "<img src=\"images/a.png\" alt=\"a\">\n<a href='images/b.md'>文件</a>\n`<img src=\"assets/a.png\">`\n");
        assert_eq!(changes.len(), 2);
        assert_eq!(local_references(body, "note.md").len(), 2);
    }
}
