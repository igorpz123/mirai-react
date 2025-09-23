import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipButtonProps {
  title: string;
  hover: string;
  onClick?: () => void;
}

export function TooltipButton({ title, hover, onClick }: TooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" onClick={onClick}>{title}</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hover}</p>
      </TooltipContent>
    </Tooltip>
  )
}