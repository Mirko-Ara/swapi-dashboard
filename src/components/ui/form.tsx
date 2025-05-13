"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import {
    Controller,
    FormProvider,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
} from "react-hook-form"
import { cn } from "@/lib/utils"

const Form = FormProvider

function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
    return <Controller {...props} />
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
    asChild?: boolean
}

function FormItem({ className, asChild = false, ...props }: FormItemProps) {
    const Comp = asChild ? Slot : "div"
    return (
        <Comp
            className={cn("space-y-2", className)}
            {...props}
        />
    )
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    asChild?: boolean
}

function FormLabel({ className, asChild = false, ...props }: FormLabelProps) {
    const Comp = asChild ? Slot : "label"
    return (
        <Comp
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className
            )}
            {...props}
        />
    )
}

interface FormControlProps extends React.ComponentPropsWithoutRef<typeof Slot> {
    asChild?: boolean
}

const FormControl = React.forwardRef<HTMLElement, FormControlProps>(
    ({ asChild = false, ...props }, ref) => {
        if (asChild) {
            return <Slot ref={ref} {...props} />
        }
        return <div ref={ref as React.Ref<HTMLDivElement>} {...props} />
    }
)

FormControl.displayName = "FormControl"

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    asChild?: boolean
}

function FormMessage({ className, asChild = false, ...props }: FormMessageProps) {
    const Comp = asChild ? Slot : "p"
    return (
        <Comp
            className={cn("text-sm font-medium text-destructive", className)}
            {...props}
        />
    )
}

export {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
}
