
export function createIsolatedPartition(tabId: string): string {
  return `persist:tab-${tabId}`;
}