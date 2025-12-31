import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TokenForm from './TokenForm.vue';

// Mock URI parser
vi.mock('../utils/qrcode.js', () => ({
  parseTotpUri: vi.fn((uri) => {
    if (uri.includes('otpauth://totp/')) {
      return {
        name: 'Test Account',
        secret: 'JBSWY3DPEHPK3PXP'
      };
    }
    throw new Error('Invalid URI');
  })
}));

describe('TokenForm', () => {
  // Factory function to create wrapper
  const createWrapper = (propsOverrides = {}) => {
    return mount(TokenForm, {
      props: { ...propsOverrides }
    });
  };

  const mockToken = {
    id: '1',
    name: 'Existing Account',
    secret: 'EXISTINGSECRET',
    createdAt: Date.now()
  };

  describe('Mode rendering', () => {
    it('should render in add mode by default', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('添加密钥');
      expect(wrapper.find('button[type="submit"]').text()).toBe('添加');
    });

    it('should render in edit mode when token provided', () => {
      const wrapper = createWrapper({ token: mockToken });
      expect(wrapper.text()).toContain('编辑密钥');
      expect(wrapper.find('button[type="submit"]').text()).toBe('保存');
      expect((wrapper.find('#name').element as HTMLInputElement).value).toBe('Existing Account');
    });

    it('should disable secret input in edit mode', () => {
      const wrapper = createWrapper({ token: mockToken });
      expect((wrapper.find('#secret').element as HTMLInputElement).disabled).toBe(true);
    });
  });

  describe('URI import', () => {
    it('should show URI import section when button clicked', async () => {
      const wrapper = createWrapper();
      expect(wrapper.find('#uri').exists()).toBe(false);

      await wrapper.find('.btn-import').trigger('click');
      expect(wrapper.find('#uri').exists()).toBe(true);
    });

    it('should parse URI and fill form fields', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.btn-import').trigger('click');
      await wrapper.find('#uri').setValue('otpauth://totp/Test:user@example.com?secret=JBSWY3DPEHPK3PXP');
      await wrapper.find('.btn-parse').trigger('click');

      expect((wrapper.find('#name').element as HTMLInputElement).value).toBe('Test Account');
      expect((wrapper.find('#secret').element as HTMLInputElement).value).toBe('JBSWY3DPEHPK3PXP');
    });
  });

  describe('Form validation', () => {
    it('should validate Base32 secret format', async () => {
      const wrapper = createWrapper();
      await wrapper.find('#name').setValue('Test');
      await wrapper.find('#secret').setValue('INVALID!@#');
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('无效的Base32格式');
    });

    it('should disable submit button when form is invalid', async () => {
      const wrapper = createWrapper();
      const submitButton = wrapper.find('button[type="submit"]');
      expect((submitButton.element as HTMLButtonElement).disabled).toBe(true);

      await wrapper.find('#name').setValue('Valid Name');
      await wrapper.find('#secret').setValue('JBSWY3DPEHPK3PXP');
      await wrapper.vm.$nextTick();

      expect((submitButton.element as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('Form submission', () => {
    it('should emit submit event with trimmed and formatted data', async () => {
      const wrapper = createWrapper();
      await wrapper.find('#name').setValue('  Test Account  ');
      await wrapper.find('#secret').setValue('jbsw y3dp ehpk 3pxp');
      await wrapper.find('form').trigger('submit');

      expect(wrapper.emitted('submit')).toBeTruthy();
      const emittedData = wrapper.emitted('submit')?.[0]?.[0] as any;
      expect(emittedData.name).toBe('Test Account');
      expect(emittedData.secret).toBe('JBSWY3DPEHPK3PXP');
    });
  });

  describe('Close actions', () => {
    it.each([
      ['.btn-close', 'close button'],
      ['.btn-secondary', 'cancel button'],
      ['.modal-overlay', 'overlay']
    ])('should emit close event when %s clicked', async (selector) => {
      const wrapper = createWrapper();
      await wrapper.find(selector).trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
