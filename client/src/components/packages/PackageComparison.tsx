import { TravelPackage } from "@/types/travel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Star } from "lucide-react";

interface PackageComparisonProps {
  packages: TravelPackage[];
  onBack: () => void;
  onSelectPackage: (pkg: TravelPackage) => void;
}

export function PackageComparison({ packages, onBack, onSelectPackage }: PackageComparisonProps) {
  const getPackageGradient = (type: string) => {
    switch (type) {
      case "classic":
        return "bg-gradient-to-br from-blue-500 to-purple-600";
      case "foodie":
        return "bg-gradient-to-br from-orange-500 to-red-600";
      case "budget":
        return "bg-gradient-to-br from-green-500 to-teal-600";
      default:
        return "bg-brand-accent";
    }
  };

  const getPackageLetter = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-brand-mute hover:text-brand-accent mb-4 p-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to conversation
        </Button>
        <h2 className="text-2xl font-bold mb-2 text-brand-text">Compare Travel Packages</h2>
        <p className="text-brand-mute">Choose the perfect package for your adventure</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg, index) => (
          <Card key={pkg.id} className="bg-brand-card border-brand-border overflow-hidden hover:border-brand-accent/50 transition-all duration-300">
            <div className={`${getPackageGradient(pkg.type)} p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{pkg.name}</h3>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                  {getPackageLetter(index)}
                </span>
              </div>
              <p className="text-3xl font-bold mb-1">{pkg.budget}</p>
              <p className="opacity-80 text-sm">per person • {pkg.days} days</p>
            </div>
            
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-brand-border">
                  <span className="text-brand-mute text-sm">Route</span>
                  <span className="text-sm font-medium text-brand-text">{pkg.route}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-brand-border">
                  <span className="text-brand-mute text-sm">Accommodation</span>
                  <span className="text-sm font-medium text-brand-text">{pkg.accommodation}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-brand-border">
                  <span className="text-brand-mute text-sm">Dining</span>
                  <span className="text-sm font-medium text-brand-text">{pkg.diningCount} experiences</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-brand-mute text-sm">Attractions</span>
                  <span className="text-sm font-medium text-brand-text">{pkg.attractionCount} locations</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-sm text-brand-text">Highlights</h4>
                <ul className="space-y-2">
                  {pkg.highlights?.slice(0, 4).map((highlight, idx) => (
                    <li key={idx} className="text-sm text-brand-mute flex items-center">
                      <Check className="w-4 h-4 text-brand-accent mr-2 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => onSelectPackage(pkg)}
                className="w-full bg-brand-accent text-brand-bg py-3 font-semibold hover:bg-yellow-500"
              >
                View Day-by-Day
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-brand-card border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left py-3 text-brand-mute font-medium">Feature</th>
                  {packages.map((pkg, index) => (
                    <th key={pkg.id} className="text-center py-3 font-medium text-brand-text">
                      {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)} ({getPackageLetter(index)})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-brand-mute">
                <tr className="border-b border-brand-border/50">
                  <td className="py-3">Budget Range</td>
                  {packages.map(pkg => (
                    <td key={`budget-${pkg.id}`} className="text-center py-3">{pkg.budget}</td>
                  ))}
                </tr>
                <tr className="border-b border-brand-border/50">
                  <td className="py-3">Duration</td>
                  {packages.map(pkg => (
                    <td key={`duration-${pkg.id}`} className="text-center py-3">{pkg.days} days</td>
                  ))}
                </tr>
                <tr className="border-b border-brand-border/50">
                  <td className="py-3">Dining Experiences</td>
                  {packages.map(pkg => (
                    <td key={`dining-${pkg.id}`} className="text-center py-3">{pkg.diningCount}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3">Hotel Quality</td>
                  {packages.map(pkg => (
                    <td key={`hotel-${pkg.id}`} className="text-center py-3">{pkg.accommodation}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
