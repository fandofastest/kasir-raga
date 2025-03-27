import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={`bg-tosca hover:bg-toscadark rounded px-4 py-2 text-white transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
