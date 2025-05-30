import {useCallback, useState} from 'react';
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
       .min(10, {message: "First name must be at least 10 characters long"})
       .max(20, {message: "First name must not exceed 20 characters"}),
    lastName: z.string()
        .min(10, {message: "Last name must be at least 10 characters long"})
        .max(20, {message: "Last name must not exceed 20 characters"}),
    email: z.string().email("Please enter a valid email address"),
});

const accountFormSchema = z.object({
    currentPassword: z.string()
        .min(6, { message: "Current password is required" }),
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
    const STORAGE_KEY = "twoFactorAuthEnabled";
    const [isEnabled, setIsEnabled] = useState<boolean>(() => {
        if(typeof window !== "undefined") {
            return localStorage.getItem(STORAGE_KEY) === "true";
        }
        return false;
    });
    const handleToggle2FA = useCallback((checked: boolean) => {
        setIsEnabled(checked);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, String(checked));
        }
    }, [STORAGE_KEY]);

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

    const handleUpdatePassword = useCallback((values: z.infer<typeof accountFormSchema>) => {
        setIsLoading(true);
        console.log("Password updated:", values);
        setTimeout(() => {
            accountForm.reset();
            setIsLoading(false);
        }, 800);
    }, [accountForm]);

    const handleResetProfile = useCallback(() => {
        profileForm.reset();
    }, [profileForm]);

    const handleSaveAppearance = useCallback(() => {
        setIsLoading(true);
        console.log("Appearance saved:", {theme, language: i18n.language});
        setTimeout(() => setIsLoading(false), 800);
    }, [theme, i18n.language]);

    const handleThemeToggle = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [setTheme, theme]);


    return (
        <div className="flex flex-col w-full max-w-3xl mx-auto">
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <div className="flex items-center justify-center sm:justify-between">
                    <h2 className="text-[2.25rem] text-center font-bold tracking-tight">{t("settings")}</h2>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 flex">
                        <TabsTrigger
                            value="profile"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:font-medium px-4 pb-3 pt-2 -mb-px flex-1 text-center"
                        >
                            {t("profile")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:font-medium px-4 pb-3 pt-2 -mb-px flex-1 text-center"
                        >
                            {t("account")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="cursor-pointer rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-[0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:font-medium px-4 pb-3 pt-2 -mb-px flex-1 text-center"
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
                                                        <FormMessage className="text-red-500">
                                                            {profileForm.formState.errors.firstName?.message}
                                                        </FormMessage>
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
                                                        <FormMessage className="text-red-500" >
                                                            {profileForm.formState.errors.lastName?.message}
                                                        </FormMessage>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-full overflow-x-auto sm:overflow-visible">
                                            <FormField
                                                control={profileForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem className="mb-10 min-w-[300px]">
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                className="min-w-[250px] sm:min-w-0"
                                                                placeholder={t("enterYourEmail")}
                                                                type="email"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500">
                                                            {profileForm.formState.errors.email?.message}
                                                        </FormMessage>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-wrap gap-2 justify-center sm:justify-end border-t pt-4">
                                        <Button
                                            variant="outline"
                                            className="cursor-pointer mr-0 sm:mr-2 w-full sm:w-auto"
                                            type="button"
                                            onClick={handleResetProfile}
                                        >
                                            {t("cancel")}
                                        </Button>
                                        <Button className="cursor-pointer w-full sm:w-auto" type="submit" disabled={isLoading}>
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
                                                        <Input type="password"  autoComplete="new-password" {...field}/>
                                                    </FormControl>
                                                    <FormMessage className="text-red-500" >
                                                        {accountForm.formState.errors.currentPassword?.message}
                                                    </FormMessage>
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
                                                            <Input type="password" autoComplete="new-password"{...field} />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500">
                                                            {accountForm.formState.errors.newPassword?.message}
                                                        </FormMessage>
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
                                                            <Input type="password" autoComplete="new-password"{...field} />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500">
                                                            {accountForm.formState.errors.confirmPassword?.message}
                                                        </FormMessage>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="mb-7 group flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-4 rounded-xl border border-border/60 bg-gradient-to-r from-card/70 to-card/50 hover:from-accent/5 hover:to-accent/20 transition-all duration-300 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20">
                                            <div className="bg-primary/10 p-2.5 rounded-full flex items-center justify-center text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                    <path d="M12 16.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                                                </svg>
                                            </div>
                                            <div className="flex-1 space-y-1.5 text-center sm:text-left">
                                                <p className="font-medium leading-none text-foreground/90">{t("twoFactorAuth")}</p>
                                                <p className="text-sm text-muted-foreground">{t("enhanceAccountSecurity")}</p>
                                            </div>
                                            <div className="flex flex-col items-center sm:items-end gap-1">
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={handleToggle2FA}
                                                    className="cursor-pointer data-[state=checked]:bg-primary"
                                                />
                                                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity">
                                                  {t("twoFactorAuth")}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-wrap gap-2 justify-center sm:justify-end border-t pt-4">
                                        <Button
                                            variant="outline"
                                            className="cursor-pointer mr-0 sm:mr-2 w-full sm:w-auto"
                                            type="button"
                                            onClick={() => {
                                                accountForm.reset({
                                                    currentPassword: "",
                                                    newPassword: "",
                                                    confirmPassword: ""
                                                });
                                            }}
                                        >
                                            {t("cancel")}
                                        </Button>
                                        <Button
                                            className="cursor-pointer w-full sm:w-auto"
                                            type="submit"
                                            disabled={isLoading}
                                        >
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
                                        <SelectTrigger className="cursor-pointer w-full sm:w-[240px]">
                                            <SelectValue placeholder={t("selectLanguage")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem className="cursor-pointer" value="en">English</SelectItem>
                                            <SelectItem className="cursor-pointer" value="it">Italiano</SelectItem>
                                            <SelectItem className="cursor-pointer" value="es">Español</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mb-4 group relative flex items-center gap-5 p-4 rounded-xl border border-border/60 bg-gradient-to-r from-card/80 to-card/60 hover:from-accent/5 hover:to-accent/20 transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20">
                                    <div className={`p-2.5 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-blue-500/15 text-blue-500" : "bg-amber-500/15 text-amber-500"} transition-colors duration-300`}>
                                        {theme === "dark" ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="4"></circle>
                                                <path d="M12 2v2"></path>
                                                <path d="M12 20v2"></path>
                                                <path d="m4.93 4.93 1.41 1.41"></path>
                                                <path d="m17.66 17.66 1.41 1.41"></path>
                                                <path d="M2 12h2"></path>
                                                <path d="M20 12h2"></path>
                                                <path d="m6.34 17.66-1.41 1.41"></path>
                                                <path d="m19.07 4.93-1.41 1.41"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="black" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium leading-none text-foreground/90">
                                            {theme === "dark" ? t("lightMode") : t("darkMode")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{t("toggleDarkMode")}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            className="cursor-pointer transition-colors duration-300"
                                            checked={theme === "dark"}
                                            onCheckedChange={handleThemeToggle}
                                        />
                                    </div>
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