import { cn } from '@/lib/utils';

describe('Web Utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('p-4', 'bg-red-500');
      expect(result).toContain('p-4');
      expect(result).toContain('bg-red-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('p-4', true && 'visible', false && 'hidden');
      expect(result).toContain('visible');
      expect(result).not.toContain('hidden');
    });

    it('should resolve tailwind conflicts', () => {
      // Assuming tailwind-merge behavior
      const result = cn('p-4', 'p-8');
      expect(result).toContain('p-8');
      expect(result).not.toContain('p-4');
    });
  });
});
