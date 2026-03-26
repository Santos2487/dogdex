import { PawPrint } from "lucide-react";
import CollectionGrid from "@/components/collection/CollectionGrid";
import Balancer from "react-wrap-balancer";

export default function CollectionPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-8">
        <PawPrint className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">
          <Balancer>My Collection</Balancer>
        </h1>
      </div>

      <CollectionGrid />
    </div>
  );
}
