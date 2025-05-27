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
        <div className="flex min-h-screen items-center justify-center pt-0 pb-8 sm:pb-12 md:pb-20 lg:pb-[8.75rem]">
            <Card className="w-full max-w-xs sm:max-w-sm lg:max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl">Login</CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base">{t("enterYourCredentials")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 lg:space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs sm:text-sm lg:text-base">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} className="text-xs h-9 px-3 py-2 sm:text-sm sm:h-10 md:h-11 md:text-base lg:h-12 lg:px-4 lg:py-3"/>
                                        </FormControl>
                                        <FormMessage className="text-red-500 text-sm sm:text-sm md:text-base">
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
                                        <FormLabel className="text-xs sm:text-sm lg:text-base">Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} className="text-xs h-9 px-3 py-2 sm:text-sm sm:h-10 md:h-11 md:text-base lg:h-12 lg:px-4 lg:py-3 "/>
                                        </FormControl>
                                        <FormMessage className="text-red-500 text-xs sm:text-sm md:text-base">
                                            {form.formState.errors.password?.message}
                                        </FormMessage>
                                    </FormItem>
                                )}
                            />
                            <Button className="cursor-pointer w-full text-xs h-9 px-4 py-2 sm:text-sm sm:h-10 md:h-11 md:text-base lg:h-12 lg:px-5 lg:py-3" type="submit" disabled={isLoading || form.formState.isSubmitting}>
                                {isLoading ? t("loggingIn") : t("signIn")}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

export default Login