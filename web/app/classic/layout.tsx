import { Shell } from "@/components/site/shell";

export default function ClassicLayout({ children }: LayoutProps<"/classic">) {
  return <Shell site="classic">{children}</Shell>;
}
