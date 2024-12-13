/* eslint-disable react/react-in-jsx-scope */
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import FileUpload from "../pages/FileUpload";

export default function Master() {
  return (
    <Box w="100vw">
      {/* // <div className=" h-[100dvh] bg-gray-200"> */}
      {/* <div className="flex flex-col items-center gap-8 "> */}
      {/* <Text
        bgGradient={"linear(to-r, cyan.400, blue.500)"}
        bgClip={"text"}
        fontSize={"50"}
        fontWeight={"bold"}
        align={"center"}
        mt="10"
      >
        Sistema de Qualificações
      </Text> */}
      <Navbar />
      <Outlet />
      {/* // </div> */}
      {/* // </div> */}
    </Box>
  );
}
