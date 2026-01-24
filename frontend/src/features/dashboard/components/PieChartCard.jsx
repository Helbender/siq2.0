import { formatHours } from "@/utils/timeCalc";
import { Box, Heading, Text } from "@chakra-ui/react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#E53E3E",
  "#38A169",
  "#3182ce",
  "#633974",
  "#D69E2E",
  "#805AD5",
];

const CHART_HEIGHT = 350;

export function PieChartCard({ title, data, totalHours }) {
  return (
    <Box
      flex={1}
      minW={0}
      bg="bg.cardSubtle"
      p={4}
      borderRadius="lg"
      boxShadow="md"
      h="450px"
      display="flex"
      flexDirection="column"
    >
      <Heading size="md" mb={4} textAlign="center">
        {title}
      </Heading>
      {data.length > 0 ? (
        <Box flex={1} minH={CHART_HEIGHT} w="100%">
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              label={({ name, value, percent }) => {
                if (percent < 0.02) return "";
                return `${name}: ${formatHours(value)}`;
              }}
              labelLine={false}
              outerRadius={90}
              paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const percentage =
                    totalHours > 0
                      ? ((value / totalHours) * 100).toFixed(1)
                      : 0;
                  return `${percentage}%`;
                }}
                labelFormatter={(label) => `${title}: ${label}`}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  paddingBottom: "10px",
                }}
                iconSize={12}
                wrapperClass="legend-wrapper"
                style={{
                  lineHeight: "24px",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Text textAlign="center" mt={20}>
          No data available
        </Text>
      )}
    </Box>
  );
}