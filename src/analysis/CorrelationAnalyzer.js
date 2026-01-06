export class CorrelationAnalyzer {
  constructor() {
    // Known correlation groups
    this.correlationGroups = {
      'major-crypto': ['BTCUSD', 'ETHUSD'],
      'layer1-crypto': ['SOLUSD', 'AVAXUSD', 'DOTUSD'],
      'defi-crypto': ['AAVEUSD', 'UNIUSD', 'LINKUSD'],
      'meme-crypto': ['DOGEUSD', 'SHIBUSD'],
      'mega-cap-tech': ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      'ai-tech': ['NVDA', 'AMD'],
      'social-tech': ['META'],
      'ev-auto': ['TSLA'],
      'index-etf': ['SPY', 'QQQ']
    };

    this.maxPerGroup = 2; // Max 2 positions per correlated group
  }

  getCorrelationGroup(symbol) {
    for (const [group, symbols] of Object.entries(this.correlationGroups)) {
      if (symbols.includes(symbol)) {
        return group;
      }
    }
    return 'uncorrelated';
  }

  canAddPosition(symbol, currentPositions) {
    const targetGroup = this.getCorrelationGroup(symbol);

    if (targetGroup === 'uncorrelated') {
      return {
        allowed: true,
        reason: 'Symbol not in correlation groups'
      };
    }

    // Count existing positions in this group
    const groupPositions = currentPositions.filter(pos => {
      const posGroup = this.getCorrelationGroup(pos.symbol);
      return posGroup === targetGroup;
    });

    if (groupPositions.length >= this.maxPerGroup) {
      return {
        allowed: false,
        reason: `Already holding ${groupPositions.length} positions in ${targetGroup} group (max: ${this.maxPerGroup})`,
        group: targetGroup,
        existing: groupPositions.map(p => p.symbol)
      };
    }

    return {
      allowed: true,
      reason: `OK to add (${groupPositions.length}/${this.maxPerGroup} in ${targetGroup})`,
      group: targetGroup
    };
  }

  getDiversificationScore(positions) {
    const groups = new Set();

    positions.forEach(pos => {
      const group = this.getCorrelationGroup(pos.symbol);
      groups.add(group);
    });

    // More unique groups = better diversification
    // Score: unique groups / total positions * 100
    if (positions.length === 0) return 100;

    return (groups.size / positions.length) * 100;
  }

  getPortfolioBalance(positions) {
    const cryptoPositions = positions.filter(p => p.symbol.includes('USD'));
    const stockPositions = positions.filter(p => !p.symbol.includes('USD'));

    const cryptoPercent = positions.length > 0 ? (cryptoPositions.length / positions.length) * 100 : 0;
    const stockPercent = 100 - cryptoPercent;

    return {
      crypto: cryptoPercent,
      stocks: stockPercent,
      balanced: Math.abs(cryptoPercent - 50) < 20 // Within 20% of 50/50
    };
  }

  suggestNextAssetType(positions) {
    const balance = this.getPortfolioBalance(positions);

    if (balance.crypto > 60) return 'stock';
    if (balance.stocks > 60) return 'crypto';

    return 'any';
  }

  analyzeRisk(positions) {
    const diversificationScore = this.getDiversificationScore(positions);
    const balance = this.getPortfolioBalance(positions);

    const groupConcentration = {};

    positions.forEach(pos => {
      const group = this.getCorrelationGroup(pos.symbol);
      groupConcentration[group] = (groupConcentration[group] || 0) + 1;
    });

    const overconcentratedGroups = Object.entries(groupConcentration)
      .filter(([group, count]) => count > this.maxPerGroup)
      .map(([group, count]) => ({ group, count }));

    return {
      diversificationScore: diversificationScore,
      balance: balance,
      overconcentrated: overconcentratedGroups.length > 0,
      overconcentratedGroups: overconcentratedGroups,
      risk: diversificationScore < 50 ? 'HIGH' : diversificationScore < 70 ? 'MEDIUM' : 'LOW'
    };
  }
}

export const correlationAnalyzer = new CorrelationAnalyzer();
