import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'editor', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
    id: z.string().uuid().default(() => crypto.randomUUID()),
    username: z.string().min(3, 'Username must contains at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must contains at least 6 characters'),
    role: UserRoleSchema.default('viewer'),
    isActive: z.boolean().default(true),
    createdAt: z.string().datetime().default(() => new Date().toISOString()),
    updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type User = z.infer<typeof UserSchema>;

export const UserCreateUpdateSchema = UserSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
}).partial({ password: true});

export type UserCreateUpdate = z.infer<typeof UserCreateUpdateSchema>;