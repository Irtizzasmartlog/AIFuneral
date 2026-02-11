"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateTaskCompleted } from "@/app/actions/invoice";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type Task = {
  id: string;
  title: string;
  dueDate: Date | null;
  completedAt: Date | null;
  category: string;
  source: string;
};

export function BookingChecklist(props: { caseId: string; tasks: Task[] }) {
  const { caseId, tasks } = props;
  const router = useRouter();
  const completed = tasks.filter((t) => t.completedAt).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  async function handleToggle(taskId: string, checked: boolean) {
    await updateTaskCompleted(taskId, checked);
    router.refresh();
  }

  const byCategory = tasks.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  return (
    <Card>
      <CardHeader className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">
          Booking Checklist
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-600 rounded">
          {percent}% DONE
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {Object.entries(byCategory).map(([category, list]) => (
          <div key={category}>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{category}</p>
            <div className="space-y-3">
              {list.map((task) => (
                <label
                  key={task.id}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={!!task.completedAt}
                    onCheckedChange={(checked) =>
                      handleToggle(task.id, !!checked)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                      {task.source === "agent" && (
                        <Sparkles className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : task.completedAt
                          ? "Done"
                          : "Pending"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
