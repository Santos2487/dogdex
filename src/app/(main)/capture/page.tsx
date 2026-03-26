import { Camera } from "lucide-react";
import ImageUploader from "@/components/capture/ImageUploader";

export default function CapturePage() {
  return (
    <div className="container mx-auto max-w-lg p-4">
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <Camera className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Capture a Dog</h1>
        <p className="text-muted-foreground max-w-md">
          Use your camera or upload a file to have our AI identify a dog breed.
        </p>
      </div>
      <ImageUploader />
    </div>
  );
}
