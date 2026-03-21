import { Storage as NativeStorage, saveBase64Data } from '@apps-in-toss/web-framework'

export type ImportedImage = {
  id: string
  dataUrl: string
  name: string
  source: 'local' | 'album' | 'camera'
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function isAppsInTossRuntime() {
  if (typeof window === 'undefined') {
    return false
  }

  const runtimeWindow = window as Window & {
    ReactNativeWebView?: {
      postMessage?: unknown
    }
  }

  return typeof runtimeWindow.ReactNativeWebView?.postMessage === 'function'
}

export async function optimizeLocalImage(file: File) {
  const rawDataUrl = await readFileAsDataUrl(file)
  const optimizedDataUrl = await resizeDataUrl(rawDataUrl, file.type, 1600)

  return {
    id: createId('local'),
    dataUrl: optimizedDataUrl,
    name: file.name || 'local-image.jpg',
    source: 'local' as const,
  }
}

export async function loadDraftValue(key: string) {
  if (isAppsInTossRuntime()) {
    try {
      const nativeValue = await NativeStorage.getItem(key)

      if (nativeValue) {
        return nativeValue
      }
    } catch {
      return readFromLocalStorage(key)
    }
  }

  return readFromLocalStorage(key)
}

export async function saveDraftValue(key: string, value: string) {
  if (isAppsInTossRuntime()) {
    await NativeStorage.setItem(key, value)
    return
  }

  writeToLocalStorage(key, value)
}

export async function clearDraftValue(key: string) {
  if (isAppsInTossRuntime()) {
    await NativeStorage.removeItem(key)
    return
  }

  removeFromLocalStorage(key)
}

export async function savePngDataUrl(fileName: string, dataUrl: string) {
  const pureBase64 = dataUrl.replace(/^data:image\/png;base64,/, '')

  if (isAppsInTossRuntime()) {
    await saveBase64Data({
      data: pureBase64,
      fileName,
      mimeType: 'image/png',
    })

    return
  }

  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = fileName
  anchor.click()
}

function readFromLocalStorage(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeToLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, value)
  } catch {
    throw new Error('브라우저 저장 공간이 부족해서 초안을 저장할 수 없어요.')
  }
}

function removeFromLocalStorage(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('이미지 파일을 읽지 못했어요.'))
        return
      }

      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(new Error('이미지 파일을 읽는 중 오류가 발생했어요.'))
    }

    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(new Error('이미지를 불러오지 못했어요.'))
    }

    image.src = dataUrl
  })
}

async function resizeDataUrl(dataUrl: string, mimeType: string, maxSide: number) {
  const image = await loadImage(dataUrl)
  const longestSide = Math.max(image.width, image.height)

  if (longestSide <= maxSide) {
    return dataUrl
  }

  const ratio = maxSide / longestSide
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * ratio)
  canvas.height = Math.round(image.height * ratio)

  const context = canvas.getContext('2d')

  if (context == null) {
    return dataUrl
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  if (mimeType === 'image/png') {
    return canvas.toDataURL('image/png')
  }

  return canvas.toDataURL('image/jpeg', 0.9)
}
