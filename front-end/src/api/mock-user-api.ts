import { type User, type UserCreateUpdate, UserSchema } from '@/types/user';
// Simuliamo un database in memoria con utenti predefiniti


const LOCAL_STORAGE_KEY = 'mockUsers' as const;


const initializeUsers = (): User[] => {
    const defaultUsers: User[] = [
        UserSchema.parse({
            username: 'adminuser',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            isActive: false,
        }),
        UserSchema.parse({
            username: 'editoruser',
            email: 'editor@example.com',
            password: 'password123',
            role: 'editor',
            id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
            isActive: false,
        }),
        UserSchema.parse({
            username: 'vieweruser',
            email: 'viewer@example.com',
            password: 'password123',
            role: 'viewer',
            id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
            isActive: false,
        }),
    ];
    if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedUsers) {
            try {
                const parsedUsers = JSON.parse(storedUsers);
                if (Array.isArray(parsedUsers)) {
                    return parsedUsers.map((user: unknown) => UserSchema.parse(user));
                }
            } catch (error) {
                console.error('Error parsing stored users or invalid data found:', error);
            }
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    }

    return defaultUsers;
};

let users: User[] = initializeUsers();

const saveUsers = (currentUsers: User[]) => {
    if(typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUsers));
    }
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockUserApi = {
    async fetchUsers(): Promise<User[]> {
        await delay(500);
        console.log('Fetched users from mock API: ', users);
        return users;
    },
    async fetchUserById(id: string): Promise<User | null> {
        await delay(300);
        const user = users.find(u => u.id === id);
        console.log(`Fetched user ${id} from mock API:`, user);
        return user || null;
    },
    async createUser(userData: UserCreateUpdate): Promise<User | null> {
        await delay(700);
        const existingEmailOrUsername = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase() || u.username === userData.username);
        if(existingEmailOrUsername) {
            console.error('Email or username already exists');
            throw new Error('Email or username already exists');
        }
        const newUser = UserSchema.parse({
            ...userData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        users.push(newUser);
        saveUsers(users);
        console.log('Created new user: ', newUser);
        return newUser;
    },

    async updateUser(id: string, updates: Partial<UserCreateUpdate>): Promise<User | null> {
        await delay(600);
        const index = users.findIndex(u => u.id === id);
        if(index === -1) {
            console.error(`User with id ${id} not found`);
            throw new Error('User with id not found');
        }
        const updatedUser = {
            ...users[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        users[index] = UserSchema.parse(updatedUser);
        saveUsers(users);
        console.log(`Updated user ${id}: `, updatedUser);
        return users[index];
    },

    async deleteUser(id: string): Promise<void> {
        await delay(400);
        const initialLength = users.length;
        users = users.filter(u => u.id !== id);
        if(users.length === initialLength) {
            console.error(`User with id ${id} not found`);
            throw new Error('User not found');
        }
        saveUsers(users);
        console.log(`Deleted user ${id}. Remaining users:`, users);
    }
};