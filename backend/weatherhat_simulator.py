"""
weatherhat_sim.py - A complete simulator for the Pimoroni WeatherHAT Python library.

Matches the API documented at:
https://github.com/pimoroni/weatherhat-python
"""

import math
import random
import time
from typing import List


class WindSpeedHistory:
    """Stores wind speed history and calculates averages, gusts, and unit conversions."""

    def __init__(self, max_samples: int = 120):
        self.max_samples = max_samples
        self._samples: List[float] = []  # speed in m/s

    def append(self, speed_mps: float) -> None:
        """Add a new wind speed measurement in m/s."""
        self._samples.append(speed_mps)
        if len(self._samples) > self.max_samples:
            self._samples.pop(0)

    def average_mps(self) -> float:
        """Returns average wind speed in meters per second."""
        return sum(self._samples) / len(self._samples) if self._samples else 0.0

    def average_mph(self) -> float:
        """Returns average wind speed in miles per hour."""
        return self.average_mps() * 2.23694

    def average_kmh(self) -> float:
        """Returns average wind speed in kilometers per hour."""
        return self.average_mps() * 3.6

    def gust_mps(self) -> float:
        """Returns maximum wind gust speed in meters per second."""
        return max(self._samples) if self._samples else 0.0

    def gust_mph(self) -> float:
        """Returns maximum wind gust speed in miles per hour."""
        return self.gust_mps() * 2.23694

    def gust_kmh(self) -> float:
        """Returns maximum wind gust speed in kilometers per hour."""
        return self.gust_mps() * 3.6


class HistoryModule:
    """Namespace module providing access to history helper classes."""
    WindSpeedHistory = WindSpeedHistory


history = HistoryModule()


class WeatherHAT:
    """Mock implementation of the Pimoroni WeatherHAT sensor suite."""

    CARDINAL_DIRECTIONS = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
    ]

    def __init__(self):
        # Base environmental configuration
        self.temperature_offset: float = 3.0  # Default Pi self-heating offset (°C)

        self._base_pressure: float = 1013.25  # hPa
        self._base_humidity: float = 50.0     # %
        self._base_lux: float = 350.0         # Lux

        # Initial sensor readings
        self.device_temperature: float = 18.0  # Raw uncompensated BME280 temp (°C)
        self.pressure: float = self._base_pressure
        self.humidity: float = self._base_humidity
        self.lux: float = self._base_lux

        self.wind_speed: float = 0.0       # m/s
        self.wind_direction: float = 0.0   # Degrees (0, 45, 90, ..., 315)
        self.rain: float = 0.0             # mm/s
        self.rain_total: float = 0.0       # mm total for current update period

        self.updated_wind_rain: bool = False
        self._last_update_time: float = time.time()
        self._sim_time: float = 0.0

    @property
    def temperature(self) -> float:
        """
        Compensated ambient air temperature in °C.
        Applies temperature_offset to device_temperature.
        """
        return round(self.device_temperature - self.temperature_offset, 2)

    @property
    def relative_humidity(self) -> float:
        """Relative humidity in % (temperature-compensated water content)."""
        return self.humidity

    @property
    def dewpoint(self) -> float:
        """Calculates dew point temperature in °C using the Magnus formula."""
        if self.humidity <= 0:
            return 0.0

        a = 17.27
        b = 237.7
        alpha = ((a * self.temperature) / (b + self.temperature)) + math.log(self.humidity / 100.0)
        return round((b * alpha) / (a - alpha), 2)

    @property
    def degrees_to_cardinal(self) -> str:
        """Converts wind direction degrees into a cardinal direction string."""
        idx = int((self.wind_direction + 11.25) / 22.5) % 16
        return self.CARDINAL_DIRECTIONS[idx]

    def update(self, interval: float = 5.0) -> None:
        """
        Simulates reading all Weather HAT sensors.
        - Air temperature ranges smoothly from -10°C to 40°C.
        - Wind speeds range up to 70 mph (31.29 m/s).
        """
        current_time = time.time()
        elapsed = current_time - self._last_update_time
        self._last_update_time = current_time
        self._sim_time += elapsed

        t = self._sim_time

        # 1. Temperature Simulation (-10°C to +40°C ambient range)
        # Midpoint = 15°C, Amplitude = 25°C -> Air Temp sinusoidally cycles between -10°C and 40°C
        ambient_sim = 15.0 + math.sin(t / 60.0) * 25.0 + random.uniform(-0.2, 0.2)
        ambient_sim = max(-10.0, min(40.0, ambient_sim))
        
        # Device temp includes the self-heating offset
        self.device_temperature = round(ambient_sim + self.temperature_offset, 2)

        # 2. Pressure & Humidity
        self.pressure = round(
            self._base_pressure + math.cos(t / 120.0) * 15.0 + random.uniform(-0.1, 0.1),
            2
        )
        self.humidity = round(
            max(1.0, min(100.0, self._base_humidity - math.sin(t / 60.0) * 35.0 + random.uniform(-0.5, 0.5))),
            2
        )

        # 3. Light / Lux
        self.lux = round(
            max(0.0, min(64000.0, self._base_lux + math.sin(t / 30.0) * 30000.0 + random.uniform(-50.0, 50.0))),
            1
        )

        # 4. Wind Direction (45° potentiometer increments)
        if random.random() < 0.3:
            raw_direction = (self.wind_direction + random.choice([-45, 45])) % 360
            self.wind_direction = float(round(raw_direction / 45.0) * 45 % 360)

        # 5. Wind & Rain Interval Updates
        if elapsed >= interval or not self.updated_wind_rain:
            # Wind speed simulation: Up to 31.29 m/s (70 mph)
            # Uses a base wave + Gaussian variations to generate gusts up to 70 mph
            max_mps = 70.0 / 2.23694  # ~31.29 m/s
            base_speed = (math.sin(t / 40.0) + 1.0) / 2.0 * (max_mps * 0.7)
            sim_wind_mps = base_speed + random.gauss(3.0, 4.0)
            self.wind_speed = round(max(0.0, min(max_mps, sim_wind_mps)), 2)

            # Rain bucket simulation (0.28mm increments)
            if random.random() < 0.20:
                ticks = random.randint(1, 5)
                self.rain_total = round(ticks * 0.28, 2)
                self.rain = round(self.rain_total / interval, 4)
            else:
                self.rain_total = 0.0
                self.rain = 0.0

            self.updated_wind_rain = True
        else:
            self.updated_wind_rain = False