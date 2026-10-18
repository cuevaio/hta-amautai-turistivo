export type TransactionalEmail = {
  id: string
  email: string
  title: string
  body: string
}
export type TransactionalEmailResult = {
  status: "accepted" | "failed" | "uncertain" | "retry"
  providerId?: string
  error?: string
}
export interface TransactionalEmailProvider {
  configured(): boolean
  send(item: TransactionalEmail): Promise<TransactionalEmailResult>
}
