import { Game } from './game/game.js';

const canvas = document.getElementById('game');
const surfaceEl = document.getElementById('surface');

new Game(canvas, surfaceEl).start();
