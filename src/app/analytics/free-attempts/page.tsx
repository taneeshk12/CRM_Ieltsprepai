'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface FreeAttemptsData {
  totalAttempts: number
  uniqueIPs: number
  recentAttempts: Array<{
    id: string
    ipAddress: string
    usedAt: string
    attemptCount: number
  }>
  attemptsOverTime: Array<{
    date: string
    count: number
  }>
  topIPs: Array<{
    ipAddress: string
    count: number
    firstAttempt: string
    lastAttempt: string
  }>
}

export default function FreeAttemptsPage() {
  const [data, setData] = useState<FreeAttemptsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)

        let dateFilter = new Date(0)
        if (timeFilter === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        if (timeFilter === '30d') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        if (timeFilter === '90d') dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

        const { data: attempts, error } = await supabase
          .from('free_test_attempts')
          .select('*')
          .gte('used_at', dateFilter.toISOString())
          .order('used_at', { ascending: false })

        if (error) throw error

        const totalAttempts = attempts?.length || 0
        const uniqueIPs = new Set(attempts?.map(a => a.ip_address)).size

        // Count attempts per IP
        const ipCountMap = new Map<string, { count: number; firstAttempt: string; lastAttempt: string }>()
        attempts?.forEach(attempt => {
          const current = ipCountMap.get(attempt.ip_address) || {
            count: 0,
            firstAttempt: attempt.used_at,
            lastAttempt: attempt.used_at
          }
          ipCountMap.set(attempt.ip_address, {
            count: current.count + 1,
            firstAttempt: attempt.used_at < current.firstAttempt ? attempt.used_at : current.firstAttempt,
            lastAttempt: attempt.used_at > current.lastAttempt ? attempt.used_at : current.lastAttempt
          })
        })

        const recentAttempts = Array.from(ipCountMap.entries())
          .map(([ipAddress, data]) => ({
            id: ipAddress,
            ipAddress,
            usedAt: data.lastAttempt,
            attemptCount: data.count
          }))
          .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
          .slice(0, 50)

        // Top IPs by attempt count
        const topIPs = Array.from(ipCountMap.entries())
          .map(([ipAddress, data]) => ({
            ipAddress,
            count: data.count,
            firstAttempt: data.firstAttempt,
            lastAttempt: data.lastAttempt
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)

        // Attempts over time
        const attemptsByDay = new Map<string, number>()
        attempts?.forEach(attempt => {
          const date = new Date(attempt.used_at).toISOString().split('T')[0]
          attemptsByDay.set(date, (attemptsByDay.get(date) || 0) + 1)
        })

        const attemptsOverTime = Array.from(attemptsByDay.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setData({
          totalAttempts,
          uniqueIPs,
          recentAttempts,
          attemptsOverTime,
          topIPs
        })

      } catch (error) {
        console.error('Error fetching free attempts data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading free attempts analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/analytics" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 block">
            ← Back to Analytics
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Free Test Attempts Analytics</h1>
            <div className="flex gap-2">
              {['all', '7d', '30d', '90d'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter as typeof timeFilter)}
                  className={`px-4 py-2 rounded ${timeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                >
                  {filter === 'all' ? 'All Time' : filter === '7d' ? '7 Days' : filter === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Total Attempts</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.totalAttempts}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Unique IP Addresses</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.uniqueIPs}</div>
              </div>
            </div>
          </div>

          {/* Attempts Over Time */}
          {data?.attemptsOverTime && data.attemptsOverTime.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Attempts Over Time</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.attemptsOverTime.slice(-30).reverse().map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {day.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top IPs */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top IP Addresses by Attempt Count</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Attempts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Attempt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Attempt</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.topIPs.map((ip) => (
                    <tr key={ip.ipAddress}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {ip.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-semibold ${ip.count > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {ip.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ip.firstAttempt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ip.lastAttempt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Attempts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Attempts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Attempts</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.recentAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {attempt.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attempt.usedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attempt.attemptCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
