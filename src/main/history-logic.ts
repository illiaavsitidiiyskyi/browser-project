export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

const DEDUPE_WINDOW_MS = 60 * 1000;

export function shouldSkipUrl(url: string): boolean {
  return url.includes('start.html') ||
    url.includes('history.html') ||
    url.includes('bookmarks.html') ||
    url.includes('settings.html');
}

export function addHistoryEntry(
  history: HistoryEntry[],
  url: string,
  title: string,
  now: number = Date.now()
): HistoryEntry[] {
  if (shouldSkipUrl(url)) return history;

  const last = history[0];
  if (last && last.url === url && now - last.timestamp < DEDUPE_WINDOW_MS) {
    return [{ ...last, timestamp: now, title }, ...history.slice(1)];
  }

  return [{ url, title, timestamp: now }, ...history];
}