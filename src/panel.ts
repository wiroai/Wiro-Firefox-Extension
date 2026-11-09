import '../core/src/ui/styles.css';
import { mountPanel } from '../core/src/ui/app.js';
import { firefoxPlatform } from './platform.js';

const root = document.getElementById('app');
if (root) mountPanel(root, firefoxPlatform);
