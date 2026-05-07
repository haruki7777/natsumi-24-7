// utils/market.js

/**
 * Calculates a dynamic market multiplier based on the current time.
 * Changes every 5 minutes to simulate a fluctuating stock market.
 */
export function getMarketRate() {
    const now = new Date();
    const minutes = now.getMinutes();
    const hour = now.getHours();

    // Use a pseudo-random seed based on time
    // This ensures all users see the same "market" at the same time
    const seed = (hour * 60 + Math.floor(minutes / 5));
    
    // Simple sine wave fluctuation between 0.7 and 1.5
    // multiplier = mid + amplitude * sin(seed)
    const rate = 1.1 + 0.4 * Math.sin(seed * 0.5);
    
    let trend = "➡️ 보합";
    let emoji = "➖";
    
    if (rate > 1.3) {
        trend = "🚀 급등 (Bull Market)";
        emoji = "📈";
    } else if (rate > 1.1) {
        trend = "🔼 상승세";
        emoji = "↗️";
    } else if (rate < 0.9) {
        trend = "📉 폭락 (Bear Market)";
        emoji = "💀";
    } else if (rate < 1.1) {
        trend = "🔽 하락세";
        emoji = "↘️";
    }

    return {
        rate: parseFloat(rate.toFixed(2)),
        trend,
        emoji
    };
}
