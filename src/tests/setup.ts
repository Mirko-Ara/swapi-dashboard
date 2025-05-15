import '@testing-library/jest-dom';


class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

// @ts-ignore
global.ResizeObserver = ResizeObserver
