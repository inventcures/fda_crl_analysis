'use client'

import { motion } from 'framer-motion'

type SkeletonType = 'bar' | 'line' | 'stat' | 'radar' | 'heatmap' | 'scatter' | 'wordcloud'

interface ChartSkeletonProps {
  type: SkeletonType
  height?: number | string
  className?: string
}

// Shimmer animation keyframes
const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear' as const,
  },
}

export default function ChartSkeleton({
  type,
  height = 300,
  className = '',
}: ChartSkeletonProps) {
  const heightStyle = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-50 ${className}`}
      style={{ height: heightStyle }}
    >
      {type === 'bar' && <BarSkeleton />}
      {type === 'line' && <LineSkeleton />}
      {type === 'stat' && <StatSkeleton />}
      {type === 'radar' && <RadarSkeleton />}
      {type === 'heatmap' && <HeatmapSkeleton />}
      {type === 'scatter' && <ScatterSkeleton />}
      {type === 'wordcloud' && <WordCloudSkeleton />}

      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={shimmer.animate}
        transition={shimmer.transition}
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  )
}

function BarSkeleton() {
  return (
    <div className="flex items-end justify-around h-full p-4 pt-8">
      {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.75].map((h, i) => (
        <motion.div
          key={i}
          className="w-8 bg-gray-200 rounded-t"
          initial={{ height: 0 }}
          animate={{ height: `${h * 80}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        />
      ))}
    </div>
  )
}

function LineSkeleton() {
  return (
    <div className="h-full p-4 flex flex-col justify-end">
      {/* Y-axis labels */}
      <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between">
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className="w-6 h-3 bg-gray-200 rounded" />
        ))}
      </div>

      {/* Line placeholder */}
      <svg className="w-full h-3/4 ml-8" viewBox="0 0 100 50" preserveAspectRatio="none">
        <motion.path
          d="M0,40 Q10,35 20,30 T40,25 T60,20 T80,15 T100,10"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 ml-8">
        {[1, 2, 3, 4, 5].map((_, i) => (
          <div key={i} className="w-10 h-3 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="w-24 h-4 bg-gray-200 rounded" />
      <div className="w-16 h-8 bg-gray-200 rounded" />
      <div className="w-32 h-3 bg-gray-200 rounded mt-1" />
    </div>
  )
}

function RadarSkeleton() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <svg className="w-3/4 h-3/4" viewBox="0 0 100 100">
        {/* Pentagon shape */}
        <motion.polygon
          points="50,10 90,35 75,85 25,85 10,35"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.polygon
          points="50,25 75,40 65,75 35,75 25,40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        {/* Axes */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <motion.line
            key={i}
            x1="50"
            y1="50"
            x2={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#e5e7eb"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
          />
        ))}
      </svg>
    </div>
  )
}

function HeatmapSkeleton() {
  const rows = 6
  const cols = 6

  return (
    <div className="h-full p-4">
      {/* Column headers */}
      <div className="flex gap-1 mb-2 ml-16">
        {Array(cols).fill(0).map((_, i) => (
          <div key={i} className="flex-1 h-3 bg-gray-200 rounded" />
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {Array(rows).fill(0).map((_, row) => (
          <div key={row} className="flex gap-1 items-center">
            {/* Row label */}
            <div className="w-14 h-3 bg-gray-200 rounded" />
            {/* Cells */}
            {Array(cols).fill(0).map((_, col) => (
              <motion.div
                key={col}
                className="flex-1 aspect-square bg-gray-200 rounded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 + Math.random() * 0.5 }}
                transition={{ duration: 0.3, delay: (row * cols + col) * 0.02 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScatterSkeleton() {
  const points = Array(20).fill(0).map(() => ({
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 4 + Math.random() * 8,
  }))

  return (
    <div className="h-full p-4">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Axes */}
        <line x1="10" y1="90" x2="90" y2="90" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="10" y1="10" x2="10" y2="90" stroke="#e5e7eb" strokeWidth="1" />

        {/* Points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.size / 2}
            fill="#e5e7eb"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          />
        ))}
      </svg>
    </div>
  )
}

function WordCloudSkeleton() {
  const words = [
    { w: 80, h: 24, x: 30, y: 40 },
    { w: 60, h: 18, x: 50, y: 25 },
    { w: 50, h: 16, x: 15, y: 55 },
    { w: 70, h: 20, x: 60, y: 60 },
    { w: 40, h: 14, x: 25, y: 75 },
    { w: 55, h: 17, x: 70, y: 35 },
    { w: 45, h: 15, x: 40, y: 80 },
    { w: 65, h: 19, x: 10, y: 30 },
  ]

  return (
    <div className="h-full relative p-4">
      {words.map((word, i) => (
        <motion.div
          key={i}
          className="absolute bg-gray-200 rounded"
          style={{
            width: word.w,
            height: word.h,
            left: `${word.x}%`,
            top: `${word.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 + Math.random() * 0.3 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        />
      ))}
    </div>
  )
}

// Stat card skeleton grid
export function StatCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array(count).fill(0).map((_, i) => (
        <ChartSkeleton key={i} type="stat" height={120} />
      ))}
    </div>
  )
}
