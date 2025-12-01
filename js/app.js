// ===== SHORESQUAD APP - MAIN JAVASCRIPT FILE =====

// App Configuration
const APP_CONFIG = {
  name: 'ShoreSquad',
  version: '1.0.0',
  api: {
    // NEA Singapore Weather APIs
    neaWeather: 'https://api.data.gov.sg/v1/environment/air-temperature',
    neaForecast: 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast',
    neaRainfall: 'https://api.data.gov.sg/v1/environment/rainfall',
    neaHumidity: 'https://api.data.gov.sg/v1/environment/relative-humidity',
    neaWindSpeed: 'https://api.data.gov.sg/v1/environment/wind-speed',
    neaWindDirection: 'https://api.data.gov.sg/v1/environment/wind-direction',
    // Fallback APIs
    weather: 'https://api.openweathermap.org/data/2.5/weather',
    geocoding: 'https://api.openweathermap.org/geo/1.0/direct',
    weatherApiKey: 'YOUR_OPENWEATHER_API_KEY',
    mapboxToken: 'YOUR_MAPBOX_TOKEN'
  },
  features: {
    geolocation: true,
    offlineSupport: true,
    animations: true,
    analytics: false
  },
  ui: {
    animationDuration: 250,
    debounceDelay: 300,
    loadingTimeout: 10000
  }
};

// Global State Management
const AppState = {
  user: {
    location: null,
    preferences: {},
    isLoggedIn: false
  },
  events: [],
  weather: null,
  map: null,
  loading: false,
  online: navigator.onLine
};

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Local Storage utilities with error handling
const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`shoresquad_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Storage get error:', error);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(`shoresquad_${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Storage set error:', error);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(`shoresquad_${key}`);
      return true;
    } catch (error) {
      console.warn('Storage remove error:', error);
      return false;
    }
  }
};

// Format date utility
function formatDate(date, format = 'short') {
  const options = {
    short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' }
  };
  
  return new Date(date).toLocaleDateString('en-US', options[format]);
}

// Distance calculation between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ===== LOADING & UI UTILITIES =====

const LoadingManager = {
  overlay: null,
  
  init() {
    this.overlay = document.getElementById('loading-overlay');
  },
  
  show(message = 'Loading...') {
    if (this.overlay) {
      const textElement = this.overlay.querySelector('.loading-text');
      if (textElement) textElement.textContent = message;
      this.overlay.classList.add('active');
      this.overlay.setAttribute('aria-hidden', 'false');
    }
    AppState.loading = true;
  },
  
  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.setAttribute('aria-hidden', 'true');
    }
    AppState.loading = false;
  }
};

// Toast notification system
const Toast = {
  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${this.getIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">&times;</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    const removeToast = () => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    };
    
    setTimeout(removeToast, duration);
    
    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', removeToast);
  },
  
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }
};

// ===== GEOLOCATION SERVICE =====

const GeolocationService = {
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };
      
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          AppState.user.location = coords;
          Storage.set('lastLocation', coords);
          resolve(coords);
        },
        error => {
          console.error('Geolocation error:', error);
          // Try to use cached location
          const cached = Storage.get('lastLocation');
          if (cached) {
            resolve(cached);
          } else {
            reject(error);
          }
        },
        options
      );
    });
  }
};

// ===== WEATHER SERVICE =====

