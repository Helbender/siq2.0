import React from "react";
import { Grid, useToast } from "@chakra-ui/react";
import PilotCard from "../components/pilotComponents/PilotCard";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const Pilots = ({ position }) => {
  const [pilotos, setPilotos] = useState([]);
  const { token, removeToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const getSavedPilots = async () => {
    toast({
      title: "A carregar Pilotos",
      description: "Em processo.",
      status: "loading",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
    try {
      const res = await axios.get(`/api/pilots/${position}`, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.closeAll();
      toast({
        title: "Pilotos Carregados",
        description: "Informação carregada com sucesso",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPilotos(res.data || []);
    } catch (error) {
      console.log(error);
      console.log(error.response.status);
      if (error.response.status === 401) {
        console.log("Removing Token");
        removeToken();
        navigate("/");
      }
    }
  };
  useEffect(() => {
    getSavedPilots();
  }, [location]);
  return (
    <Grid
      mx="5"
      templateColumns={{
        base: "1fr",
        lg: "repeat(2,1fr)",
        xl: "repeat(3,1fr)",
      }}
      gap={4}
      mt="8"
    >
      {pilotos.map((pilot) => (
        <PilotCard key={pilot.nip} user={pilot} />
      ))}
    </Grid>
  );
};

export default Pilots;
