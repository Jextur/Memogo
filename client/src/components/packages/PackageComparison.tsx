import { TravelPackage } from "@/types/travel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CleanPackageCard } from "./CleanPackageCard";

interface PackageComparisonProps {
  packages: TravelPackage[];
  onBack: () => void;
  onSelectPackage: (pkg: TravelPackage) => void;
}

export function PackageComparison({ packages, onBack, onSelectPackage }: PackageComparisonProps) {
  return (
    <div className="min-h-[calc(100vh-160px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-4 p-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to conversation
          </Button>
          
          {/* Title with gradient */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Choose Your Perfect Journey
            </h2>
            <p className="text-gray-600">Three personalized travel packages designed just for you</p>
          </div>
        </div>

        {/* Package Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <CleanPackageCard
              key={pkg.id}
              package={pkg}
              index={index}
              onSelect={onSelectPackage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
