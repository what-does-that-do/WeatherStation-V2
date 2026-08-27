import redis

# USE weatherhat_simulator IN DEVELOPMENT
# import weatherhat_simulator as weatherhat

# USE weatherhat IN PROD
import weatherhat

from datetime import datetime
from time import sleep
from objects import *
from database import *
import json
from logger import Logger

log = Logger("data_collector")
log.info("Started.")

# Connect to local Redis server
r = redis.Redis(host='localhost', port=6379)

db = Database(user="admin", logger=log)
station = weatherhat.WeatherHAT()


while True:
    currentMinute = int(datetime.now().strftime("%M"))
    weatherHistory = WeatherHistory()

    precip_total_12 = db.get_precipitation()
    precip_total_24 = db.get_precipitation(hours=23, minutes=59)
    precip_rate = db.get_precipitation_rate()
    wind_gust = db.get_wind_gust()
    
    # collect one minute of data from the sensors
    while currentMinute == int(datetime.now().strftime("%M")):
        station.update(interval=1.0) # update sensors every sec

        if station.updated_wind_rain:
            # push per sec data to sse
            r.publish("live", json.dumps({
                "temperature": int(round(station.temperature, 0)),
                "wind_speed": round(station.wind_speed, 1),
                "wind_direction": int(station.wind_direction),
                "dew_point": int(round(station.dewpoint, 0)),
                "pressure": int(station.pressure),
                "humidity": int(round(station.humidity, 0)),
                "precipitation_total_12": round(precip_total_12, 1),
                "precipitation_total_24": round(precip_total_24, 1),
                "precipitation_rate": round(precip_rate, 1),
                "wind_gust": round(wind_gust, 1),
            }))

            # add data to weather history
            weatherHistory.write_data(station.temperature, station.wind_speed, station.wind_direction, station.dewpoint, station.pressure, station.relative_humidity, station.rain_total)

        sleep(1.0)

    log.debug("Writing minute data to database.")
    # summarise the minute's data
    weatherMin = Weather(
        weatherHistory.temperature(),
        weatherHistory.precipitation,
        weatherHistory.wind_speed(),
        weatherHistory.wind_gust(),
        weatherHistory.wind_direction(),
        weatherHistory.dew_point(),
        weatherHistory.pressure(),
        weatherHistory.humidity()
    )
    # write data min to db
    db.add_weather_record(weatherMin)