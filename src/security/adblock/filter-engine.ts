import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';
import { app, Session } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const CACHE_PATH = path.join(app.getPath('userData'), 'adblock-engine.bin');

export async function setupAdblock(targetSession: Session) {
  let blocker: ElectronBlocker;

  if (fs.existsSync(CACHE_PATH)) {
    const buffer = fs.readFileSync(CACHE_PATH);
    blocker = ElectronBlocker.deserialize(buffer);
  } else {
    blocker = await ElectronBlocker.fromLists(fetch, [
      'https://easylist.to/easylist/easylist.txt',
      'https://easylist.to/easylist/easyprivacy.txt',
    ]);
    fs.writeFileSync(CACHE_PATH, blocker.serialize());
  }

  blocker.enableBlockingInSession(targetSession);
  return blocker;
}