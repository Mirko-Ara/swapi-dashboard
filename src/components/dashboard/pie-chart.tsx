import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend} from "recharts";
import { useSwapiPeople } from "@/hooks/use-swapi";
import { useTheme } from "@/providers/theme-hooks";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface CustomLabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    percent: number;
    index: number;
    name: string;
}
const CustomLabel = (theme: string) => (props: CustomLabelProps) => {
    const { cx, cy, midAngle, outerRadius, percent, index, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 10;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const offset = index % 2 === 0 ? -5 : 5;
    const textColor = theme === "dark" ? "#f4f4f5" : "#1f2937";

    return (
        <text
            x={x}
            y={y + offset}
            fill={textColor}
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize={12}
        >
            {`${name}: ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const PieChartComponent = () => {
    const { data, isLoading } = useSwapiPeople();
    const { theme } = useTheme();

    if (isLoading) {
        return <div className="flex h-[300px] items-center justify-center">Loading chart data...</div>;
    }

    const genderCount =
        data?.reduce((acc: Record<string, number>, person) => {
            const gender = person.gender && person.gender !== "n/a" ? person.gender : "Unknown";
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {}) || {};

    const pieData = Object.entries(genderCount).map(([name, value]) => ({ name, value }));

    if (pieData.length === 0) {
        return <div className="flex h-[300px] items-center justify-center">No gender data available</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={300} data-testid="pie-chart">
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={CustomLabel(theme)}
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
