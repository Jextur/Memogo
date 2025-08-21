import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Plus, X, Sparkles, MapPin, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedTag {
  id?: number;
  label: string;
  category?: string;
  score?: string;
  usageCount?: number;
}

interface EnhancedTagSelectorProps {
  cityName: string;
  countryCode: string;
  onTagsSelected: (tags: string[]) => void;
  onSkip?: () => void;
}

export function EnhancedTagSelector({ cityName, countryCode, onTagsSelected, onSkip }: EnhancedTagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<EnhancedTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [searchResults, setSearchResults] = useState<{ label: string; confidence: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [cityId, setCityId] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadCityTags();
  }, [cityName, countryCode]);

  // Debounced search as user types
  useEffect(() => {
    if (customInput.length < 2) {
      setSearchResults([]);
      return;
    }

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchTags(customInput);
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [customInput]);

  const loadCityTags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cities/tags/${encodeURIComponent(cityName)}/${countryCode}`);
      const data = await response.json();
      
      if (data.enhanced) {
        // Use enhanced tags with categories and scores
        setAvailableTags(data.enhanced);
        setCityId(data.cityId);
      } else if (data.tags) {
        // Fallback to simple tag strings
        setAvailableTags(data.tags.map((t: string | EnhancedTag) => 
          typeof t === 'string' ? { label: t } : t
        ));
      }
      
      setIsDefault(data.isDefault || false);
    } catch (error) {
      console.error("Failed to load city tags:", error);
      // Fallback to default tags
      setAvailableTags([
        { label: 'Must-see Highlights', category: 'attraction' },
        { label: 'Local Food & Culture', category: 'food' },
        { label: 'Shopping Districts', category: 'district' },
        { label: 'Nature & Parks', category: 'experience' },
        { label: 'Museums & Art', category: 'attraction' },
        { label: 'Nightlife', category: 'experience' },
        { label: 'Family Activities', category: 'experience' }
      ]);
      setIsDefault(true);
    } finally {
      setIsLoading(false);
    }
  };

  const searchTags = async (query: string) => {
    if (!cityId) return;
    
    try {
      setIsSearching(true);
      const response = await fetch(`/api/cities/tags/search?q=${encodeURIComponent(query)}&cityId=${cityId}`);
      const data = await response.json();
      
      if (data.found && data.tag) {
        setSearchResults([{
          label: data.tag.label,
          confidence: data.tag.confidence
        }]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const normalizeUserTags = async (tags: string[]) => {
    if (!cityId) return tags;
    
    try {
      const response = await apiRequest("/api/cities/tags/normalize", {
        method: "POST",
        body: JSON.stringify({
          inputs: tags,
          cityId,
          cityName,
          countryCode
        })
      });
      
      // Combine matched and custom tags
      return [...(response.matched || []), ...(response.custom || [])];
    } catch (error) {
      console.error("Normalization failed:", error);
      return tags;
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = async () => {
    if (!customInput.trim()) return;
    
    const trimmed = customInput.trim();
    
    // Check if already selected
    if (selectedTags.includes(trimmed)) {
      setCustomInput("");
      return;
    }
    
    // Add the custom tag
    setSelectedTags(prev => [...prev, trimmed]);
    setCustomInput("");
    setSearchResults([]);
  };

  const selectSearchResult = (label: string) => {
    if (!selectedTags.includes(label)) {
      setSelectedTags(prev => [...prev, label]);
    }
    setCustomInput("");
    setSearchResults([]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleConfirm = async () => {
    if (selectedTags.length > 0) {
      // Normalize tags before sending
      const normalizedTags = await normalizeUserTags(selectedTags);
      onTagsSelected(normalizedTags);
    }
  };

  // Group tags by category
  const groupedTags = availableTags.reduce((acc, tag) => {
    const category = tag.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, EnhancedTag[]>);

  const categoryIcons = {
    attraction: <MapPin className="w-3 h-3" />,
    district: <MapPin className="w-3 h-3" />,
    experience: <Sparkles className="w-3 h-3" />,
    food: <span className="text-xs">🍜</span>,
    other: <span className="text-xs">•</span>
  };

  const categoryColors = {
    attraction: "bg-blue-100 hover:bg-blue-200 text-blue-800",
    district: "bg-purple-100 hover:bg-purple-200 text-purple-800",
    experience: "bg-green-100 hover:bg-green-200 text-green-800",
    food: "bg-orange-100 hover:bg-orange-200 text-orange-800",
    other: "bg-gray-100 hover:bg-gray-200 text-gray-800"
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-white/95 backdrop-blur animate-fade-in">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 bg-gray-200 rounded-full w-24"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/95 backdrop-blur animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {isDefault 
              ? `What interests you most?`
              : `Popular in ${cityName}`
            }
          </h3>
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {selectedTags.length} selected
            </Badge>
          )}
        </div>

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-lg">
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                className="pl-3 pr-1 py-1 bg-purple-600 text-white hover:bg-purple-700"
              >
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0.5 hover:bg-purple-500"
                  onClick={() => removeTag(tag)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Available tags grouped by category */}
        <div className="space-y-3">
          {Object.entries(groupedTags).map(([category, tags]) => (
            <div key={category}>
              {!isDefault && (
                <p className="text-xs text-gray-500 mb-1 capitalize">{category}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Button
                    key={tag.label}
                    variant="outline"
                    size="sm"
                    className={`${
                      selectedTags.includes(tag.label)
                        ? 'bg-purple-100 border-purple-400 text-purple-700'
                        : categoryColors[category as keyof typeof categoryColors] || categoryColors.other
                    } transition-all`}
                    onClick={() => toggleTag(tag.label)}
                  >
                    {categoryIcons[category as keyof typeof categoryIcons] || categoryIcons.other}
                    <span className="ml-1">{tag.label}</span>
                    {selectedTags.includes(tag.label) && (
                      <Check className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Custom input with search */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={`Add your own (e.g., "TeamLab", "築地", "Shinjuku nightlife")`}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                className="pr-8"
              />
              {isSearching && (
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-pulse" />
              )}
            </div>
            <Button
              onClick={addCustomTag}
              disabled={!customInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
              <p className="text-xs text-gray-500 px-2">Did you mean:</p>
              {searchResults.map(result => (
                <button
                  key={result.label}
                  className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm flex items-center justify-between"
                  onClick={() => selectSearchResult(result.label)}
                >
                  <span>{result.label}</span>
                  <span className="text-xs text-gray-400">
                    {Math.round(result.confidence * 100)}% match
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleConfirm}
            disabled={selectedTags.length === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            Continue with {selectedTags.length || 'no'} {selectedTags.length === 1 ? 'preference' : 'preferences'}
          </Button>
          {onSkip && (
            <Button
              onClick={onSkip}
              variant="outline"
              className="border-gray-300"
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}