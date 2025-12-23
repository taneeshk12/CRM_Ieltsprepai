'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface RevenueData {
  totalRevenue: number
  completedPayments: number
  pendingPayments: number
  avgTransactionValue: number
  topPayingUsers: Array<{
    userId: string
    email: string
    name: string
    totalSpent: number
    transactionCount: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    count: number
  }>
  revenueByCredits: Array<{
    credits: number
    revenue: number
    count: number
  }>
  recentPayments: Array<{
    id: string
    amount: number
    credits: number
    status: string
    email: string
    name: string
    createdAt: string
  }>
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    fetchRevenueData()
  }, [router, timeFilter])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)

      // Calculate date filter
      let dateFilter = new Date(0) // Beginning of time
      if (timeFilter === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (timeFilter === '30d') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (timeFilter === '90d') dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

      // Fetch all payments with filters
      const { data: payments, error } = await supabase
        .from('user_payments')
        .select('*')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate total revenue and stats - check for multiple status values
      const completedPayments = payments?.filter(p => 
        p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid'
      ) || []
      const pendingPayments = payments?.filter(p => 
        p.status === 'pending' || p.status === 'created' || p.status === 'processing'
      ) || []
      
      const totalRevenue = completedPayments.reduce((sum, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      const avgTransactionValue = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0

      // Get user details
      const userIds = [...new Set(payments?.map(p => p.user_id).filter(Boolean))] as string[]
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name')
        .in('user_id', userIds)

      const userMap = new Map(users?.map(u => [u.id, u.email]) || [])
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || [])

      // Top paying users
      const userRevenue = new Map<string, { totalSpent: number, transactionCount: number }>()
      completedPayments.forEach(p => {
        if (!p.user_id) return
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount
        const current = userRevenue.get(p.user_id) || { totalSpent: 0, transactionCount: 0 }
        userRevenue.set(p.user_id, {
          totalSpent: current.totalSpent + (isNaN(amount) ? 0 : amount),
          transactionCount: current.transactionCount + 1
        })
      })

      const topPayingUsers = Array.from(userRevenue.entries())
        .map(([userId, data]) => ({
          userId,
          email: userMap.get(userId) || 'Unknown',
          name: profileMap.get(userId) || userMap.get(userId) || 'Unknown',
          ...data
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)

      // Revenue by month
      const monthlyRevenue = new Map<string, { revenue: number, count: number }>()
      completedPayments.forEach(p => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount
        const date = new Date(p.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const current = monthlyRevenue.get(monthKey) || { revenue: 0, count: 0 }
        monthlyRevenue.set(monthKey, {
          revenue: current.revenue + (isNaN(amount) ? 0 : amount),
          count: current.count + 1
        })
      })

      const revenueByMonth = Array.from(monthlyRevenue.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Revenue by credits
      const creditRevenue = new Map<number, { revenue: number, count: number }>()
      completedPayments.forEach(p => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount
        const credits = p.credits_added || 0
        const current = creditRevenue.get(credits) || { revenue: 0, count: 0 }
        creditRevenue.set(credits, {
          revenue: current.revenue + (isNaN(amount) ? 0 : amount),
          count: current.count + 1
        })
      })

      const revenueByCredits = Array.from(creditRevenue.entries())
        .map(([credits, data]) => ({ credits, ...data }))
        .sort((a, b) => b.revenue - a.revenue)

      // Recent payments with user details
      const recentPayments = payments?.slice(0, 20).map(p => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        credits: p.credits_added || 0,
        status: p.status,
        email: p.email || userMap.get(p.user_id) || 'Unknown',
        name: profileMap.get(p.user_id) || p.email || userMap.get(p.user_id) || 'Unknown',
        createdAt: p.created_at
      })) || []

      setData({
        totalRevenue,
        completedPayments: completedPayments.length,
        pendingPayments: pendingPayments.length,
        avgTransactionValue,
        topPayingUsers,
        revenueByMonth,
        revenueByCredits,
        recentPayments
      })

    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading revenue analytics...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-4 py-2 rounded ${timeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-4 py-2 rounded ${timeFilter === '7d' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-4 py-2 rounded ${timeFilter === '30d' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeFilter('90d')}
                className={`px-4 py-2 rounded ${timeFilter === '90d' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{data?.totalRevenue.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Completed Payments</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.completedPayments}
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Avg Transaction</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{data?.avgTransactionValue.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Pending Payments</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.pendingPayments}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Month */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Month</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg per Transaction</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.revenueByMonth.map((month) => (
                    <tr key={month.month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(month.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{month.revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {month.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{(month.revenue / month.count).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Paying Users */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Paying Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.topPayingUsers.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{user.totalSpent.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.transactionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue by Credit Package */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Credit Package</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.revenueByCredits.map((item) => (
                    <tr key={item.credits}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.credits} credits
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{(item.revenue / item.count).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Payments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{payment.name}</div>
                        <div className="text-xs text-gray-500">{payment.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status}
                        </span>
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
