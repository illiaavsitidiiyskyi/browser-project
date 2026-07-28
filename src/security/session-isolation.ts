
export function createIsolatedPartition(tabId: string): string {
  return `persist:tab-${tabId}`;
}

console.log(createIsolatedPartition("1"));
console.log(createIsolatedPartition("2"));