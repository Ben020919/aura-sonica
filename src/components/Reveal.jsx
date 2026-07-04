import { motion } from 'framer-motion'

// 滾動到視野先由模糊 / 淡入浮現。令頁面「活」起嚟。
export default function Reveal({
  children,
  delay = 0,
  y = 40,
  once = true,
  className,
  as = 'div',
}) {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
