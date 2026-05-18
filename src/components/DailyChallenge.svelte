
<script lang="ts">
  import {
    dailyChallengeState,
    getCurrentChallenge,
    getChallengeProgress,
    getTimeRemaining,
    claimDailyReward,
    isChallengeActive,
    isChallengeComplete,
    getStreakBonus
  } from '../modules/dailyChallenge.svelte.js';
  import { formatValue } from '../systems/formatValue.js';
  import { showToast } from '../stores/uiStore.svelte.js';
  import { addLog } from '../ui/LogPanelState.svelte.js';

  let challenge = $derived(getCurrentChallenge());
  let progress = $derived(getChallengeProgress());
  let timeRemaining = $derived(getTimeRemaining());
  let isActive = $derived(isChallengeActive());
  let isComplete = $derived(isChallengeComplete());
  let streakBonus = $derived(getStreakBonus());
  let canClaim = $derived(isComplete && !dailyChallengeState.claimedReward);

  function formatTime(t: { hours: number; minutes: number; seconds: number }): string {
    if (t.hours > 0) {
      return `${t.hours}h ${t.minutes.toString().padStart(2, '0')}m`;
    }
    return `${t.minutes.toString().padStart(2, '0')}:${t.seconds.toString().padStart(2, '0')}`;
  }

  function handleClaim() {
    const reward = claimDailyReward();
    if (reward) {
      showToast(`Claimed ${reward.shards} Ascension Shards!`, 'success');
      addLog(`[DAILY] ${reward.badge}! +${reward.shards} Shards`, 'awakening');
    }
  }
</script>

