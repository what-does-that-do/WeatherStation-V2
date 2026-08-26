import { useEffect, useState, type ReactNode } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { IconLayoutDashboard, IconUpload } from '@tabler/icons-react';

type AppSidebarProps = {
  children?: ReactNode,
  title: string
}

export default function AppSidebar({ children, title }: AppSidebarProps) {
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
      setDate(
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      )
    }

    updateClock()
    const interval = window.setInterval(updateClock, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <h1 className="text-2xl text-center font-heading m-2">Weather Station</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<a href="/" />}>
                  <IconLayoutDashboard stroke={2} />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<a href="/export" />}>
                  <IconUpload stroke={2} />
                  Export
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <p id="connmethod">Connecting...</p>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <h1>{title}</h1>
            <div className="grow" />
            <div>
              <h1 className="font-bold text-right">{time}</h1>
              <p>{date}</p>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
