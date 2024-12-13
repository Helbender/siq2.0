/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
import { Text } from "@chakra-ui/react";

const QualificationsPanel = (props) => {
  function colorFormatter(days) {
    let color = "";
    if (days < 0) return (color = "red");
    if (days < 45) return (color = "yellow");
    // eslint-disable-next-line no-unused-vars
    else return (color = "green");
  }
  function getDays(date) {
    let today = new Date();
    let qualificationDate = new Date(date);
    let semester = new Date(qualificationDate);
    semester.setDate(qualificationDate.getDate() + 180);
    let days = Math.round(
      (qualificationDate.setDate(qualificationDate.getDate() + 180) -
        today.getTime()) /
        86400000,
    );

    return days;
  }
  let days = getDays(props.qualification);
  return (
    <Text fontSize={14} color="black" bg={colorFormatter(days)}
    py={1}
    borderTopLeftRadius={props.borderTopLeftRadius} 
    borderTopRightRadius={props.borderTopRightRadius} 
    borderBottomLeftRadius={props.borderBottomLeftRadius} 
    borderBottomRightRadius={props.borderBottomRightRadius} 
>
      {days}
    </Text>
  );
};

export default QualificationsPanel;
