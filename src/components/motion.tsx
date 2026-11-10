"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "motion/react";

/**
 * Hiệu ứng vào trang / danh sách dùng chung (motion — cùng thư viện với animate-ui).
 * Nhẹ, ngắn (≤ 300ms) để không làm chậm thao tác bán hàng; tự tắt khi người dùng bật
 * "giảm chuyển động" của hệ điều hành (motion tôn trọng prefers-reduced-motion qua CSS ở globals).
 */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
};

/** Khối nội dung trang: hiện dần + trượt lên nhẹ khi mount. */
export function FadeIn({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, delay }}
      {...props}
    />
  );
}

/** Lưới / danh sách: các con `StaggerItem` hiện lần lượt. */
export function Stagger({
  stagger = 0.04,
  ...props
}: HTMLMotionProps<"div"> & { stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      {...props}
    />
  );
}

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={fadeUp} {...props} />;
}

/** Bọc phần tử có thể nhấn (thẻ bàn, thẻ món): co nhẹ khi chạm, nhô nhẹ khi hover. */
export const Pressable = React.forwardRef<HTMLButtonElement, HTMLMotionProps<"button">>(
  function Pressable(props, ref) {
    return (
      <motion.button
        ref={ref}
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...props}
      />
    );
  },
);
