'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATES, calculateStampDuty, StampDutyResult } from '@/lib/stamp-duty-rates';
import { AlertCircle, Calculator, Info, Landmark } from 'lucide-react';

export default function StampDutyCalculator() {
  const [selectedState, setSelectedState] = useState<string>('MH');
  const [cities, setCities] = useState<readonly string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [rent, setRent] = useState<string>('20000');
  const [deposit, setDeposit] = useState<string>('50000');
  const [term, setTerm] = useState<string>('11');
  const [result, setResult] = useState<StampDutyResult | null>(null);

  // Update cities list when state changes
  useEffect(() => {
    const stateObj = STATES.find((s) => s.code === selectedState);
    if (stateObj) {
      setCities(stateObj.cities);
      // Select first city in the list
      setSelectedCity(stateObj.cities[0]);
    }
  }, [selectedState]);

  // Recalculate whenever inputs change
  useEffect(() => {
    const rentNum = parseFloat(rent) || 0;
    const depositNum = parseFloat(deposit) || 0;
    const termNum = parseInt(term, 10) || 11;

    const calcResult = calculateStampDuty(
      selectedState,
      selectedCity,
      rentNum,
      depositNum,
      termNum
    );
    setResult(calcResult);
  }, [selectedState, selectedCity, rent, deposit, term]);

  const handleReset = () => {
    setSelectedState('MH');
    setRent('20000');
    setDeposit('50000');
    setTerm('11');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span>Stamp Duty & Registration Calculator</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Calculate the approximate stamp duty and registration fees for your rental agreement based on state-wise rates.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Card */}
          <Card className="lg:col-span-5 border-slate-200/60 dark:border-slate-800/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Agreement Variables</CardTitle>
              <CardDescription>Enter values to compute indicative government fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* State Select */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={selectedState} onValueChange={(val) => setSelectedState(val || 'MH')}>
                  <SelectTrigger id="state" className="bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Select */}
              <div className="space-y-2">
                <Label htmlFor="city">City / Region</Label>
                <Select value={selectedCity} onValueChange={(val) => setSelectedCity(val || '')}>
                  <SelectTrigger id="city" className="bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Monthly Rent */}
              <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent (₹)</Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="e.g. 20000"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="bg-white dark:bg-slate-900 font-mono"
                  min="0"
                />
              </div>

              {/* Security Deposit */}
              <div className="space-y-2">
                <Label htmlFor="deposit">Security Deposit (₹)</Label>
                <Input
                  id="deposit"
                  type="number"
                  placeholder="e.g. 50000"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="bg-white dark:bg-slate-900 font-mono"
                  min="0"
                />
              </div>

              {/* Term (Months) */}
              <div className="space-y-2">
                <Label htmlFor="term">Agreement Duration (Months)</Label>
                <Select value={term} onValueChange={(val) => setTerm(val || '11')}>
                  <SelectTrigger id="term" className="bg-white dark:bg-slate-900 font-mono">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m} Month{m > 1 ? 's' : ''} {m === 11 ? '(Recommended Cap)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">
                  * Short-term licenses are capped at 11 months to stay within non-mandatory sub-registrar registration rules.
                </p>
              </div>

              {/* Reset */}
              <Button variant="outline" className="w-full text-slate-700 dark:text-slate-300" onClick={handleReset}>
                Reset Fields
              </Button>

            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Calculation Card */}
            {result && (
              <Card className="border-indigo-150/40 dark:border-indigo-950/40 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg">Indicated Estimate</h3>
                    <p className="text-xs text-indigo-200">Values are calculated in real-time</p>
                  </div>
                  <Landmark className="h-6 w-6 text-indigo-200" />
                </div>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Breakdowns */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Approximate Stamp Duty</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono text-base">₹{result.stampDuty.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Approximate Registration Fee</span>
                      <span className="font-bold text-slate-800 dark:text-white font-mono text-base">₹{result.registrationFee.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold text-base">Indicative Total</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-2xl">₹{result.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Formula description */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg space-y-2 border border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                      <span>Calculation Formula</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {result.formula}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal">
                      {result.notes}
                    </p>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Disclaimer Callout */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-800 dark:text-amber-400">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold">Important Rate Disclaimer</h4>
                <p className="text-xs leading-normal">
                  These calculations are indicative estimates based on simplified state-wise formulas for Leave & License contracts. Actual stamp duty charges can fluctuate depending on exact circular rates, local sub-registrar overrides, and municipal boundaries.
                </p>
                <p className="text-xs leading-normal font-semibold">
                  Always verify rates with the state's official e-stamping and registration portal (e.g., IGR Maharashtra, Kaveri Online Services, Delhi Online Stamp Duty Portal) before executing payments.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
