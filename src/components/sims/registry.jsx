import RotationalSimulator from './RotationalSimulator';
import VectorSpace3D from './VectorSpace3D';
import DynamicGrapher from './DynamicGrapher';
import OscillatorSimulator from './OscillatorSimulator';
import NetworkSimplex from './NetworkSimplex';
import EngineSimulator from './EngineSimulator';
import GearSimulator from './GearSimulator';
import TrussSimulator from './TrussSimulator';

const Riemann = (props) => <DynamicGrapher initialMode="riemann" {...props} />;

export const SIMS = {
  rotation: RotationalSimulator,
  vector3d: VectorSpace3D,
  grapher: DynamicGrapher,
  riemann: Riemann,
  oscillator: OscillatorSimulator,
  network: NetworkSimplex,
  engine3d: EngineSimulator,
  gears3d: GearSimulator,
  truss3d: TrussSimulator,
};