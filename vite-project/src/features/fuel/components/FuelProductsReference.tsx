/**
 * Fuel Products Reference Component
 * Displays common fuel products with their carb content
 */

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { FUEL_PRODUCTS } from "../types";

export function FuelProductsReference() {
  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          Common Fuel Products
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {FUEL_PRODUCTS.map((product) => (
            <div
              key={product.name}
              className="p-3 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors"
            >
              <div className="font-medium text-sm text-gray-700">{product.name}</div>
              <div className="text-xl font-bold text-blue-600 mt-1">{product.carbs}g</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
