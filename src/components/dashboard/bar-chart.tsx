import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSwapiPeople } from '@/hooks/use-swapi';
import { useTranslation } from 'react-i18next';
import {useEffect, useState} from "react";

const BarChartComponent = () => {
    const { data, isLoading } = useSwapiPeople();
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isSmallMobile, setIsSmallMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsSmallMobile(width < 480);
            setIsMobile(width < 640);
            setIsTablet(width >= 640 && width < 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    });

    if (isLoading) {
        return (
            <div className="flex h-[250px] sm:h-[300px] md:h-[350px] items-center justify-center">
                {t("loadingChartData")}
            </div>
        );
    }

    const charactersForChart = isSmallMobile ? 10 : isMobile ? 10 : isTablet ? 16 : 20;
    const barData = data
        ?.filter(person => person.mass && person.mass !== "unknown" && !isNaN(parseFloat(person.mass)))
        .slice(0, charactersForChart)
        .map(person => ({
            name: person.name,
            value: Number(parseFloat(person.mass.replace(',', '.')).toFixed(1))
        })) || [];

    if (barData.length === 0) {
        return <div className="flex h-[250px] sm:h-[300px] md:h-[350px] items-center justify-center"><span className="text-xs sm:text-sm md:text-md lg:text-lg text-shadow">{t("noMassDataAvailable")}</span></div>;
    }

    const chartHeight = isMobile ? 250 : isTablet ? 300 : 350;
    const bottomMargin = isMobile ? 60 : isTablet ? 70 : 80;
    const fontSize = isSmallMobile ? 9: isMobile ? 9 : isTablet ? 9 : 12;
    return (
        <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
                data={barData}
                margin={{
                    top: 5,
                    right: isMobile ? 10 : isTablet ? 20 : 30,
                    left: isMobile ? 10 : isTablet ? 15 : 20,
                    bottom: bottomMargin,
                }}
            >
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={bottomMargin - 20}
                    interval={0}
                    fontSize={fontSize}
                    tick={{ fontSize: fontSize }}
                />
                <YAxis label={{ value: t("mass"), angle: -90, position: 'insideLeft', style: { fontSize: fontSize}}} fontSize={fontSize} tick={{ fontSize: fontSize }}/>
                <Tooltip formatter={(value, name, props) => [
                    `${value} kg`,
                    props.payload?.fullName || name
                ]}
                 contentStyle={{
                     fontSize: isMobile ? '11px' : isTablet ? '12px' : '13px',
                     padding: isMobile ? '4px 6px' : isTablet ? '5px 7px' : '6px 8px'
                 }}/>
                <Legend verticalAlign="top" height={isMobile ? 30 : isTablet ? 33 : 36} align="center" wrapperStyle={{fontSize: isMobile ? '10px' : '12px'}}/>
                <Bar dataKey="value" fill="#8884d8" radius={isMobile ? [2, 2, 0, 0] : isTablet ? [3, 3, 0, 0] : [4, 4, 0, 0]}/>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BarChartComponent;