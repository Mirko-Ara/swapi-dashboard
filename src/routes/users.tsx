import { useSwapiPeople } from '../hooks/use-swapi';
import { UsersTable } from '../components/users/users-table';
import { LogWatcher } from '@/components/layout/log-watcher';

const Users = () => {
    const { data, isLoading } = useSwapiPeople();
    return (
        <div className="flex flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">SWAPI Characters</h2>
                </div>
                <div className="rounded-md border">
                    {isLoading ? (
                        <div className="p-4 text-center">
                            <LogWatcher className="h-[300px]" />
                        </div>
                    ) : (
                        <UsersTable data={data || []}/>
                    )}
                </div>
            </div>
        </div>
    );
};


export default Users;