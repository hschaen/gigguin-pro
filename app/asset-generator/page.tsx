import { Suspense } from "react";
import AssetGenerator from "@/components/AssetGenerator/AssetGenerator";

export default function AssetGeneratorPage() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Event Asset Generator
        </h1>
        <Suspense fallback={<div>Loading...</div>}>
          <AssetGenerator />
        </Suspense>
      </div>
    </div>
  );
}