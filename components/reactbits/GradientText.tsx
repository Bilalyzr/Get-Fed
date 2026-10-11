"use client";

// GradientText (reactbits.dev pattern) — animated flowing gradient text.

export function GradientText({
  children,
  className = "",
  colors = ["#306d29", "#4e8b45", "#c5d9a8", "#306d29"],
  animationSpeed = 6,
}: {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
}) {
  const gradient = colors
    .map((color, index) => `${color} ${(index * 100) / colors.length}%`)
    .join(", ");

  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${gradient})`,
        backgroundSize: `${colors.length * 30}% 100%`,
        animation: `fws-gradient-flow ${animationSpeed}s linear infinite`,
      }}
    >
      {children}
    </span>
  );
}
