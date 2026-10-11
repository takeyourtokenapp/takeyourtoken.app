# aOi Assets Directory

This directory serves as a **fallback location** for aOi images when the primary CDN (tyt.foundation) is unavailable.

## Primary Source

All aOi images are hosted on **tyt.foundation** and loaded via CDN:
```
https://tyt.foundation/aoi/
```

## Image Inventory

The following images should be available as fallbacks:

### Core Images
- `portrait-close.png` - Used in header badge, chat widget (PRIMARY)
- `aoi-fullbody-welcome.png` - Full body welcome pose
- `hero-welcome.png` - Hero section image
- `logo.png` - TYT logo

### Evolution Levels
- `portrait-close.png` - Level 1 (Beginner Guide)
- `guiding-left.png` - Level 2 (Explorer Mentor)
- `presenting-open.png` - Level 3 (Builder Advisor)
- `standing-neutral.png` - Level 4 (Guardian Master)

### Additional Poses
- `pointing-right.png` - Pointing gesture
- `aoi-placeholder.svg` - Fallback placeholder

## Usage

Images are loaded via `src/config/aoiConfig.ts`:

```typescript
import { getAoiImage, getTYTLogoUrl } from '../config/aoiConfig';

// Get specific image
const portraitUrl = getAoiImage('portraitClose');
// Result: https://tyt.foundation/aoi/portrait-close.png

// Get logo
const logoUrl = getTYTLogoUrl();
// Result: https://tyt.foundation/aoi/logo.png
```

## Fallback Strategy

All components implement automatic fallback:

```typescript
<img
  src={getAoiImage('portraitClose')}
  alt="aOi"
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    target.src = '/aoi/portrait-close.png'; // Fallback to local
  }}
/>
```

## Component Usage Map

| Component | Image Used | Purpose |
|-----------|-----------|---------|
| `AoiCompactWidget` | portrait-close | Header badge |
| `AoiBadgePill` | portrait-close | Badge pill |
| `AoiChatWidget` | portrait-close | Chat messages |
| `AoiAvatar` | Level-based | User profile avatars |
| `Header` | logo.png | Site logo |
| `Footer` | logo.png | Footer logo |
| `AppLayout` | logo.png | Sidebar logo |

## Notes

- Local fallback images are optional and only loaded if CDN fails
- This folder may be empty in development - images load from tyt.foundation
- To add fallback images, download from tyt.foundation/aoi/ to this directory
