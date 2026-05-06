const _self = self as unknown as DedicatedWorkerGlobalScope;

let duration: number = 0;
let elapsed: number = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let tickStartTime: number | null = null;
let elapsedAtStart: number = 0;

interface WorkerCommand {
  command: string;
  duration?: number;
}

interface TickMessage {
  type: 'TICK';
  remaining: number;
  elapsed: number;
}

interface CompleteMessage {
  type: 'COMPLETE';
}

type WorkerOutMessage = TickMessage | CompleteMessage;

self.onmessage = function (e: MessageEvent<WorkerCommand>): void {
  const { command, duration: dur } = e.data;

  switch (command) {
    case 'START':
      if (dur !== undefined) {
        duration = dur;
        elapsed = 0;
      }
      startTicking();
      break;

    case 'PAUSE':
      pauseTicking();
      break;

    case 'RESET':
      resetTimer();
      break;

    case 'SET_DURATION':
      if (dur !== undefined) {
        duration = dur;
        elapsed = 0;
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
        tickStartTime = null;
        elapsedAtStart = 0;
      }
      break;

    default:
      break;
  }
};

function startTicking(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }

  tickStartTime = Date.now();
  elapsedAtStart = elapsed;

  intervalId = setInterval(function (): void {
    const wallElapsed: number = Math.floor((Date.now() - tickStartTime!) / 1000);
    elapsed = Math.min(elapsedAtStart + wallElapsed, duration);
    const remaining: number = Math.max(0, duration - elapsed);

    self.postMessage({ type: 'TICK', remaining: remaining, elapsed: elapsed } as TickMessage);

    if (remaining <= 0) {
      clearInterval(intervalId!);
      intervalId = null;
      self.postMessage({ type: 'COMPLETE' } as CompleteMessage);
    }
  }, 1000);
}

function pauseTicking(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resetTimer(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  elapsed = 0;
  duration = 0;
  tickStartTime = null;
  elapsedAtStart = 0;
}
