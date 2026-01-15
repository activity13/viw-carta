import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Facturación y Suscripción</h1>

      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
          <CardDescription>
            Información sobre tu plan y estado de cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">
              Para gestionar tus pagos, por favor contacta a soporte técnico o
              espera las instrucciones de pago automatizadas.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline">Contactar Soporte</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
