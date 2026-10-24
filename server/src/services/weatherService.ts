import axios from 'axios';

export interface WeatherData {
  temperature: string;
  condition: string;
  aqi: string;
  humidity: string;
  windSpeed: string;
  locationName: string;
}

export const getWeatherAndAQI = async (lat: number, lng: number): Promise<WeatherData> => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  
  if (!apiKey) {
    return getFallbackWeather();
  }

  try {
    // Get current weather
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    // Get air pollution data
    const aqiResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`
    );

    const weather = weatherResponse.data;
    const airQuality = aqiResponse.data.list[0];

    const aqiValue = airQuality.main.aqi;
    const aqiText = getAQIText(aqiValue);

    return {
      temperature: `${Math.round(weather.main.temp)}°C`,
      condition: weather.weather[0].description,
      aqi: `${aqiValue} (${aqiText})`,
      humidity: `${weather.main.humidity}%`,
      windSpeed: `${Math.round(weather.wind.speed * 3.6)} km/h`,
      locationName: weather.name,
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return getFallbackWeather();
  }
};

const getAQIText = (aqi: number): string => {
  const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor', 'Extremely Poor'];
  return aqiLevels[aqi - 1] || 'Unknown';
};

const getFallbackWeather = (): WeatherData => ({
  temperature: '--',
  condition: 'Unavailable',
  aqi: '--',
  humidity: '--',
  windSpeed: '--',
  locationName: 'Service Unavailable',
});
