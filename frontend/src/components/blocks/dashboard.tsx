import React, {useEffect, useState} from "react";
import DataCard from "../ui/dataCard";
import { Spinner } from "../ui/spinner";

import { IconTemperature, IconWindsock, IconWind, IconMist, IconCloudRain, IconDroplet, IconDroplets, IconCloud, IconSnowflake, IconRadar, IconBolt } from '@tabler/icons-react';
import StaticCard from "../ui/staticCard";

const valueExpMap = {
  "temperature": [
    {"colour": "purple", "desc": "Deep Freeze", "isWarning": true},
    {"colour": "blue", "desc": "Freezing", "isWarning": false},
    {"colour": "lightblue", "desc": "Bitter", "isWarning": false},
    {"colour": "teal", "desc": "Cold", "isWarning": false},
    {"colour": "green", "desc": "Cool", "isWarning": false},
    {"colour": "yellow", "desc": "Mild", "isWarning": false},
    {"colour": "orange", "desc": "Warm", "isWarning": false},
    {"colour": "red", "desc": "Hot", "isWarning": false},
    {"colour": "maroon", "desc": "Very Hot", "isWarning": false},
    {"colour": "maroon", "desc": "Extreme Heat", "isWarning": true},
  ],
  "wind": [
    {"colour": "teal", "desc": "Calm"},
    {"colour": "green", "desc": "Light"},
    {"colour": "yellow", "desc": "Moderate Breeze"},
    {"colour": "orange", "desc": "Strong Wind"},
    {"colour": "orange", "desc": "V. Strong Wind"},
    {"colour": "red", "desc": "Gales"},
    {"colour": "maroon", "desc": "Severe Gales", "isWarning": true}
  ],
  "humidity": [
    {"colour": "orange", "desc": "Dry"},
    {"colour": "green", "desc": "Optimal"},
    {"colour": "blue", "desc": "Wet / Oppressive"}
  ],
  "precipitation": [
    {"colour": "black", "desc": "Dry"},
    {"colour": "lightblue", "desc": "Light"},
    {"colour": "teal", "desc": "Rainy Day"},
    {"colour": "blue", "desc": "Wet"},
    {"colour": "blue", "desc": "Wet"},
    {"colour": "orange", "desc": "Very Wet"},
    {"colour": "red", "desc": "Exceptional (>1 month)", "isWarning": true},
  ],
  "precipitation_rate": [
    {"colour": "black", "desc": "Dry"},
    {"colour": "blue", "desc": "Drizzle"},
    {"colour": "teal", "desc": "Light"},
    {"colour": "green", "desc": "Rain"},
    {"colour": "yellow", "desc": "Moderate"},
    {"colour": "orange", "desc": "Heavy"},
    {"colour": "red", "desc": "Very Heavy", "isWarning": true},
    {"colour": "maroon", "desc": "Intense", "isWarning": true},
  ],
  "pressure": [
    {"colour": "blue", "desc": "Deep Low"},
    {"colour": "lightblue", "desc": "Low"},
    {"colour": "teal", "desc": "Weak Low"},
    {"colour": "green", "desc": "Transitionary"},
    {"colour": "red", "desc": "High"},
    {"colour": "maroon", "desc": "Strong High"},
  ],
  "dew_point": [
    {"colour": "black", "desc": "Dry"},
    {"colour": "lightblue", "desc": "Dew Possible"},
    {"colour": "blue", "desc": "Frost Possible"},
  ]
}

