"use client";

import { useState } from "react";

export function PlanTaskDoneCheckbox({
  diagnosisId,
  week,
  taskTitle,
  initialDone,
  label
}: {
  diagnosisId: string;
  week: number;
  taskTitle: string;
  initialDone: boolean;
  label: string;
}) {
  const [done, setDone] = useState(initialDone);
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    setDone(next);
    setSaving(true);
    try {
      const response = await fetch("/api/app/plan/task-done", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          diagnosis_id: diagnosisId,
          week,
          task_title: taskTitle,
          done: next
        })
      });
      if (!response.ok) {
        setDone(!next);
      }
    } catch {
      setDone(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
      <input
        checked={done}
        className="h-4 w-4 cursor-pointer accent-emerald-600"
        disabled={saving}
        onChange={(event) => handleToggle(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}
