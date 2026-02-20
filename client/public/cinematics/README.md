# Cinematic Video Assets

This directory contains video backgrounds for the onboarding tunnel sequence.

## Required Files

### Desktop/Landscape Video (16:9)
**Filename:** `tunnel_16x9.mp4`
- Resolution: 1920x1080 or 1280x720
- Duration: ~5-6 seconds
- Content: Stadium tunnel walk, manager silhouette walking toward bright stadium lights
- Crowd gradually visible, lights brighten as camera moves forward
- Should loop or end on bright light fade

### Mobile/Portrait Video (9:16)
**Filename:** `tunnel_9x16.mp4`
- Resolution: 1080x1920 or 720x1280
- Duration: ~5-6 seconds
- Content: Same as above but vertical composition for mobile devices

### Poster Image
**Filename:** `tunnel_poster.jpg`
- Resolution: 1920x1080
- Content: First frame of tunnel video (for loading state)

## Placeholder/Temporary Assets

Until you have professional videos, you can:
1. Use solid dark gradient backgrounds
2. Use stock footage from:
   - Pexels (free): https://www.pexels.com/search/videos/stadium%20tunnel/
   - Pixabay (free): https://pixabay.com/videos/search/football%20stadium/
   - Envato Elements (paid): Professional stadium footage

## Video Requirements
- Format: MP4 (H.264 codec)
- Size: Keep under 5MB for fast loading
- Optimize with: ffmpeg or HandBrake
- Muted by default (audio handled separately)

## Example ffmpeg Optimization
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -preset slow tunnel_16x9.mp4
```
