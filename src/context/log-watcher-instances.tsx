import { createLogWatcherContext } from './create-log-watcher-context';

const peopleContextFactory = createLogWatcherContext("PEOPLE");
const starshipsContextFactory = createLogWatcherContext("STARSHIPS");

export const {
    useLogWatcher: usePeopleLogWatcher,
    LogWatcherProvider: PeopleLogWatcherProvider,
} = peopleContextFactory;

export const {
    useLogWatcher: useStarshipsLogWatcher,
    LogWatcherProvider: StarshipsLogWatcherProvider,
} = starshipsContextFactory;