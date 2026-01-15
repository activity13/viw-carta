import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ServiceSuspended() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-red-100 dark:border-red-900/20">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto bg-red-100 dark:bg-red-900/20 p-4 rounded-full w-fit">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Service Temporarily Suspended
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This digital menu is currently unavailable. Please contact the
            restaurant staff.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4 pt-4">
          <Separator />
          <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
            Powered by VIW
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
