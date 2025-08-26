import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipButtonProps {
  title: string;
  hover: string;
}

export function TooltipButton({ title, hover }: TooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">{title}</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{hover}</p>
      </TooltipContent>
    </Tooltip>
  )
}