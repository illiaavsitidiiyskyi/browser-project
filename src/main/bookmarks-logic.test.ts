import { toggleBookmark, BookmarkEntry } from './bookmarks-logic';

describe('toggleBookmark', () => {
  it('adds a bookmark when not present', () => {
    const result = toggleBookmark([], 'https://github.com', 'GitHub', 1000);
    expect(result).toEqual([{ url: 'https://github.com', title: 'GitHub', timestamp: 1000 }]);
  });

  it('removes a bookmark when already present', () => {
    const existing: BookmarkEntry[] = [{ url: 'https://github.com', title: 'GitHub', timestamp: 1000 }];
    const result = toggleBookmark(existing, 'https://github.com', 'GitHub', 2000);
    expect(result).toEqual([]);
  });

  it('adds new bookmarks to the front', () => {
    const existing: BookmarkEntry[] = [{ url: 'https://github.com', title: 'GitHub', timestamp: 1000 }];
    const result = toggleBookmark(existing, 'https://youtube.com', 'YouTube', 2000);
    expect(result[0].url).toBe('https://youtube.com');
    expect(result[1].url).toBe('https://github.com');
  });
});