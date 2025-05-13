import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useSwapiPeople } from "@/hooks/use-swapi";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PieChartComponent = () => {
    const { data, isLoading } = useSwapiPeople();
    if (isLoading) {
        return <div className="flex h-[300px] items-center justify-center">Loading chart data...</div>;
    }

    const genderCount = data?.reduce((acc: Record<string, number>, person) => {
        const gender = person.gender && person.gender !== "n/a" ? person.gender : "Unknown";
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {}) || {};

    const pieData = Object.entries(genderCount).map(([name, value]) => ({ name, value }));

    if (pieData.length === 0) {
        return <div className="flex h-[300px] items-center justify-center">No gender data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                    {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default PieChartComponent;