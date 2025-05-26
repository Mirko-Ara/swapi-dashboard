import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend} from "recharts";
import { useSwapiPeople } from "@/hooks/use-swapi";
import { useTheme } from "@/providers/theme-hooks";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

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

const CustomLabel = (theme: string, isMobile: boolean, isTablet: boolean) => (props: CustomLabelProps) => {
    const { cx, cy, midAngle, outerRadius, percent, index, name } = props;
    const RADIAN = Math.PI / 180;
    const radiusOffset = isMobile ? 5 : isTablet ? 15 : 20;
    const radius = outerRadius + radiusOffset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const offset = index % 2 === 0 ? -3 : 3;
    const textColor = theme === "dark" ? "#f4f4f5" : "#1f2937";

    return (
        <text
            x={x}
            y={y + offset}
            fill={textColor}
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize={isMobile ? 8 : isTablet ? 10 : 13}
            className="select-none"
        >
            {isMobile && percent < 0.01 ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const PieChartComponent = () => {
    const { data, isLoading } = useSwapiPeople();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setIsTablet(width >= 640 && width < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[200px] sm:h-[350px] md:h-[400px]">
                {t("loadingChartData")}
            </div>
        );
    }

    const genderCount =
        data?.reduce((acc: Record<string, number>, person) => {
            const gender = person.gender && person.gender !== "n/a" ? t(person.gender) : t("unknown");
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {}) || {};

    const pieData = Object.entries(genderCount).map(([name, value]) => ({ name, value }));

    if (pieData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] sm:h-[350px] md:h-[400px]">
                {t("noGenderDataAvailable")}
            </div>
        );
    }

    const outerRadius = isMobile ? 45 : isTablet ? 85 : 120;
    const chartHeight = isMobile ? 220 : isTablet ? 370 : 420;

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart margin={{ top: 15, right: 15, bottom: 25, left: 15 }}>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={outerRadius}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={CustomLabel(theme, isMobile, isTablet)}
                    >
                        {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            fontSize: isMobile ? '12px' : '14px',
                            padding: isMobile ? '4px 8px' : '8px 12px'
                        }}
                    />
                    <Legend
                        wrapperStyle={{
                            fontSize: isMobile ? '10px' : isTablet ? '11px' : '13px',
                            paddingTop: isMobile ? '5px' : '10px'
                        }}
                        iconSize={isMobile ? 8 : isTablet ? 9 : 11}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PieChartComponent;