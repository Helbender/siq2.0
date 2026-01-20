import { Box, Flex, Heading, Image } from "@chakra-ui/react";

export function Header() {


  return (
    <Box
      as="header"
      w="100%"
      bg="teal.500"
      color="white"
      p={4}
      boxShadow="md"
      position="relative"
    >
      <Flex align="center" justify="space-between">
        {/* Logo Image on the Left */}
        <Image
          src="/Esquadra_502.png"
          alt="Esquadra 502 Logo"
          boxSize="60px"
          objectFit="contain"
          mr={4}
        />

        {/* Centered Heading */}
        <Flex flex="1" justify="center">
          <Heading
            size="2xl"
            cursor="pointer"
            textAlign={"center"}
            // onClick={() => navigate("/")}
          >
            Sistema Integrado de Qualificações 2.0
          </Heading>
        </Flex>
        {/* Right Side Button Theme */}
        {/* <Flex display={{ base: "none", sm: "block" }}>
          <Button onClick={toggleColorMode}>
            {colorMode === "light" ? <IoMoon /> : <LuSun />}
          </Button>
        </Flex> */}
        {/* <Drawer.Root
          open={isOpen}
          onOpenChange={(details) => {
            if (!details.open) {
              onClose();
            }
          }}
          placement="left"
        >
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Drawer.CloseTrigger>
              {token ? (
                //Drawer render if logged in
                <>
                  <Drawer.Header flexDirection={"row"}>
                    <Flex flexDirection={"row"} pr={10}>
                      <Box>
                        <Heading
                          size="sm"
                          color="teal.500"
                          mt="10"
                          cursor="pointer"
                          onClick={() => {
                            navigate("/");
                            onClose();
                          }}
                        >
                          Bem-vindo,
                        </Heading>
                        <Heading
                          size="md"
                          mt="0"
                          color={"teal.500"}
                          cursor="pointer"
                          onClick={() => {
                            navigate("/");
                            onClose();
                          }}
                        >
                          {User.name}
                        </Heading>
                        <Heading size="sm" mt="0" color={"teal.700"}>
                          {User.admin ? "Admin" : ""}
                        </Heading>
                      </Box>
                      <Spacer />
                      <Image
                        src="/Esquadra_502.png"
                        alt="Logo"
                        boxSize="50px"
                        alignSelf={"center"}
                        objectFit="cover"
                      />
                    </Flex>
                  </Drawer.Header>
                  <Drawer.Body>
                    <VStack align="flex-start" h="100%">
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/dashboard");
                          onClose();
                        }}
                        aria-label="Dashboard"
                      >
                        <Flex align="center">
                          <MdSpaceDashboard />
                          <Box ml={2}>Dashboard</Box>
                        </Flex>
                      </ChakraLink>
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/flights");
                          onClose();
                        }}
                        aria-label="Voos"
                      >
                        <Flex align="center">
                          <FaPlaneArrival />
                          <Box ml={2}>Voos</Box>
                        </Flex>
                      </ChakraLink>
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/piloto");
                          onClose();
                        }}
                        aria-label="Qualificações"
                      >
                        <Flex align="center">
                          <FaTable />
                          <Box ml={2}>Qualificações</Box>
                        </Flex>
                      </ChakraLink>
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          navigate("/piloto-table");
                          onClose();
                        }}
                        aria-label="Tabela de Qualificações"
                      >
                        <Flex align="center">
                          <FaTh />
                          <Box ml={2}>Tabela de Qualificações</Box>
                        </Flex>
                      </ChakraLink>

                      {User.admin ? (
                        <ChakraLink
                          p={2}
                          color="teal.500"
                          fontSize="lg"
                          onClick={() => {
                            navigate("/qualificacoes");
                            onClose();
                          }}
                        >
                          <Flex align="center">
                            <FaTools />

                            <Box ml={2}>Gerir Qualificações</Box>
                          </Flex>
                        </ChakraLink>
                      ) : null}

                      {User.admin ? (
                        <ChakraLink
                          p={2}
                          color="teal.500"
                          fontSize="lg"
                          onClick={() => {
                            navigate("/users");
                            onClose();
                          }}
                        >
                          <Flex align="center">
                            <FaUsers />

                            <Box ml={2}>Utilizadores</Box>
                          </Flex>
                        </ChakraLink>
                      ) : (
                        <ChakraLink
                          p={2}
                          color="teal.500"
                          fontSize="lg"
                          onClick={() => {
                            navigate("/users");
                            onClose();
                          }}
                        >
                          <Flex align="center">
                            <FaUsers />

                            <Box ml={2}>Utilizador</Box>
                          </Flex>
                        </ChakraLink>
                      )}

                      <Spacer />
                      <ChakraLink
                        p={2}
                        color="teal.500"
                        fontSize="lg"
                        onClick={() => {
                          handleLogout();
                          onClose();
                        }}
                        aria-label="Logout"
                      >
                        <Flex align={"center"}>
                          <FaSignOutAlt /> <Box ml={2}>Logout</Box>
                        </Flex>
                      </ChakraLink>
                      {/* Horizontal line above Logout */}
        {/* <Separator borderWidth="1px" borderColor={"teal.500"} />
                    </VStack>
                  </Drawer.Body>
                </>
              ) : (
                //Drawer render if not logged in

                <Drawer.Header>
                  <Heading
                    size="sm"
                    fontSize="sm"
                    color="teal.500"
                    mt="10"
                    textAlign="center"
                  >
                    Por favor efetue o seu login
                  </Heading>
                </Drawer.Header>
              )}

              <Drawer.Footer>
                <Flex
                  direction="row"
                  textAlign={"center"}
                  justify={"center"}
                  align="center"
                  w="100%"
                >
                  <ChakraLink
                    p={2}
                    color="teal.500"
                    fontSize="lg"
                    onClick={() => {
                      navigate("/about");
                      onClose();
                    }}
                    aria-label="About"
                  >
                    <Flex align="center">
                      <FaInfoCircle />
                      <Box ml={2}>About</Box>
                    </Flex>
                  </ChakraLink>
                  <ChakraLink
                    p={2}
                    color="teal.500"
                    fontSize="lg"
                    href="https://www.instagram.com/esquadra502/"
                    isExternal
                    aria-label="Instagram"
                    onClick={onClose}
                  >
                    <Flex align="center">
                      <FaInstagram />
                      <Box ml={2}>Instagram</Box>
                    </Flex>
                  </ChakraLink>
                </Flex>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root> */}
      </Flex>
    </Box>
  );
}
