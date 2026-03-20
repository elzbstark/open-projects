export interface ParsedSection {
  heading: string;
  content: string;
}

/**
 * Parse markdown content by ## headings into sections.
 * If no headings found, returns the whole content as one section.
 */
export function parseMarkdownSections(markdown: string): ParsedSection[] {
  const lines = markdown.split('\n');
  const sections: ParsedSection[] = [];
  let currentHeading = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (currentHeading || currentContent.length > 0) {
        sections.push({
          heading: currentHeading || 'Untitled',
          content: currentContent.join('\n').trim(),
        });
      }
      currentHeading = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentHeading || currentContent.length > 0) {
    sections.push({
      heading: currentHeading || 'Content',
      content: currentContent.join('\n').trim(),
    });
  }

  return sections;
}

/**
 * Map parsed sections to template section slots.
 * Matches by index; extras go to last section.
 */
export function mapToTemplateSections(
  parsed: ParsedSection[],
  templateSectionCount: number
): string[] {
  const result: string[] = Array(templateSectionCount).fill('');

  for (let i = 0; i < parsed.length; i++) {
    if (i < templateSectionCount) {
      result[i] = parsed[i].content;
    } else {
      // Append overflow to the last section
      result[templateSectionCount - 1] += '\n\n' + `## ${parsed[i].heading}\n${parsed[i].content}`;
    }
  }

  return result;
}
