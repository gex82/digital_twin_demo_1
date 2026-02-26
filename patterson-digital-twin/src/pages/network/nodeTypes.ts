import type { NodeTypes } from 'reactflow';
import { CrossDockNode, FCNode, HubNode, SatelliteNode } from './custom-nodes';

export const nodeTypes: NodeTypes = {
  fc: FCNode,
  hub: HubNode,
  satellite: SatelliteNode,
  crossDock: CrossDockNode,
};
