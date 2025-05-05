import { formatDateWithTimezone } from "@/lib/timezone";

interface DateDisplayProps {
  date: string | Date;
  format?: string;
  className?: string;
}

export default function DateDisplay({ date, format = "dd MMMM yyyy", className = "" }: DateDisplayProps) {
  return <span className={className}>{formatDateWithTimezone(date, format)}</span>;
} 