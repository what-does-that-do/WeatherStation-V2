def mean(array) -> float:
    return sum(array) / len(array)

def mode(array) -> float:
    counts = {}
    for a in array:
        if a in counts:
            counts[a] += 1
        else:
            counts[a] = 1

    mostCommon = array[0]
    for c in counts:
        if counts[c] > counts[mostCommon]:
            mostCommon = c

    return mostCommon

def median(array) -> float:
    return array[len(array) // 2]

class WeatherHistory:
    def __init__(self):
        self.temperatures = []
        self.wind_speeds = []
        self.wind_directions = []
        self.dew_points = []
        self.pressures = []
        self.humidities = []
        self.precipitation = 0

    def write_data(self, temperature:float, wind_speed:float, wind_direction:int, dew_point:float, pressure:int, humidity:int, precipitation:float = None):
        """Add data to the object.

        Args:
            temperature (float): Temperature in celsius
            wind_speed (float): Wind speed in mph
            wind_direction (int): Wind direction in degrees
            dew_point (float): Dew point in celsius
            pressure (int): Pressure in MBa
            humidity (int): Humidity in integer % (i.e. 50 for 50%)
            precipitation (float, optional): mm of precipitation fallen. Defaults to None.
        """
        self.temperatures.append(round(temperature, 1))
        self.wind_speeds.append(round(wind_speed, 1))
        self.wind_directions.append(wind_direction)
        self.dew_points.append(round(dew_point, 1))
        self.pressures.append(pressure)
        self.humidities.append(humidity)

        if precipitation:
            self.precipitation += precipitation

    def temperature(self) -> float:
        return round(mean(self.temperatures), 1)

    def wind_speed(self) -> float:
        return round(mean(self.wind_speeds), 1)

    def wind_gust(self) -> float:
        return max(self.wind_speeds)

    def wind_direction(self) -> int:
        return mode(self.wind_directions)

    def dew_point(self) -> float:
        return round(mean(self.dew_points), 1)

    def pressure(self) -> int:
        return median(self.pressures)
    
    def humidity(self) -> int:
        return int(round(mean(self.humidities), 0))

    def has_rained(self) -> bool:
        """Checks if any precipitation has occured.

        Returns:
            bool: True if precipitation has occured.
        """
        return not (self.precipitation == 0)

class Weather:
    def __init__(self, 
                 temperature:float = 0, 
                 precipitation:float = 0,
                 wind_speed:float = 0, 
                 wind_gust:float = 0, 
                 wind_direction: int = 0,
                 dew_point: float = 0,
                 pressure: int = 0,
                 humidity: int = 0):
        
        self.temperature = round(temperature, 1)
        self.precipitation = round(precipitation, 2)
        self.wind_speed = round(wind_speed, 1)
        self.wind_gust = round(wind_gust, 1)
        self.wind_direction = int(wind_direction)
        self.dew_point = round(dew_point, 1)
        self.pressure = round(pressure, 0)
        self.humidity = round(humidity, 0)

    def has_rained(self) -> bool:
        """Checks if any precipitation has occured.

        Returns:
            bool: True if precipitation has occured.
        """
        return not (self.precipitation == 0)