import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';
import TokenItem from './TokenItem.vue';

// Mock composables
vi.mock('../composables/useTOTP.js', () => ({
  useTOTP: vi.fn(() => {
    const code = ref('123456');
    const remainingSeconds = ref(20);
    const progress = computed(() => 66.67);
    const isExpiringSoon = computed(() => false);
    return { code, remainingSeconds, progress, isExpiringSoon };
  })
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  writable: true
});

describe('TokenItem', () => {
  const mockToken = {
    id: '1',
    name: 'Test Account',
    secret: 'JBSWY3DPEHPK3PXP',
    createdAt: Date.now()
  };

  // Factory function to create wrapper with default token
  const createWrapper = (tokenOverrides = {}) => {
    return mount(TokenItem, {
      props: {
        token: { ...mockToken, ...tokenOverrides }
      }
    });
  };

  describe('Rendering', () => {
    it('should render token information', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toContain('Test Account');
      expect(wrapper.text()).toContain('123 456'); // Formatted code
      expect(wrapper.html()).toContain('20');
    });

    it('should apply warning class when expiring soon', async () => {
      // Re-import and mock with new values
      vi.resetModules();
      vi.doMock('../composables/useTOTP.js', () => ({
        useTOTP: vi.fn(() => {
          const { ref, computed } = require('vue');
          return {
            code: ref('123456'),
            remainingSeconds: ref(3),
            progress: computed(() => 10),
            isExpiringSoon: computed(() => true)
          };
        })
      }));

      const { default: TokenItemNew } = await import('./TokenItem.vue');
      const wrapper = mount(TokenItemNew, {
        props: { token: mockToken }
      });

      expect(wrapper.find('.remaining-time').classes()).toContain('warning');
    });
  });

  describe('User interactions', () => {
    it('should emit edit event when edit button clicked', async () => {
      const wrapper = createWrapper();
      const editButtons = wrapper.findAll('.btn-icon');
      await editButtons[0].trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]?.[0]).toEqual(mockToken);
    });

    it('should emit delete event when confirmed', async () => {
      const wrapper = createWrapper();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const deleteButtons = wrapper.findAll('.btn-icon');
      await deleteButtons[1].trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]?.[0]).toBe('1');
    });

    it('should not emit delete event when cancelled', async () => {
      const wrapper = createWrapper();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const deleteButtons = wrapper.findAll('.btn-icon');
      await deleteButtons[1].trigger('click');

      expect(wrapper.emitted('delete')).toBeFalsy();
    });
  });

  describe('Clipboard functionality', () => {
    it('should copy code to clipboard when clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.token-item').trigger('click');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    });

    it('should show copy toast after successful copy', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.token-item').trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.copy-toast').exists()).toBe(true);
      expect(wrapper.find('.copy-toast').text()).toBe('已复制');
    });
  });
});
