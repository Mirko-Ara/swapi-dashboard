import { render, screen } from '@testing-library/react'
import PieChartComponent from '@/components/dashboard/pie-chart'
import { useSwapiPeople } from '@/hooks/use-swapi'

vi.mock('@/hooks/use-swapi', () => ({
    useSwapiPeople: vi.fn(),
}))

const mockedUseSwapiPeople = useSwapiPeople as unknown as ReturnType<typeof vi.fn>

describe('PieChartComponent', () => {
    it('displays loading message when data is loading', () => {
        mockedUseSwapiPeople.mockReturnValue({
            isLoading: true,
            data: null,
        })
        render(<PieChartComponent />)
        expect(screen.getByText(/loading chart data/i)).toBeInTheDocument()
    })

    it('displays no data message when gender data is missing', () => {
        mockedUseSwapiPeople.mockReturnValue({
            isLoading: false,
            data: [],
        })
        render(<PieChartComponent />)
        expect(screen.getByText(/no gender data available/i)).toBeInTheDocument()
    })

    it('renders pie chart when data is available', () => {
        mockedUseSwapiPeople.mockReturnValue({
            isLoading: false,
            data: [
                { name: 'Luke', gender: 'male' },
                { name: 'Leia', gender: 'female' },
                { name: 'R2-D2', gender: 'n/a' },
            ],
        })

        render(<PieChartComponent />)
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument()
        expect(screen.getByText(/female/i)).toBeInTheDocument()
        expect(screen.getByText(/unknown/i)).toBeInTheDocument()
    })
})
