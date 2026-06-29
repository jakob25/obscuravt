export type UploadPurpose = 'meme' | 'fan-art' | 'silhouette' | 'general'

export async function uploadImageFile(file: File, purpose: UploadPurpose): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('purpose', purpose)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url as string
}

export function validateImageFile(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) return 'Please choose a JPEG, PNG, GIF, or WebP image.'
  if (file.size > 5 * 1024 * 1024) return 'Image must be 5MB or smaller.'
  return null
}