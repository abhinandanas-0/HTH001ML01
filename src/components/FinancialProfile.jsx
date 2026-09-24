import React from 'react';
import { DollarSign, PiggyBank, Briefcase, TrendingUp, Info } from 'lucide-react';
import { CURRENCIES } from '../data/mockData';

export default function FinancialProfile({
  profile,
  onChange,
  currency,
  onCurrencyChange
}) {
  const handleInputChange = (field, value) => {
    // Keep numbers and decimals only
    const cleanVal = value.replace(/[^0-9.]/g, '');
    onChange({
      ...profile,
      [field]: cleanVal
    });
  };

  const currentCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  const monthlyStable = parseFloat(profile.monthlyIncome) || 0;
  const irregular = parseFloat(profile.irregularIncome) || 0;
  const savings = parseFloat(profile.savingsGoal) || 0;
  const totalCombinedIncome = monthlyStable + irregular;

  return (
    <div className="glass-panel financial-profile-card">
      <div className="profile-header">
        <div className="profile-title-area">
          <div className="card-icon-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--purple-400)' }}>
            <PiggyBank size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              3. Income & Savings Baseline
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Optional context for the Financial Detective to evaluate runway & leaks
            </p>
          </div>
        </div>

        <div className="profile-currency-picker">
          <span className="currency-label">Currency:</span>
          <select
            className="currency-select"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            aria-label="Select currency"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code} style={{ background: '#0e163b', color: '#fff' }}>
                {curr.symbol} {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="fields-grid">
        {/* Monthly Stable Income */}
        <div className="input-field-group">
          <label className="input-label" htmlFor="monthly-income-input">
            <span>Stable Monthly Income</span>
            <span className="label-optional">(Optional)</span>
          </label>
          <div className="input-control-wrap">
            <span className="input-prefix">{currentCurrencySymbol}</span>
            <input
              id="monthly-income-input"
              type="text"
              inputMode="decimal"
              className="custom-input"
              placeholder="e.g. 5,500"
              value={profile.monthlyIncome}
              onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
            />
          </div>
          <span className="input-helper">
            Predictable salary, fixed retainers, or pension.
          </span>
        </div>

        {/* Irregular / Variable Income */}
        <div className="input-field-group">
          <label className="input-label" htmlFor="irregular-income-input">
            <span>Irregular / Bonus Inflow</span>
            <span className="label-optional">(Optional)</span>
          </label>
          <div className="input-control-wrap">
            <span className="input-prefix">{currentCurrencySymbol}</span>
            <input
              id="irregular-income-input"
              type="text"
              inputMode="decimal"
              className="custom-input"
              placeholder="e.g. 1,200"
              value={profile.irregularIncome}
              onChange={(e) => handleInputChange('irregularIncome', e.target.value)}
            />
          </div>
          <span className="input-helper">
            Freelance payouts, quarterly dividends, or side gigs.
          </span>
        </div>

        {/* Monthly Savings Goal */}
        <div className="input-field-group">
          <label className="input-label" htmlFor="savings-goal-input">
            <span>Monthly Savings Target</span>
            <span className="label-optional">(Optional)</span>
          </label>
          <div className="input-control-wrap">
            <span className="input-prefix">{currentCurrencySymbol}</span>
            <input
              id="savings-goal-input"
              type="text"
              inputMode="decimal"
              className="custom-input"
              placeholder="e.g. 1,800"
              value={profile.savingsGoal}
              onChange={(e) => handleInputChange('savingsGoal', e.target.value)}
            />
          </div>
          <span className="input-helper">
            Emergency cushion or target investment accumulation.
          </span>
        </div>
      </div>

      {/* Summary chip if any input provided */}
      {(totalCombinedIncome > 0 || savings > 0) && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e0e7ff' }}>
            <TrendingUp size={16} style={{ color: 'var(--emerald-400)' }} />
            <span>
              Total Estimated Inflow:{' '}
              <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {currentCurrencySymbol}{totalCombinedIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
          </div>

          {savings > 0 && (
            <div style={{ color: 'var(--purple-400)' }}>
              Target Cushion:{' '}
              <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {currentCurrencySymbol}{savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>{' '}
              / month
            </div>
          )}
        </div>
      )}
    </div>
  );
}
