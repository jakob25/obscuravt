// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageUploadField } from './image-upload-field'

const { uploadImageFile, validateImageFile } = vi.hoisted(() => ({
  uploadImageFile: vi.fn(),
  validateImageFile: vi.fn(() => null as string | null),
}))

vi.mock('@/lib/upload-client', () => ({
  uploadImageFile,
  validateImageFile,
}))

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() })
  uploadImageFile.mockReset()
  validateImageFile.mockReset()
  validateImageFile.mockReturnValue(null)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ImageUploadField', () => {
  it('uses a visually hidden file input and keeps showing upload errors', async () => {
    const onUploaded = vi.fn()
    uploadImageFile.mockRejectedValue(new Error('Upload storage not configured — create the vault-uploads bucket in Supabase.'))

    await act(async () => root.render(
      <ImageUploadField purpose="fan-art" label="Upload fan art" onUploaded={onUploaded} />,
    ))

    const input = host.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input?.className.split(/\s+/)).toContain('sr-only')
    expect(input?.className.split(/\s+/)).not.toContain('hidden')

    const trigger = [...host.querySelectorAll('button')].find(b => b.textContent === 'Upload fan art')
    expect(trigger).toBeTruthy()
    const clickSpy = vi.spyOn(input!, 'click')
    await act(async () => trigger?.click())
    expect(clickSpy).toHaveBeenCalledTimes(1)

    const file = new File(['art'], 'art.png', { type: 'image/png' })
    await act(async () => {
      Object.defineProperty(input!, 'files', { configurable: true, value: [file] })
      input!.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(host.textContent).toContain('Upload storage not configured — create the vault-uploads bucket in Supabase.')
    expect(onUploaded).not.toHaveBeenCalled()
  })
})
