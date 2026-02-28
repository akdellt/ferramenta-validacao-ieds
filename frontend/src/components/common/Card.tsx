interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`border-eq-border bg-white ${className} flex flex-col rounded-lg border p-6.25 shadow-2xl`}
    >
      {title && (
        <h3 className="text-primary mb-6 shrink-0 text-center text-lg font-bold">
          {title}
        </h3>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default Card;