const WeatherService = {
  async fetchWeather(lat, lng) {
    try {
      const [currentWeather, forecast] = await Promise.all([
        this.fetchCurrentWeather(),
        this.fetchWeatherForecast()
      ]);
      
      return {
        ...currentWeather,
        forecast: forecast
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getMockWeatherData();
    }
  },
  
  async fetchCurrentWeather() {
    try {
      const [tempResponse, humidityResponse, windSpeedResponse, windDirResponse, rainfallResponse] = await Promise.all([
        fetch(APP_CONFIG.api.neaWeather),
        fetch(APP_CONFIG.api.neaHumidity),
        fetch(APP_CONFIG.api.neaWindSpeed),
        fetch(APP_CONFIG.api.neaWindDirection),
        fetch(APP_CONFIG.api.neaRainfall)
      ]);
      
      if (!tempResponse.ok) throw new Error('Failed to fetch temperature');
      
      const [tempData, humidityData, windSpeedData, windDirData, rainfallData] = await Promise.all([
        tempResponse.json(),
        humidityResponse.ok ? humidityResponse.json() : null,
        windSpeedResponse.ok ? windSpeedResponse.json() : null,
        windDirResponse.ok ? windDirResponse.json() : null,
        rainfallResponse.ok ? rainfallResponse.json() : null
      ]);
      
      return this.processNEAWeatherData(tempData, humidityData, windSpeedData, windDirData, rainfallData);
    } catch (error) {
      console.warn('NEA API failed, using mock data:', error);
      return this.getCurrentMockData();
    }
  },
  
  async fetchWeatherForecast() {
    try {
      const response = await fetch(APP_CONFIG.api.neaForecast);
      if (!response.ok) throw new Error('Forecast fetch failed');
      
      const data = await response.json();
      return this.processForecastData(data);
    } catch (error) {
      console.warn('Forecast API failed, using mock data:', error);
      return this.getMockForecastData();
    }
  },
  
  processNEAWeatherData(tempData, humidityData, windSpeedData, windDirData, rainfallData) {
    // Extract latest readings from NEA data
    const latestTemp = tempData?.items?.[0]?.readings?.[0] || {};
    const latestHumidity = humidityData?.items?.[0]?.readings?.[0] || {};
    const latestWindSpeed = windSpeedData?.items?.[0]?.readings?.[0] || {};
    const latestWindDir = windDirData?.items?.[0]?.readings?.[0] || {};
    const latestRainfall = rainfallData?.items?.[0]?.readings?.[0] || {};
    
    const temperature = latestTemp.value || 28;
    const humidity = latestHumidity.value || 75;
    const windSpeed = latestWindSpeed.value || 2.5;
    const windDirection = latestWindDir.value || 180;
    const rainfall = latestRainfall.value || 0;
    
    return {
      temperature: Math.round(temperature),
      description: this.getWeatherDescription(temperature, humidity, rainfall),
      icon: this.getWeatherIcon(temperature, humidity, rainfall),
      humidity: Math.round(humidity),
      windSpeed: windSpeed,
      windDirection: windDirection,
      visibility: rainfall < 1 ? 10 : Math.max(5, 10 - rainfall),
      location: 'Singapore',
      rainfall: rainfall,
      suitable: this.isWeatherSuitable({ temp: temperature, windSpeed, rainfall })
    };
  },
  
  processForecastData(data) {
    const forecast = data?.items?.[0]?.forecasts || [];
    const periods = data?.items?.[0]?.periods || [];
    
    // Create 7-day forecast
    const sevenDayForecast = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      let dayForecast;
      if (i < forecast.length) {
        dayForecast = forecast[i];
      } else {
        // Generate reasonable forecast for days beyond API data
        dayForecast = this.generateExtendedForecast(i);
      }
      
      sevenDayForecast.push({
        date: forecastDate,
        day: forecastDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: dayForecast.forecast || 'Partly Cloudy',
        temperature: {
          high: this.extractTemp(dayForecast.temperature?.high) || (28 + Math.random() * 4),
          low: this.extractTemp(dayForecast.temperature?.low) || (24 + Math.random() * 2)
        },
        humidity: {
          high: dayForecast.relative_humidity?.high || (85 + Math.random() * 10),
          low: dayForecast.relative_humidity?.low || (65 + Math.random() * 10)
        },
        wind: dayForecast.wind || 'Light',
        icon: this.getForecastIcon(dayForecast.forecast)
      });
    }
    
    return sevenDayForecast;
  },
  
  extractTemp(tempStr) {
    if (!tempStr) return null;
    const match = tempStr.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  },
  
  generateExtendedForecast(dayIndex) {
    const forecasts = ['Partly Cloudy', 'Cloudy', 'Light Showers', 'Thundery Showers', 'Fair'];
    return {
      forecast: forecasts[dayIndex % forecasts.length],
      temperature: {
        high: `${Math.round(28 + Math.random() * 4)}°C`,
        low: `${Math.round(24 + Math.random() * 2)}°C`
      },
      relative_humidity: {
        high: Math.round(85 + Math.random() * 10),
        low: Math.round(65 + Math.random() * 10)
      },
      wind: 'Light'
    };
  },
  
  getWeatherDescription(temp, humidity, rainfall) {
    if (rainfall > 5) return 'Heavy rain';
    if (rainfall > 1) return 'Light showers';
    if (humidity > 85) return 'Very humid';
    if (temp > 32) return 'Very warm';
    if (temp < 22) return 'Cool';
    return 'Partly cloudy';
  },
  
  getWeatherIcon(temp, humidity, rainfall) {
    if (rainfall > 5) return '09d';
    if (rainfall > 1) return '10d';
    if (humidity > 85) return '04d';
    if (temp > 32) return '01d';
    return '02d';
  },
  
  getForecastIcon(forecast) {
    const iconMap = {
      'Fair': '01d',
      'Partly Cloudy': '02d',
      'Cloudy': '04d',
      'Light Showers': '10d',
      'Thundery Showers': '11d',
      'Heavy Rain': '09d'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (forecast && forecast.includes(key)) return icon;
    }
    return '02d';
  },
  
  getCurrentMockData() {
    return {
      temperature: 28,
      description: 'Partly cloudy',
      icon: '02d',
      humidity: 75,
      windSpeed: 2.5,
      windDirection: 180,
      visibility: 10,
      location: 'Singapore',
      rainfall: 0,
      suitable: true
    };
  },
  
  getMockWeatherData() {
    return {
      ...this.getCurrentMockData(),
      forecast: this.getMockForecastData()
    };
  },
  
  getMockForecastData() {
    const forecasts = ['Partly Cloudy', 'Cloudy', 'Light Showers', 'Fair', 'Thundery Showers', 'Partly Cloudy', 'Fair'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return forecasts.map((forecast, i) => {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      return {
        date: forecastDate,
        day: days[(today.getDay() + i) % 7],
        dateStr: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: forecast,
        temperature: {
          high: Math.round(28 + Math.random() * 4),
          low: Math.round(24 + Math.random() * 2)
        },
        humidity: {
          high: Math.round(85 + Math.random() * 10),
          low: Math.round(65 + Math.random() * 10)
        },
        wind: ['Light', 'Moderate'][Math.floor(Math.random() * 2)],
        icon: this.getForecastIcon(forecast)
      };
    });
  },
  
  isWeatherSuitable(data) {
    const temp = data.temp || data.temperature;
    const windSpeed = data.windSpeed || 0;
    const rainfall = data.rainfall || 0;
    
    return temp > 20 && temp < 35 && windSpeed < 8 && rainfall < 2;
  }
};

// ===== EVENT SERVICE =====

const EventService = {
  async fetchEvents(lat, lng, radius = 50) {
    try {
      // For demo, return mock data
      return this.getMockEvents(lat, lng);
    } catch (error) {
      console.error('Event service error:', error);
      return [];
    }
  },
  
  getMockEvents(lat = 1.3521, lng = 103.8198) {
    const events = [
      {
        id: 1,
        title: 'East Coast Beach Cleanup',
        description: 'Join us for a morning cleanup at East Coast Park! Bring your friends and help keep our shores clean.',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        location: 'East Coast Park, Singapore',
        coordinates: { lat: lat + 0.02, lng: lng + 0.03 },
        attendees: 24,
        maxAttendees: 40,
        difficulty: 'Easy',
        tags: ['family-friendly', 'morning', 'park-connector']
      },
      {
        id: 2,
        title: 'Sentosa Beach Squad',
        description: 'Sunset cleanup session at Sentosa Beach. Perfect for photography enthusiasts!',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        location: 'Sentosa Beach, Singapore',
        coordinates: { lat: lat - 0.02, lng: lng - 0.01 },
        attendees: 18,
        maxAttendees: 30,
        difficulty: 'Medium',
        tags: ['sunset', 'photography', 'social']
      },
      {
        id: 3,
        title: 'Changi Beach Conservation',
        description: 'Help protect marine life by removing plastic waste from Changi Beach.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Changi Beach, Singapore',
        coordinates: { lat: lat + 0.05, lng: lng + 0.05 },
        attendees: 32,
        maxAttendees: 50,
        difficulty: 'Hard',
        tags: ['conservation', 'marine-life', 'educational']
      }
    ];
    
    // Add distance from user location
    events.forEach(event => {
      if (AppState.user.location) {
        event.distance = calculateDistance(
          AppState.user.location.lat,
          AppState.user.location.lng,
          event.coordinates.lat,
          event.coordinates.lng
        );
      }
    });
    
    return events.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }
};

// ===== ANIMATION UTILITIES =====

const AnimationUtils = {
  // Counter animation for statistics
  animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };
    
    requestAnimationFrame(updateCounter);
  },
  
  // Fade in animation
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    
    setTimeout(() => {
      element.style.opacity = '1';
    }, 10);
  },
  
  // Slide in animation
  slideInUp(element, duration = 300) {
    element.style.transform = 'translateY(20px)';
    element.style.opacity = '0';
    element.style.transition = `all ${duration}ms ease`;
    
    setTimeout(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
    }, 10);
  }
};

