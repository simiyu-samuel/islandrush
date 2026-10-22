import './ui/styles.css';
import { IslandController } from './controller';
import { mountUI } from './ui/app';
import { mountGame } from './game/config';
const app = document.querySelector<HTMLElement>('#app')!;
const controller = new IslandController();
const world = mountUI(app, controller);
try { mountGame(world, controller.bridge); }
catch (error) { controller.bridge.onError(error instanceof Error ? error.message : 'Unable to start the game renderer.'); }
