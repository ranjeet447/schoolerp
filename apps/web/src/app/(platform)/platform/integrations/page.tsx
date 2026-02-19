"use client";

import Link from "next/link";
import { 
  Link as LinkIcon, 
  Activity, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Globe,
  Settings,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  Badge,
  Progress 
} from "@schoolerp/ui";

const HEALTH_STATUS = [
  { name: "Payment Gateway", status: "Operational", health: 100, icon: Zap, color: "text-emerald-500" },
  { name: "Notification Engine", status: "Operational", health: 99.8, icon: Activity, color: "text-blue-500" },
  { name: "Auth Provider", status: "Operational", health: 100, icon: ShieldCheck, color: "text-indigo-500" },
];

const INTEGRATION_ACTIONS = [
  { 
    title: "Global Webhooks", 
    description: "Manage platform-wide event delivery", 
    href: "/platform/integrations/manage?tab=webhooks", 
    icon: Globe,
  },
  { 
    title: "Activity Monitoring", 
    description: "Real-time integration request logs", 
    href: "/platform/integrations/manage?tab=logs", 
    icon: Activity,
  },
  { 
    title: "Advanced Config", 
    description: "API master keys and security policy", 
    href: "/platform/integrations/manage?tab=security", 
    icon: Settings,
  },
];

export default function IntegrationsDashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">System Connectivity</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Platform integration health and API telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">ALL SYSTEMS OPERATIONAL</Badge>
           <Button variant="ghost" size="icon" className="h-8 w-8">
             <RefreshCw className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {HEALTH_STATUS.map((service) => (
          <Card key={service.name} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`rounded-xl p-2 bg-muted ${service.color}`}>
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">{service.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60">{service.status}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
                <span className="text-sm font-black text-foreground">{service.health}%</span>
              </div>
              <Progress value={service.health} className="h-1.5 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {INTEGRATION_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="h-full border-none shadow-sm transition-all duration-200 hover:shadow-md hover:bg-accent/50">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl p-3 bg-primary/10 text-primary">
                      <action.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Alerts / Events */}
      <div className="grid gap-8 lg:grid-cols-3">
         <Card className="lg:col-span-2 border-none shadow-sm">
           <CardContent className="p-0">
             <div className="flex items-center justify-between p-6 border-b border-border">
               <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Recent API Events</h3>
               <Link href="/platform/integrations/manage?tab=logs" className="text-xs font-bold text-primary hover:underline">View Logs</Link>
             </div>
             <div className="divide-y divide-border">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                   <div className="flex items-center gap-3">
                     <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                     <div>
                       <p className="text-sm font-bold text-foreground">Webhook Delivered: tenant.created</p>
                       <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">to https://api.crm-sync.com/webhook</p>
                     </div>
                   </div>
                   <span className="text-[10px] font-bold text-muted-foreground">12m ago</span>
                 </div>
               ))}
               <div className="flex items-center justify-between p-4 bg-amber-500/5">
                 <div className="flex items-center gap-3">
                   <AlertCircle className="h-4 w-4 text-amber-500" />
                   <div>
                     <p className="text-sm font-bold text-foreground">Retrying delivery: order.failed</p>
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight text-amber-600/80">Attempt 2 of 5</p>
                   </div>
                 </div>
                 <span className="text-[10px] font-bold text-muted-foreground">45m ago</span>
               </div>
             </div>
           </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
           <CardContent className="p-8 h-full flex flex-col justify-between">
             <div className="space-y-4">
               <Zap className="h-10 w-10 text-white/50" />
               <h3 className="text-2xl font-black leading-tight">Developer API Reference</h3>
               <p className="text-indigo-100 text-sm leading-relaxed">
                 Access technical documentation for platform-level API integration and event schemas.
               </p>
             </div>
             <Button variant="secondary" className="w-full mt-8 font-bold border-none transition-transform group-hover:scale-[1.02]">
               Open API Docs
             </Button>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
