import { useEffect, type RefObject } from 'react';

export const useClickOutside = (
    callback: () => void,
    monitoredRefs: Array<RefObject<HTMLElement | null>>,
    excludedRefs: Array<RefObject<HTMLElement | null>>
) => {
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (monitoredRefs.length === 0 && excludedRefs.length === 0) {
                return;
            }

            for (const ref of monitoredRefs) {
                if (ref && ref.current && ref.current.contains(event.target as Node)) {
                    return;
                }
            }

           for(const ref of excludedRefs) {
               if(ref && ref.current && ref.current.contains(target)){
                   return;
               }
           }

             callback();
        };

        document.addEventListener('mousedown', handleClick);

        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [callback, monitoredRefs, excludedRefs]);
};