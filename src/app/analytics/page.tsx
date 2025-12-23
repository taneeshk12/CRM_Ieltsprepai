'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalyticsCard {
  id: string
  title: string
  icon: string
  color: string
  href: string
  description: string
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [router])

  const analyticsCards: AnalyticsCard[] = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      icon: '$',
      color: 'bg-green-500',
      href: '/analytics/revenue',
      description: 'Detailed revenue analytics, trends, and payment breakdowns'
    },
    {
      id: 'retention',
      title: 'User Retention',
      icon: 'R',
      color: 'bg-blue-500',
      href: '/analytics/retention',
      description: 'User retention rates, cohort analysis, and engagement metrics'
    },
    {
      id: 'active-users',
      title: 'Active Users',
      icon: 'A',
      color: 'bg-purple-500',
      href: '/analytics/active-users',
      description: 'Active user metrics, DAU, MAU, and engagement patterns'
    },
    {
      id: 'reading',
      title: 'Reading Tests',
      icon: 'R',
      color: 'bg-yellow-500',
      href: '/analytics/reading',
      description: 'Reading test analytics, performance, and completion rates'
    },
    {
      id: 'speaking',
      title: 'Speaking Tests',
      icon: 'S',
      color: 'bg-pink-500',
      href: '/analytics/speaking',
      description: 'Speaking test analytics, scores, and topic performance'
    },
    {
      id: 'trials',
      title: 'Trial Users',
      icon: 'T',
      color: 'bg-indigo-500',
      href: '/analytics/trials',
      description: 'Trial user analytics, conversion rates, and usage patterns'
    },
    {
      id: 'free-attempts',
      title: 'Free Test Attempts',
      icon: 'F',
      color: 'bg-teal-500',
      href: '/analytics/free-attempts',
      description: 'Free test attempt tracking and IP-based analytics'
    },
    {
      id: 'essays',
      title: 'Essay Analytics',
      icon: 'E',
      color: 'bg-orange-500',
      href: '/analytics/essays',
      description: 'Essay submission analytics, band scores, and trends'
    },
    {
      id: 'full-tests',
      title: 'Full Writing Tests',
      icon: 'T',
      color: 'bg-red-500',
      href: '/analytics/full-tests',
      description: 'Full writing test analytics and performance metrics'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <p className="text-gray-600">
              Click on any analytics card below to view detailed insights, trends, and breakdowns.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {analyticsCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mr-4`}>
                      <span className="text-white font-bold text-xl">{card.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{card.description}</p>
                  <div className="mt-4 flex items-center text-indigo-600 font-medium">
                    <span>View Details</span>
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
