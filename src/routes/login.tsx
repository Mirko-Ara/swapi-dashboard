"use client"

import { useNavigate } from "@tanstack/react-router"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { useAuth } from "@/providers/theme-hooks"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form"
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";
import {useState} from "react";
const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    const { t } = useTranslation();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        console.log("Login attempt with:", values);
        toast.promise(
            new Promise((resolve, reject) => {
                setTimeout(async () => {
                    try {
                        login();
                        await navigate({to: "/dashboard"});
                        resolve("success");
                    } catch (error) {
                        console.error("Error during login or navigation:", error);
                        reject(error);
                    } finally {
                        setIsLoading(false);
                    }
                }, 800);
            }),
            {
                loading: t("loggingIn"),
                success: t("loggedIn"),
                error: t("loginFailed"),
            }
        );
    };

    return (
        <div className="flex min-h-screen items-center justify-center pt-0 pb-35">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>{t("enterYourCredentials")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-500">
                                            {form.formState.errors.email?.message}
                                        </FormMessage>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-500">
                                            {form.formState.errors.password?.message}
                                        </FormMessage>
                                    </FormItem>
                                )}
                            />
                            <Button className="cursor-pointer w-full" type="submit" disabled={isLoading || form.formState.isSubmitting}>
                                {isLoading ? t("loggingIn") : t("signIn")}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default Login