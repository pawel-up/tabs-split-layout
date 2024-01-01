/**
 * Takes the array and reads which indexes are missing.
 * 
 * ## Example
 * 
 * ```javascript
 * const input = [0, 1, 3, 6, 7];
 * let result = missingIndexes(input);
 * console.log(result); // -> [2, 5]
 * result = missingIndexes(input, 9);
 * console.log(result); // -> [2, 5, 8, 9]
 * ```
 */
export default function missingIndexes(list: number[], desiredSize?: number): number[] {
  const indexes: number[] = [];
  const size = typeof desiredSize === 'number' ? desiredSize : Math.max(list.length, Math.max(...list));
  for (let i = 0; i < size; i++) {
    if (!list.includes(i)) {
      indexes.push(i);
    }
  }
  return indexes;
}
