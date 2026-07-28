import { addHistoryEntry, shouldSkipUrl, HistoryEntry } from './history-logic';

describe('shouldSkipUrl', () => {
  it('skips internal pages', () => {
    expect(shouldSkipUrl('src/renderer/start.html')).toBe(true);
    expect(shouldSkipUrl('src/renderer/history.html')).toBe(true);
    expect(shouldSkipUrl('src/renderer/bookmarks.html')).toBe(true);
    expect(shouldSkipUrl('src/renderer/settings.html')).toBe(true);
  });

  it('does not skip regular urls', () => {
    expect(shouldSkipUrl('https://youtube.com')).toBe(false);
  });
});

describe('addHistoryEntry', () => {
  it('adds a new entry to empty history', () => {
    const result = addHistoryEntry([], 'https://youtube.com', 'YouTube', 1000);
    expect(result).toEqual([{ url: 'https://youtube.com', title: 'YouTube', timestamp: 1000 }]);
  });

  it('skips internal pages', () => {
    const result = addHistoryEntry([], 'src/renderer/start.html', 'New Tab', 1000);
    expect(result).toEqual([]);
  });

  it('adds new entries to the front', () => {
    const existing: HistoryEntry[] = [{ url: 'https://google.com', title: 'Google', timestamp: 500 }];
    const result = addHistoryEntry(existing, 'https://youtube.com', 'YouTube', 1000);
    expect(result[0].url).toBe('https://youtube.com');
    expect(result[1].url).toBe('https://google.com');
  });

  it('dedupes same url within the time window', () => {
    const existing: HistoryEntry[] = [{ url: 'https://youtube.com', title: 'YouTube', timestamp: 1000 }];
    const result = addHistoryEntry(existing, 'https://youtube.com', 'YouTube Home', 1000 + 30000);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(1000 + 30000);
    expect(result[0].title).toBe('YouTube Home');
  });

  it('does not dedupe if outside the time window', () => {
    const existing: HistoryEntry[] = [{ url: 'https://youtube.com', title: 'YouTube', timestamp: 1000 }];
    const result = addHistoryEntry(existing, 'https://youtube.com', 'YouTube', 1000 + 61000);
    expect(result).toHaveLength(2);
  });
});