import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';

describe('LocalStorageRepository', () => {
  let repository: LocalStorageRepository;
  let mockLocalStorage: {
    data: Record<string, string>;
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    clear: () => void;
  };

  // Helper function to create test token
  const createTestToken = (overrides = {}) => ({
    name: 'Test Account',
    secret: 'JBSWY3DPEHPK3PXP',
    ...overrides
  });

  beforeEach(() => {
    // 模拟 localStorage
    mockLocalStorage = {
      data: {},
      getItem(key: string) {
        return this.data[key] || null;
      },
      setItem(key: string, value: string) {
        this.data[key] = value;
      },
      clear() {
        this.data = {};
      }
    };

    global.localStorage = mockLocalStorage as any;
    repository = new LocalStorageRepository('test_tokens');
    mockLocalStorage.clear();
  });

  describe('Create operations', () => {
    it('should create new Token', () => {
      const token = repository.create(createTestToken());

      expect(token).toHaveProperty('id');
      expect(token).toHaveProperty('createdAt');
      expect(token.name).toBe('Test Account');
      expect(token.secret).toBe('JBSWY3DPEHPK3PXP');
    });
  });

  describe('Read operations', () => {
    it('should get all Tokens', () => {
      repository.create(createTestToken({ name: 'Account 1', secret: 'SECRET1' }));
      repository.create(createTestToken({ name: 'Account 2', secret: 'SECRET2' }));

      const tokens = repository.getAll();

      expect(tokens).toHaveLength(2);
      expect(tokens[0].name).toBe('Account 1');
      expect(tokens[1].name).toBe('Account 2');
    });

    it('should get Token by ID', () => {
      const created = repository.create(createTestToken());
      const found = repository.getById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null when Token does not exist', () => {
      const found = repository.getById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('Update operations', () => {
    it('should update Token', () => {
      const created = repository.create(createTestToken({ name: 'Old Name' }));
      const updated = repository.update(created.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(updated.id).toBe(created.id);
    });

    it('should throw error when updating non-existent Token', () => {
      expect(() => {
        repository.update('non-existent-id', { name: 'New' });
      }).toThrow();
    });
  });

  describe('Delete operations', () => {
    it('should delete Token', () => {
      const created = repository.create(createTestToken());
      const deleted = repository.delete(created.id);

      expect(deleted).toBe(true);
      expect(repository.getAll()).toHaveLength(0);
    });

    it('should return false when deleting non-existent Token', () => {
      const deleted = repository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist data to localStorage', () => {
      repository.create(createTestToken());

      const stored = JSON.parse(mockLocalStorage.getItem('test_tokens') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Test Account');
    });

    it('should load data from localStorage', () => {
      const data = [
        { id: '1', name: 'Account 1', secret: 'SECRET1', createdAt: Date.now() }
      ];
      mockLocalStorage.setItem('test_tokens', JSON.stringify(data));

      const newRepo = new LocalStorageRepository('test_tokens');
      const tokens = newRepo.getAll();

      expect(tokens).toHaveLength(1);
      expect(tokens[0].name).toBe('Account 1');
    });
  });
});
