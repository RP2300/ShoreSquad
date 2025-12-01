# ShoreSquad 🌊

*Rally your crew, track weather, and hit the next beach cleanup with our dope map app!*

## Project Overview

ShoreSquad is a modern web application designed to mobilize young people for beach cleanup events. It combines interactive maps, weather tracking, and social features to make environmental action fun and accessible.

## Color Palette & Design

### Primary Colors
- **Ocean Blue** (`#1E88E5`) - Trust, reliability, ocean connection
- **Sandy Beige** (`#F4E4BC`) - Beach vibes, warmth, approachability  
- **Sea Foam Green** (`#4CAF50`) - Environmental focus, growth, action

### Secondary Colors
- **Coral Accent** (`#FF7043`) - Energy, enthusiasm, call-to-action
- **Deep Navy** (`#1A237E`) - Professionalism, depth
- **Clean White** (`#FAFAFA`) - Cleanliness, simplicity

## JavaScript Features

### Core Functionality
- **Interactive Maps** - Location-based event discovery
- **Weather Integration** - Real-time weather conditions for cleanup suitability
- **Progressive Web App** capabilities
- **Geolocation Services** for nearby events
- **Local Storage** for user preferences and offline data
- **Service Workers** for offline functionality

### Performance Optimizations
- **Lazy Loading** for images and content
- **Debounced/Throttled** event handlers
- **Animation Frame** optimized counters
- **Intersection Observer** for scroll animations
- **Error Boundaries** and graceful degradation

### User Experience Features
- **Toast Notifications** for user feedback
- **Loading States** with spinners and progress indicators
- **Responsive Navigation** with hamburger menu
- **Smooth Scrolling** and transitions
- **Accessibility** features (ARIA labels, keyboard navigation)

## UX Design Principles

### Accessibility First
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** mode support
- **Focus indicators** for all interactive elements
- **Skip to content** links

### Mobile-First Design
- **Responsive grid** systems
- **Touch-friendly** button sizes
- **Mobile navigation** patterns
- **Performance optimized** for mobile networks

### Inclusive Features
- **Reduced motion** support for users with vestibular disorders
- **Dark mode** support via CSS media queries
- **Error handling** with clear, actionable messages
- **Offline functionality** for core features

## Project Structure

```
c240-demo/
├── index.html              # Main HTML file with semantic markup
├── css/
│   └── styles.css         # Complete CSS with custom properties and responsive design
├── js/
│   └── app.js             # Main JavaScript application with modular architecture
├── .vscode/
│   └── settings.json      # Live Server configuration
├── .gitignore             # Git ignore file for common exclusions
└── README.md              # This documentation file
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd c240-demo
   ```

2. **Open with Live Server**
   - Open the project in VS Code
   - Install Live Server extension if not already installed
   - Right-click on `index.html` and select "Open with Live Server"
   - The app will open at `http://localhost:3000` (or your configured port)

3. **Start developing**
   - The app includes hot reload for development
   - Modify CSS/JS files and see changes instantly
   - Use browser dev tools for debugging

## Features Overview

### 🗺️ Interactive Maps
- Location-based event discovery
- Real-time event markers
- Distance calculations from user location
- Full-screen map view (coming soon)

### 🌤️ Weather Tracking
- Current weather conditions
- Cleanup suitability indicators
- Wind, humidity, and visibility data
- Location-based weather fetching

### 👥 Community Features
- Event creation and management
- Social sharing capabilities
- Squad formation and invitations
- Impact tracking and badges

### 📱 Progressive Web App
- Offline functionality
- Push notifications (coming soon)
- App-like experience on mobile
- Fast loading and caching

## Browser Support

- **Modern browsers** (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- **Mobile browsers** (iOS Safari, Chrome Mobile, Samsung Internet)
- **Progressive enhancement** for older browsers
- **Graceful degradation** for unsupported features

## Performance Targets

- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **First Input Delay** < 100ms
- **Lighthouse Score** > 90

## Development Notes

### API Integration
- Weather API integration ready (requires API key)
- Maps integration prepared for Mapbox/Google Maps
- Mock data provided for development and testing

### Security Considerations
- API keys stored securely (not in repository)
- Content Security Policy headers recommended
- Input validation and sanitization implemented

### Future Enhancements
- User authentication and profiles
- Real-time chat during events
- Gamification and achievement system
- Mobile app versions (React Native/Flutter)
- Admin dashboard for event management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact the ShoreSquad development team.

---

*Made with 🌊 for a cleaner future*