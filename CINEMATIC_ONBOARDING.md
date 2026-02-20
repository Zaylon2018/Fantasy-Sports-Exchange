# Cinematic Onboarding Tunnel - Implementation Guide

## Overview
A premium FIFA/Sorare-style onboarding experience featuring:
- Stadium tunnel walk with video background
- Crowd audio with user-triggered interaction
- Pack opening reveal with 3D card animations
- 9 cards displayed with interactive selection
- Mobile-responsive (16:9 desktop, 9:16 mobile)

## File Structure

```
client/
├── src/
│   ├── components/
│   │   └── CinematicBackground.tsx     # Video background with mobile detection
│   └── pages/
│       └── onboarding-tunnel.tsx       # Main cinematic orchestration
├── public/
│   ├── cinematics/
│   │   ├── README.md                   # Video asset requirements
│   │   ├── tunnel_16x9.mp4            # Desktop landscape video (REQUIRED)
│   │   ├── tunnel_9x16.mp4            # Mobile portrait video (REQUIRED)
│   │   └── tunnel_poster.jpg          # Loading poster image (REQUIRED)
│   └── sfx/
│       ├── README.md                   # Audio asset requirements
│       ├── crowd_cheer.mp3            # Stadium crowd audio (OPTIONAL)
│       ├── whoosh.mp3                 # Card movement swoosh (OPTIONAL)
│       └── pack_open.mp3              # Pack opening sound (OPTIONAL)
```

## Components

### CinematicBackground.tsx
**Purpose:** Manages video background with mobile/desktop detection

**Features:**
- Automatically selects 16:9 or 9:16 video based on screen orientation
- Fallback gradient if video fails to load
- Dark overlay for text readability (configurable opacity)
- Vignette effect for cinematic feel

**Props:**
```typescript
interface CinematicBackgroundProps {
  show?: boolean;              // Show/hide background
  overlayOpacity?: number;     // 0-1, darkness overlay
  className?: string;          // Additional CSS classes
}
```

**Usage:**
```tsx
<CinematicBackground 
  show={phase !== "start"} 
  overlayOpacity={0.5} 
/>
```

### onboarding-tunnel.tsx
**Purpose:** Main cinematic page with full choreography

**Phases:**
1. **start** - Welcome screen with "Enter the Stadium" button
2. **tunnel** - Video plays, "THE CROWD ROARS..." text
3. **light** - Bloom effect as manager reaches stadium light
4. **pack-appear** - Pack materializes with glow
5. **pack-shake** - Pack shakes with whoosh sound
6. **pack-open** - Pack opens with flash
7. **cards-reveal** - 9 cards fly out in 3D
8. **complete** - UI appears for card selection

**Timeline:**
```
0.0s  → User clicks "Enter the Stadium"
0.0s  → Crowd audio starts (if enabled)
2.5s  → Bloom/light effect
3.0s  → Pack appears
3.5s  → Pack shakes + whoosh
4.0s  → Pack opens + burst sound
4.2s  → Cards fly out (staggered 0.1s each)
5.0s  → Selection UI appears
```

**Audio Handling:**
- Complies with browser autoplay policies
- User must click button to enable audio
- Audio toggle in top-right corner
- Graceful fallback if audio fails

## Assets Required

### Video Assets (Critical)

#### Desktop Video: `tunnel_16x9.mp4`
- **Resolution:** 1920x1080 (or 1280x720)
- **Duration:** 5-6 seconds
- **Content:** Stadium tunnel POV, manager walking toward bright lights
- **Format:** MP4 (H.264), < 5MB
- **Notes:** Should end on bright light or loop smoothly

#### Mobile Video: `tunnel_9x16.mp4`
- **Resolution:** 1080x1920 (or 720x1280)
- **Duration:** 5-6 seconds
- **Content:** Same as desktop, vertical composition
- **Format:** MP4 (H.264), < 3MB

#### Poster Image: `tunnel_poster.jpg`
- **Resolution:** 1920x1080
- **Content:** First frame of tunnel video
- **Purpose:** Loading state, prevents flash

### Audio Assets (Optional)

All audio files will gracefully fail if missing. App works without sound.

#### Crowd Cheer: `crowd_cheer.mp3`
- Duration: 5-10 seconds, building excitement
- Volume: 60% (configurable in code)

#### Whoosh: `whoosh.mp3`
- Duration: 0.5-1 second
- Volume: 40%

#### Pack Open: `pack_open.mp3`
- Duration: 1-2 seconds, celebratory
- Volume: 70%

## Temporary Assets / Placeholders

Until production videos are available:

### Free Stock Footage Sources:
1. **Pexels** (free): https://www.pexels.com/search/videos/stadium%20tunnel/
2. **Pixabay** (free): https://pixabay.com/videos/search/football%20stadium/
3. **Unsplash** (free images): https://unsplash.com/s/photos/stadium-tunnel

### Free Sound Effects:
1. **Freesound.org** (CC licensed)
2. **Zapsplat** (free with attribution)
3. **Mixkit** (no attribution required)

### Fallback Behavior:
If video fails to load:
- Component shows gradient background instead
- All animations still work
- No broken experience

