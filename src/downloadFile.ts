interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileSystemWritableFileStreamLike {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface WindowWithSavePicker extends Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<{
    createWritable(): Promise<FileSystemWritableFileStreamLike>;
  }>;
}

export async function saveFile(url: string, fileName: string, mimeType: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to prepare ${fileName} for download.`);
  }

  const blob = await response.blob();
  const picker = (window as WindowWithSavePicker).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [{ description: mimeType, accept: { [mimeType]: [`.${fileName.split('.').pop()}`] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      throw error;
    }
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}
