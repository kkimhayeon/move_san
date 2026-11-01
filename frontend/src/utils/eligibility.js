export const ELIGIBILITY_EMPTY_MESSAGE = '상세 자격 요건은 공식 안내를 확인해 주세요.';

const HEADING_LINE = /^\[([^\[\]]+)\]$/;

/**
 * CRLF/CR을 LF로 맞춘 뒤, [항목명] 줄은 섹션 제목으로,
 * '•' 줄은 목록으로, 그 다음 들여쓴 줄은 해당 항목의 보충 설명으로 나눈다.
 * 원문 순서와 문장은 유지한다.
 *
 * @param {unknown} value
 * @returns {{
 *   kind: 'empty',
 * } | {
 *   kind: 'plain',
 *   blocks: EligibilityBlock[],
 * } | {
 *   kind: 'sections',
 *   preamble: EligibilityBlock[],
 *   sections: { title: string, blocks: EligibilityBlock[] }[],
 * }}
 */
export function parseEligibility(value) {
  if (value == null) return { kind: 'empty' };

  const normalized = String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start += 1;
  while (end > start && lines[end - 1].trim() === '') end -= 1;

  const body = lines.slice(start, end);
  if (body.length === 0 || body.every((line) => line.trim() === '')) {
    return { kind: 'empty' };
  }

  const hasHeading = body.some((line) => HEADING_LINE.test(line.trim()));
  if (!hasHeading) {
    return { kind: 'plain', blocks: parseBlocks(body) };
  }

  /** @type {{ title: string, lines: string[] }[]} */
  const sections = [];
  /** @type {string[]} */
  const preamble = [];
  /** @type {{ title: string, lines: string[] } | null} */
  let current = null;

  body.forEach((line) => {
    const heading = line.trim().match(HEADING_LINE);
    if (heading) {
      current = { title: heading[1], lines: [] };
      sections.push(current);
      return;
    }
    if (!current) preamble.push(line);
    else current.lines.push(line);
  });

  return {
    kind: 'sections',
    preamble: parseBlocks(preamble),
    sections: sections.map((section) => ({
      title: section.title,
      blocks: parseBlocks(section.lines),
    })),
  };
}

/**
 * @typedef {{ type: 'paragraph', lines: string[] }
 *   | { type: 'notice', text: string }
 *   | { type: 'list', items: { text: string, notes: string[] }[] }} EligibilityBlock
 */

/**
 * @param {string[]} lines
 * @returns {EligibilityBlock[]}
 */
function parseBlocks(lines) {
  /** @type {EligibilityBlock[]} */
  const blocks = [];
  /** @type {{ type: 'paragraph', lines: string[] } | null} */
  let paragraph = null;
  /** @type {{ type: 'list', items: { text: string, notes: string[] }[] } | null} */
  let list = null;

  const flushParagraph = () => {
    if (paragraph && paragraph.lines.length) blocks.push(paragraph);
    paragraph = null;
  };
  const flushList = () => {
    if (list && list.items.length) blocks.push(list);
    list = null;
  };

  lines.forEach((raw) => {
    if (raw.trim() === '') {
      flushParagraph();
      flushList();
      return;
    }

    const trimmed = raw.trim();
    const indented = /^[ \t]/.test(raw) && !trimmed.startsWith('•');
    if (indented && list && list.items.length > 0) {
      list.items[list.items.length - 1].notes.push(trimmed);
      return;
    }

    if (trimmed.startsWith('•')) {
      flushParagraph();
      if (!list) list = { type: 'list', items: [] };
      list.items.push({
        text: trimmed.slice(1).trimStart(),
        notes: [],
      });
      return;
    }

    if (trimmed.startsWith('※')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'notice', text: trimmed });
      return;
    }

    flushList();
    if (!paragraph) paragraph = { type: 'paragraph', lines: [] };
    paragraph.lines.push(trimmed);
  });

  flushParagraph();
  flushList();
  return blocks;
}