## Video Optimization

Optimize your videos to reduce file size:

```bash
# Desktop 16:9 video
ffmpeg -i input.mp4 \
  -vcodec h264 \
  -acodec aac \
  -b:v 2M \
  -preset slow \
  -s 1280x720 \
  tunnel_16x9.mp4

# Mobile 9:16 video
ffmpeg -i input.mp4 \
  -vcodec h264 \
  -acodec aac \
  -b:v 1.5M \
  -preset slow \
  -s 720x1280 \
  tunnel_9x16.mp4
```

## Routing

The page is already integrated into the app at:
- **Route:** `/onboarding-tunnel`
- **Component:** Already imported in `App.tsx`

To test:
```
http://localhost:5000/onboarding-tunnel
```

## User Flow

1. User lands on onboarding page
2. Sees "Welcome, Manager" screen
3. Clicks "Enter the Stadium"
4. Audio permission granted (if clicked)
5. Video plays, crowd cheers
6. Stadium lights brighten
7. Pack appears and shakes
8. Pack opens with burst
9. 9 cards fly out in 3D grid
10. User selects 5 cards for starting lineup
11. Clicks "Complete Onboarding"
12. Redirected to `/dashboard`

## Mobile Considerations

- **Portrait video** automatically loaded on mobile
- Cards display in 3x3 grid (responsive)
- Touch-friendly selection (tap cards)
- Smaller button sizing on mobile
- Overflow scroll if needed

## Performance

- Video is preloaded (`preload="auto"`)
- Poster image prevents white flash
- Audio only loads when needed
- Framer Motion handles 60fps animations
- GPU-accelerated transforms

## Browser Compatibility

**Video:**
- Chrome/Edge: Full support
- Safari: Full support (H.264 required)
- Firefox: Full support
- Mobile browsers: Full support

**Audio:**
- Autoplay: Blocked by default (handled with user click)
- Format: MP3 supported everywhere

**Animations:**
- Framer Motion: React 16.8+
- CSS transforms: All modern browsers

## Customization

### Adjust Timeline
Edit timeouts in `startSequence()`:
```typescript
setTimeout(() => setPhase("light"), 2500);     // Change 2500 to adjust
setTimeout(() => setPhase("pack-appear"), 3000);
```

### Change Audio Volume
Edit in `useEffect`:
```typescript
if (crowdAudioRef.current) crowdAudioRef.current.volume = 0.6; // 0.0 to 1.0
```

### Modify Overlay Darkness
```tsx
<CinematicBackground overlayOpacity={0.5} /> // 0.0 (light) to 1.0 (dark)
```

### Card Count
Change from 9 to another number:
```typescript
const displayCards = cards?.slice(0, 9) || [];  // Change 9 to desired count
```

## Troubleshooting

### Video Not Playing
- **Check:** Video files exist in `/client/public/cinematics/`
- **Check:** Correct format (MP4, H.264)
- **Check:** Browser console for errors
- **Fallback:** Gradient background shows automatically

### Audio Not Playing
- **Check:** User clicked "Enter the Stadium" button
- **Check:** Audio files exist in `/client/public/sfx/`
- **Check:** Volume not muted at OS level
- **Note:** Audio is optional, not critical

### Cards Not Loading
- **Check:** `/api/user/cards` endpoint working
- **Check:** User has cards in database
- **Check:** Browser console for API errors

### Mobile Video Wrong Orientation
- **Check:** Both `tunnel_16x9.mp4` and `tunnel_9x16.mp4` exist
- **Check:** Mobile device actually in portrait mode
- **Logic:** Component checks `window.innerHeight > window.innerWidth`

## Testing Checklist

- [ ] Desktop video plays on wide screens
- [ ] Mobile video plays on portrait devices
- [ ] Audio enables after button click
- [ ] Audio toggle button works
- [ ] Pack shakes at correct timing
- [ ] 9 cards reveal with stagger
- [ ] Card selection works (max 5)
- [ ] "Complete" button disabled until 5 selected
- [ ] Redirects to dashboard after completion
- [ ] Works without video (gradient fallback)
- [ ] Works without audio (silent)

## Future Enhancements

Potential improvements:
- [ ] Add particle effects during pack open
- [ ] Camera shake on pack burst
- [ ] Rarity-based card entrance effects
- [ ] Sound effect per card rarity
- [ ] Save selected cards to API
- [ ] Skip button for returning users
- [ ] Multiple pack options (rare/epic packs)

## Production Checklist

Before deploying:
1. **Add production videos** (2-5MB each)
2. **Add audio files** or remove audio refs
3. **Test on multiple devices**
4. **Optimize video bitrate** for fast loading
5. **Add analytics** for completion rate
6. **Test slow connections** (3G simulation)

## License & Credits

Videos and audio:
- Ensure you have rights to use any footage
- Credit sources if required (check licenses)
- Consider custom video production for best quality

---

**Implementation Complete** ✅
- Cinematic background component
- Full onboarding page with timeline
- Audio handling with user interaction
- Mobile responsive
- Asset directories with documentation
