"use client"
import {memo, useEffect, useState} from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { format } from "date-fns"

interface CityTimeProps {
    city: string
    timeZone: string
}

export const  CityTime = memo(function CityTime({ city, timeZone }: CityTimeProps) {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone,
        hour12: true,
    }).format(time)

    const formattedDate = format(time, "EEEE, MMMM d, yyyy")

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{city}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedTime}</div>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </CardContent>
        </Card>
    )
});
