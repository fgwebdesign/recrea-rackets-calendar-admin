'use client'

import { useState } from 'react'
import { FootballLeague } from '@/types/footballLeague'
import { FootballLeagueCard } from './FootballLeagueCard'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const PER_PAGE = 6

export function FootballLeagueList({ leagues }: { leagues: FootballLeague[] }) {
  const [page, setPage] = useState(1)
  const total = leagues.length
  const totalPages = Math.ceil(total / PER_PAGE)
  const paginated = leagues.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="flex flex-col min-h-[calc(100vh-300px)]">
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((l) => (
            <FootballLeagueCard key={l.id} league={l} />
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{(page - 1) * PER_PAGE + 1}</span>–
              <span className="font-medium">{Math.min(page * PER_PAGE, total)}</span> de{' '}
              <span className="font-medium">{total}</span> ligas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${
                  page === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md ${
                  page === totalPages
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
