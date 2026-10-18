import { Navigate, useParams } from "react-router"
import { RoomPlayer } from "./rooms"
export function FamilyGamePage() {
  const { roomId, participantId } = useParams()
  if (!roomId || !participantId) return <Navigate to="/panel" replace />
  return (
    <main className="mx-auto min-h-svh w-full p-4 sm:p-6">
      <RoomPlayer
        key={roomId + participantId}
        roomId={roomId}
        participantId={participantId}
        family
      />
    </main>
  )
}
