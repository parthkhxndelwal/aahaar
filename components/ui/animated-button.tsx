"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
 
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  onAsyncClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<boolean>;
}
 
export const AnimatedButton = ({ className, children, onAsyncClick, ...props }: ButtonProps) => {
  const [scope, animate] = useAnimate();
  const [animationKey, setAnimationKey] = React.useState(0);
 
  const animateLoading = async () => {
    await animate(
      ".loader",
      {
        width: "20px",
        scale: 1,
        display: "flex",
      },
      {
        duration: 0.2,
      },
    );
  };
 
  const animateSuccess = async () => {
    await animate(
      ".loader",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        duration: 0.2,
      },
    );
    await animate(
      ".check",
      {
        width: "20px",
        scale: 1,
        display: "flex",
      },
      {
        duration: 0.2,
      },
    );
 
    await animate(
      ".check",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        delay: 2,
        duration: 0.2,
      },
    );
  };

  const animateFailure = async () => {
    // Trigger shake animation by changing the key
    setAnimationKey(prev => prev + 1);
    
    // Wait for shake to complete
    await new Promise(resolve => setTimeout(resolve, 600));

    // Then hide loader and show cross
    await animate(
      ".loader",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        duration: 0.2,
      },
    );
    await animate(
      ".cross",
      {
        width: "20px",
        scale: 1,
        display: "flex",
      },
      {
        duration: 0.2,
      },
    );
 
    await animate(
      ".cross",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        delay: 2,
        duration: 0.2,
      },
    );
  };
 
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onAsyncClick) {
      await animateLoading();
      try {
        const success = await onAsyncClick(event);
        if (success) {
          await animateSuccess();
        } else {
          await animateFailure();
        }
      } catch (error) {
        await animateFailure();
      }
    } else {
      await props.onClick?.(event);
    }
  };
 
  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;
 
  return (
    <motion.button
      key={`button-${animationKey}`}
      layout
      layoutId="button"
      ref={scope}
      initial={{ x: 0 }}
      animate={{ x: animationKey > 0 ? [0, 10, -10, 10, -10, 0] : 0 }}
      transition={{ 
        duration: animationKey > 0 ? 0.6 : 0,
        ease: "easeInOut",
      }}
      className={cn(
        "flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground ring-offset-2 transition duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-2">
        <Loader />
        <CheckIcon />
        <CrossIcon />
        <motion.span layout>{children}</motion.span>
      </motion.div>
    </motion.button>
  );
};
 
const Loader = () => {
  return (
    <motion.div
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 1,
        display: "none",
      }}
      className="loader flex items-center justify-center"
    >
      <Spinner size={20} variant="dark" />
    </motion.div>
  );
};
 
const CheckIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 1,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="check text-current flex items-center justify-center"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </motion.svg>
  );
};

const CrossIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 1,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="cross text-current flex items-center justify-center"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M10 10l4 4m0 -4l-4 4" />
    </motion.svg>
  );
};
