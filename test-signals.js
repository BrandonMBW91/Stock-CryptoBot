// Quick test to see if strategies can generate signals
import { rsiSlope } from './src/analysis/RSISlope.js';

// Test RSI slope analysis with flat market (RSI 45, slope 0.1)
const mockBars = [];
for (let i = 0; i < 50; i++) {
  mockBars.push({ c: 100 + (i % 3) * 0.5 }); // Very flat price action
}

const analysis = rsiSlope.analyze(mockBars, 14, 3);

console.log('\n=== RSI Slope Analysis Test ===');
console.log('Current RSI:', analysis?.current);
console.log('Slope:', analysis?.slope);
console.log('Direction:', analysis?.direction);
console.log('Signal:', analysis?.signal);
console.log('Strength:', analysis?.strength);
console.log('\nIs Bullish?', rsiSlope.isBullish(analysis));
console.log('Is Bearish?', rsiSlope.isBearish(analysis));

// Test fallback logic
console.log('\n=== Fallback Logic Test ===');
if (rsiSlope.isBullish(analysis)) {
  console.log('✓ Would generate BUY from RSI slope');
} else if (rsiSlope.isBearish(analysis)) {
  console.log('✓ Would generate SELL from RSI slope');
} else if (analysis) {
  const currentRSI = analysis.current;
  if (currentRSI < 35) {
    console.log(`✓ Would generate BUY from RSI level fallback (RSI=${currentRSI})`);
  } else if (currentRSI > 65) {
    console.log(`✓ Would generate SELL from RSI level fallback (RSI=${currentRSI})`);
  } else {
    console.log(`✗ NO SIGNAL - RSI is ${currentRSI} (needs <35 or >65 for fallback)`);
  }
}

console.log('\n');
