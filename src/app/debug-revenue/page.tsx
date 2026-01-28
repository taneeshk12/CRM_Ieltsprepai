'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DebugRevenue() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      // Fetch all payments
      const { data: payments, error } = await supabase
        .from('user_payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by status
      const byStatus = payments?.reduce((acc: any, payment: any) => {
        const status = payment.status || 'unknown'
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            total: 0,
            payments: []
          }
        }
        acc[status].count++
        
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount
        acc[status].total += isNaN(amount) ? 0 : amount
        acc[status].payments.push(payment)
        return acc
      }, {})

      // Calculate completed payments
      const completed = payments?.filter((p: any) => 
        p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid'
      ) || []

      const totalRevenue = completed.reduce((sum: number, p: any) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)

      setData({
        totalPayments: payments?.length || 0,
        byStatus,
        completed,
        totalRevenue,
        avgTransaction: completed.length > 0 ? totalRevenue / completed.length : 0,
        allPayments: payments || []
      })

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading debug data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mb-4 block">
          ← Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold mb-6">Revenue Debug Information</h1>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Payments</div>
              <div className="text-2xl font-bold">{data?.totalPayments}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Completed Payments</div>
              <div className="text-2xl font-bold">{data?.completed?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{data?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Transaction</div>
              <div className="text-2xl font-bold">
                ₹{data?.avgTransaction?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Payments by Status</h2>
          <div className="space-y-4">
            {data?.byStatus && Object.entries(data.byStatus).map(([status, info]: [string, any]) => (
              <div key={status} className="border-l-4 border-indigo-500 pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-lg">{status}</div>
                    <div className="text-sm text-gray-500">
                      {info.count} payments
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹{info.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Completed Payments */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Recent Completed Payments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.completed?.slice(0, 20).map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.email || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold">
                      ₹{typeof payment.amount === 'string' ? payment.amount : payment.amount?.toFixed(2) || '0'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {typeof payment.amount}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.credits_added || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">All Payments (Last 50)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.allPayments?.slice(0, 50).map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.email || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'completed' || payment.status === 'succeeded' || payment.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold">
                      ₹{typeof payment.amount === 'string' ? payment.amount : payment.amount?.toFixed(2) || '0'}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.credits_added || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Data */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Raw Data (for debugging)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
