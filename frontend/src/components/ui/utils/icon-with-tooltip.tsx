import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconWithTooltipProps {
  icon: LucideIcon;
  tooltipText: string;
  label?: string;
  size?: number;
  className?: string;
}

export function IconWithTooltip({
  icon: Icon,
  tooltipText,
  size = 20,
  className = "",
}: IconWithTooltipProps) {

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>  
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-lg">
              <Icon size={size} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}