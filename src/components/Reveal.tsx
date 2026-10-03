import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType } from "react";

import { reveal } from "@/lib/reveal";

type RevealProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "ref">;

export function Reveal<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: RevealProps<T>) {
  const Component = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return reveal(element);
  }, []);

  return (
    <Component
      ref={ref}
      className={["reveal", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}