// ===== UI COMPONENTS =====

const UIComponents = {
  // Render weather widget with 7-day forecast
  renderWeather(weatherData) {
    const widget = document.getElementById('weather-widget');
    if (!widget) return;
    
    const suitabilityColor = weatherData.suitable ? 'var(--sea-foam-green)' : 'var(--coral-accent)';
    const suitabilityText = weatherData.suitable ? 'Great for cleanup!' : 'Check conditions';
    
    widget.innerHTML = `
      <div class="weather-content">
        <!-- Current Weather -->
        <div class="current-weather">
          <div class="weather-main">
            <div class="weather-temp">
              <span class="temp-value">${weatherData.temperature}°C</span>
              <img src="https://openweathermap.org/img/w/${weatherData.icon}.png" 
                   alt="${weatherData.description}" class="weather-icon">
            </div>
            <div class="weather-info">
              <h4 class="weather-location">${weatherData.location}</h4>
              <p class="weather-desc">${weatherData.description}</p>
              <div class="weather-status" style="color: ${suitabilityColor}">
                <span class="status-icon">${weatherData.suitable ? '✅' : '⚠️'}</span>
                ${suitabilityText}
              </div>
            </div>
          </div>
          <div class="weather-details">
            <div class="weather-detail">
              <span class="detail-label">Humidity</span>
              <span class="detail-value">${weatherData.humidity}%</span>
            </div>
            <div class="weather-detail">
              <span class="detail-label">Wind</span>
              <span class="detail-value">${weatherData.windSpeed} m/s</span>
            </div>
            <div class="weather-detail">
              <span class="detail-label">Visibility</span>
              <span class="detail-value">${weatherData.visibility} km</span>
            </div>
            ${weatherData.rainfall !== undefined ? `
            <div class="weather-detail">
              <span class="detail-label">Rainfall</span>
              <span class="detail-value">${weatherData.rainfall} mm</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- 7-Day Forecast -->
        <div class="forecast-section">
          <h5 class="forecast-title">7-Day Forecast</h5>
          <div class="forecast-grid">
            ${weatherData.forecast ? weatherData.forecast.map((day, index) => `
              <div class="forecast-day ${index === 0 ? 'today' : ''}">
                <div class="forecast-header">
                  <span class="forecast-day-name">${index === 0 ? 'Today' : day.day}</span>
                  <span class="forecast-date">${day.dateStr}</span>
                </div>
                <div class="forecast-icon">
                  <img src="https://openweathermap.org/img/w/${day.icon}.png" 
                       alt="${day.forecast}" class="forecast-weather-icon">
                </div>
                <div class="forecast-temps">
                  <span class="temp-high">${day.temperature.high}°</span>
                  <span class="temp-low">${day.temperature.low}°</span>
                </div>
                <div class="forecast-desc">${day.forecast}</div>
                <div class="forecast-details">
                  <span class="humidity-range">💧 ${day.humidity.low}-${day.humidity.high}%</span>
                  <span class="wind-info">🌬️ ${day.wind}</span>
                </div>
              </div>
            `).join('') : '<p class="forecast-loading">Loading forecast...</p>'}
          </div>
        </div>
      </div>
    `;
    
    AnimationUtils.fadeIn(widget);
  },
  
  // Render events grid
  renderEvents(events) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    
    if (events.length === 0) {
      grid.innerHTML = `
        <div class="no-events">
          <div class="no-events-icon">🌊</div>
          <h4>No events nearby</h4>
          <p>Be the first to organize a beach cleanup in your area!</p>
          <button class="btn btn-primary" id="create-first-event">Create Event</button>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = events.map(event => `
      <div class="event-card" data-event-id="${event.id}">
        <div class="event-image" style="background: linear-gradient(135deg, var(--ocean-blue), var(--sea-foam-green));">
          <div class="event-overlay">
            <span class="event-difficulty ${event.difficulty.toLowerCase()}">${event.difficulty}</span>
          </div>
        </div>
        <div class="event-content">
          <h4 class="event-title">${event.title}</h4>
          <div class="event-meta">
            <span class="event-date">
              <span class="meta-icon">📅</span>
              ${formatDate(event.date, 'short')}
            </span>
            <span class="event-location">
              <span class="meta-icon">📍</span>
              ${event.location}
            </span>
            ${event.distance ? `
              <span class="event-distance">
                <span class="meta-icon">📏</span>
                ${event.distance.toFixed(1)} km away
              </span>
            ` : ''}
          </div>
          <p class="event-description">${event.description}</p>
          <div class="event-stats">
            <div class="stat">
              <span class="stat-label">Attendees</span>
              <span class="stat-value">${event.attendees}/${event.maxAttendees}</span>
            </div>
            <div class="event-tags">
              ${event.tags.map(tag => `<span class="event-tag">#${tag}</span>`).join('')}
            </div>
          </div>
          <div class="event-actions">
            <button class="btn btn-primary btn-join-event" data-event-id="${event.id}">
              Join Cleanup
            </button>
            <button class="btn btn-secondary btn-share-event" data-event-id="${event.id}">
              Share
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Animate cards in
    const cards = grid.querySelectorAll('.event-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        AnimationUtils.slideInUp(card);
      }, index * 100);
    });
    
    // Add event listeners
    this.attachEventListeners(grid);
  },
  
  attachEventListeners(container) {
    // Join event buttons
    container.querySelectorAll('.btn-join-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.target.dataset.eventId;
        this.handleJoinEvent(eventId);
      });
    });
    
    // Share event buttons
    container.querySelectorAll('.btn-share-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.target.dataset.eventId;
        this.handleShareEvent(eventId);
      });
    });
  },
  
  handleJoinEvent(eventId) {
    if (!AppState.user.isLoggedIn) {
      Toast.show('Please log in to join events', 'info');
      // Trigger login modal
      return;
    }
    
    Toast.show('Successfully joined the cleanup event!', 'success');
    // Here you would make an API call to join the event
  },
  
  handleShareEvent(eventId) {
    const event = AppState.events.find(e => e.id == eventId);
    if (!event) return;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: `${window.location.origin}/event/${eventId}`
      });
    } else {
      // Fallback: copy to clipboard
      const shareUrl = `${window.location.origin}/event/${eventId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        Toast.show('Event link copied to clipboard!', 'success');
      });
    }
  }
};

// ===== NAVIGATION HANDLER =====

const NavigationHandler = {
  init() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.contains('active');
        
        navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', !isOpen);
        
        // Animate hamburger
        this.animateHamburger(navToggle, !isOpen);
      });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav') && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', false);
        this.animateHamburger(navToggle, false);
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.setAttribute('aria-expanded', false);
        this.animateHamburger(navToggle, false);
        navToggle.focus();
      }
    });
  },
  
  animateHamburger(button, isOpen) {
    const lines = button.querySelectorAll('.hamburger');
    if (isOpen) {
      lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      lines[0].style.transform = 'none';
      lines[1].style.opacity = '1';
      lines[2].style.transform = 'none';
    }
  }
};

// ===== MAP INITIALIZATION =====

const MapManager = {
  map: null,
  
  async initMap() {
    const mapContainer = document.getElementById('map-preview');
    if (!mapContainer) return;
    
    try {
      // For demo, show a static map preview
      await this.showMapPreview();
    } catch (error) {
      console.error('Map initialization error:', error);
      this.showMapError();
    }
  },
  
  async showMapPreview() {
    const mapContainer = document.getElementById('map-preview');
    const placeholder = mapContainer.querySelector('.map-placeholder');
    
    // Simulate map loading
    setTimeout(() => {
      placeholder.innerHTML = `
        <div class="map-preview-content">
          <div class="map-preview-header">
            <h4>🗺️ Nearby Beach Cleanups</h4>
            <span class="map-count">3 events within 10km</span>
          </div>
          <div class="map-preview-locations">
            <div class="location-pin">📍 East Coast Park</div>
            <div class="location-pin">📍 Sentosa Beach</div>
            <div class="location-pin">📍 Changi Beach</div>
          </div>
          <button class="btn btn-primary btn-open-map">
            <span class="btn-icon">🔍</span>
            View Full Map
          </button>
        </div>
      `;
      
      AnimationUtils.fadeIn(placeholder);
      
      // Add click handler for full map
      placeholder.querySelector('.btn-open-map')?.addEventListener('click', () => {
        Toast.show('Full map feature coming soon!', 'info');
      });
    }, 1500);
  },
  
  showMapError() {
    const placeholder = document.querySelector('.map-placeholder');
    if (placeholder) {
      placeholder.innerHTML = `
        <div class="map-error">
          <div class="error-icon">🗺️</div>
          <p>Map temporarily unavailable</p>
          <button class="btn btn-secondary btn-retry-map">Retry</button>
        </div>
      `;
    }
  }
};

// ===== PERFORMANCE MONITORING =====

const PerformanceMonitor = {
  init() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
        
        // Track slow loads
        if (loadTime > 3000) {
          console.warn('Slow page load detected');
        }
      }
    });
    
    // Monitor memory usage (if available)
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          console.warn('High memory usage detected');
        }
      }, 30000);
    }
  }
};

// ===== MAIN APP INITIALIZATION =====

class ShoreSquadApp {
  constructor() {
    this.initialized = false;
  }
  
  async init() {
    try {
      console.log('🌊 Initializing ShoreSquad App...');
      
      // Initialize core services
      LoadingManager.init();
      LoadingManager.show('Setting up ShoreSquad...');
      
      // Initialize navigation
      NavigationHandler.init();
      
      // Initialize performance monitoring
      PerformanceMonitor.init();
      
      // Set up online/offline detection
      this.setupConnectivityMonitoring();
      
      // Initialize location services
      await this.initializeLocation();
      
      // Load weather data
      await this.loadWeatherData();
      
      // Load events
      await this.loadEvents();
      
      // Initialize map
      await MapManager.initMap();
      
      // Animate statistics
      this.animateStatistics();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Hide loading
      LoadingManager.hide();
      
      this.initialized = true;
      console.log('✅ ShoreSquad App initialized successfully!');
      
      // Show welcome message for first-time users
      if (!Storage.get('hasVisited')) {
        setTimeout(() => {
          Toast.show('Welcome to ShoreSquad! 🌊 Let\'s clean some beaches!', 'success', 8000);
          Storage.set('hasVisited', true);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      LoadingManager.hide();
      Toast.show('App initialization failed. Please refresh the page.', 'error');
    }
  }
  
  async initializeLocation() {
    try {
      const position = await GeolocationService.getCurrentPosition();
      console.log('📍 Location obtained:', position);
    } catch (error) {
      console.warn('Location access denied or failed:', error);
      // App can still function without location
    }
  }
  
  async loadWeatherData() {
    try {
      const location = AppState.user.location || { lat: 1.3521, lng: 103.8198 }; // Default to Singapore
      const weather = await WeatherService.fetchWeather(location.lat, location.lng);
      AppState.weather = weather;
      UIComponents.renderWeather(weather);
    } catch (error) {
      console.error('Weather loading failed:', error);
    }
  }
  
  async loadEvents() {
    try {
      const location = AppState.user.location || { lat: 1.3521, lng: 103.8198 };
      const events = await EventService.fetchEvents(location.lat, location.lng);
      AppState.events = events;
      UIComponents.renderEvents(events);
    } catch (error) {
      console.error('Events loading failed:', error);
    }
  }
  
  animateStatistics() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Use Intersection Observer for performance
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.count);
          AnimationUtils.animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    });
    
    statNumbers.forEach(stat => observer.observe(stat));
  }
  
  setupEventListeners() {
    // Main CTA buttons
    document.getElementById('find-cleanup-btn')?.addEventListener('click', () => {
      document.getElementById('events-grid')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    });
    
    document.getElementById('create-event-btn')?.addEventListener('click', () => {
      Toast.show('Event creation feature coming soon!', 'info');
    });
    
    document.getElementById('view-all-events')?.addEventListener('click', () => {
      Toast.show('Loading more events...', 'info');
      // Here you would load more events
    });
    
    // Login/Signup buttons
    document.getElementById('login-btn')?.addEventListener('click', () => {
      Toast.show('Login feature coming soon!', 'info');
    });
    
    document.getElementById('signup-btn')?.addEventListener('click', () => {
      Toast.show('Signup feature coming soon!', 'info');
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
  
  setupConnectivityMonitoring() {
    const updateOnlineStatus = () => {
      AppState.online = navigator.onLine;
      
      if (AppState.online) {
        Toast.show('Connection restored! 🌐', 'success', 3000);
        // Sync any pending data
      } else {
        Toast.show('You\'re offline. Some features may be limited.', 'warning', 5000);
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }
}

// ===== APP STARTUP =====

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

async function startApp() {
  const app = new ShoreSquadApp();
  window.ShoreSquadApp = app; // Make available globally for debugging
  await app.init();
}

// ===== ERROR HANDLING =====

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  if (!AppState.loading) {
    Toast.show('Something went wrong. Please try again.', 'error');
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShoreSquadApp, AppState, Storage };
}

console.log('🌊 ShoreSquad JavaScript loaded successfully!');