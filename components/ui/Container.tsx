export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-full px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}