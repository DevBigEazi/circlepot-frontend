import React, { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Target, Plus, TrendingUp, AlertCircle, Loader } from 'lucide-react'
import { useThemeColors } from '../hooks/useThemeColors'
import NavBar from '../components/NavBar'
import { useUserProfile } from '../hooks/useUserProfile'
import { usePersonalGoals } from '../hooks/usePersonalGoals'
import { client } from '../thirdwebClient'
import { formatBalance } from '../constant/formatBalance'

const Goals: React.FC = () => {
  const navigate = useNavigate()
  const colors = useThemeColors()
  const { profile } = useUserProfile(client)
  const { goals, isLoading, error, contributeToGoal, completeGoal } = usePersonalGoals(client)

  // Calculate total saved across all goals
  const totalBalance = useMemo(() => {
    return goals.reduce((sum, goal) => sum + formatBalance(goal.currentAmount), 0)
  }, [goals])

  // Calculate progress percentage for each goal
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const target = formatBalance(goal.goalAmount)
      const saved = formatBalance(goal.currentAmount)
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0
      return {
        ...goal,
        progress,
        savedAmount: saved,
        targetAmount: target
      }
    })
  }, [goals])

  const activeGoals = goalsWithProgress.filter(g => g.isActive)
  const completedGoals = goalsWithProgress.filter(g => !g.isActive)

  return (
    <>
      <NavBar colors={colors} userName={profile?.username} fullName={profile?.fullName} onBack={() => navigate(-1)} />
      
      <div className="min-h-screen pb-10" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
              Your Goals
            </h1>
            <p style={{ color: colors.textLight }}>
              Track and manage your savings goals with deadline-based incentives
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm" style={{ color: colors.textLight }}>Total Saved</div>
                <TrendingUp size={16} style={{ color: colors.primary }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text }}>
                ${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>Active Goals</div>
              <div className="text-2xl font-bold" style={{ color: colors.text }}>
                {activeGoals.length}
              </div>
            </div>

            <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="text-sm mb-2" style={{ color: colors.textLight }}>Completed</div>
              <div className="text-2xl font-bold" style={{ color: colors.text }}>
                {completedGoals.length}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#fee', borderColor: '#fcc' }}>
              <div className="flex items-center gap-2" style={{ color: '#c33' }}>
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Active Goals Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.text }}>
                  <Target size={20} style={{ color: colors.primary }} />
                  Active Goals
                </h2>
              </div>
              <button
                onClick={() => navigate('/create/personal-goal')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-80 font-medium"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
              >
                <Plus size={18} />
                New Goal
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12" style={{ color: colors.textLight }}>
                <Loader size={24} className="animate-spin mr-2" />
                <span>Loading your goals...</span>
              </div>
            ) : activeGoals.length === 0 ? (
              <div className="rounded-xl p-12 border text-center" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <Target size={32} className="mx-auto mb-3" style={{ color: colors.textLight }} />
                <p style={{ color: colors.textLight }}>
                  No active goals yet. Create one to start saving!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-xl p-6 border transition hover:shadow-md"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                          {goal.goalName}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: colors.textLight }}>
                          Progress: {goal.progress.toFixed(1)}% complete
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                          {goal.progress.toFixed(0)}%
                        </div>
                        <div className="text-xs" style={{ color: colors.textLight }}>
                          Complete
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full rounded-full h-3 mb-4" style={{ backgroundColor: colors.border }}>
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ backgroundColor: colors.primary, width: `${goal.progress}%` }}
                      ></div>
                    </div>

                    {/* Amount Info */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs" style={{ color: colors.textLight }}>Saved</p>
                        <p className="font-semibold" style={{ color: colors.text }}>
                          ${goal.savedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs" style={{ color: colors.textLight }}>of</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: colors.textLight }}>Target</p>
                        <p className="font-semibold" style={{ color: colors.text }}>
                          ${goal.targetAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => contributeToGoal(goal.goalId)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                      >
                        Contribute
                      </button>
                      <button
                        onClick={() => completeGoal(goal.goalId)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium transition"
                        style={{ backgroundColor: colors.border, color: colors.text }}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Goals Section */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                Completed Goals
              </h2>
              <div className="space-y-4">
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-xl p-4 border opacity-75"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold" style={{ color: colors.text }}>
                          {goal.goalName}
                        </h3>
                        <p className="text-sm" style={{ color: colors.textLight }}>
                          ${goal.targetAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} saved
                        </p>
                      </div>
                      <div className="text-green-600 font-semibold">✓ Complete</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Goals