import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImportDialog from './ImportDialog.vue'
import type { Token } from '../types'

describe('ImportDialog', () => {
  const mockTokens: Token[] = [
    {
      id: '1',
      name: 'Existing Account',
      secret: 'JBSWY3DPEHPK3PXP',
      createdAt: 1704124800000
    }
  ]

  it('should render file upload button', () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    expect(wrapper.find('.btn-upload').exists()).toBe(true)
    expect(wrapper.text()).toContain('选择备份文件')
  })

  it('should show file info after file selection', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      exported_at: Date.now(),
      tokens: [
        { name: 'Test Account', secret: 'SECRET123' }
      ]
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    // 模拟文件选择
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.file-name').text()).toBe('backup.json')
  })

  it('should show preview for unencrypted file', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      exported_at: Date.now(),
      tokens: [
        { name: 'Test Account 1', secret: 'SECRET1' },
        { name: 'Test Account 2', secret: 'SECRET2' }
      ]
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('导入预览')
    expect(wrapper.text()).toContain('共 2 个密钥')
  })

  it('should detect duplicate tokens', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: mockTokens
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      exported_at: Date.now(),
      tokens: [
        { name: 'Existing Account', secret: 'SECRET1' },
        { name: 'New Account', secret: 'SECRET2' }
      ]
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('1 个重复名称')
    expect(wrapper.text()).toContain('Existing Account')
  })

  it('should show conflict resolution options when duplicates exist', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: mockTokens
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      exported_at: Date.now(),
      tokens: [
        { name: 'Existing Account', secret: 'SECRET1' }
      ]
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.text()).toContain('处理方式')
    expect(wrapper.text()).toContain('跳过重复项')
    expect(wrapper.text()).toContain('覆盖现有密钥')
    expect(wrapper.text()).toContain('保留两者')
  })

  it('should require password for encrypted file', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      encrypted: true,
      data: 'encrypted-data',
      salt: 'salt',
      iv: 'iv'
    })

    const file = new File([fileContent], 'backup-encrypted.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('解密密码')
    expect(wrapper.find('.btn-preview').exists()).toBe(true)
  })

  it('should emit import event with correct data', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      exported_at: Date.now(),
      tokens: [
        { name: 'Test Account', secret: 'SECRET123' }
      ]
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(wrapper.emitted('import')).toBeTruthy()
    const emittedData = wrapper.emitted('import')?.[0]
    expect(emittedData?.[0]).toHaveProperty('tokens')
    expect(emittedData?.[0]).toHaveProperty('total')
    expect(emittedData?.[0]).toHaveProperty('duplicates')
  })

  it('should emit close event when close button clicked', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    await wrapper.find('.btn-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should clear file when clear button clicked', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      exported_at: Date.now(),
      tokens: [{ name: 'Test', secret: 'SECRET' }]
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.file-selected').exists()).toBe(true)

    await wrapper.find('.btn-clear').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.file-upload').exists()).toBe(true)
  })

  it('should show error message for invalid JSON', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const file = new File(['invalid json'], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(wrapper.find('.error-box').exists()).toBe(true)
  })

  it('should disable import button when no preview data', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        existingTokens: []
      }
    })

    const fileContent = JSON.stringify({
      version: '1.0',
      encrypted: true,
      data: 'data',
      salt: 'salt',
      iv: 'iv'
    })

    const file = new File([fileContent], 'backup.json', { type: 'application/json' })
    const input = wrapper.find('input[type="file"]')
    
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    await input.trigger('change')
    await wrapper.vm.$nextTick()

    const importButton = wrapper.find('.btn-primary')
    expect(importButton.attributes('disabled')).toBeDefined()
  })
})