export default function Dashboard() {
  const [isConnecting, setIsConnecting] = useState<boolean>(true);

  const [values, setValues] = useState<Record<string,number>>({});
  const [timeGreeting, setTimeGreeting] = useState<string>("Hello.");
  const [valueExp, setValueExp] = useState({
  temperature: { colour: "", desc: "", isWarning: false },
  humidity: { colour: "", desc: "", isWarning: false },
  wind_speed: { colour: "", desc: "", isWarning: false },
  wind_gust: { colour: "", desc: "", isWarning: false },
  precipitation_total_12: { colour: "", desc: "", isWarning: false },
  precipitation_total_24: { colour: "", desc: "", isWarning: false },
  precipitation_rate: { colour: "", desc: "", isWarning: false },
  pressure: { colour: "", desc: "", isWarning: false },
  dew_point: { colour: "", desc: "", isWarning: false },
});


  useEffect(() => {
    const sse = new EventSource("http://"+window.location.hostname+":8000/sse");
    sse.onmessage = e => {
      setIsConnecting(false);

      const now = new Date();
      const timeHour = parseInt( now.toLocaleTimeString([], {
          hour: "2-digit"
      }));

      setTimeGreeting("Good night.");
      if (timeHour >= 18) {
        setTimeGreeting("Good evening.");
      } else if (timeHour >= 12) {
        setTimeGreeting("Good afternoon.")
      } else if (timeHour >= 4) {
        setTimeGreeting("Good morning.")
      }

      const data = JSON.parse(e.data);
      setValues(prev => ({...prev, ...data}));

      for (const sensor in data) {
        if (sensor == "temperature") {
          let id = Math.floor((data[sensor] + 5) / 5) + 1;

          if (id < 0) {
            id = 0;
          } else if (id >= valueExpMap.temperature.length) {
            id = valueExpMap.temperature.length - 1;
          }
          
          const vep = valueExp;
          vep["temperature"] = valueExpMap.temperature[id];
          setValueExp(vep);
        } else if (sensor.includes("wind")) {
          let id = Math.floor(data[sensor] / 10);

          if (id < 0) {
            id = 0;
          } else if (id >= valueExpMap.wind.length) {
            id = valueExpMap.wind.length - 1;
          }
          
          const vep = valueExp;
          vep[sensor] = valueExpMap.wind[id];
          setValueExp(vep);
        } else if (sensor == "humidity") {
          let id = 1;

          if (data[sensor] <= 30) {
            id = 0;
          } else if (data[sensor] > 70) {
            id = 2;
          }
          
          const vep = valueExp;
          vep[sensor] = valueExpMap.humidity[id];
          setValueExp(vep);
        } else if (sensor.includes("precipitation_total")) {
          let id = Math.floor(data[sensor] / 10);

          if (id < 0) {
            id = 0;
          } else if (id >= valueExpMap.precipitation.length) {
            id = valueExpMap.precipitation.length - 1;
          }
          
          const vep = valueExp;
          vep[sensor] = valueExpMap.precipitation[id];
          setValueExp(vep);
        } else if (sensor == "precipitation_rate") {
          let id = 0

          if (data[sensor] > 0) {
            id++;
          }
          if (data[sensor] > 1) {
            id++;
          }
          if (data[sensor] > 2) {
            id = Math.floor(Math.log2(data[sensor])) + 2;
          }
          if (data[sensor] > 32) {
            id = 7
          }
          
          const vep = valueExp;
          vep[sensor] = valueExpMap.precipitation_rate[id];
          setValueExp(vep);
        } else if (sensor == "pressure") {
          let id = 0

          if (data[sensor] > 980) {
            id++;
          }
          if (data[sensor] > 1000) {
            id++;
          }
          if (data[sensor] > 1010) {
            id++;
          }
          if (data[sensor] > 1020) {
            id++;
          }
          if (data[sensor] > 1030) {
            id++;
          }
          
          const vep = valueExp;
          vep[sensor] = valueExpMap.pressure[id];
          setValueExp(vep);
        } else if (sensor == "dew_point") {
          const tempVal = Number(values.temperature ?? 0);
          const dewVal = Number(data[sensor]);
          let id = 0; // 0 = Dry

          // If the air temperature is less than the dew point, dew is possible.
          // If it's also below freezing, frost is possible.
          if (tempVal < dewVal) {
            id = 1; // Dew Possible
            if (tempVal < 0) {
              id = 2; // Frost Possible
            }
          }

          const vep = { ...valueExp };
          vep[sensor] = valueExpMap.dew_point[id];
          setValueExp(vep);
        }
      }
    };
    return () => sse.close();
  }, []);

  return (
    <>
      <div className="flex flex-row">
        <div className="grow" />
        <div className="">
          <h1 className="text-5xl text-center font-heading">{timeGreeting}</h1>
          <p className={`text-center ${!isConnecting && "hidden"}`}><Spinner className="inline size-5" role="status" /> Connecting...</p>
          <div className={`flex flex-wrap -m-2 max-w-[1100px] mt-2 ${isConnecting && "hidden"}`}>
            <DataCard Icon={<IconTemperature className="inline" />} sensor="Temperature" value={ values.temperature ?? 0} unit="°C" progress={ ((values.temperature + 5) / 40) * 100 ?? 0} desc={valueExp.temperature.desc} colour={valueExp.temperature.colour} isWarning={valueExp.temperature.isWarning} />
            <DataCard Icon={<IconWindsock className="inline" />} sensor="Wind Speed" value={ values.wind_speed ?? 0} unit="mph" progress={ (values.wind_speed / 50) * 100 ?? 0} desc={valueExp.wind_speed.desc} colour={valueExp.wind_speed.colour} isWarning={valueExp.wind_speed.isWarning} />
            <DataCard Icon={<IconWind className="inline" />} sensor="Wind Gust" value={ values.wind_gust ?? 0} unit="mph" progress={ (values.wind_gust / 50) * 100 ?? 0} desc={valueExp.wind_gust.desc} colour={valueExp.wind_gust.colour} isWarning={valueExp.wind_gust.isWarning} />
            <DataCard Icon={<IconMist className="inline" />} sensor="Humidity" value={ values.humidity ?? 0} unit="%" progress={ values.humidity ?? 0} desc={valueExp.humidity.desc} colour={valueExp.humidity.colour} />
            <DataCard Icon={<IconDroplet className="inline" />} sensor="Precipitation Total 12h" value={ values.precipitation_total_12 ?? 0} unit="mm" progress={ values.precipitation_total_12 * 5 ?? 0} desc={valueExp.precipitation_total_12.desc} colour={valueExp.precipitation_total_12.colour} isWarning={valueExp.precipitation_total_12.isWarning} />
            <DataCard Icon={<IconDroplets className="inline" />} sensor="Precipitation Total 24h" value={ values.precipitation_total_24 ?? 0} unit="mm" progress={ values.precipitation_total_24 * 5 ?? 0} desc={valueExp.precipitation_total_24.desc} colour={valueExp.precipitation_total_24.colour} isWarning={valueExp.precipitation_total_24.isWarning} />
            <DataCard Icon={<IconCloudRain className="inline" />} sensor="Precipitation Rate" value={ values.precipitation_rate ?? 0} unit="mm/hour" progress={ values.precipitation_rate * 3.125 ?? 0} desc={valueExp.precipitation_rate.desc} colour={valueExp.precipitation_rate.colour} isWarning={valueExp.precipitation_rate.isWarning} />
            <DataCard Icon={<IconCloud className="inline" />} sensor="Pressure" value={ values.pressure ?? 0} unit="hPa" progress={ (values.pressure - 963) ?? 0} desc={valueExp.pressure.desc} colour={valueExp.pressure.colour} />
            <DataCard Icon={<IconSnowflake className="inline" />} sensor="Dew Point" value={ values.dew_point ?? 0} unit="°C" progress={ ((values.dew_point + 5) / 40) * 100 ?? 0} desc={valueExp.dew_point.desc} colour={valueExp.dew_point.colour} />
          </div>

          <div className="flex flex-wrap -m-2 max-w-[1100px] mt-2">
            <StaticCard Icon={<IconRadar className="inline" />} title="Radar" link="https://www.windy.com/-Weather-radar-radar?radar,52.166,0.503,10" >
              <iframe width="450" height="300" src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=mph&zoom=9&overlay=radar&product=radar&level=surface&lat=52.241&lon=0.344"></iframe>
            </StaticCard>
            <StaticCard Icon={<IconBolt className="inline" />} title="Lightning" link="https://www.lightningmaps.org/#m=oss;t=3;s=0;o=0;b=0.00;ts=0;y=52.1597;x=0.4515;z=10;d=2;dl=2;dc=0;">
              <iframe src="https://map.blitzortung.org/index.php?interactive=1&NavigationControl=0&FullScreenControl=0&Cookies=0&InfoDiv=0&MenuButtonDiv=1&ScaleControl=1&MapStyle=2#8/52.241/0.344" width="450" height="300"></iframe> 
            </StaticCard>
          </div>
          
        </div>
        <div className="grow" />
      </div>
        
    </>
  );
}