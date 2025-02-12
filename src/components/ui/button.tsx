import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={`rounded bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
