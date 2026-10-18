import "i18next"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "messages"
    resources: { messages: Record<string, string> }
    strictKeyChecks: true
  }
}
