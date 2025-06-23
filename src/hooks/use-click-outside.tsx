import { useEffect, type RefObject } from 'react';

export const useClickOutside = (
    callback: () => void,
    ignoredRefs: Array<RefObject<HTMLElement | null>>
) => {
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            let shouldClose = true;

            for (const ref of ignoredRefs) {
                if (ref && ref.current && ref.current.contains(event.target as Node)) {
                    shouldClose = false;
                    break;
                }
            }

            if (shouldClose) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClick);

        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [callback, ignoredRefs]);
};