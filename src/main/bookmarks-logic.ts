export interface BookmarkEntry {
  url: string;
  title: string;
  timestamp: number;
}

export function toggleBookmark(
  bookmarks: BookmarkEntry[],
  url: string,
  title: string,
  now: number = Date.now()
): BookmarkEntry[] {
  const existingIndex = bookmarks.findIndex(b => b.url === url);

  if (existingIndex >= 0) {
    return bookmarks.filter((_, i) => i !== existingIndex);
  }

  return [{ url, title, timestamp: now }, ...bookmarks];
}