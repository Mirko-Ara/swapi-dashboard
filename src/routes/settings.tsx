import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/providers/theme-hooks';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {useForm} from "react-hook-form";

const profileFormSchema = z.object({
   firstName: z.string()
       .min(2, {message: "First name must be at least 2 characters long"})
       .max(20, {message: "First name must not exceed 20 characters"}),
    lastName: z.string()
        .min(2, {message: "Last name must be at least 2 characters long"})
        .max(20, {message: "Last name must not exceed 20 characters"}),
    email: z.string().email("Please enter a valid email address"),
});

const accountFormSchema = z.object({
    currentPassword: z.string()
        .min(1, { message: "Current password is required" }),
    newPassword: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(50, { message: "Password must not exceed 50 characters" }),
    confirmPassword: z.string()
        .min(6, { message: "Password must be at least 6 characters long" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const Settings = () => {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: ""
        },
    });

    const accountForm = useForm<z.infer<typeof accountFormSchema>>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        },
    });

    const handleSaveProfile = (values: z.infer<typeof profileFormSchema>) => {
        setIsLoading(true);
        console.log("Profile data saved:", values);
        setTimeout(() => setIsLoading(false), 800);
    };

    const handleUpdatePassword = (values: z.infer<typeof accountFormSchema>) => {
        setIsLoading(true);
        console.log("Password updated:", values);
        setTimeout(() => setIsLoading(false), 800);
    };

    const handleSaveAppearance = () => {
        setIsLoading(true);
        console.log("Appearance saved:", {theme, language: i18n.language});
        setTimeout(() => setIsLoading(false), 800);
    };
    const handleThemeToggle = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };


    return (
        <div className="flex flex-col">
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">{t("settings")}</h2>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0">
                        <TabsTrigger
                            value="profile"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:font-medium px-4 pb-3 pt-2 -mb-px"
                        >
                            {t("profile")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:font-medium px-4 pb-3 pt-2 -mb-px"
                        >
                            {t("account")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:font-medium px-4 pb-3 pt-2 -mb-px"
                        >
                            {t("appearance")}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("userProfile")}</CardTitle>
                                <CardDescription>{t("manageProfileInfo")}</CardDescription>
                            </CardHeader>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(handleSaveProfile)}>
                                    <CardContent className="space-y-5">
                                        <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
                                            <Avatar className="h-24 w-24">
                                                <AvatarImage src="https://github.com/shadcn.png" />
                                                <AvatarFallback>UN</AvatarFallback>
                                            </Avatar>
                                            <Button variant="outline" size="sm" className="cursor-pointer">{t("changeAvatar")}</Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={profileForm.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t("firstName")}</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t("enterYour") + " " + t("firstName")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={profileForm.control}
                                                name="lastName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t("lastName")}</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={t("enterYour") + " " + t("lastName")}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={profileForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={t("enterYourEmail")}
                                                            type="email"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-red-500" />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                    <CardFooter className="flex justify-end border-t pt-4">
                                        <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                                            {isLoading ? t("saving") : t("saveChanges")}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("accountSettings")}</CardTitle>
                                <CardDescription>{t("manageAccountSettings")}</CardDescription>
                            </CardHeader>
                            <Form {...accountForm}>
                                <form onSubmit={accountForm.handleSubmit(handleUpdatePassword)}>
                                    <CardContent className="space-y-5">
                                        <FormField
                                            control={accountForm.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("currentPassword")}</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage className="text-red-500" />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={accountForm.control}
                                                name="newPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t("newPassword")}</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" {...field} />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={accountForm.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t("confirmPassword")}</FormLabel>
                                                        <FormControl>
                                                            <Input type="password" {...field} />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium leading-none">{t("twoFactorAuth")}</p>
                                                <p className="text-sm text-muted-foreground">{t("enhanceAccountSecurity")}</p>
                                            </div>
                                            <Switch className="cursor-pointer"/>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end border-t pt-4">
                                        <Button variant="outline" className="cursor-pointer mr-2" type="button">{t("cancel")}</Button>
                                        <Button className="cursor-pointer" type="submit" disabled={isLoading}>
                                            {isLoading ? t("saving") : t("updatePassword")}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("appearance")}</CardTitle>
                                <CardDescription>{t("customizeAppearance")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label>{t("language")}</Label>
                                    <Select defaultValue={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                                        <SelectTrigger className="w-full sm:w-[240px]">
                                            <SelectValue placeholder={t("selectLanguage")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="it">Italiano</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <div className="font-medium">{theme === "dark" ? t("lightMode") : t("darkMode")}</div>
                                        <div className="text-sm text-muted-foreground">{t("toggleDarkMode")}</div>
                                    </div>
                                    <Switch className="cursor-pointer" checked={theme === "dark"} onCheckedChange={handleThemeToggle} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end border-t pt-4">
                                <Button className="cursor-pointer" onClick={handleSaveAppearance} disabled={isLoading}>
                                    {isLoading ? t("saving") : t("savePreferences")}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Settings;