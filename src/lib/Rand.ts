export class Rand {
  /**
   * Generates a random alphanumeric string.
   * This gives 62 elements per single character generated so the 
   * probability of generating the same string is (62 ^ size).
   * 
   * - size = 4  => ~14.77 million (collision very likely to happen)
   * - size = 6  => ~56.8 billion (collision likely to happen)
   * - size = 8  => ~218.34e+12 (collision very unlikely to happen)
   * - size = 12 => ~3.23e+21 (collision impossible to happen)
   * 
   * For comparison, the universe is about 4.41e+17 seconds old
   * and the planet Earth is about 1.75e+17 seconds old.
   * 
   * @param size The size of the resulting alphanumeric string. Max 12.
   * @returns Random alphanumeric string
   */
  static id(size = 8): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charsetLength = charset.length;
    for (let i = 0; i < size; i++) {
      const randomIndex = Math.floor(Math.random() * charsetLength);
      result += charset.charAt(randomIndex);
    }
    return result;
  }
}
