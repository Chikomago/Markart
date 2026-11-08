fn escape_markdown_line(line: &str) -> String {
    let mut output = String::with_capacity(line.len());
    for (index, character) in line.chars().enumerate() {
        if matches!(character, '\\' | '`' | '*' | '_' | '[' | ']' | '<' | '>')
            || (index == 0 && matches!(character, '#' | '-' | '+' | '=')) {
            output.push('\\');
        }
        output.push(character);
    }
    output
}

pub fn pdf_text_to_markdown(text: &str) -> Result<String, String> {
    if text.trim().is_empty() {
        return Err("PDF 中未提取到文字；扫描件请先进行文字识别（OCR）".into());
    }
    let normalized = text.replace("\r\n", "\n").replace('\r', "\n");
    let mut output = String::new();
    let mut previous_line = false;
    for source_line in normalized.lines() {
        let line = source_line.trim();
        if line.is_empty() {
            if !output.is_empty() && !output.ends_with("\n\n") { output.push_str("\n\n"); }
            previous_line = false;
            continue;
        }
        if previous_line { output.push_str("  \n"); }
        output.push_str(&escape_markdown_line(line));
        previous_line = true;
    }
    Ok(output.trim_end().to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_pdf_lines_visible_in_preview() {
        assert_eq!(pdf_text_to_markdown("第一行\n第二行\n\n下一段").unwrap(), "第一行  \n第二行\n\n下一段");
    }

    #[test]
    fn keeps_markdown_symbols_literal() {
        assert_eq!(pdf_text_to_markdown("# 原文标题\n*不是斜体*").unwrap(), "\\# 原文标题  \n\\*不是斜体\\*");
    }

    #[test]
    fn rejects_scanned_pdf_without_text() {
        assert!(pdf_text_to_markdown(" \n ").unwrap_err().contains("OCR"));
    }
}
