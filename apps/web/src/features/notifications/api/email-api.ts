import { api } from "@/shared/api/client"
import type { EmailNotificationOverview } from "@amautai/contracts"
const root="/api/notifications/email"
export const emailApi={
 overview:(signal?:AbortSignal)=>api<EmailNotificationOverview>(root,{signal}),
 requestCode:()=>api(root+"/verify/request",{method:"POST",body:JSON.stringify({consent:true})}),
 verify:(code:string)=>api(root+"/verify",{method:"POST",body:JSON.stringify({code})}),
 preferences:(enabled:boolean)=>api(root+"/preferences",{method:"PUT",body:JSON.stringify({enabled})}),
 schedule:(title:string,scheduledAt:number,requestKey:string)=>api(root,{method:"POST",body:JSON.stringify({title,scheduledAt,requestKey})}),
 test:(requestKey:string)=>api(root+"/test",{method:"POST",body:JSON.stringify({requestKey})}),
 cancel:(id:string)=>api(root+"/"+encodeURIComponent(id),{method:"DELETE"}),
}
