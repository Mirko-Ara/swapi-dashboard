import { render, screen, act } from "@testing-library/react";
import { CityTime } from "@/components/dashboard/city-time";
import { format } from "date-fns";
import { vi } from "vitest";

describe("CityTime", () => {
    beforeAll(() => {
        vi.useFakeTimers();
        const mockDate = new Date(2023, 0, 1, 12, 30, 45); // 1 Jan 2023 12:30:45
        vi.setSystemTime(mockDate);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    const mockProps = {
        city: "New York",
        timeZone: "America/New_York",
    };

    it("renders city name correctly", () => {
        render(<CityTime {...mockProps} />);
        expect(screen.getByText("New York")).toBeInTheDocument();
    });

    it("displays correct initial time and date", () => {
        render(<CityTime {...mockProps} />);

        const expectedTime = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZone: mockProps.timeZone,
            hour12: true,
        });

        expect(screen.getByText(expectedTime)).toBeInTheDocument();

        const expectedDate = format(new Date(), "EEEE, MMMM d, yyyy");
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it("updates time every second", () => {
        render(<CityTime {...mockProps} />);

        const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2} (AM|PM)/i);
        const initialTime = timeElement.textContent;

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        const updatedTime = timeElement.textContent;
        expect(updatedTime).not.toBe(initialTime);
    });

    it("matches snapshot", () => {
        const { asFragment } = render(<CityTime {...mockProps} />);
        expect(asFragment()).toMatchSnapshot();
    });

    it("clears interval on unmount", () => {
        const clearIntervalSpy = vi.spyOn(global, "clearInterval");
        const { unmount } = render(<CityTime {...mockProps} />);

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
        clearIntervalSpy.mockRestore();
    });
});