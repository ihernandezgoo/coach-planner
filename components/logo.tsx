import { WhistleIcon } from "./icons";

export function Logo({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-fg">
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-fg">
        <WhistleIcon />
      </span>
      {name}
    </span>
  );
}