<div class="daily-challenge">
  {#if !challenge}
    <div class="loading-state">
      <span class="loading-icon">⟳</span>
      <span class="loading-text">Loading daily challenge...</span>
    </div>
  {:else}
    <div class="challenge-header">
      <div class="challenge-icon">{challenge.icon}</div>
      <div class="challenge-info">
        <h3 class="challenge-name">{challenge.name}</h3>
        <p class="challenge-desc">{challenge.description}</p>
      </div>
      <div class="time-remaining">
        <span class="time-label">RESETS IN</span>
        <span class="time-value">{formatTime(timeRemaining)}</span>
      </div>
    </div>

    <div class="challenge-body">
      <!-- Progress Bar -->
      <div class="progress-section">
        {#if progress.target > 1}
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-value">
              {progress.current >= 1e6
                ? formatValue(progress.current)
                : progress.current.toLocaleString()} / {progress.target >= 1e6
                ? formatValue(progress.target)
                : progress.target.toLocaleString()}
            </span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              class:complete={isComplete}
              style="width: {progress.percentage}%"
            ></div>
          </div>
        {:else}
          <div class="passive-badge">
            <span class="badge-icon">✓</span>
            <span>Active Bonus: {challenge.multiplier}x</span>
          </div>
        {/if}
      </div>

      <!-- Reward Section -->
      <div class="reward-section">
        <div class="reward-info">
          <span class="reward-label">Reward</span>
          <div class="reward-value">
            <span class="shard-icon">◆</span>
            <span class="shard-count">{challenge.reward.shards}</span>
            {#if streakBonus > 0}
              <span class="streak-bonus">(+{streakBonus})</span>
            {/if}
            <span class="badge-name">{challenge.reward.badge}</span>
          </div>
        </div>

        {#if canClaim}
          <button class="claim-btn" onclick={handleClaim}>
            <span class="btn-icon">★</span>
            <span class="btn-text">CLAIM REWARD</span>
          </button>
        {:else if dailyChallengeState.claimedReward}
          <div class="claimed-badge">
            <span class="check-icon">✓</span>
            <span>Claimed</span>
          </div>
        {:else if !isComplete}
          <div class="pending-badge">
            <span>Complete challenge to claim</span>
          </div>
        {/if}
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Streak</span>
          <span class="stat-value">{dailyChallengeState.consecutiveDays} days</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Best</span>
          <span class="stat-value">{dailyChallengeState.bestStreak} days</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total</span>
          <span class="stat-value">{dailyChallengeState.totalCompletions}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Shards</span>
          <span class="stat-value shard">{formatValue(dailyChallengeState.totalShardsEarned)}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .daily-challenge {
    background: var(--bg-2);
    border: 1px solid var(--line);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .loading-state {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-2);
    font-family: var(--font-hud);
  }

  .loading-icon {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .challenge-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }

  .challenge-icon {
    font-size: 2rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-1);
    border: 1px solid var(--gold);
    color: var(--gold);
    flex-shrink: 0;
  }

  .challenge-info {
    flex: 1;
    min-width: 0;
  }

  .challenge-name {
    font-family: var(--font-hud);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--gold);
    margin: 0 0 4px 0;
    text-transform: uppercase;
  }

  .challenge-desc {
    font-size: 0.7rem;
    color: var(--text-2);
    margin: 0;
  }

  .time-remaining {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .time-label {
    font-family: var(--font-hud);
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    color: var(--text-2);
  }

  .time-value {
    font-family: var(--font-data);
    font-size: 0.9rem;
    color: var(--cyan);
    font-weight: 700;
  }

  .challenge-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
  }

  .progress-label {
    font-family: var(--font-hud);
    color: var(--text-2);
    letter-spacing: 0.1em;
  }

  .progress-value {
    font-family: var(--font-data);
    color: var(--text-0);
  }

  .progress-track {
    height: 8px;
    background: var(--bg-0);
    border: 1px solid var(--line);
    position: relative;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--cyan), var(--neon-blue));
    transition: width 0.3s ease;
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: white;
    opacity: 0.5;
  }

  .progress-fill.complete {
    background: linear-gradient(90deg, var(--gold), var(--green));
  }

  .passive-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: hsl(45 100% 50% / 0.1);
    border: 1px solid var(--gold);
    font-family: var(--font-hud);
    font-size: 0.7rem;
    color: var(--gold);
  }

  .badge-icon {
    font-size: 1rem;
  }

  .reward-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-1);
    border: 1px solid var(--line);
  }

  .reward-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .reward-label {
    font-family: var(--font-hud);
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    color: var(--text-2);
    text-transform: uppercase;
  }

  .reward-value {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-data);
    font-size: 0.9rem;
  }

  .shard-icon {
    color: var(--gold);
  }

  .shard-count {
    color: var(--gold);
    font-weight: 700;
  }

  .streak-bonus {
    color: var(--green);
    font-size: 0.8rem;
  }

  .badge-name {
    font-family: var(--font-hud);
    font-size: 0.65rem;
    color: var(--text-2);
    padding: 2px 8px;
    background: var(--bg-0);
    border: 1px solid var(--line);
    letter-spacing: 0.1em;
  }

  .claim-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: linear-gradient(180deg, var(--gold), hsl(45 100% 40%));
    border: none;
    color: var(--bg-void);
    font-family: var(--font-hud);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s ease;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .claim-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px hsl(45 100% 50% / 0.5);
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 10px hsl(45 100% 50% / 0.3); }
    50% { box-shadow: 0 0 20px hsl(45 100% 50% / 0.6); }
  }

  .btn-icon {
    font-size: 1rem;
  }

  .claimed-badge,
  .pending-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-family: var(--font-hud);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
  }

  .claimed-badge {
    background: hsl(120 100% 50% / 0.1);
    border: 1px solid var(--green);
    color: var(--green);
  }

  .pending-badge {
    background: var(--bg-0);
    border: 1px solid var(--line);
    color: var(--text-2);
  }

  .check-icon {
    font-size: 1rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px;
    background: var(--bg-0);
    border: 1px solid var(--line);
  }

  .stat-label {
    font-family: var(--font-hud);
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    color: var(--text-2);
    text-transform: uppercase;
  }

  .stat-value {
    font-family: var(--font-data);
    font-size: 0.75rem;
    color: var(--text-0);
  }

  .stat-value.shard {
    color: var(--gold);
  }
</style>
