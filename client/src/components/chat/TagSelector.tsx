import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getCityTags } from "@/lib/api";
import { Check, Plus, X, Sparkles, MapPin } from "lucide-react";

interface TagSelectorProps {
  cityName: string;
  countryCode: string;
  onTagsSelected: (tags: string[]) => void;
  onSkip?: () => void;
}

export function TagSelector({ cityName, countryCode, onTagsSelected, onSkip }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadCityTags();
  }, [cityName, countryCode]);

  const loadCityTags = async () => {
    try {
      setIsLoading(true);
      const { tags, isDefault: defaultTags } = await getCityTags(cityName, countryCode);
      setAvailableTags(tags);
      setIsDefault(defaultTags);
    } catch (error) {
      console.error("Failed to load city tags:", error);
      // Fallback to default tags
      setAvailableTags([
        'Must-see Highlights',
        'Local Food & Culture',
        'Shopping Districts',
        'Nature & Parks',
        'Museums & Art',
        'Nightlife',
        'Family Activities'
      ]);
      setIsDefault(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleConfirm = () => {
    if (selectedTags.length > 0) {
      onTagsSelected(selectedTags);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-brand-mute">Loading attractions for {cityName}...</p>
      </div>
    );
  }

  return (
    <Card className="bg-brand-card/50 border-brand-border p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-brand-accent" />
          <h3 className="font-medium text-brand-text">
            {isDefault ? "What interests you most?" : `Popular in ${cityName}:`}
          </h3>
        </div>
        
        {/* Available Tags */}
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? "bg-brand-accent text-brand-bg border-brand-accent" 
                    : "bg-transparent hover:bg-brand-accent/10 hover:border-brand-accent"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {isSelected && <Check className="w-3 h-3 mr-1" />}
                {tag}
              </Badge>
            );
          })}
        </div>

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="pt-3 border-t border-brand-border">
            <p className="text-xs text-brand-mute mb-2">Selected ({selectedTags.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="bg-brand-primary text-white pl-2 pr-1"
                >
                  {tag}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-1 h-auto p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Custom Tag Input */}
        <div className="pt-3 border-t border-brand-border">
          <p className="text-xs text-brand-mute mb-2">Add your own preference:</p>
          <div className="flex gap-2">
            <Input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., TeamLab Planets, Vegan restaurants..."
              className="flex-1 bg-brand-bg/50 border-brand-border text-brand-text placeholder:text-brand-mute"
            />
            <Button
              size="sm"
              onClick={addCustomTag}
              disabled={!customTag.trim()}
              className="bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <Button
            onClick={handleConfirm}
            disabled={selectedTags.length === 0}
            className="flex-1 bg-brand-accent text-brand-bg hover:bg-yellow-500 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Itinerary {selectedTags.length > 0 && `(${selectedTags.length})`}
          </Button>
          {onSkip && (
            <Button
              variant="outline"
              onClick={onSkip}
              className="border-brand-border text-brand-mute hover:bg-brand-bg/50"
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}