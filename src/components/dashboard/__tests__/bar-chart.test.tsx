import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from "vitest";
import BarChartComponent from '@/components/dashboard/bar-chart';
import * as swapiHook from '@/hooks/use-swapi';
import type {ReactNode} from 'react';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children, data }: { children: ReactNode; data: unknown }) => (
        <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
    ),
    Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => <div data-testid="bar" data-key={dataKey} data-fill={fill}></div>,
    XAxis: ({ dataKey, angle, textAnchor, height, interval }: { dataKey: string; angle: number; textAnchor: string; height: number; interval: number }) => (
        <div
            data-testid="x-axis"
            data-key={dataKey}
            data-angle={angle}
            data-anchor={textAnchor}
            data-height={height}
            data-interval={interval}
        ></div>
    ),
    YAxis: ({ label }: { label: unknown }) => <div data-testid="y-axis" data-label={JSON.stringify(label)}></div>,
    CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => <div data-testid="cartesian-grid" data-dash={strokeDasharray}></div>,
    Tooltip: () => <div data-testid="tooltip"></div>,
    Legend: ({ verticalAlign, height, align }: { verticalAlign: string; height: number; align: string }) =>
        <div data-testid="legend" data-align={align} data-valign={verticalAlign} data-height={height}></div>,
}));


describe('BarChartComponent', () => {
    const mockUseSwapiPeople = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(swapiHook, 'useSwapiPeople').mockImplementation(mockUseSwapiPeople);
    });

    it("should show loading state", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: undefined,
            isLoading: true,
        });
        render(<BarChartComponent />);
        expect(screen.getByText(/loading chart data.../i)).toBeInTheDocument();
        expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    });

    it("should show no data message when data is empty", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [],
            isLoading: false,
        });
        render(<BarChartComponent />);
        expect(screen.getByText(/No mass data available/i)).toBeInTheDocument();
        expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    });

    it("should show no data message when all people have unknown mass", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [
                { name: 'Luke Skywalker', mass: 'unknown' },
                { name: 'C-3PO', mass: 'unknown' },
            ],
            isLoading: false,
        });
        render(<BarChartComponent />);
        expect(screen.getByText("No mass data available")).toBeInTheDocument();
    });

    it("should correctly filter out unknown mass values", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [
                { name: 'Luke Skywalker', mass: '77' },
                { name: 'C-3PO', mass: 'unknown' },
                { name: 'R2-D2', mass: '32' },
            ],
            isLoading: false,
        });
        render(<BarChartComponent />);

        const barChart = screen.getByTestId('bar-chart');
        const attr = barChart.getAttribute('data-chart-data');
        if (!attr) throw new Error("Missing 'data-chart-data' attribute on barChart");
        const chartData = JSON.parse(attr);

        expect(chartData.length).toBe(2);
        expect(chartData[0].name).toBe('Luke Skywalker');
        expect(chartData[0].value).toBe(77);
        expect(chartData[1].name).toBe('R2-D2');
        expect(chartData[1].value).toBe(32);
    });

    it("should correctly convert comma decimal separator to dot", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [
                {name: 'Some Alien', mass: '123,45'}
            ],
            isLoading: false,
        });
        render(<BarChartComponent />);
        const barChart = screen.getByTestId('bar-chart');
        const attr = barChart.getAttribute('data-chart-data');
        if (!attr) throw new Error("Missing 'data-chart-data' attribute on barChart");
        const chartData = JSON.parse(attr);
        expect(chartData[0].value).toBe(123.45);    });

    it("should only take the first 10 people with valid mass", () => {
        const people = Array.from({length: 15}, (_, i) => ({
            name: `Person ${i + 1}`,
            mass: `${(i +1 ) * 10}` ,
        }));
        mockUseSwapiPeople.mockReturnValue({
            data: people,
            isLoading: false,
        });
        render(<BarChartComponent />);
        const barChart = screen.getByTestId('bar-chart');
        const attr = barChart.getAttribute('data-chart-data');
        if (!attr) throw new Error("Missing 'data-chart-data' attribute on barChart");
        const chartData = JSON.parse(attr);

        expect(chartData.length).toBe(10);
        expect(chartData[0].name).toBe('Person 1');
        expect(chartData[9].name).toBe('Person 10');
    });

    it("should render all chart components correctly", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [
                { name: 'Luke Skywalker', mass: '77' },
                { name: 'Darth Vader', mass: '136' }
            ],
            isLoading: false,
        });
        render(<BarChartComponent />);
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('y-axis')).toBeInTheDocument();
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('legend')).toBeInTheDocument();
        expect(screen.getByTestId('bar')).toBeInTheDocument();
    });

    it("should configure X-axis correctly", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [{name: 'Luke Skywalker', mass: '77'}],
            isLoading: false,
        });
        render(<BarChartComponent />);
        const xAxis = screen.getByTestId('x-axis');
        expect(xAxis.getAttribute('data-key')).toBe('name');
        expect(xAxis.getAttribute('data-angle')).toBe('-45');
        expect(xAxis.getAttribute('data-anchor')).toBe('end');
        expect(xAxis.getAttribute('data-height')).toBe('60');
        expect(xAxis.getAttribute('data-interval')).toBe('0');
    });

    it("should configure Y-axis correctly", () => {
        mockUseSwapiPeople.mockReturnValue({
            data: [{name: 'Luke Skywalker', mass: '77'}],
            isLoading: false,
        });
        render(<BarChartComponent />);
        const yAxis = screen.getByTestId('y-axis');
        const attr = yAxis.getAttribute('data-label');
        if(!attr) throw new Error("Missing 'data-label' attribute on yAxis");
        const label = JSON.parse(attr);
        expect(label.value).toBe('Mass (kg)');
        expect(label.angle).toBe(-90);
        expect(label.position).toBe('insideLeft');
    });

    it("should configure Bar correctly", () => {
       mockUseSwapiPeople.mockReturnValue({
           data: [{name: 'Luke Skywalker', mass: '77'}],
           isLoading: false,
       });
       render(<BarChartComponent />);
       const bar = screen.getByTestId('bar');
       expect(bar.getAttribute('data-key')).toBe('value');
       expect(bar.getAttribute('data-fill')).toBe('#8884d8');
    });
});
