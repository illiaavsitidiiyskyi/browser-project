import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('browserAPI', {});