interface AnalysisHeaderProps {
  title: string
  description: string
}

export function AnalysisHeader({ title, description }: AnalysisHeaderProps) {
  return (
    <div className="mb-2">
      <h1 className="mb-1 text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
