"use client";

// Tabs có thanh highlight trượt (animate-ui).
import type * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
} from "@/components/animate-ui/components/radix/tabs";

type TabsContentProps = Omit<
  React.ComponentProps<typeof TabsPrimitive.Content>,
  "asChild" | "forceMount"
> &
  HTMLMotionProps<"div">;

/**
 * Nội dung tab: chỉ hiệu ứng hiện vào (mờ → rõ), không giữ bản cũ để chạy hiệu ứng thoát.
 * Bản của animate-ui bọc AnimatePresence nên có lúc 2 bản cùng nằm trong DOM → trùng id
 * (vd 2 ô #login-password), làm lỗi label/autofill và test.
 */
export function TabsContent({ value, className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content value={value} asChild>
      <motion.div
        data-slot="tabs-content"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("flex-1 outline-none", className)}
        {...props}
      />
    </TabsPrimitive.Content>
  );
}
