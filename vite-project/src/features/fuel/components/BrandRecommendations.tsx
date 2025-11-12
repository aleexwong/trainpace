/**
 * Brand Recommendations Component
 * Shows gel brand recommendations with pricing based on gels needed
 */

import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Info } from "lucide-react";
import { GEL_BRANDS } from "../types";
import { useState } from "react";

interface BrandRecommendationsProps {
  gelsNeeded: number;
}

export function BrandRecommendations({ gelsNeeded }: BrandRecommendationsProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  if (gelsNeeded === 0) {
    return null;
  }

  // Show top 3 brands
  const recommendedBrands = GEL_BRANDS.slice(0, 3);

  return (
    <Card className="bg-white shadow-lg border-2 border-green-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Brand Recommendations
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Based on {gelsNeeded} {gelsNeeded === 1 ? "gel" : "gels"}, here are our top picks:
        </p>

        <div className="space-y-3">
          {recommendedBrands.map((brand) => {
            const totalCost = (brand.pricePerGel * gelsNeeded).toFixed(2);
            const isSelected = selectedBrand === brand.name;

            return (
              <button
                key={brand.name}
                onClick={() => setSelectedBrand(isSelected ? null : brand.name)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {brand.name}
                      </h4>
                      {brand.caffeine && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          Caffeine
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {brand.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-700">
                        {brand.carbsPerGel}g carbs
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold text-green-700">
                        ${brand.pricePerGel.toFixed(2)}/gel
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-700">
                      ${totalCost}
                    </div>
                    <div className="text-xs text-gray-500">
                      for {gelsNeeded}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Available flavors:
                        </p>
                        <p className="text-xs text-gray-600">
                          {brand.flavors.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            💡 <strong>Pro tip:</strong> Test your chosen gel brand during training runs before race day. Everyone's stomach reacts differently!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
