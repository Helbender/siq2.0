import { Grid } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import CrewCard from "../components/crewComponents/CrewCard";
import { apiAuth } from "../utils/api";

const Crew = () => {
  const [crew, setCrew] = useState([]);
  const { token, removeToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  async function getSavedCrew() {
    try {
      const response = await apiAuth.get("/api/crew", {
        headers: { Authorization: "Bearer " + token },
      });
      setCrew(response.data || []);
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    getSavedCrew();
    // console.log("Pilots Loaded");
  }, [location]);
  return (
    <Grid
      mx="5"
      templateColumns={{
        base: "1fr",
        md: "repeat(2,1fr)",
        lg: "repeat(3,1fr)",
      }}
      gap={4}
      mt="8"
    >
      {crew.map((user) => (
        <CrewCard key={user.nip} user={user} />
      ))}
    </Grid>
  );
};

export default Crew;
