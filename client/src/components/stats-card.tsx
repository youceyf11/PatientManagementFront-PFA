import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  linkText?: string;
  linkHref?: string;
  iconColor?: string;
  iconBgColor?: string;
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  linkText,
  linkHref,
  iconColor = "text-primary",
  iconBgColor = "bg-blue-100"
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {value}
                  </div>
                  {description && (
                    <div className="text-sm text-gray-500">
                      {description}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {linkText && linkHref && (
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a href={linkHref} className="font-medium text-primary hover:text-primary/80">
                {linkText}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
