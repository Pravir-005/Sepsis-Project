import { Patient, Vitals } from '../db/store';

// Sepsis risk scoring using a weighted clinical formula
// Based on qSOFA + SIRS criteria adapted for continuous monitoring

interface RiskComponents {
    hrScore: number;
    spo2Score: number;
    tempScore: number;
    mapScore: number;
    rrScore: number;
    trendBonus: number;
    lactateScore: number;
}

function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

export function calculateRisk(
    vitals: Vitals,
    trend: Patient['trend'],
    lactate: number,
    existingScore: number
): number {
    const components: RiskComponents = {
        // Heart rate: normal 60-100, elevated = higher risk
        hrScore: vitals.hr > 130 ? 0.25
            : vitals.hr > 110 ? 0.18
                : vitals.hr > 90 ? 0.08
                    : 0.02,

        // SpO2: normal ≥95%, < 90 is severe
        spo2Score: vitals.spo2 < 90 ? 0.30
            : vitals.spo2 < 93 ? 0.20
                : vitals.spo2 < 95 ? 0.10
                    : 0.01,

        // Temperature: normal 36.1-37.2°C
        tempScore: vitals.temp > 39.5 ? 0.20
            : vitals.temp > 38.5 ? 0.14
                : vitals.temp > 38.0 ? 0.08
                    : vitals.temp < 36.0 ? 0.12
                        : 0.01,

        // MAP: < 65 mmHg is shock criterion
        mapScore: vitals.map < 60 ? 0.28
            : vitals.map < 70 ? 0.18
                : vitals.map < 80 ? 0.08
                    : 0.01,

        // Respiratory rate: normal 12-20
        rrScore: vitals.rr > 30 ? 0.18
            : vitals.rr > 25 ? 0.12
                : vitals.rr > 20 ? 0.06
                    : 0.01,

        // Trend modifier
        trendBonus: trend === 'rising' ? 0.03
            : trend === 'falling' ? -0.04
                : 0,

        // Lactate (mmol/L): > 4 = severe, 2-4 = moderate
        lactateScore: lactate > 4 ? 0.25
            : lactate > 2 ? 0.12
                : lactate > 1.5 ? 0.04
                    : 0.01,
    };

    const rawScore = Object.values(components).reduce((a, b) => a + b, 0);

    // Blend with existing score for smooth transitions (80% existing, 20% new calculation)
    const blended = existingScore * 0.8 + rawScore * 0.2;
    return clamp(parseFloat(blended.toFixed(3)), 0.02, 0.99);
}

export function generateInsights(patient: Patient): string[] {
    const insights: string[] = [];
    const { vitals, riskScore, trend, lactate, sofa } = patient;

    if (lactate > 4) insights.push('Lactate critically elevated (>4 mmol/L) — immediate IV fluid resuscitation indicated');
    else if (lactate > 2) insights.push('Lactate elevated (>2 mmol/L) — indicates tissue hypoperfusion');

    if (vitals.spo2 < 92) insights.push('SpO₂ critically low — evaluate for ARDS or pulmonary embolism');
    else if (vitals.spo2 < 95) insights.push('SpO₂ below normal — supplemental oxygen therapy recommended');

    if (vitals.map < 65) insights.push('MAP <65 mmHg — vasopressor initiation/escalation indicated per Surviving Sepsis Campaign');
    else if (vitals.map < 70) insights.push('MAP borderline — closely monitor haemodynamic response');

    if (vitals.hr > 120) insights.push('Severe tachycardia — assess volume status and cardiac function');
    else if (vitals.hr > 100) insights.push('Tachycardia present — monitor fluid balance and fever response');

    if (vitals.temp > 39) insights.push('High fever — review culture results and broaden antibiotic coverage if needed');
    else if (vitals.temp < 36) insights.push('Hypothermia detected — possible late-stage sepsis marker, reassess severity');

    if (vitals.rr > 25) insights.push('Respiratory rate elevated — consider early mechanical ventilation assessment');

    if (sofa >= 8) insights.push(`SOFA score ${sofa} — high organ dysfunction risk, consider ICU escalation protocol`);
    else if (sofa >= 4) insights.push(`SOFA score ${sofa} — moderate organ dysfunction, close monitoring required`);

    if (riskScore > 0.85 && trend === 'rising') insights.push('Rapid deterioration pattern detected — escalate care immediately');
    else if (trend === 'falling' && riskScore < 0.6) insights.push('Clinical trajectory improving — consider step-down if sustained');

    // Fallback
    if (insights.length === 0) insights.push('Vitals within acceptable range — continue standard monitoring protocol');

    return insights.slice(0, 5); // cap at 5 insights
}

export function simulateVitalsDrift(vitals: Vitals, trend: Patient['trend']): Vitals {
    const trendFactor = trend === 'rising' ? 0.02 : trend === 'falling' ? -0.02 : 0;
    const rand = (range: number) => (Math.random() - 0.5) * range;

    const newHr = Math.max(40, Math.min(200, Math.round(vitals.hr + rand(6) + trendFactor * 8)));
    const newSpo2 = Math.max(80, Math.min(100, Math.round(vitals.spo2 + rand(2) - trendFactor * 1)));
    const newTemp = parseFloat((Math.max(35, Math.min(42, vitals.temp + rand(0.3) + trendFactor * 0.1))).toFixed(1));
    const newRr = Math.max(10, Math.min(45, Math.round(vitals.rr + rand(3) + trendFactor * 2)));

    // Recalculate MAP from updated BP components
    const [sysStr, diaStr] = vitals.bp.split('/');
    const sys = parseInt(sysStr) + Math.round(rand(8) - trendFactor * 4);
    const dia = parseInt(diaStr) + Math.round(rand(5) - trendFactor * 3);
    const newSys = Math.max(60, Math.min(200, sys));
    const newDia = Math.max(30, Math.min(130, dia));
    const newMap = Math.round((newSys + 2 * newDia) / 3);

    return {
        hr: newHr,
        bp: `${newSys}/${newDia}`,
        spo2: newSpo2,
        temp: newTemp,
        rr: newRr,
        map: Math.max(30, Math.min(160, newMap)),
    };
}
