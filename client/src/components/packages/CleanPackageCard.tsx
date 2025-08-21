import { TravelPackage } from "@/types/travel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Heart, Star } from "lucide-react";
import { useLocation } from "wouter";

interface CleanPackageCardProps {
  package: TravelPackage;
  index: number;
  onSelect: (pkg: TravelPackage) => void;
  showHeart?: boolean;
}

// Generate beautiful gradient backgrounds for packages
const getPackageImage = (type: string, destination: string) => {
  // Using gradient backgrounds as hero images
  const gradients = {
    classic: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    foodie: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-500",
    budget: "bg-gradient-to-br from-green-400 via-teal-500 to-blue-500",
  };
  
  return gradients[type as keyof typeof gradients] || gradients.classic;
};

const getRecommendedBadge = (index: number) => {
  if (index === 0) return { text: "Top Pick", color: "bg-yellow-500" };
  if (index === 1) return { text: "Popular", color: "bg-gray-400" };
  if (index === 2) return { text: "Best Value", color: "bg-orange-400" };
  return null;
};

export function CleanPackageCard({ package: pkg, index, onSelect, showHeart = true }: CleanPackageCardProps) {
  const [, setLocation] = useLocation();
  const recommendedBadge = getRecommendedBadge(index);
  const imageClass = getPackageImage(pkg.type, pkg.destination);
  
  // Extract key highlights as tags (max 4)
  const highlightTags = pkg.highlights?.slice(0, 4) || [];
  
  // Format price (remove "per person" text if present)
  const formatPrice = (price: string) => {
    // Extract just the numeric value with currency symbol
    const match = price.match(/\$?[\d,]+/);
    return match ? match[0] : price.replace(/per person/i, '').trim();
  };
  
  const handleViewItinerary = () => {
    if (pkg.id) {
      setLocation(`/itinerary/${pkg.id}`);
    } else {
      onSelect(pkg);
    }
  };
  
  return (
    <Card className="overflow-hidden bg-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
      {/* Hero Image Section */}
      <div className="relative h-64 overflow-hidden">
        <div className={`absolute inset-0 ${imageClass}`}>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {recommendedBadge && (
            <Badge className={`${recommendedBadge.color} text-white border-0 px-3 py-1 text-xs font-medium`}>
              {recommendedBadge.text}
            </Badge>
          )}
        </div>
        
        {/* Rating */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium">{index === 0 ? '4.9' : index === 1 ? '4.8' : '4.7'}</span>
        </div>
        
        {/* Package Type Badge */}
        <div className="absolute bottom-4 left-4">
          <Badge className="bg-white/90 backdrop-blur text-gray-800 border-0 px-3 py-1 text-xs font-medium capitalize">
            {pkg.type} Package
          </Badge>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        {/* Title and Location */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
            {pkg.name}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{pkg.destination || pkg.route}</span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {pkg.description}
        </p>
        
        {/* Price and Duration Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-2xl font-bold text-gray-900">
              <DollarSign className="w-5 h-5" />
              <span>{formatPrice(pkg.budget).replace(/[\$NT]/g, '').trim()}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              <span>{pkg.days} days</span>
            </div>
          </div>
          {showHeart && (
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
            </button>
          )}
        </div>
        
        {/* Must-See Highlights */}
        <div className="mb-5">
          <p className="text-xs text-gray-600 mb-2">Key Highlights:</p>
          <div className="flex flex-wrap gap-1.5">
            {highlightTags.map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="secondary"
                className="bg-gray-100 text-gray-700 border-0 px-2 py-0.5 text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Small metric tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-200">
            {pkg.attractionCount} attractions
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-200">
            {pkg.diningCount} dining
          </Badge>
          {pkg.accommodation && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-200">
              Hotels included
            </Badge>
          )}
        </div>
        
        {/* CTA Button */}
        <Button
          onClick={handleViewItinerary}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          View Full Itinerary
        </Button>
      </div>
    </Card>
  );
}