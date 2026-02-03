import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Polygon, Line, Text as SvgText } from "react-native-svg";

export interface RadarChartData {
  label: string;
  value: number;
}

export interface RadarChartProps {
  /** Data points (6 items recommended) */
  data: RadarChartData[];
  /** Size of the chart */
  size?: number;
  /** Color of the data polygon */
  color?: string;
  /** Max value for scaling */
  maxValue?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size: propSize,
  color = "#22d3ee",
  maxValue = 100,
  className
}) => {
  const { width } = useWindowDimensions();
  // Responsive: max 70% del ancho disponible, cap a 280px
  const size = Math.min(propSize || 280, Math.min(width * 0.7, 280));
  const center = size / 2;
  const radius = size * 0.35; // Leave space for labels
  const levels = 5;
  const angleStep = (2 * Math.PI) / data.length;

  // Calculate polygon points for data
  const dataPoints = data.map((item, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const value = Math.min(item.value, maxValue);
    const r = (value / maxValue) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Calculate grid lines
  const gridLines = data.map((_, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x1: center, y1: center, x2: x, y2: y };
  });

  // Calculate level polygons
  const levelPolygons = Array.from({ length: levels }, (_, levelIndex) => {
    const levelRadius = radius * ((levelIndex + 1) / levels);
    return data.map((_, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = center + levelRadius * Math.cos(angle);
      const y = center + levelRadius * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  // Calculate label positions
  const labels = data.map((item, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const labelRadius = radius * 1.15;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return { text: item.label, x, y, angle };
  });

  return (
    <View className={className}>
      <Svg width={size} height={size}>
        {/* Draw level polygons (grid) */}
        {levelPolygons.map((points, index) => (
          <Polygon
            key={`level-${index}`}
            points={points}
            fill="transparent"
            stroke="#334155"
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {/* Draw grid lines */}
        {gridLines.map((line, index) => (
          <Line
            key={`line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#334155"
            strokeWidth={1}
            opacity={0.3}
          />
        ))}

        {/* Draw data polygon */}
        <Polygon
          points={dataPoints}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
        />

        {/* Draw labels */}
        {labels.map((label, index) => (
          <SvgText
            key={`label-${index}`}
            x={label.x}
            y={label.y}
            fontSize="11"
            fill="#94a3b8"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {label.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};
