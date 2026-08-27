"use client"

import React, {useEffect} from "react";
import { addDays, format } from "date-fns"
import { IconCalendar, IconCloud, IconCloudRain, IconDroplet, IconDroplets, IconFileAlert, IconFileDownload, IconInfoCircle, IconMist, IconNavigation, IconSnowflake, IconTemperature, IconWind, IconWindsock } from "@tabler/icons-react"
import { type DateRange } from "react-day-picker"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "../ui/spinner"



export function ExportForm() {
  const today = new Date();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    to: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  })
  const [sensors, setSensors] = React.useState({
    temperature: true,
    wind_speed: true,
    wind_gust: true,
    wind_direction: false,
    precipitation: true,
    humidity: true,
    pressure: true,
    dew_point: false,
  })
  const [isExporting, setIsExporting] = React.useState<boolean>(false);
  const [isFinished, setIsFinished] = React.useState<boolean>(false);
  const [isError, setIsError] = React.useState<boolean>(false);
  const [host, setHost] = React.useState<string>("");
  const [downloadUrl, setDownloadUrl] = React.useState<string>("");

  const dateFrom = date?.from ? format(date.from, "yyyy-MM-dd") + " 00:00:00" : "";
  const dateTo = date?.to ? format(date.to, "yyyy-MM-dd") + " 23:59:59" : dateFrom;
  const selectedSensors = Object.entries(sensors)
    .filter(([, enabled]) => enabled)
    .map(([sensorName]) => sensorName)
    .join(",");

  function send_export_request() {
    setIsFinished(false);
    // const host = window.location.hostname.split(":")[0];
    const url = new URL(`${host}/export_excel`);

    url.searchParams.set("dateFrom", dateFrom);
    url.searchParams.set("dateTo", dateTo);
    url.searchParams.set("sensors", selectedSensors);

    console.log("Sending request to:", url.toString());
    setIsExporting(true);
    setIsError(false);

    fetch(url.toString(), {credentials: 'include'})
    .then((response) => {
        // Our handler throws an error if the request did not succeed.
        if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
        }
        // Otherwise (if the response succeeded), our handler fetches the response
        // as text by calling response.text(), and immediately returns the promise
        // returned by `response.text()`.
        return response.text();
    })
    .then((text) => {
        const fileUrl = new URL(`${host}/get_file`);
        fileUrl.searchParams.set("file", text);
        setDownloadUrl(fileUrl.toString());

        // locally served files mix protocols, so retrieve the file in new tab if local.
        if (fileUrl.protocol == "http:") {
            window.open(fileUrl, "_blank").focus();
        } else {
            document.getElementById("downloader").src = fileUrl;
        }
        
        setIsFinished(true);

        // allow the browser to fetch the file
        setTimeout(() => {
            setIsExporting(false);
        }, 1000);
    })
    .catch((error) => {
        setIsError(true);
        setIsExporting(false);
    });
  }

  useEffect(() => {
    fetch("http://weatherstation.local:8000/").then((response) => {
    if (response.ok) {
        setHost("http://weatherstation.local:8000")
        console.log("Using local.")
    } else {
        setHost("https://weatherapi.whatdoesthatdo.dev");
        console.log("Using tunnel.")
    }
    }).catch((error) => {
      console.log("Using tunnel - error with local.");
      setHost("https://weatherapi.whatdoesthatdo.dev");
    })
}, []);

  return (
    <div className="w-100">
        {isFinished && 
            <Alert className="max-w-md border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50">
                <IconFileDownload />
                <AlertTitle>Export Complete</AlertTitle>
                <AlertDescription>
                Your file will now start downloading. If it doesn't, <a href={downloadUrl} target="_blank">click here</a>.
                </AlertDescription>
            </Alert>
        }
        {isError && 
            <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
                <IconFileDownload />
                <AlertTitle>Export Error</AlertTitle>
                <AlertDescription>
                Please check your date range is valid and try again.
                </AlertDescription>
            </Alert>
        }
        <br />
        <Field className="mx-auto">
            <FieldLabel htmlFor="date-picker-range">Dates to include</FieldLabel>
            <Popover>
                <PopoverTrigger render={<Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal"><IconCalendar data-icon="inline-start" />{date?.from ? (
                    date.to ? (
                    <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                    </>
                    ) : (
                    format(date.from, "LLL dd, y")
                    )
                ) : (
                    <span>Pick a date</span>
                )}</Button>} />
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
        </Field>

        <br></br>

        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline">Edit sensors to include</Button>} />
            <DropdownMenuContent className="w-48">
                <DropdownMenuGroup>
                <DropdownMenuLabel>Sensors to Include</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                    checked={sensors.temperature}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, temperature: checked === true })
                    }
                >
                    <IconTemperature />
                    Temperature
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={sensors.wind_speed}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, wind_speed: checked === true })
                    }
                >
                    <IconWindsock />
                    Wind Speed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={sensors.wind_gust}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, wind_gust: checked === true })
                    }
                >
                    <IconWind />
                    Wind Gust
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={sensors.wind_direction}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, wind_direction: checked === true })
                    }
                >
                    <IconNavigation />
                    Wind Direction
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={sensors.precipitation}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, precipitation: checked === true })
                    }
                >
                    <IconDroplets />
                    Precipitation
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={sensors.humidity}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, humidity: checked === true })
                    }
                >
                    <IconMist />
                    Humidity
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={sensors.pressure}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, pressure: checked === true })
                    }
                >
                    <IconCloud />
                    Pressure
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={sensors.dew_point}
                    onCheckedChange={(checked) =>
                    setSensors({ ...sensors, dew_point: checked === true })
                    }
                >
                    <IconSnowflake />
                    Dew Point
                </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>

        {isExporting ? 
        <Button disabled>
            <Spinner />
            Exporting...
        </Button> : 
        <Button onClick={send_export_request}>
            Export
        </Button>}

        <iframe id="downloader" className="hidden" />
        
    </div>
    
  )
}
