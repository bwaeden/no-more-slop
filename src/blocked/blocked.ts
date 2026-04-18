import { endSession, getState } from '../shared/storage';

const intentDisplay = document.getElementById('intent-display') as HTMLElement;
const subDisplay = document.getElementById('sub-display') as HTMLElement;
const goBackButton = document.getElementById('go-back') as HTMLButtonElement;
const endButton = document.getElementById('end-session') as HTMLButtonElement;

getState().then(({ session }) => {
  if (session.active && session.intent) {
    intentDisplay.textContent = session.intent;
  } else {
    intentDisplay.textContent = 'stay focused.';
  }
  subDisplay.textContent = 'This is the part you came here for.';
});

goBackButton.addEventListener('click', () => {
  if (history.length > 1) {
    history.back();
  } else {
    window.close();
  }
});

endButton.addEventListener('click', async () => {
  await endSession();
  window.close();
});
