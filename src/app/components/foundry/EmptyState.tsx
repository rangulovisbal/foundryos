import { type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-xl bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && onAction && (
        <Button onClick={onAction} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {action}
        </Button>
      )}
    </div>
  );
}