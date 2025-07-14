import {useState, useEffect, useMemo} from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import { type User, type UserCreateUpdate, UserRoleSchema } from '@/types/user';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {LoaderSpinner} from '@/components/layout/loader-spinner';
import { useTranslation } from 'react-i18next';
import {Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertCircle,
    Edit,
    Loader2,
    Trash2,
    ShieldCheck,
    Edit2,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Alert, AlertDescription} from "@/components/ui/alert";
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import {Checkbox} from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserFormSchema = z.object({
    username: z.string().min(3, 'Username must contains at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must contains at least 6 characters').optional().or(z.literal('')),
    role: UserRoleSchema,
    isActive: z.boolean(),
});

type UserFormData = z.infer<typeof UserFormSchema>;


export const UserManagementPage = () => {
    const { hasRole } = useAuth();
    const canCreateUsers = useMemo(() => hasRole(['admin']), [hasRole]);
    const canEditUsers = useMemo(() => hasRole(['admin', 'editor']), [hasRole]);
    const canDeleteUsers = useMemo(() => hasRole(['admin']), [hasRole]);
    const canChangeRoles = useMemo(() => hasRole(['admin']), [hasRole]);
    const canView = hasRole(['admin', 'editor', 'viewer']);
    const { data: users, isLoading, isError } = useUsers();
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const deleteUserMutation = useDeleteUser();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { t } = useTranslation();
    const { register, handleSubmit, reset, formState: {errors}, setValue, watch} = useForm<UserFormData>({
        resolver: zodResolver(UserFormSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            role: 'viewer',
            isActive: false,
        }
    });

    useEffect(() => {
        if(editingUser) {
            reset({
                username: editingUser.username,
                email: editingUser.email,
                role: editingUser.role,
                isActive: editingUser.isActive,
                password: '',
            });
        } else {
            reset();
        }
    }, [editingUser, reset]);

    const onSubmit = async (data: UserFormData) => {
        const userData: UserCreateUpdate = {
            username: data.username,
            email: data.email,
            role: data.role,
            isActive: data.isActive,
        };
        if(data.password && data.password.length > 0) {
            userData.password = data.password;
        }
        try {
            if(editingUser) {
                if(!canEditUsers){
                    toast.error(t('unauthorizedAction'));
                    return;
                }
                if(!canChangeRoles && data.role !== editingUser.role) {
                    toast.error(t('unauthorizedRoleChange'));
                    return;
                }
                await updateUserMutation.mutateAsync({id: editingUser.id, updates: userData});
                toast.success(t('userUpdatedSuccessfully', {user: userData.username}));
                setEditingUser(null);
            } else {
                if(!canCreateUsers) {
                    toast.error(t('unauthorizedAction'));
                    return;
                }
                await createUserMutation.mutateAsync(userData);
                toast.success(t('userCreateSuccessfully', {user: userData.username}));
            }
            reset();
        } catch(error) {
            console.error("Error saving user:", error);
            toast.error(t('errorSavingUser'));
        }
    };

    const handleDelete = async (user: User) => {
        if(!canDeleteUsers) {
            toast.error(t('unauthorizedAction'));
            return;
        }
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleteDialogOpen(false);
        if (!userToDelete) return;

        try {
            await deleteUserMutation.mutateAsync(userToDelete.id);
            toast.success(t('userDeletedSuccessfully', {user: userToDelete.username}));
        } catch(error) {
            console.error("Error deleting user:", error);
            toast.error(t('errorDeletingUser', {user: userToDelete.username}));
        } finally {
            setUserToDelete(null);
        }
    };
    const isUserActive = watch('isActive');

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                <div className="flex flex-col items-center justify-center -mt-16">
                    <LoaderSpinner size="xl" />
                    <p className="text-center text-muted-foreground mt-4">{t('loadingUsers')}</p>
                </div>
            </div>
        );
    }

    if(isError) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                <div className="flex flex-col items-center justify-center -mt-16">
                    <span className="text-center text-red-500 text-lg">{t("errorLoadingUsers")}</span>
                </div>
            </div>
        )
    }
    if(!canView && !isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
                <div className="flex flex-col items-center justify-center -mt-16">
                    <span className="text-center text-red-500 text-lg">{t("accessDenied")}</span>
                </div>
            </div>
        )
    }

    return (
        <PageTransitionWrapper>
            <div className="container mx-auto p-6">
                <h2 className="text-3xl font-bold tracking-tight mb-6">{t('users1.title')}</h2>
                {(canCreateUsers || (editingUser && canEditUsers)) && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>
                                {editingUser ? t('users1.form.editTitle') : t('users1.form.createTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">{t('users1.form.username')}</Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            {...register('username')}
                                            className={errors.username ? "border-destructive" : ""}
                                            disabled={!canEditUsers && !!editingUser}
                                        />
                                        {errors.username && (
                                            <p className="text-sm text-destructive">{errors.username.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('users1.form.email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            className={errors.email ? "border-destructive" : ""}
                                            disabled={!canEditUsers && !!editingUser}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">{t('users1.form.password')}</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register('password')}
                                            className={errors.password ? "border-destructive" : ""}
                                            disabled={(!canEditUsers && !!editingUser) || (!!editingUser && !canCreateUsers)}
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">{t('users1.form.role')}</Label>
                                        <Select
                                            disabled={!canChangeRoles}
                                            value={watch('role')}
                                            onValueChange={(value: User['role']) => setValue('role', value)}
                                        >
                                            <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                                                <SelectValue placeholder={t('users1.form.selectRole')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UserRoleSchema.options.map(role => (
                                                    <SelectItem key={role} value={role}>
                                                        {t(`users1.roles.${role}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.role && (
                                            <p className="text-sm text-destructive">{errors.role.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        className="cursor-pointer"
                                        id="isActive"
                                        checked={isUserActive}
                                        onCheckedChange={(checked: boolean) => {
                                            setValue('isActive', checked, { shouldValidate: true });
                                        }}
                                        disabled={!canEditUsers && !!editingUser}
                                    />
                                    <Label htmlFor="isActive" className="text-sm font-medium">
                                        {t('users1.form.active')}
                                    </Label>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                    {canCreateUsers && !editingUser && (
                                        <Button
                                            type="submit"
                                            disabled={createUserMutation.isPending}
                                            className="cursor-pointer flex-1 sm:flex-none hover:scale-[0.98] active:scale-[0.98]"
                                        >
                                            {(createUserMutation.isPending) && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            {t('users1.form.createUser')}
                                        </Button>
                                    )}
                                    {canEditUsers && editingUser && (
                                        <Button
                                            type="submit"
                                            disabled={updateUserMutation.isPending}
                                            className="cursor-pointer flex-1 sm:flex-none hover:scale-[0.98] active:scale-[0.98]"
                                        >
                                            {(updateUserMutation.isPending) && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            {t('users1.form.saveChanges')}
                                        </Button>
                                    )}
                                    {editingUser && (canCreateUsers || canEditUsers) && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingUser(null)}
                                            className="cursor-pointer flex-1 sm:flex-none hover:scale-[0.98] active:scale-[0.98]"
                                        >
                                            {t('users1.form.cancel')}
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {(createUserMutation.isPending || updateUserMutation.isPending) && (
                                <Alert className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{t('users1.messages.saving')}</AlertDescription>
                                </Alert>
                            )}

                            {createUserMutation.isError && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {t('users1.messages.createError')}: {createUserMutation.error?.message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {updateUserMutation.isError && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {t('users1.messages.updateError')}: {updateUserMutation.error?.message}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('users1.list.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('users1.table.username')}</TableHead>
                                        <TableHead>{t('users1.table.email')}</TableHead>
                                        <TableHead>{t('users1.table.role')}</TableHead>
                                        <TableHead>{t('users1.table.active')}</TableHead>
                                        {(canEditUsers || canDeleteUsers) && (
                                            <TableHead className="text-right">{t('users1.table.actions')}</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'admin' ? <ShieldCheck className="h-4 w-4 text-primary"/>
                                                        : user.role === 'editor' ? <Edit2 className="h-4 w-4 text-blue-500" />
                                                            : <Eye className="h-4 w-4 text-gray-500" />}
                                                    <span className="capitalize">{t(`users1.roles.${user.role}`)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-3 w-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span>{user.isActive ? t('users1.status.active') : t('users1.status.inactive')}</span>
                                                </div>
                                            </TableCell>
                                            {(canEditUsers || canDeleteUsers) && (
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {canEditUsers && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="cursor-pointer active:scale-[0.99] hover:scale-[0.99]"
                                                                onClick={() => setEditingUser(user)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                <span className="sr-only">{t('users1.actions.edit')}</span>
                                                            </Button>
                                                        )}
                                                        {canDeleteUsers && (
                                                            <Button
                                                                variant="ghost"
                                                                className="cursor-pointer hover:text-destructive"
                                                                size="sm"
                                                                onClick={() => handleDelete(user)}
                                                                disabled={deleteUserMutation.isPending}
                                                            >
                                                                {deleteUserMutation.isPending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                                <span className="sr-only">{t('users1.actions.delete')}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {deleteUserMutation.isPending && (
                            <Alert className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{t('users1.messages.deleting')}</AlertDescription>
                            </Alert>
                        )}

                        {deleteUserMutation.isError && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {t('users1.messages.deleteError')}: {deleteUserMutation.error?.message}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('users1.deleteDialog.title', {user: userToDelete?.email })}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('users1.deleteDialog.description', { user: userToDelete?.username })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setTimeout(() => setUserToDelete(null), 500);
                        }} className="cursor-pointer">
                            {t('users1.deleteDialog.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="cursor-pointer bg-destructive hover:bg-destructive-foreground text-destructive-foreground">
                            {t('users1.deleteDialog.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageTransitionWrapper>
    );
};