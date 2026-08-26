
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import type { ReactNode } from "react";
import { IconExternalLink } from "@tabler/icons-react";

export default function StaticCard({Icon, title, link, children}: {Icon: ReactNode; title: string; link: string; children?: ReactNode;}) {
        return (
            <Card className="w-full md:w-[500px] m-2">
                <CardHeader>
                    <div className="flex flex-row">
                        <CardTitle>{Icon} {title}</CardTitle>
                        <div className="grow" />
                        <a
                            href={link}
                            className={buttonVariants({ variant: "outline" })}
                            target="_blank"
                        >
                            <IconExternalLink />
                        </a>
                    </div>
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
            </Card>
        )
}
