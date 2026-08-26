import type { ReactNode } from "react"

import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { IconAlertTriangle } from "@tabler/icons-react";

const textColourClasses: Record<string, string> = {
  purple: "text-purple-500",
  blue: "text-blue-500",
  lightblue: "text-sky-400",
  teal: "text-teal-500",
  green: "text-green-500",
  yellow: "text-yellow-300",
  orange: "text-orange-400",
  red: "text-red-500",
  maroon: "text-red-900",
  black: "text-black",
};

const progressColourClasses: Record<string, string> = {
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  lightblue: "bg-sky-400",
  teal: "bg-teal-500",
  green: "bg-green-500",
  yellow: "bg-yellow-300",
  orange: "bg-orange-400",
  red: "bg-red-500",
  maroon: "bg-red-900",
  black: "bg-black",
};

export default function DataCard({ Icon, sensor, value, unit, progress, desc, colour, isWarning, doubleWidth = false }: { Icon: ReactNode; sensor: string; value: number; unit: string; progress: number; desc: string; colour: string; isWarning: boolean; doubleWidth?: boolean }) {
  return (
    <Card className={`w-full md:w-[250px] m-2 ${(isWarning == true) && " bg-orange-200"}`}>
        <CardHeader>
            <CardTitle>{(isWarning == true) ? <IconAlertTriangle className="inline" /> : Icon} {sensor}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className={`text-center text-lg ${textColourClasses[colour] ?? "text-black"}`}>{desc}</p>
            <h1 className={`text-5xl font-semibold font-heading text-center ${textColourClasses[colour] ?? "text-black"}`}>{value}</h1>
            <p className="text-center">{unit}</p>
        </CardContent>
        <CardFooter>
            <Progress
              value={progress}
              className="w-full"
              indicatorClassName={progressColourClasses[colour] ?? "bg-primary"}
            />
        </CardFooter>
    </Card>
  );
}