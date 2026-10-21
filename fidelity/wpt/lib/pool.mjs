// Process pool with per-task timeouts. A worker that times out is SIGKILLed and replaced (its
// test is recorded as `timeout`); a worker that dies mid-task is replaced and its test is recorded
// as `error` (kind "crash") with the exit code/signal — never silently dropped.
import { fork } from "node:child_process";

export async function runPool({ script, size, tasks, timeoutMs, env, onResult }) {
  let next = 0;
  let seq = 0;

  function spawnWorker() {
    const child = fork(script, [], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    });
    const ready = new Promise((resolve, reject) => {
      const onMsg = (m) => {
        if (m?.type === "ready") {
          child.off("message", onMsg);
          child.off("exit", onEarlyExit);
          resolve();
        }
      };
      const onEarlyExit = (code, signal) =>
        reject(new Error(`worker exited before ready (code ${code}, signal ${signal})`));
      child.on("message", onMsg);
      child.once("exit", onEarlyExit);
    });
    return { child, ready };
  }

  function runOne(worker, task) {
    return new Promise((resolve) => {
      const id = ++seq;
      const limit = timeoutMs(task);
      let settled = false;
      const finish = (result, dead) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.child.off("message", onMsg);
        worker.child.off("exit", onExit);
        resolve({ result, dead });
      };
      const onMsg = (m) => {
        if (m?.type === "result" && m.id === id) finish(m.result, false);
      };
      const onExit = (code, signal) =>
        finish(
          {
            test: task.rel,
            mode: task.mode,
            outcome: "error",
            node: "test",
            cause: {
              status: "error",
              kind: "crash",
              message: `worker exited (code ${code}, signal ${signal})`,
            },
          },
          true,
        );
      const timer = setTimeout(() => {
        worker.child.kill("SIGKILL");
        finish(
          {
            test: task.rel,
            mode: task.mode,
            outcome: "timeout",
            node: "test",
            cause: { status: "timeout", message: `exceeded ${limit} ms` },
            durationMs: limit,
          },
          true,
        );
      }, limit);
      worker.child.on("message", onMsg);
      worker.child.once("exit", onExit);
      worker.child.send({ type: "run", id, test: task });
    });
  }

  async function lane() {
    let worker = spawnWorker();
    await worker.ready;
    while (next < tasks.length) {
      const task = tasks[next++];
      const { result, dead } = await runOne(worker, task);
      onResult(result, task);
      if (dead) {
        worker.child.kill("SIGKILL");
        worker = spawnWorker();
        await worker.ready;
      }
    }
    worker.child.kill("SIGTERM");
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(size, tasks.length)) }, () => lane()),
  );
}
