import { cn } from "@/lib/utils";

export type SemanticTone =
  | "primary"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

type ToneClassSet = {
  text: string;
  icon: string;
  soft: string;
  outline: string;
  buttonOutline: string;
};

const TONES: Record<SemanticTone, ToneClassSet> = {
  primary: {
    text: "text-primary",
    icon: "bg-primary/10 text-primary",
    soft: "bg-primary/10 text-primary border-primary/20",
    outline: "text-primary border-primary/30 bg-primary/10",
    buttonOutline: "border-primary/30 text-primary hover:bg-primary/10",
  },
  neutral: {
    text: "text-muted-foreground",
    icon: "bg-muted text-foreground",
    soft: "bg-muted text-foreground border-border",
    outline: "text-muted-foreground border-border bg-muted/50",
    buttonOutline: "border-input text-muted-foreground hover:bg-accent hover:text-foreground",
  },
  info: {
    text: "text-blue-600 dark:text-blue-300",
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    soft: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-200",
    outline: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-200 dark:border-blue-700",
    buttonOutline: "border-blue-600/40 text-blue-700 hover:bg-blue-500/10 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900/20",
  },
  success: {
    text: "text-emerald-600 dark:text-emerald-300",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    soft: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-200",
    outline: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-200 dark:border-emerald-700",
    buttonOutline: "border-emerald-600/40 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20",
  },
  warning: {
    text: "text-amber-600 dark:text-amber-300",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    soft: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-200",
    outline: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-200 dark:border-amber-700",
    buttonOutline: "border-amber-600/40 text-amber-700 hover:bg-amber-500/10 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20",
  },
  danger: {
    text: "text-destructive",
    icon: "bg-destructive/10 text-destructive",
    soft: "bg-destructive/10 text-destructive border-destructive/20",
    outline: "bg-destructive/10 text-destructive border-destructive/30",
    buttonOutline: "border-destructive/40 text-destructive hover:bg-destructive/10",
  },
};

export function semanticText(tone: SemanticTone) {
  return TONES[tone].text;
}

export function semanticIconChip(tone: SemanticTone) {
  return TONES[tone].icon;
}

export function semanticBadge(tone: SemanticTone, mode: "soft" | "outline" = "soft") {
  return mode === "soft" ? TONES[tone].soft : TONES[tone].outline;
}

export function semanticOutlineButton(tone: SemanticTone, extra?: string) {
  return cn(TONES[tone].buttonOutline, extra);
}

