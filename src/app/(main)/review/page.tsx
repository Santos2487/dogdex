'use client';
import { CheckCircle, Loader2 } from "lucide-react";
import useCaptureStore from "@/store/capture-store";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewForm from "@/components/review/ReviewForm";
import Balancer from "react-wrap-balancer";

export default function ReviewPage() {
    const router = useRouter();
    const photoDataUri = useCaptureStore((s) => s.photoDataUri);

    useEffect(() => {
        if (!photoDataUri) {
            router.replace('/capture');
        }
    }, [photoDataUri, router]);

    if (!photoDataUri) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                    <Balancer>Review Capture</Balancer>
                </h1>
            </div>
            <ReviewForm />
        </div>
    );
}
