import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700",
        secondary: "bg-cyan-50 text-cyan-900 hover:bg-cyan-100",
        outline: "border border-slate-200 bg-white text-slate-800 hover:border-blue-300",
        ghost: "text-slate-700 hover:bg-slate-100",
      },
      size: {
        default: "min-h-11",
        large: "min-h-13 px-6 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly asChild?: boolean
  }

export function Button({ asChild = false, className, variant, size, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button"
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
