'use client'

import type { FormEvent } from 'react'

const fields = [
  { name: 'rubric', label: 'Grading rubric', example: 'Mention that Earth rotates on its axis.' },
  { name: 'prompt', label: 'Prompt', example: 'What causes day and night on Earth?' },
  { name: 'good', label: 'Strong response', example: 'Earth rotates on its axis, turning each location toward and away from the Sun.' },
  { name: 'weak', label: 'Weak response', example: 'The Sun switches off at night.' },
] as const

export default function CaseBuilder() {
  function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    for (const { name } of fields) {
      const input = form.elements.namedItem(name) as HTMLTextAreaElement
      if (!input.value.trim()) {
        input.setCustomValidity('Enter some text for this field.')
        input.reportValidity()
        return
      }
      values.set(name, input.value.trim())
    }
    const { rubric, prompt, good, weak } = Object.fromEntries(values)
    const json = JSON.stringify({ rubric, cases: [{ prompt, good, weak }] }, null, 2)
    const url = URL.createObjectURL(new Blob([json + '\n'], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'cases.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <form onSubmit={download} className="border-t border-[#f3f4e9]/15 py-12" aria-labelledby="case-heading">
      <h2 id="case-heading" className="text-3xl font-bold tracking-tight">Build your first audit case</h2>
      <p className="mt-3 text-[#f3f4e9]/70">Edit the example, download it, then run <code>juryrig cases.json</code> in the download directory.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {fields.map(({ name, label, example }) => (
          <div key={name} className="grid gap-2 font-mono text-sm">
            <label htmlFor={`case-${name}`}>{label}</label>
            <textarea id={`case-${name}`} name={name} rows={3} required defaultValue={example}
              onInput={(e) => e.currentTarget.setCustomValidity('')}
              className="w-full rounded-sm border border-[#f3f4e9]/30 bg-[#171a15] p-3 text-[#f3f4e9]" />
          </div>
        ))}
      </div>
      <button type="submit" className="mt-5 bg-[#5EEAD4] px-5 py-3 font-mono text-sm font-bold text-[#10120f]">Download cases.json</button>
    </form>
  )
}
