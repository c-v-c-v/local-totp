import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressBar from './ProgressBar.vue';

describe('ProgressBar', () => {
  // Factory function to create wrapper with default props
  const createWrapper = (propsOverrides = {}) => {
    return mount(ProgressBar, {
      props: {
        progress: 50,
        isWarning: false,
        ...propsOverrides
      }
    });
  };

  describe('Progress rendering', () => {
    it.each([
      [0, 'width: 0%'],
      [50, 'width: 50%'],
      [100, 'width: 100%']
    ])('should render %i% progress correctly', (progress, expectedStyle) => {
      const wrapper = createWrapper({ progress });
      const progressFill = wrapper.find('.progress-fill');
      expect(progressFill.attributes('style')).toContain(expectedStyle);
    });
  });

  describe('Warning state', () => {
    it('should apply warning class when isWarning is true', () => {
      const wrapper = createWrapper({ progress: 10, isWarning: true });
      const progressFill = wrapper.find('.progress-fill');
      expect(progressFill.classes()).toContain('warning');
    });

    it('should not apply warning class when isWarning is false', () => {
      const wrapper = createWrapper({ progress: 80, isWarning: false });
      const progressFill = wrapper.find('.progress-fill');
      expect(progressFill.classes()).not.toContain('warning');
    });
  });
});
