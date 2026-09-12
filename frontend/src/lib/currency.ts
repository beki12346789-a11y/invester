// Format amount in Ethiopian Birr (ETB)
export function formatBirr(amount: number): string {
  return `${amount.toFixed(2)} Birr`;
}

// Format amount with compact notation for large numbers
export function formatCompactBirr(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M Birr`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K Birr`;
  }
  return formatBirr(amount);
}
