import {
  AddIcon,
  MinusIcon,
  RepeatIcon,
  QuestionOutlineIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Spinner,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useSelector } from '@xstate/react';
import React, { useMemo } from 'react';
import { CanvasContainer } from './CanvasContainer';
import { useCanvas } from './CanvasContext';
import {
  getShouldEnableZoomInButton,
  getShouldEnableZoomOutButton,
} from './canvasMachine';
import { toDirectedGraph } from './directedGraph';
import { Graph } from './Graph';
import { useSimulation, useSimulationMode } from './SimulationContext';
import { CanvasHeader } from './CanvasHeader';
import { Overlay } from './Overlay';
import { useSourceActor } from './sourceMachine';
import { Bolt, Lightbulb } from './Icons';
import { WelcomeArea } from './WelcomeArea';

export const CanvasView: React.FC = () => {
  const simService = useSimulation();
  const canvasService = useCanvas();
  const [sourceState] = useSourceActor();
  const machine = useSelector(simService, (state) => {
    return state.context.currentSessionId
      ? state.context.serviceDataMap[state.context.currentSessionId!]?.machine
      : undefined;
  });
  const isLayoutPending = useSelector(simService, (state) =>
    state.hasTag('layoutPending'),
  );
  const isEmpty = useSelector(simService, (state) => state.hasTag('empty'));
  const digraph = useMemo(
    () => (machine ? toDirectedGraph(machine) : undefined),
    [machine],
  );

  const shouldEnableZoomOutButton = useSelector(
    canvasService,
    getShouldEnableZoomOutButton,
  );

  const shouldEnableZoomInButton = useSelector(
    canvasService,
    getShouldEnableZoomInButton,
  );

  const simulationMode = useSimulationMode();

  const canShowWelcomeMessage = sourceState.hasTag('canShowWelcomeMessage');

  return (
    <Box display="grid" gridTemplateRows="3rem 1fr">
      <Box bg="gray.800" zIndex={1} padding="0">
        <CanvasHeader />
      </Box>
      <CanvasContainer>
        {digraph && <Graph digraph={digraph} />}
        {isLayoutPending && (
          <Overlay>
            <Box textAlign="center">
              <VStack spacing="4">
                <Spinner size="xl" />
                <Box>Visualizing machine...</Box>
              </VStack>
            </Box>
          </Overlay>
        )}
        {isEmpty && canShowWelcomeMessage && <WelcomeArea />}
      </CanvasContainer>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        position="absolute"
        bottom={0}
        left={0}
        paddingX={2}
        paddingY={3}
        zIndex={1}
        width="100%"
      >
        <ButtonGroup size="sm" spacing={2} isAttached>
          <IconButton
            aria-label="Zoom out"
            title="Zoom out"
            icon={<MinusIcon />}
            disabled={!shouldEnableZoomOutButton}
            onClick={() => canvasService.send('ZOOM.OUT')}
            variant="secondary"
          />
          <IconButton
            aria-label="Zoom in"
            title="Zoom in"
            icon={<AddIcon />}
            disabled={!shouldEnableZoomInButton}
            onClick={() => canvasService.send('ZOOM.IN')}
            variant="secondary"
          />
          <IconButton
            aria-label="Reset canvas"
            title="Reset canvas"
            icon={<RepeatIcon />}
            onClick={() => canvasService.send('POSITION.RESET')}
            variant="secondary"
          />
        </ButtonGroup>
        {simulationMode === 'visualizing' && (
          <Button
            size="sm"
            marginLeft={2}
            onClick={() => simService.send('MACHINES.RESET')}
            variant="secondary"
          >
            RESET
          </Button>
        )}
        <Menu closeOnSelect={true} placement="top-end">
          <MenuButton
            as={IconButton}
            size="sm"
            isRound
            aria-label="More info"
            marginLeft="auto"
            variant="secondary"
            icon={
              <QuestionOutlineIcon
                boxSize={6}
                css={{ '& circle': { display: 'none' } }}
              />
            }
          />
          <Portal>
            <MenuList fontSize="sm" padding="0">
              <MenuItem
                as={Link}
                href="https://github.com/statelyai/xstate"
                target="_blank"
                rel="noreferrer"
              >
                XState version 4.23.0
              </MenuItem>
              <MenuItem
                as={Link}
                href="https://stately.ai/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Box>
    </Box>
  );
};
