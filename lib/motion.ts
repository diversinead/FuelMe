// Reusable motion presets

export const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.24, ease: ease.out },
};

export const stepHorizontalEnter = (direction: 1 | -1) => ({
  initial: { opacity: 0, x: 24 * direction },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 * direction },
  transition: { duration: 0.22, ease: ease.out },
});

export const staggerList = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.16, ease: ease.out },
  },
};
