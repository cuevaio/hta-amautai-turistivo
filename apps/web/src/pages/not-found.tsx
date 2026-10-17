import { Link } from "react-router"
import { CompassIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"

export function NotFoundPage() {
  return (
    <main className="flex min-h-80 flex-1 items-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CompassIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>Página no encontrada</h1>
          </EmptyTitle>
          <EmptyDescription>
            Esta ruta no existe o cambió de lugar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link to="/dashboard" />}>
            Volver al inicio
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
