import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Opens the system share sheet with a file. The Android WebView has no Web Share API and ignores
 * <a download>, so the APK writes the file to the cache folder and shares it natively; browsers use
 * navigator.share when they can share files, and otherwise download it.
 * Returns false if the user cancelled.
 */
export async function shareFile(blob: Blob, fileName: string, text: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.writeFile({
        path: fileName,
        data: await blobToBase64(blob),
        directory: Directory.Cache,
      });
      await Share.share({ title: 'NutriStep', text, files: [uri], dialogTitle: 'Share' });
      return true;
    }
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'NutriStep' });
      return true;
    }
  } catch (err: any) {
    if (/cancel|abort/i.test(String(err?.message || err?.name))) return false;
    throw err;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
