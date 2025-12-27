'use client'

import React, { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'

interface Document {
  file_hash: string
  drug_name: string
  application_number: string
  approval_status: string
  letter_date: string
  deficiency_categories: string[]
  enriched?: {
    openfda_brand_name?: string
  }
}

interface GravityDocumentListProps {
  documents: Document[]
}

export default function GravityDocumentList({ documents }: GravityDocumentListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  // Use a reasonable subset for physics performance if needed, but standard computers can handle ~100 simple rects.
  // Let's take the first 100 for the physics view.
  const activeDocs = documents.slice(0, 100)

  useEffect(() => {
    if (!containerRef.current || activeDocs.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    // Calculate height based on grid rows needed
    const cols = width > 1000 ? 4 : width > 768 ? 3 : 2
    const rows = Math.ceil(activeDocs.length / cols)
    const cardHeight = 280
    const cardWidth = 220
    const gap = 60 // Increased gap
    const height = rows * (cardHeight + gap) + 200

    container.style.height = `${height}px`

    // Setup Matter JS
    const Engine = Matter.Engine,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Constraint = Matter.Constraint

    const engine = Engine.create()
    engineRef.current = engine
    engine.world.gravity.y = 0 
    engine.world.gravity.x = 0

    const world = engine.world
    const bodies: Matter.Body[] = []
    const constraints: Matter.Constraint[] = []

    activeDocs.forEach((doc, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      
      // Target Grid Position (Center of the card)
      const gridWidth = cols * (cardWidth + gap) - gap
      const startX = (width - gridWidth) / 2 + cardWidth / 2
      const targetX = startX + col * (cardWidth + gap)
      const targetY = 150 + row * (cardHeight + gap)

      // Create Card Body
      // Initialize EXACTLY at grid position
      const body = Bodies.rectangle(targetX, targetY, cardWidth, cardHeight, {
        chamfer: { radius: 12 },
        frictionAir: 0.05, // High friction for stability
        restitution: 0.4,
        density: 0.001,
        angle: 0, // Start perfectly straight
        label: doc.file_hash
      })

      // Create Tether Constraint (Spring)
      const tether = Constraint.create({
        pointA: { x: targetX, y: targetY },
        bodyB: body,
        pointB: { x: 0, y: 0 },
        stiffness: 0.1, // Tighter spring to hold grid shape
        damping: 0.05,
        length: 0, // Zero length spring
        render: { visible: false }
      })

      bodies.push(body)
      constraints.push(tether)
    })

    Composite.add(world, [...bodies, ...constraints])

    // Mouse Interaction
    const mouse = Mouse.create(container)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    })

    // Allow scrolling by disabling mouse capture on scroll events
    // @ts-ignore
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel)
    // @ts-ignore
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel)

    Composite.add(world, mouseConstraint)

    // Sync Loop
    let requestID: number
    const updateLoop = () => {
      Engine.update(engine, 1000 / 60)
      
      bodies.forEach((body) => {
        const el = document.getElementById(`card-${body.label}`)
        if (el) {
          const { x, y } = body.position
          const angle = body.angle
          el.style.transform = `translate3d(${x - 110}px, ${y - 140}px, 0) rotate(${angle}rad)`
        }
      })
      
      requestID = requestAnimationFrame(updateLoop)
    }
    
    updateLoop()
    setIsReady(true)

    return () => {
      cancelAnimationFrame(requestID)
      Composite.clear(world, false)
      Engine.clear(engine)
    }
  }, [activeDocs])

  return (
    <div className="relative w-full bg-slate-50 border-t border-slate-200">
      {/* Container needs to be large enough to hold the simulated physics world */}
      <div ref={containerRef} className="relative overflow-hidden cursor-grab active:cursor-grabbing">
        {activeDocs.map((doc) => (
          <div
            key={doc.file_hash}
            id={`card-${doc.file_hash}`}
            className={`absolute top-0 left-0 w-[220px] h-[280px] bg-white rounded-xl shadow-lg border border-gray-100 p-5 flex flex-col transition-opacity duration-700 ${
              isReady ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              transform: 'translate3d(-9999px, -9999px, 0)', // Hide initially
              willChange: 'transform'
            }}
            onDoubleClick={() => router.push(`/document-view/${doc.file_hash}`)}
          >
            {/* Minimalist Card Design */}
            <div className="flex justify-between items-start mb-4">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                 doc.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
               }`}>
                 <FileText size={16} />
               </div>
               <span className="text-[10px] font-mono text-gray-400">{doc.application_number}</span>
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg mb-2 leading-snug line-clamp-3">
              {doc.enriched?.openfda_brand_name || doc.drug_name || "Unknown"}
            </h3>
            
            <div className="mt-auto">
               <div className="flex flex-wrap gap-1.5">
                 {doc.deficiency_categories.slice(0, 2).map(cat => (
                   <span key={cat} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded">
                     {cat.replace('_', ' ')}
                   </span>
                 ))}
               </div>
            </div>
            
            {/* Interaction Hint Overlay */}
            <div className="absolute inset-0 bg-white/0 hover:bg-black/5 transition-colors rounded-xl pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  )
}