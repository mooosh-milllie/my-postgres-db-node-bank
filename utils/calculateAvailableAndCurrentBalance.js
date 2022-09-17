const calculateAvailableAndCurrentBalance = (currentCustomer, amount, transactionType) => {
  const prevAvailableBalance = currentCustomer.availableBalance;
  const prevCurrentBalance = currentCustomer.currentBalance;

  if (transactionType === 'debit') {
    const newAvailableBalance = prevAvailableBalance - amount;
    const newCurrentBalance = (prevCurrentBalance - prevAvailableBalance) + newAvailableBalance;
    return {
      newAvailableBalance,
      newCurrentBalance
    }
  }
  
  if (transactionType === 'credit') {
    const newAvailableBalance = prevAvailableBalance + amount;
    const newCurrentBalance = (prevCurrentBalance - prevAvailableBalance) + newAvailableBalance;
    return {
      newAvailableBalance,
      newCurrentBalance
    }
  }

  throw new Error('INVALID METHOD');
}

module.exports = {
  calculateAvailableAndCurrentBalance
}