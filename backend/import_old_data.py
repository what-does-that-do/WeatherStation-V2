# BRIDGE TO ADD OLD SQLITE DATA INTO POSTGRES

import sqlite3
import os, sys
from database import *
from objects import *

db = Database(user="admin")
OLD_DATA_DIR = "/Users/oli-mac/Desktop/data"

# year this script imports
# run multiple scripts for multiprocessing
if sys.argv[1]:
    filter = sys.argv[1]
else:
    filter = ""

def zpad(s):
    s = "00" + s
    return s[-2:]

def writeRecord(minData, timestamp):
    try:
        # summarise the minute's data
        weatherMin = Weather(
            minData.temperature(),
            minData.precipitation,
            minData.wind_speed(),
            minData.wind_gust(),
            minData.wind_direction(),
            minData.dew_point(),
            minData.pressure(),
            minData.humidity()
        )

        # write data min to db
        db.add_weather_record(weatherMin, timestamp=timestamp, commit=False)
    except Exception as e:
        print("Record error, skipped. Error:", str(e))
        db.commit()

for year_month in os.listdir(OLD_DATA_DIR):
    if year_month == "exports":
        continue
    if filter not in year_month:
        continue

    print("Processing", year_month)
    for day_db in os.listdir(os.path.join(OLD_DATA_DIR, year_month)):
        day = day_db.replace("Database-","").split(".")[0]

        print("Processing", day_db)
        try:
            old_db = sqlite3.connect(os.path.join(OLD_DATA_DIR, year_month, day_db))
        except:
            print("Cannot open database. Skipped.")
            continue
        cur = old_db.cursor()

        hour = 0

        while hour < 24:
            try:
                cur.execute("SELECT * FROM h"+zpad(str(hour))+" ORDER BY time ASC")
                data = cur.fetchall()
            except Exception as e:
                print("Cannot fetch hour",hour,"from",year_month,day," due to",str(e))
                hour += 1
                continue

            currentMin = 0
            minData = WeatherHistory()

            for row in data:
                minData.write_data(
                    temperature=row[1],
                    wind_speed=row[2],
                    wind_direction=row[3],
                    precipitation=row[4],
                    dew_point=row[6],
                    pressure=row[7],
                    humidity=row[8]
                )

                if int(str(row[0])[:2]) != currentMin:
                    timestamp = year_month + "-" + day +" " + zpad(str(hour)) + ":" + zpad(str(currentMin))
                    # print("Writing data record",timestamp)

                    # summarise the minute's data
                    writeRecord(minData, timestamp)

                    currentMin += 1
                    minData = WeatherHistory()

            timestamp = year_month + "-" + day +" " + zpad(str(hour)) + ":" + zpad(str(currentMin))
            # print("Writing data record",timestamp)
    
            # summarise the minute's data
            writeRecord(minData, timestamp)
            
            hour += 1

        print("** Commiting...")
        db.commit()
        print("** Commited day.")

print("Ok, finished.")