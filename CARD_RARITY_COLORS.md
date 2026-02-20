# Card Rarity Metal Colors & Patterns

## Rarity Definitions
Located in: `shared/schema.ts`
```typescript
export const rarityEnum = pgEnum("rarity", ["common", "rare", "unique", "epic", "legendary"]);
```

## 3D Card Metal Slab Colors
Located in: `client/src/components/threeplayercards.tsx` - `rarityPalette()` function

### Legendary (Gold)
- **Metal Base**: `#d4af37` - Rich gold metallic
- **Highlight A**: `#fff9e6` - Cream white highlight
- **Highlight B**: `#f59e0b` - Deep amber
- **Glow**: `#ffd700` - Pure gold glow
- **Emissive**: `#8b6914` with 0.35 intensity

### Unique (Purple)
- **Metal Base**: `#7c3aed` - Vivid purple metallic
- **Highlight A**: `#ddd6fe` - Light lavender
- **Highlight B**: `#06b6d4` - Cyan accent
- **Glow**: `#a78bfa` - Purple glow
- **Emissive**: `#4c2d9f` with 0.25 intensity

### Rare (Red)
- **Metal Base**: `#dc2626` - Crimson red metallic
- **Highlight A**: `#fee2e2` - Light rose
- **Highlight B**: `#f43f5e` - Pink accent
- **Glow**: `#fb7185` - Rose glow
- **Emissive**: `#5a1010` with 0.15 intensity

### Common (Aluminum/Titanium)
- **Metal Base**: `#94a3b8` - Slate metallic (brushed aluminum look)
- **Highlight A**: `#f8fafc` - Nearly white
- **Highlight B**: `#64748b` - Darker slate
- **Glow**: `#cbd5e1` - Soft steel glow
- **Emissive**: `#000000` with 0.05 intensity

## Material Properties

### Metal Slab Physical Material
- **Metalness**: 0.98 (highly reflective)
- **Roughness**: 
  - Common: 0.32
  - Rare: 0.20
  - Epic: 0.18
  - Unique: 0.16
  - Legendary: 0.14
- **Clearcoat**: 1.0 (glossy protective layer)
- **Clearcoat Roughness**: 0.06
- **IOR**: 2.5 (Index of Refraction for premium glass-like reflections)
- **Reflectivity**: 1.0
- **Environment Map Intensity**: 1.8

## 3D Presentation

### iPhone-Style Tilt
- **Z-axis rotation**: -5° (signature iPhone presentation angle)
- **X-axis tilt**: 3° (slight downward viewing angle)
- **Y-axis rotation**: 8° (slight right rotation for depth)

### Card Dimensions
- **Depth**: 0.35 units (premium metal slab thickness)
- **Rounded corners**: 0.24 radius
- **Bevel**: 0.08 thickness with 4 segments

### Lighting Setup
- **Environment**: Warehouse preset (metallic reflections)
- **Ambient**: 0.5 intensity, blue tint (#aabbff)
- **Key Light**: Spotlight at [8, 10, 8], 2.2 intensity
- **Fill Light**: Directional at [-8, 6, 5], warm tint (#ffccaa)
- **Accent Light**: Point light at [0, -3, 3], cool tint (#ccddff)

## Foil & Shine Effects

### Rainbow Foil Shader (Rarity-Specific)
- **Legendary**: Gold-cyan hue shift (+0.15)
- **Unique**: Purple-cyan hue shift (+0.5)
- **Rare**: Red-magenta hue shift (+0.8)
- **Common**: Neutral shift (+0.3)

### Shine Intensities
- **Foil Strength**: Unique (0.38) > Legendary (0.26) > Rare (0.18) > Common (0.12)
- **Shine Strength**: Legendary (0.30) > Unique (0.24) > Rare (0.19) > Common (0.14)

## Pattern Generation

### Rarity Pattern Overlay
Located in: `drawRarityPattern()` function
- **Common**: 130 shards, 0.22 alpha
- **Rare**: 130 shards, 0.30 alpha
- **Unique**: 170 shards, 0.30 alpha with enhanced glow
- **Legendary**: 150 shards, 0.30 alpha with golden tint

### Brushed Metal Grain
- Horizontal noise pattern (180 frequency)
- Sheen range: 0.55 to 1.0 (with 0.45 grain intensity)
- Time-animated for subtle shimmer effect
