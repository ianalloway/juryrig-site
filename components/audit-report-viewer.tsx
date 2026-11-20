'use client'

import { useState, type FormEvent } from 'react'

type AuditRow = { name: string; status: 'Flagged' | 'Passed' | 'Skipped'; detail: string }
type AuditReport = { judge: string; rows: AuditRow[] }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const measurements: Record<string, [string, string]> = {
  position: ['flip_rate', 'Flip rate'],
  verbosity: ['mean_delta', 'Mean score change'],
  injection: ['mean_delta', 'Mean score change'],
  consistency: ['spread', 'Score spread'],
}

function readReport(source: string): AuditReport {
  let data: unknown
  try {
    data = JSON.parse(source)
  } catch {
    throw new Error('Enter valid JSON from the audit command.')
  }
  if (!record(data) || data.schema_version !== 1 || data.report !== 'audit' ||
      typeof data.judge !== 'string' || !record(data.audits) || !Object.keys(data.audits).length) {
    throw new Error('Expected a version 1 JuryRig audit report.')
  }
  const reasons = record(data.skipped_reasons) ? data.skipped_reasons : {}
  const rows = Object.entries(data.audits).map(([name, audit]): AuditRow => {
    if (audit === null) {
      const reason = reasons[name]
      return { name, status: 'Skipped', detail: typeof reason === 'string' ? reason : 'No result recorded' }
    }
    if (!record(audit) || typeof audit.flagged !== 'boolean') {
      throw new Error(`Missing verdict for the ${name} check.`)
    }
    const metric = Object.hasOwn(measurements, name) ? measurements[name] : undefined
    const value = metric && audit[metric[0]]
    return { name, status: audit.flagged ? 'Flagged' : 'Passed',
      detail: metric && typeof value === 'number' ? `${metric[1]} ${value}` : '—' }
  })
  return { judge: data.judge, rows }
}

export default function AuditReportViewer() {
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const source = new FormData(event.currentTarget).get('report')
    try {
      setReport(readReport(typeof source === 'string' ? source : ''))
      setError('')
    } catch (problem) {
      setReport(null)
      setError(problem instanceof Error ? problem.message : 'Unable to read the audit report.')
    }
  }
  return (
    <section className="border-t border-[#f3f4e9]/15 py-12" aria-labelledby="report-heading">
      <h2 id="report-heading" className="text-3xl font-bold tracking-tight">Read an audit report</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <label htmlFor="audit-report">Paste the JSON from <code>juryrig cases.json --json</code>. Your report stays in this browser.</label>
        <textarea id="audit-report" name="report" required rows={4} spellCheck={false}
          onChange={() => { setReport(null); setError('') }}
          className="w-full border border-[#f3f4e9]/30 bg-[#171a15] p-3 font-mono text-sm" />
        <button type="submit" className="w-fit bg-[#5EEAD4] px-5 py-3 font-mono text-sm font-bold text-[#10120f]">View report</button>
      </form>
      {error && <p role="alert" className="mt-4 text-[#ffb4a2]">{error}</p>}
      {report && <div className="mt-6">
        <p role="status" className="mb-3 break-words">Judge: {report.judge} · {report.rows.filter(row => row.status === 'Flagged').length} flagged · {report.rows.filter(row => row.status === 'Skipped').length} skipped</p>
        <table className="w-full table-fixed text-left text-sm [overflow-wrap:anywhere]">
          <caption className="sr-only">Audit check results</caption>
          <thead><tr>{['Check', 'Verdict', 'Detail'].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{report.rows.map(row => <tr key={row.name} className="border-t border-[#f3f4e9]/20">
            <th scope="row" className="p-2">{row.name}</th>
            <td className="p-2">{row.status}</td><td className="p-2">{row.detail}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  )
}
