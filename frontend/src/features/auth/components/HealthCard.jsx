import { http } from "@/api/http";
import { Badge, Card, Spinner, Stat } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export function HealthCard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    fetchHealth();
    // Refresh health every 60 seconds
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const startTime = Date.now();
      const response = await http.get("/health");
      const endTime = Date.now();
      const time = endTime - startTime;

      setHealth(response.data);
      setResponseTime(time);
    } catch (error) {
      setHealth({ status: "error" });
      setResponseTime(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (loading) return "gray";
    if (!health || health.status === "error") return "red";
    if (responseTime && responseTime > 1000) return "yellow";
    return "green";
  };

  const getStatusText = () => {
    if (loading) return "Checking...";
    if (!health || health.status === "error") return "Offline";
    if (responseTime && responseTime > 1000) return "Slow";
    return "Online";
  };

  return (
    <Card.Root
      position="absolute"
      top={4}
      left={4}
      minW="200px"
      bg="gray.800"
      borderColor="gray.700"
    >
      <Card.Body>
        <Stat.Root>
          <Stat.Label color="gray.300">Server Status</Stat.Label>
          <Stat.ValueText>
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <Badge
                colorPalette={getStatusColor()}
                fontSize="sm"
                fontWeight="bold"
              >
                {getStatusText()}
              </Badge>
            )}
          </Stat.ValueText>
          {responseTime !== null && (
            <Stat.HelpText color="gray.400" fontSize="xs">
              {responseTime}ms
            </Stat.HelpText>
          )}
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  );
}