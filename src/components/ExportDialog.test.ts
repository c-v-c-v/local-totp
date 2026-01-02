import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExportDialog from './ExportDialog.vue'
import type { Token } from '../types'

describe('ExportDialog', () => {
  const mockTokens: Token[] = [
    {
      id: '1',
      name: 'Test Account 1',
      secret: 'JBSWY3DPEHPK3PXP',
      createdAt: 1704124800000
    },
    {
      id: '2',
      name: 'Test Account 2',
      secret: 'HXDMVJECJJWSRB3H',
      createdAt: 1704124900000
    }
  ]

  it('should render export dialog', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    expect(wrapper.text()).toContain('导出备份')
    expect(wrapper.text()).toContain('共 2 个密钥')
  })

  it('should have encryption enabled by default', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('should show password fields when encryption enabled', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('密码')
    expect(wrapper.text()).toContain('确认密码')
  })

  it('should hide password fields when encryption disabled', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(false)

    expect(wrapper.find('.password-section').exists()).toBe(false)
    expect(wrapper.text()).toContain('未加密 JSON 格式')
  })

  it('should show warning for unencrypted export', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(false)

    expect(wrapper.text()).toContain('未加密文件包含明文密钥')
  })

  it('should validate password match', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const passwords = wrapper.findAll('input[type="password"]')
    await passwords[0].setValue('password123')
    await passwords[1].setValue('different')

    expect(wrapper.text()).toContain('密码不一致')
  })

  it('should show password strength indicator', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const passwordInput = wrapper.find('input[type="password"]')
    
    await passwordInput.setValue('weak')
    expect(wrapper.text()).toContain('密码强度：弱')

    await passwordInput.setValue('Medium12')
    expect(wrapper.text()).toContain('密码强度：中')

    await passwordInput.setValue('Strong123!@#')
    expect(wrapper.text()).toContain('密码强度：强')
  })

  it('should disable export when password too short', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const passwordInput = wrapper.find('input[type="password"]')
    await passwordInput.setValue('short')

    const exportButton = wrapper.find('.btn-primary')
    expect(exportButton.attributes('disabled')).toBeDefined()
  })

  it('should disable export when passwords do not match', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const passwords = wrapper.findAll('input[type="password"]')
    await passwords[0].setValue('password123')
    await passwords[1].setValue('different123')

    const exportButton = wrapper.find('.btn-primary')
    expect(exportButton.attributes('disabled')).toBeDefined()
  })

  it('should enable export when unencrypted', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(false)

    const exportButton = wrapper.find('.btn-primary')
    expect(exportButton.attributes('disabled')).toBeUndefined()
  })

  it('should emit close event when close button clicked', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    await wrapper.find('.btn-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should emit close event when cancel button clicked', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: mockTokens
      }
    })

    await wrapper.find('.btn-secondary').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should show correct token count', () => {
    const singleToken = [mockTokens[0]]
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: singleToken
      }
    })

    expect(wrapper.text()).toContain('共 1 个密钥')
  })

  it('should handle empty token list', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        tokens: []
      }
    })

    expect(wrapper.text()).toContain('共 0 个密钥')
  })
})
