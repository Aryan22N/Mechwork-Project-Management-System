# App Icons & Splash Screen Assets Guide

To automatically generate native Android launcher icons, adaptive icons, and splash screen drawables using `@capacitor/assets`:

1. Place your source icon image at `resources/icon.png` (Recommended size: 1024x1024 PNG).
2. Place your source splash image at `resources/splash.png` (Recommended size: 2732x2732 PNG).
3. Optionally add adaptive icon assets:
   - `resources/icon-foreground.png` (1024x1024 PNG)
   - `resources/icon-background.png` (1024x1024 PNG)

Then run:
```bash
npm run cap:assets
```
This will automatically crop, scale, and copy all required mipmap and drawable assets directly into `android/app/src/main/res/`.
