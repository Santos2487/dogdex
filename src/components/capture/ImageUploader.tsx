'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useCaptureStore from '@/store/capture-store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, FileImage, Loader2 } from 'lucide-react';
import useLanguageStore from '@/store/language-store';

export default function ImageUploader() {
  const router = useRouter();
  const { setCaptureData, clearCaptureData } = useCaptureStore.getState();
  const { language } = useLanguageStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    invalidFileTitle:
      language === 'es' ? 'Tipo de archivo no válido' : 'Invalid File Type',
    invalidFileDescription:
      language === 'es'
        ? 'Selecciona un archivo de imagen.'
        : 'Please select an image file.',
    errorTitle: language === 'es' ? 'Error' : 'Error',
    readErrorDescription:
      language === 'es'
        ? 'No se pudo leer la imagen.'
        : 'Failed to read the image file.',
    preparing:
      language === 'es'
        ? 'Preparando tu foto...'
        : 'Preparing your photo...',
    takePhoto: language === 'es' ? 'Tomar foto' : 'Take Photo',
    uploadFile: language === 'es' ? 'Subir archivo' : 'Upload File',
    qualityHint:
      language === 'es'
        ? '¡Las fotos bien iluminadas funcionan mejor!'
        : 'High-quality, well-lit photos work best!',
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: t.invalidFileTitle,
        description: t.invalidFileDescription,
      });
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUri = e.target?.result as string;

      clearCaptureData();

      setCaptureData({ photoDataUri: dataUri });

      router.push('/analyzing');
    };

    reader.onerror = () => {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: t.errorTitle,
        description: t.readErrorDescription,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (file) {
        processFile(file);
      }
    };

    input.click();
  };

  return (
    <div className="mt-4 flex min-h-[20rem] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-secondary/50 p-6">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {isLoading ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">{t.preparing}</p>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button
              onClick={handleCameraClick}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Camera className="mr-2 h-5 w-5" />
              {t.takePhoto}
            </Button>

            <Button
              onClick={handleUploadClick}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <FileImage className="mr-2 h-5 w-5" />
              {t.uploadFile}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.qualityHint}
          </p>
        </>
      )}
    </div>
  );
}