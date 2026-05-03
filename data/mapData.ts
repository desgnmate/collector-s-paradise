export interface Coordinate {
  x: number;
  y: number;
}

export interface Booth {
  id: string;
  position: Coordinate;
  size: {
    width: number;
    height: number;
  };
  vendorName: string;
  category: 'tcg' | 'food' | 'merch' | 'stage' | 'empty';
  description?: string;
  isPremium?: boolean;
}

export interface MapData {
  width: number;
  height: number;
  booths: Booth[];
}

export const MOCK_MAP_DATA: MapData = {
  width: 1000,
  height: 1000,
  booths: [
    // Artist Alley (Right Side)
    {
      id: 'aa-1',
      position: { x: 740, y: 350 },
      size: { width: 40, height: 40 },
      vendorName: 'Pikachu Prints',
      category: 'merch',
      description: 'Exclusive fan art and custom holographic prints.',
      isPremium: true,
    },
    {
      id: 'aa-2',
      position: { x: 790, y: 350 },
      size: { width: 40, height: 40 },
      vendorName: 'Eevee Enamel Pins',
      category: 'merch',
      description: 'Handcrafted enamel pins for every evolution.',
    },
    {
      id: 'aa-3',
      position: { x: 740, y: 400 },
      size: { width: 40, height: 40 },
      vendorName: 'Charmander Crafts',
      category: 'merch',
      description: 'Custom plushies and knitwear.',
    },
    
    // TCG Hub (Left/Center)
    {
      id: 'tcg-1',
      position: { x: 260, y: 350 },
      size: { width: 60, height: 80 },
      vendorName: 'Mint Condition TCG',
      category: 'tcg',
      description: 'Rare vintage boosters and high-grade slabs.',
      isPremium: true,
    },
    {
      id: 'tcg-2',
      position: { x: 260, y: 450 },
      size: { width: 60, height: 80 },
      vendorName: 'Trainer Red Sales',
      category: 'tcg',
      description: 'Modern deck builds and competitive staples.',
    },
    {
      id: 'tcg-3',
      position: { x: 360, y: 350 },
      size: { width: 60, height: 80 },
      vendorName: 'Kanto Cards',
      category: 'tcg',
      description: 'Specializing in Base Set, Jungle, and Fossil.',
    },

    // Food Court (Top Left)
    {
      id: 'food-1',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 60 },
      vendorName: 'Ramune Station',
      category: 'food',
      description: 'Japanese sodas and snacks.',
    },
    {
      id: 'food-2',
      position: { x: 250, y: 100 },
      size: { width: 80, height: 60 },
      vendorName: 'Mochi Magic',
      category: 'food',
      description: 'Authentic handmade mochi in 15 flavors.',
    },

    // Stage Area (Top Right)
    {
      id: 'stage-1',
      position: { x: 650, y: 80 },
      size: { width: 250, height: 150 },
      vendorName: 'The Main Stage',
      category: 'stage',
      description: 'Live box breaks, auctions, and guest panels.',
      isPremium: true,
    },

    // Bottom Section
    {
      id: 'g-12',
      position: { x: 550, y: 800 },
      size: { width: 150, height: 100 },
      vendorName: 'Collector Supplies',
      category: 'merch',
      description: 'Toploaders, sleeves, and ultimate guard deck boxes.',
    },
  ],
};
