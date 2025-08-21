import { create } from 'zustand';
import { TravelPackage } from '@/types/travel';

interface PackageStore {
  packages: TravelPackage[];
  conversationId: string | null;
  isLoading: boolean;
  setPackages: (packages: TravelPackage[], conversationId: string) => void;
  clearPackages: () => void;
  getPackageById: (id: string) => TravelPackage | undefined;
}

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: [],
  conversationId: null,
  isLoading: false,
  
  setPackages: (packages: TravelPackage[], conversationId: string) => {
    set({ packages, conversationId });
  },
  
  clearPackages: () => {
    set({ packages: [], conversationId: null });
  },
  
  getPackageById: (id: string) => {
    return get().packages.find(pkg => pkg.id === id);
  }
}));