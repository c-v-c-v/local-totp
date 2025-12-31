import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TokenList from './TokenList.vue';
import TokenItem from './TokenItem.vue';

describe('TokenList', () => {
  const mockTokens = [
    { id: '1', name: 'Account 1', secret: 'SECRET1', createdAt: Date.now() },
    { id: '2', name: 'Account 2', secret: 'SECRET2', createdAt: Date.now() }
  ];

  // Factory function to create wrapper with default stubs
  const createWrapper = (propsOverrides = {}, stubTokenItem = true) => {
    return mount(TokenList, {
      props: {
        tokens: mockTokens,
        ...propsOverrides
      },
      global: {
        stubs: {
          TokenItem: stubTokenItem
        }
      }
    });
  };

  describe('Rendering', () => {
    it('should render all token items', () => {
      const wrapper = createWrapper();
      const items = wrapper.findAllComponents({ name: 'TokenItem' });
      expect(items).toHaveLength(2);
    });

    it('should render add card', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('.add-card').exists()).toBe(true);
      expect(wrapper.find('.add-card').text()).toContain('添加密钥');
    });

    it('should render with empty tokens array', () => {
      const wrapper = createWrapper({ tokens: [] });
      expect(wrapper.findAllComponents({ name: 'TokenItem' })).toHaveLength(0);
      expect(wrapper.find('.add-card').exists()).toBe(true);
    });
  });

  describe('Event handling', () => {
    it('should emit add event when add card clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.add-card').trigger('click');
      expect(wrapper.emitted('add')).toBeTruthy();
    });

    it('should emit edit event from token item', async () => {
      const wrapper = createWrapper({}, false);
      const items = wrapper.findAllComponents(TokenItem);
      await items[0].vm.$emit('edit', mockTokens[0]);

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]?.[0]).toEqual(mockTokens[0]);
    });

    it('should emit delete event from token item', async () => {
      const wrapper = mount(TokenList, {
        props: { tokens: mockTokens },
        global: {
          stubs: {
            TokenItem: {
              template: '<div><button @click="$emit(\'delete\', \'1\')">Delete</button></div>',
              props: ['token']
            }
          }
        }
      });

      const button = wrapper.find('button');
      await button.trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]?.[0]).toBe('1');
    });
  });
});
