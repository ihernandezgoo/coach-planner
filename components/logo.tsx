import Image from "next/image";

export function Logo({ name, nameClassName = "" }: { name: string; nameClassName?: string }) {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-fg">
      <Image src="/logo.png" alt="" width={36} height={36} priority className="size-9 shrink-0" />
      <span className={`truncate ${nameClassName}`}>{name}</span>
    </span>
  );
}
