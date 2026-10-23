import { Shell } from "@/components/site/shell";

export default function RedesignLayout({ children }: LayoutProps<"/">) {
  return <Shell site="redesign">{children}</Shell>;
}
