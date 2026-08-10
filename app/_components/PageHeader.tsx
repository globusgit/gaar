export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-cyan-800 bg-linear-to-r from-cyan-800 to-cyan-950 px-4 py-4 text-white shadow-sm sm:px-6 lg:px-8">
      <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
    </header>
  )
}
