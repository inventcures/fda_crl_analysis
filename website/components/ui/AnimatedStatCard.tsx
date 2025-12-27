'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { cardEntry, getStaggerDelay, prefersReducedMotion } from '@/lib/animations'
import { LucideIcon } from 'lucide-react'

interface AnimatedStatCardProps {
  title: string
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  bgColor?: string
  index?: number  // For staggered animation
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  onClick?: () => void
}

export default function AnimatedStatCard({
  title,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  description,
  icon: Icon,
  iconColor = 'text-blue-500',
  bgColor = 'bg-white',
  index = 0,
  trend,
  onClick,
}: AnimatedStatCardProps) {
  const reducedMotion = prefersReducedMotion()
  const delay = getStaggerDelay(index, 0.1)

  return (
    <motion.div
      variants={cardEntry}
      initial="initial"
      animate="animate"
      transition={{ delay }}
      className={`${bgColor} rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      whileHover={reducedMotion ? {} : { scale: 1.02, y: -2 }}
      whileTap={onClick && !reducedMotion ? { scale: 0.98 } : {}}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {prefix}
              {reducedMotion ? (
                value.toLocaleString()
              ) : (
                <CountUp
                  end={value}
                  duration={1.5}
                  decimals={decimals}
                  separator=","
                  delay={delay}
                />
              )}
              {suffix}
            </span>
          </div>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium ${
                  trend.direction === 'up'
                    ? 'text-green-600'
                    : trend.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {trend.direction === 'up' && '+'}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-400">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className={`p-2.5 rounded-lg bg-opacity-10 ${iconColor.replace('text-', 'bg-')}`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Variant for percentage-based stats
interface AnimatedPercentCardProps extends Omit<AnimatedStatCardProps, 'value' | 'suffix'> {
  value: number // 0-100
  showBar?: boolean
  barColor?: string
}

export function AnimatedPercentCard({
  value,
  showBar = true,
  barColor = 'bg-blue-500',
  ...props
}: AnimatedPercentCardProps) {
  const reducedMotion = prefersReducedMotion()

  return (
    <motion.div
      variants={cardEntry}
      initial="initial"
      animate="animate"
      transition={{ delay: getStaggerDelay(props.index || 0, 0.1) }}
      className={`${props.bgColor || 'bg-white'} rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{props.title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {props.prefix}
              {reducedMotion ? (
                value.toFixed(props.decimals || 1)
              ) : (
                <CountUp
                  end={value}
                  duration={1.5}
                  decimals={props.decimals || 1}
                  delay={getStaggerDelay(props.index || 0, 0.1)}
                />
              )}
              %
            </span>
          </div>
        </div>
        {props.icon && (
          <div className={`p-2.5 rounded-lg bg-opacity-10 ${(props.iconColor || 'text-blue-500').replace('text-', 'bg-')}`}>
            <props.icon className={`w-5 h-5 ${props.iconColor || 'text-blue-500'}`} />
          </div>
        )}
      </div>

      {showBar && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${barColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{
              duration: reducedMotion ? 0 : 1,
              delay: getStaggerDelay(props.index || 0, 0.1) + 0.3,
              ease: 'easeOut',
            }}
          />
        </div>
      )}

      {props.description && (
        <p className="text-xs text-gray-400 mt-2">{props.description}</p>
      )}
    </motion.div>
  )
}
