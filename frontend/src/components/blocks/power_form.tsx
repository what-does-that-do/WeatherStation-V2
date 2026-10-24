import { Switch } from "@/components/ui/switch";
import { IconNetworkOff, IconPower, IconReload, IconStethoscope, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";
import { get_connection_host } from "@/scripts/station_connection";
import { check } from "astro:schema";

export default function PowerForm() {
    const [host, setHost] = useState<string>("");
    const [cleanSwitch, setCleanSwitch] = useState<boolean>(false);
    const [ready, setReady] = useState<boolean>(false);
    const [isConnectionErrorOpen, setConnectionErrorOpen] = useState<boolean>(false);
    const [isPowerOffWarningOpen, setIsPowerOffWarningOpen] = useState<boolean>(false);
    const [hasRequestSent, setRequestSent] = useState<boolean>(false);
    const [isRestartWarningOpen, setIsRestartWarningOpen] = useState<boolean>(false);
    const [isRestartCompleteOpen, setIsRestartCompleteOpen] = useState<boolean>(false);

    const [isPoweringOff, setisPoweringOff] = useState<boolean>(false);
    const [isRestarting, setIsRestarting] = useState<boolean>(false);

    async function connectToStation() {
        console.log("Connecting...");
        const host = await get_connection_host();

        if (host != null) {
            setHost(host);
            getSwitchStatus();
        } else {
            setConnectionErrorOpen(true);
            console.log("Cannot connect to weather station");
        }
    }

    function getSwitchStatus() {
        fetch(host+"/sys/cleanmode").then((response) => {
            setReady(true);
            if (response.text.toString() == "on") {
                setCleanSwitch(true);
            } else {
                setCleanSwitch(false);
            }
        }).catch((error) => {
            console.log(error);
        })
    }

    function showPowerOffWarning() {
        setIsPowerOffWarningOpen(true);
    }

    function showRestartWarning() {
        setIsRestartWarningOpen(true);
    }

    function powerOff() {
        setRequestSent(true);
        fetch(host+"/sys/poweroff").then((response) => {
            response.text().then(function (text) {
                if (text.includes("ok")) {
                    setisPoweringOff(true);
                }
            });
        }).catch((error) => {
            console.log(error);
        })
    }

    async function checkIfRestarted() {
        console.log("Checking if restart is complete")
        const restartedHost = await get_connection_host();
        if (restartedHost != null) {
            closeAllDialogs();
            setIsRestartCompleteOpen(true);
        } else {
            setTimeout(() => {
                checkIfRestarted();
            }, 5000);
        }
    }

    function restart() {
        setRequestSent(true);
        fetch(host+"/sys/restart").then((response) => {
            response.text().then(function (text) {
                if (text.includes("ok")) {
                    setIsRestarting(true);

                    setTimeout(() => {
                        checkIfRestarted();
                    }, 10000)
                }
            });
            
        }).catch((error) => {
            console.log(error);
        })
    }

    function reloadPage() {
        window.location.reload();
    }

    function closeAllDialogs() {
        setConnectionErrorOpen(false);
        setIsPowerOffWarningOpen(false);
        setIsRestartWarningOpen(false);
        setRequestSent(false);
        setisPoweringOff(false);
        setIsRestarting(false);
    }

    useEffect(() => {
        connectToStation();
    }, []);

    return (
        <>
            <AlertDialog defaultOpen={false} open={isConnectionErrorOpen}>
                <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                        <IconNetworkOff />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Connection Error</AlertDialogTitle>
                    <AlertDialogDescription>
                    Unable to connect to the Weather Station. This can happen if either you or the Weather Station are not connected to the internet.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline" onClick={closeAllDialogs}>Dismiss</AlertDialogCancel>
                    <AlertDialogAction variant="default" onClick={reloadPage}>Retry</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog defaultOpen={false} open={isPowerOffWarningOpen}>
                <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                        <IconPower />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Power Off</AlertDialogTitle>
                    <AlertDialogDescription>
                        Turning off the weather station will close all connections, stop data recording, and you will be unable to access data until it is turned on again.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline" onClick={closeAllDialogs} disabled={hasRequestSent}>Cancel</AlertDialogCancel>
                    {hasRequestSent ? 
                        <AlertDialogAction variant="destructive" disabled={true}><Spinner />Requesting...</AlertDialogAction>
                    :
                        <AlertDialogAction variant="destructive" onClick={powerOff}>Power Off</AlertDialogAction>
                    }
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog defaultOpen={false} open={isRestartCompleteOpen}>
                <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-green-600/10 text-green-600 dark:bg-green-600/20 dark:text-green-600">
                        <IconCheck />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Restart Complete</AlertDialogTitle>
                    <AlertDialogDescription>
                        The weather station has been restarted successfully.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction variant="default" onClick={closeAllDialogs}>OK</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog defaultOpen={false} open={isRestartWarningOpen}>
                <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-amber-600/10 text-amber-600 dark:bg-amber-600/20 dark:text-amber-600">
                        <IconReload />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Restart</AlertDialogTitle>
                    <AlertDialogDescription>
                        Restarting the weather station will take 1-2 minutes, and the system will go offline and stop recording data while this happens.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline" onClick={closeAllDialogs} disabled={hasRequestSent}>Cancel</AlertDialogCancel>
                    {hasRequestSent ? 
                        <AlertDialogAction variant="destructive" disabled={true}><Spinner />Requesting...</AlertDialogAction>
                    :
                        <AlertDialogAction variant="destructive" onClick={restart}>Restart</AlertDialogAction>
                    }
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isPoweringOff}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={"text-3xl"}><IconPower className="inline size-10" /> Shutting down...</DialogTitle>
                        <DialogDescription>
                            The weather station is now switching off. <strong>Please wait 2 minutes</strong> before turning it off at the socket.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <Dialog open={isRestarting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={"text-3xl"}><Spinner className="inline size-10" /> Restarting...</DialogTitle>
                        <DialogDescription>
                            Please wait while the weather station restarts, this page will update once the restart is complete. <strong>Do not turn off at the wall.</strong>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <div className="flex flex-row">
                <div className="grow" />
                <div className="w-100 grid grid-rows-2 grid-cols-2 gap-2">
                    <Button variant={"outline"} className="h-25 overflow-hidden row-1 col-1 w-full" onClick={showPowerOffWarning}>
                        <IconPower className="text-red-600 size-20 inline"></IconPower>
                        <p className="text-lg">Power Off</p>
                    </Button>
                    <Button variant={"outline"} className="h-25 overflow-hidden row-1 col-2 w-full" onClick={showRestartWarning}>
                        <IconReload className="text-orange-600 size-20 inline"></IconReload>
                        <p className="text-lg">Restart</p>
                    </Button>
                    <FieldGroup className="col-1 row-2 col-span-2">
                        <FieldLabel htmlFor="switch-share">
                            <Field orientation="horizontal">
                                <FieldContent>
                                    <FieldTitle><IconStethoscope className="text-blue-600 inline "></IconStethoscope> Cleaning Mode</FieldTitle>
                                    <FieldDescription>
                                    Disables data recording to allow sensors to be cleaned.
                                    </FieldDescription>
                                </FieldContent>
                            <Switch id="switch-share" readOnly={ready} checked={cleanSwitch} />
                            </Field>
                        </FieldLabel>
                    </FieldGroup>
                </div>
                <div className="grow" />
            </div>
        </>
    )
}