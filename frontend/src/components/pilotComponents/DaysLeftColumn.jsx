/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
import { Box, Divider, Text } from "@chakra-ui/react";

const DaysLeftColumn = ({ qualification, dates }) => {
  let today = new Date();
  let days = dates.map((date) => {
    let qualificationDate = new Date(date);
    let semester = new Date(qualificationDate);
    semester.setDate(qualificationDate.getDate() + 180);
    let days = Math.round(
      (qualificationDate.setDate(qualificationDate.getDate() + 180) -
        today.getTime()) /
        86400000,
    );

    return days;
  });
  function colorFormatter(days) {
    let color = "";
    if (days < 0) return (color = "red");
    if (days < 45) return (color = "yellow");
    // eslint-disable-next-line no-unused-vars
    else return (color = "green");
  }
  return (
    <Box align={"center"}
    >
      <Text
        color="white"
        fontSize={"16"}
        fontWeight={"bold"}
        bg="cyan.700"
        paddingX={4}
      >
        {qualification}
      </Text>
      <Divider mt={2} mb={1} />
      {days.map((a, i) => {
        return (
          <Text key={i} bg={colorFormatter(a)} color="black">
            {a}
          </Text>
        );
      })}
    </Box>
  );
};

export default DaysLeftColumn;
