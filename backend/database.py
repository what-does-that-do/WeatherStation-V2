import psycopg2
from objects import *
from datetime import datetime, timedelta
from db_config import load_config

class Database:
    def __init__(self, config=None, user="server", logger=None):
        self.logger = logger

        if self.logger:
            self.logger.info("Connecting to db as user: "+user)
        # Load config from file if not provided
        if not config:
            config = load_config(section=user)

        # connect and get cursor
        self.conn = psycopg2.connect(**config)
        self.cursor = self.conn.cursor()

        self.create_tables()

        self.logger.info("Connected to db")

    def create_tables(self):
        tables = (
            """CREATE TABLE IF NOT EXISTS sensordata (
                timestamp TIMESTAMP PRIMARY KEY NOT NULL,
                temperature REAL NOT NULL,
                wind_speed REAL NOT NULL,
                wind_gust REAL NOT NULL,
                wind_direction INT NOT NULL,
                humidity INT NOT NULL,
                pressure INT NOT NULL,
                dew_point REAL NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS pticks (
                timestamp TIMESTAMP PRIMARY KEY NOT NULL,
                precipitation REAL NOT NULL,
                FOREIGN KEY (timestamp) REFERENCES sensordata(timestamp)
            )""",
        )

        try:
            for table in tables:
                self.cursor.execute(table)
            
            self.conn.commit()
        except:
            if self.logger:
                self.logger.warning("Error creating tables, likely insufficient permissions. Rolled back.")
            self.conn.rollback()

    def add_weather_record(self, weather: Weather, timestamp: str = None, commit: bool = True) -> None:
        """Inserts a minute weather record into the database.

        Args:
            weather (Weather): Weather object containing sensor data.
            timestamp (str, optional): Date of data YYYY-MM-DD HH:MM:SS+MS. Defaults to current date.
        """
        if not timestamp:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S+00")
        
        self.cursor.execute("INSERT INTO sensordata VALUES(%s, %s, %s, %s, %s, %s, %s, %s)", (timestamp, weather.temperature, weather.wind_speed, weather.wind_gust, weather.wind_direction, weather.humidity, weather.pressure, weather.dew_point))
        if weather.has_rained():
            self.cursor.execute("INSERT INTO pticks VALUES(%s, %s)", (timestamp, weather.precipitation))

        if commit:
            self.conn.commit()

    def get_precipitation(self, hours: int = 12, minutes: int = 0) -> float:
        """Retrieves precipitation total for a given past timeframe in hours.

        Args:
            hours (int, optional): Hours before current time to include from. Defaults to 12.

        Returns:
            float: The total precipitation fallen in mm.
        """
        past_time = datetime.now() - timedelta(hours=hours, minutes=minutes)
        self.cursor.execute("SELECT precipitation FROM pticks WHERE timestamp>=%s", (past_time.strftime("%Y-%m-%d %H:%M:%S"),))

        total = 0
        for row in self.cursor.fetchall():
            total += row[0]

        return total

    def get_precipitation_rate(self, minutesAccuracy:int = 10) -> float:
        """Gets an estimated precipitation speed in mm/hour.

        Args:
            minutesAccuracy (int, optional): Minutes of data to collect to scale up. Defaults to 10.

        Returns:
            float: Precipitation rate in mm/hour.
        """
        total = self.get_precipitation(hours=0, minutes=minutesAccuracy)
        return total * (60 / minutesAccuracy)

    def get_wind_gust(self, hours: int = 1, minutes: int = 0):
        """Retrieves wind gust for a given past timeframe in hours.
        
        Args:
            hours (int, optional): Hours before current time to include from. Defaults to 1.

        Returns:
            float: The highest wind gust recorded within the timeframe.
        """
        past_time = datetime.now() - timedelta(hours=hours, minutes=minutes)
        self.cursor.execute("SELECT MAX(wind_gust) FROM sensordata WHERE timestamp>=%s", (past_time.strftime("%Y-%m-%d %H:%M:%S"),))

        gust = self.cursor.fetchone()[0]
        if gust:
            return gust
        return 0

    def get_weather_data(self, dateFrom: str, dateTo: str, sensors: list[str] ) -> dict[list[str]]:
        """Fetch weather data records between given dates. If dates not specified, just retrieve record for today.

        Args:
            dateFrom (str): Date of data YYYY-MM-DD HH:MM:SS+MS.
            dateTo (str): Date of data YYYY-MM-DD HH:MM:SS+MS.
            sensors (list[str]): List of sensor IDs to retrieve data from.
        
        Returns:
            list[WeatherHistory]: A dictionary of dates, with a list of records by minute as csv.
        """
        # create a list of sensors to fetch for query
        sensorList = "timestamp, "
        for sensor in sensors:
            sensor = sensor.replace(";","")
            if "precipitation" == sensor:
                continue

            sensorList += sensor + ", "
        sensorList = sensorList[:-2]

        # run query and get result
        self.cursor.execute(f"SELECT {sensorList} FROM sensordata WHERE timestamp >= %s AND timestamp <= %s ORDER BY timestamp ASC", (dateFrom, dateTo))
        result = self.cursor.fetchall()

        # handle no results
        if len(result) == 0:
            return {}

        # compile results into dictionary by date (exclude time from stamp)
        weatherRecords = {"columns": ["timestamps"]+sensors}

        for row in result:
            date = row[0].strftime("%Y-%m-%d")
            rowFormatted = (row[0].strftime("%H:%M"),) + row[1:]

            if date in weatherRecords:
                weatherRecords[date].append(rowFormatted)
            else:
                weatherRecords[date] = [rowFormatted]

        # precipitation is stored as ticks in a separate table
        # add these ticks into the data afterwards
        if "precipitation" in sensors:
            self.cursor.execute("SELECT timestamp, precipitation FROM pticks WHERE timestamp >= %s AND timestamp <= %s", (dateFrom, dateTo))
            result = self.cursor.fetchall()

            for row in result:
                date = row[0].strftime("%Y-%m-%d")
                rowFormatted = (row[0].strftime("%H:%M"),) + row[1:]

                for i in range(len(weatherRecords[date])):
                    if weatherRecords[date][i][0] == rowFormatted[0]:
                        weatherRecords[date][i] += (rowFormatted[1],)
                        break

        return weatherRecords

    def commit(self):
        self.conn.commit()

    def close(self):
        self.cursor.close()
        self.conn.close()