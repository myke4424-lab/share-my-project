import { useEffect, useRef, useState } from "react";

export type TaskStatus = "idle" | "running" | "completed" | "failed" | "stopped";

interface RunningTask {
  taskId: string | null;
  taskStatus: TaskStatus;
  setTaskId: (id: string | null) => void;
  setTaskStatus: (s: TaskStatus) => void;
  busyAccountIds: number[];
}

export function useRunningTask(tool: string): RunningTask {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("idle");
  const [busyAccountIds, setBusyAccountIds] = useState<number[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetch("/api/tasks", { credentials: "include" })
      .then(r => r.json())
      .then((tasks: Array<{ task_id: string; tool: string; status: string }>) => {
        if (!Array.isArray(tasks)) return;
        const running = tasks.find(t => t.tool === tool && t.status === "running");
        if (running) {
          setTaskId(running.task_id);
          setTaskStatus("running");
        }
      })
      .catch(() => {});

    fetch("/api/tasks/busy-accounts", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.account_ids)) setBusyAccountIds(d.account_ids); })
      .catch(() => {});
  }, [tool]);

  useEffect(() => {
    fetch("/api/tasks/busy-accounts", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.account_ids)) setBusyAccountIds(d.account_ids); })
      .catch(() => {});
  }, [taskStatus]);

  return { taskId, taskStatus, setTaskId, setTaskStatus, busyAccountIds };
}
