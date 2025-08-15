# Dark Mode and Theme Management

This document explains the dark mode toggle and automatic theme switching feature implemented in Narada AI.

## Features

### 🌗 Three Theme Modes
- **Light Mode**: Always uses light theme
- **Dark Mode**: Always uses dark theme  
- **Auto Mode**: Automatically switches based on time of day

### ⏰ Time-Based Auto Switching
- **Dark Mode**: 6:00 PM - 6:00 AM
- **Light Mode**: 6:00 AM - 6:00 PM
- Checks and updates every minute when in auto mode
- Uses your local system time

### 💾 Persistent Settings
- Theme preference is saved to localStorage
- Survives browser restarts and page refreshes
- Default setting is "Auto" mode

## Usage

### Header Theme Toggle
In the main page header, click the theme toggle button to cycle through:
1. Light Mode (☀️ Sun icon)
2. Dark Mode (🌙 Moon icon) 
3. Auto Mode (🖥️ Monitor icon)

### Settings Page
Visit `/settings` for detailed theme configuration:
- Visual status indicator showing current mode
- Large buttons to select any theme
- Schedule information for auto mode
- Real-time status updates

## Implementation Details

### Configuration
Theme settings are configured in `lib/config.ts`:

```typescript
export const THEME_CONFIG = {
  AUTO_DARK_START_HOUR: 18,      // 6 PM
  AUTO_DARK_END_HOUR: 6,         // 6 AM  
  THEME_CHECK_INTERVAL: 60000,   // 1 minute
  DEFAULT_THEME: 'auto',
  STORAGE_KEY: 'narada-theme',
} as const;
```

### Components
- `ThemeToggle`: Header toggle button component
- `ThemeSettings`: Detailed settings page component
- Both components are self-contained with their own state management

### CSS Integration
Uses Tailwind CSS dark mode classes:
- Automatically adds/removes `dark` class on `<html>` element
- All existing dark mode styles work automatically
- Smooth transitions between themes

## Technical Features

### Hydration Safe
- Prevents hydration mismatches during SSR
- Shows loading state until client-side mounted
- Graceful handling of localStorage availability

### Performance Optimized
- Only runs intervals when in auto mode
- Cleans up intervals when switching modes
- Minimal performance impact

### Accessibility
- Screen reader friendly with proper labels
- Keyboard navigation support
- Clear visual indicators for each mode

## Customization

### Changing Auto Schedule
Modify the hours in `THEME_CONFIG`:

```typescript
AUTO_DARK_START_HOUR: 20,  // 8 PM
AUTO_DARK_END_HOUR: 7,     // 7 AM
```

### Different Check Interval
Adjust how often auto mode checks the time:

```typescript
THEME_CHECK_INTERVAL: 30000,  // 30 seconds
```

### Default Theme
Change what new users see first:

```typescript
DEFAULT_THEME: 'light',  // or 'dark' or 'auto'
```

## Browser Support

Works in all modern browsers that support:
- CSS custom properties (CSS variables)
- localStorage
- ES6+ JavaScript features
- Tailwind CSS dark mode

## Future Enhancements

Potential improvements:
- Geolocation-based sunrise/sunset times
- Custom user-defined schedules
- Theme preview before applying
- System preference detection improvements
- Smooth animated transitions between themes
