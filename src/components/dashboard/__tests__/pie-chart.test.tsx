import { screen } from "@testing-library/react";
// import { render } from '@testing-library/react';
// import PieChartComponent from "@/components/dashboard/pie-chart";
import { useSwapiPeople } from "@/hooks/use-swapi";
import { vi } from "vitest";

vi.mock('@/hooks/use-swapi', () => ({
    useSwapiPeople: vi.fn(),
}));

const mockedUseSwapiPeople = useSwapiPeople as unknown as ReturnType<typeof vi.fn>;

describe('PieChartComponent', () => {
    it('displays loading message when data is loading', () => {
        mockedUseSwapiPeople.mockReturnValue({
            isLoading: true,
            data: null,
        });
        // render(<PieChartComponent />);
        expect(screen.getByText(/loading chart data/i)).toBeInTheDocument();
    });

    it('displays no data message when gender data is missing', () => {
        mockedUseSwapiPeople.mockReturnValue({
            isLoading: false,
            data: [],
        });
        // render(<PieChartComponent />);
        expect(screen.getByText(/no gender data available/i)).toBeInTheDocument();
    });
});
