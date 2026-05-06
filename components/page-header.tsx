export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.24em] text-[#d7ff73]">{eyebrow}</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
