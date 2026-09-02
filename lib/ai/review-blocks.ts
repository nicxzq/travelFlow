export type ReviewBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'photo'; photoIndex: number };

const PHOTO_PATTERN = /\[\[\s*photo\s*:\s*(\d+)\s*\]\]/gi;

/**
 * The model may only emit headings, paragraphs and an integer photo index, so
 * nothing it produces can reach the DOM as markup or as a URL. Anything outside
 * that grammar degrades to plain text.
 */
export function parseReviewBlocks(text: string, photoCount: number): ReviewBlock[] {
  const blocks: ReviewBlock[] = [];
  const usedPhotos = new Set<number>();
  let paragraph: string[] = [];

  const flush = () => {
    const section = paragraph.join('\n').trim();
    paragraph = [];
    if (!section) return;

    let cursor = 0;
    for (const match of section.matchAll(PHOTO_PATTERN)) {
      const start = match.index ?? 0;
      const before = section.slice(cursor, start).trim();
      if (before) blocks.push({ type: 'paragraph', text: before });

      const photoIndex = Number(match[1]);
      if (photoIndex < photoCount && !usedPhotos.has(photoIndex)) {
        blocks.push({ type: 'photo', photoIndex });
        usedPhotos.add(photoIndex);
      }

      cursor = start + match[0].length;
    }

    const rest = section.slice(cursor).trim();
    if (rest) blocks.push({ type: 'paragraph', text: rest });
  };

  // Line by line rather than blank-line sections: models routinely put a heading
  // directly above its paragraph, and a section-anchored regex would then miss it
  // and render the literal `## `.
  for (const line of text.split('\n')) {
    const heading = /^\s*##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: 'heading', text: heading[1] });
      continue;
    }

    if (line.trim()) paragraph.push(line);
    else flush();
  }

  flush();

  return blocks;
}
