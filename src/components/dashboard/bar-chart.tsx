import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSwapiPeople } from '@/hooks/use-swapi';

const BarChartComponent = () => {
    const { data, isLoading } = useSwapiPeople();

    if (isLoading) {
        return <div className="flex h-[300px] items-center justify-center">Loading chart data...</div>;
    }

    const barData = data
        ?.filter(person => person.mass && person.mass !== "unknown" && !isNaN(parseFloat(person.mass)))
        .slice(0, 10)
        .map(person => ({
            name: person.name,
            value: parseFloat(person.mass.replace(',', '.'))
        })) || [];

    if (barData.length === 0) {
        return <div className="flex h-[300px] items-center justify-center">No mass data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={barData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 80,
                }}
            >
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                />
                <YAxis label={{ value: 'Mass (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} align="center"/>
                <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BarChartComponent;